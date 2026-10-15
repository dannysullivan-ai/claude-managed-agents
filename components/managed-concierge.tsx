"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowDownToLine, ArrowRight, ArrowUp, Check, Clock3, Compass, Info, LoaderCircle, MapPin, MessageCircle, Plus, RefreshCw, Sparkles, Users, Wallet } from "lucide-react";
import { CITIES } from "@/lib/types";
import type { ChatMessage, City, OffsitePlan } from "@/lib/types";
import { isFeedbackCode, isSetupFeedback, messageWasNotSent, needsNewSession, responseFeedback } from "@/lib/managed/feedback";
import type { FeedbackCode, ManagedFeedback } from "@/lib/managed/feedback";
import { ManagedFeedbackPanel } from "./managed-feedback";

type ManagedSession = {
  mode: "managed";
  id?: string;
  city?: City;
  messages: ChatMessage[];
  proposal: OffsitePlan | null;
  status: "idle" | "running" | "completed" | "error";
  activity: { id: string; label: string; state: "running" | "complete" }[];
  error?: string;
  errorCode?: FeedbackCode;
};
type PendingMessage = { text: string; after: number };
const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
const totalCost = (plan: OffsitePlan) => plan.budgetItems.reduce((sum, item) => sum + item.amount, 0);
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const amount = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

function isProposal(value: unknown): value is OffsitePlan {
  if (!record(value) || !CITIES.includes(value.city as City) || !text(value.title) || !text(value.rainPlan) || !amount(value.budget) ||
    !Number.isInteger(value.attendees) || Number(value.attendees) < 1 || !Array.isArray(value.days) || !value.days.length ||
    !Array.isArray(value.budgetItems) || !value.budgetItems.length) return false;
  return value.days.every((day, index) => record(day) && day.day === index + 1 && text(day.title) && Array.isArray(day.stops) && day.stops.length > 0 &&
    day.stops.every(stop => record(stop) && [stop.id, stop.time, stop.title, stop.category, stop.location, stop.description].every(text) && amount(stop.durationMinutes))) &&
    value.budgetItems.every(item => record(item) && text(item.label) && amount(item.amount));
}

function isSession(value: unknown): value is ManagedSession {
  return record(value) && value.mode === "managed" && ["idle", "running", "completed", "error"].includes(String(value.status)) &&
    (value.id === undefined || text(value.id)) && (value.city === undefined || CITIES.includes(value.city as City)) &&
    Array.isArray(value.messages) && value.messages.every(message => record(message) && text(message.id) && text(message.text) && ["user", "assistant"].includes(String(message.role))) &&
    (value.proposal === null || isProposal(value.proposal)) && Array.isArray(value.activity) &&
    value.activity.every(event => record(event) && text(event.id) && text(event.label) && ["running", "complete"].includes(String(event.state))) &&
    (value.error === undefined || typeof value.error === "string") &&
    (value.errorCode === undefined || isFeedbackCode(value.errorCode));
}

async function responseBody(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}
class FeedbackError extends Error {
  constructor(public readonly feedback: ManagedFeedback) { super(feedback.message); }
}
const caughtFeedback = (cause: unknown, message: string, code: FeedbackCode = "connection_error"): ManagedFeedback =>
  cause instanceof FeedbackError ? cause.feedback : { code, message };

function downloadProposal(plan: OffsitePlan) {
  const content = [
    `# ${plan.title}`, "", "Managed agent proposal using illustrative lab fixtures. No bookings have been made.",
    `${plan.attendees} people · ${plan.days.length} days · Budget ${money(plan.budget)}`, "",
    ...plan.days.flatMap(day => [`## Day ${day.day} — ${day.title}`, "", ...day.stops.flatMap(stop => [
      `### ${stop.time} · ${stop.title}`, stop.description, `${stop.location} · ${stop.durationMinutes} minutes`, "",
    ])]),
    "## Budget", "", ...plan.budgetItems.map(item => `- ${item.label}: ${money(item.amount)}`), `- Total: ${money(totalCost(plan))}`,
    "", "Illustrative allowances, not live venue quotes. Flights and lodging are excluded.", "", "## Rain backup", "", plan.rainPlan,
  ].join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `offsite-${plan.city.toLowerCase().replaceAll(" ", "-")}-proposal.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ManagedConcierge({ embedded = false, implementation = "solution", hosted = false }: { embedded?: boolean; implementation?: "solution" | "learner"; hosted?: boolean }) {
  const apiBase = implementation === "learner" ? "/api/lab" : "/api/managed";
  const versionLabel = implementation === "learner" ? "Lab starter" : "Completed demo";
  const [session, setSession] = useState<ManagedSession | null>(null);
  const [city, setCity] = useState<City>("Chicago");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingMessage | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [restored, setRestored] = useState(false);
  const [action, setAction] = useState<"message" | "connect" | "reset" | null>(null);
  const [readError, setReadError] = useState<ManagedFeedback | null>(null);
  const [actionError, setActionError] = useState<ManagedFeedback | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<"chat" | "proposal">("chat");
  const latest = useRef<ManagedSession | null>(null);
  const pendingRef = useRef<PendingMessage | null>(null);
  const mutation = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const mounted = useRef(true);
  const bottom = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  const applySession = useCallback((next: ManagedSession) => {
    if (next.status === "running" && !next.error && next.id === latest.current?.id && !next.proposal && latest.current?.proposal) {
      next = { ...next, proposal: latest.current.proposal };
    }
    if (!latest.current && next.id && (next.messages.length > 0 || next.proposal)) setRestored(true);
    latest.current = next;
    setSession(next);
    if (next.city) setCity(next.city);
    if (next.proposal) setDayIndex(index => Math.min(index, next.proposal!.days.length - 1));
    const waiting = pendingRef.current;
    if (waiting && next.messages.slice(waiting.after).some(message => message.role === "user" && message.text === waiting.text)) {
      pendingRef.current = null;
      setPending(null);
      setUnconfirmed(false);
      setActionError(null);
    } else if (waiting && next.status !== "running") {
      setUnconfirmed(true);
      setActionError({ code: "delivery_unknown", message: "Your message is not in the saved history. Review the conversation before sending again." });
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; mutation.current?.abort(); };
  }, []);

  // GET only observes the hosted session. It never resends a user message.
  useEffect(() => {
    if (action) { setChecking(false); return; }
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    async function readSession() {
      controller = new AbortController();
      setChecking(true);
      try {
        const response = await fetch(`${apiBase}/session`, { cache: "no-store", signal: controller.signal });
        const body = await responseBody(response);
        if (!response.ok) throw new FeedbackError(responseFeedback(body, "Could not read the saved session."));
        if (!isSession(body)) throw new Error("The session response was incomplete. Reconnect to read it again.");
        if (disposed || lock.current) return;
        applySession(body);
        setReadError(null);
        setActionError(previous => !pendingRef.current && (previous?.code === "connection_error" || previous?.code === "service_unavailable" || (previous?.code === "session_busy" && body.status !== "running")) ? null : previous);
        if (body.status === "running") timer = setTimeout(readSession, 3000);
      } catch (cause) {
        if (disposed || controller.signal.aborted || lock.current) return;
        setReadError(caughtFeedback(cause, "Could not read the saved session."));
        // Preserve the last good snapshot while reconnecting after a transient failure.
        if (latest.current?.status === "running") timer = setTimeout(readSession, 5000);
      } finally {
        if (!disposed) setChecking(false);
      }
    }
    void readSession();
    return () => { disposed = true; clearTimeout(timer); controller?.abort(); };
  }, [applySession, refresh, action, apiBase]);

  useEffect(() => {
    if (mobilePanel !== "chat" || (!session?.messages.length && !pending)) return;
    bottom.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [session?.messages.length, pending, mobilePanel]);

  const running = session?.status === "running";
  const busy = action !== null;
  const ready = session !== null;
  const hasStarted = Boolean(session?.messages.length || session?.proposal || pending || running);
  const proposal = session?.proposal;
  const notice = readError || actionError || (session?.error ? { code: session.errorCode ?? "connection_error", message: session.error } : null);
  const needsRevision = session?.errorCode === "catering_policy" || session?.errorCode === "proposal_invalid";
  const canSend = ready && !busy && !running && !readError && !unconfirmed && !pending && !needsNewSession(notice?.code) && !needsNewSession(session?.errorCode);
  const prompt = `Plan a two-day offsite in ${city} for 12 people with a $6,000 total budget.${implementation === "solution" ? " Keep catering at or below $70 per person per day." : ""} Include focused workshops, vegetarian meal choices, a team activity, and an indoor rain backup. No meetings before 10 a.m.`;

  function draftRevision() {
    setInput(session?.errorCode === "catering_policy"
      ? "Revise the existing proposal to keep catering at or below $70 per person per day. Choose a compliant meal package from the fictional options. Preserve the same city, people, days, total budget, goals, dietary needs and other constraints; recalculate all dependent totals and save the revised proposal in this same session."
      : `Please correct the existing proposal using this application feedback: ${session?.error ?? notice?.message}. Preserve the original brief, run the checks, and save the corrected proposal in this same session.`);
    setMobilePanel("chat");
    textarea.current?.focus();
  }

  function openStep(slideId: string) {
    if (embedded) window.parent.postMessage({ type: "offsite:show-slide", slideId }, window.location.origin);
    else window.location.assign(`/workshop#${slideId}`);
  }

  async function sendMessage(value: string) {
    const message = value.trim();
    if (!message || !canSend || lock.current) return;
    lock.current = true;
    const controller = new AbortController();
    mutation.current = controller;
    const waiting = { text: message, after: latest.current?.messages.length ?? 0 };
    pendingRef.current = waiting;
    setPending(waiting); setInput(""); setAction("message"); setActionError(null);
    let knownRejection = false;
    try {
      const response = await fetch(`${apiBase}/message`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, city }), signal: controller.signal,
      });
      const body = await responseBody(response);
      if (!response.ok) {
        knownRejection = messageWasNotSent(body);
        throw new FeedbackError(responseFeedback(body, "Could not confirm message delivery.", "delivery_unknown"));
      }
      if (!isSession(body)) throw new Error("The message response was incomplete; delivery has not been confirmed.");
      if (controller.signal.aborted) return;
      applySession(body);
    } catch (cause) {
      if (controller.signal.aborted) return;
      const feedback = caughtFeedback(cause, "Could not confirm message delivery.", "delivery_unknown");
      if (knownRejection) {
        pendingRef.current = null; setPending(null); setInput(message); setUnconfirmed(false);
        setActionError(feedback);
      } else {
        setUnconfirmed(true);
        setActionError({ code: "delivery_unknown", message: feedback.message });
      }
    } finally {
      if (mounted.current) { setAction(null); setRefresh(value => value + 1); }
      lock.current = false;
      if (mutation.current === controller) mutation.current = null;
    }
  }

  async function sessionAction(kind: "connect" | "reset") {
    if (lock.current || (running && !readError) || (kind === "connect" && !ready)) return;
    lock.current = true; setAction(kind); setActionError(null);
    const controller = new AbortController();
    mutation.current = controller;
    try {
      const response = await fetch(`${apiBase}/session`, {
        method: kind === "connect" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        ...(kind === "connect" ? { body: JSON.stringify({ city }) } : {}), signal: controller.signal,
      });
      const body = await responseBody(response);
      if (!response.ok) throw new FeedbackError(responseFeedback(body, "Could not update the session. Reconnect to check its current state."));
      if (controller.signal.aborted) return;
      if (kind === "reset") {
        pendingRef.current = null; setPending(null); setUnconfirmed(false); setInput(""); setDayIndex(0); setMobilePanel("chat"); setRestored(false);
        applySession({ mode: "managed", messages: [], proposal: null, status: "idle", activity: [] });
      } else if (isSession(body)) applySession(body);
      else throw new FeedbackError({ code: "connection_error", message: "The session response was incomplete. Check for saved work before creating another session." });
    } catch (cause) {
      if (!controller.signal.aborted) setActionError(caughtFeedback(cause, "Could not update the session."));
    } finally {
      if (mounted.current) { setAction(null); setRefresh(value => value + 1); }
      lock.current = false;
      if (mutation.current === controller) mutation.current = null;
    }
  }

  function restoreDraft() {
    if (!pending || busy || running || checking || readError) return;
    setInput(pending.text); pendingRef.current = null; setPending(null); setUnconfirmed(false);
    setActionError(needsNewSession(session?.errorCode) ? null : { code: "draft_restored", message: "Review the saved conversation before you press Send. Nothing has been resent." });
    textarea.current?.focus();
  }

  return <div className={`app-shell managed-app ${embedded ? "managed-embedded" : ""}`}>
    {!embedded && <header className="site-header">
      <a className="wordmark" href="/" aria-label="Offsite home"><Compass size={23} strokeWidth={1.3} /><span>offsite<span className="wordmark-dot">.</span></span></a>
      <nav className="managed-navigation" aria-label="App navigation"><a href="/workshop">Slides</a><a href={implementation === "learner" ? "/agent" : "/lab"}>{implementation === "learner" ? "Completed demo" : "Lab starter"}</a></nav>
    </header>}
    <div className="managed-session-bar" aria-label="Managed session controls">
      <span className={`managed-mode ${embedded ? "managed-product-brand" : ""}`}>{embedded ? <><Compass size={17} strokeWidth={1.5} /><strong>Offsite</strong></> : <><span className={`status-dot ${session?.id ? "live" : ""}`} />{versionLabel}</>}</span>
      <div className="managed-session-id"><span>Session</span><code title={session?.id}>{session?.id || (checking && !ready ? "Checking…" : "No session yet")}</code></div>
      <span className="managed-status" aria-live="polite">{checking && !ready ? "Checking session…" : action === "message" ? "Sending…" : action === "connect" ? "Creating session…" : isSetupFeedback(notice?.code) ? "Setup required" : running ? "Agent working" : needsRevision ? "Needs revision" : notice && notice.code !== "draft_restored" ? "Needs attention" : session?.status === "completed" ? "Proposal ready" : session?.id ? "Ready" : ""}</span>
      <div className="managed-session-actions">
        {(session?.id || readError || unconfirmed) && <button onClick={() => setRefresh(value => value + 1)} disabled={busy || checking} title="Read session history without resending messages"><RefreshCw size={13} className={checking ? "spin" : ""} /><span>Reconnect</span></button>}
        {session?.id || readError ? <button onClick={() => void sessionAction("reset")} disabled={busy || (running && !readError) || checking} title="Disconnect this browser; hosted history is retained"><Plus size={13} /><span>{session?.id ? "New offsite" : "Reset session"}</span></button>
          : <button onClick={() => void sessionAction("connect")} disabled={busy || !ready || Boolean(readError)}><Plus size={13} /><span>{action === "connect" ? "Connecting…" : "Create session"}</span></button>}
      </div>
    </div>

    {restored && <p className="managed-restored" role="status">Restored your saved offsite. Continue below, or choose New offsite to start again.</p>}

    {hasStarted && <nav className="mobile-tabs" aria-label="Managed workspace">
      <button className={mobilePanel === "chat" ? "active" : ""} aria-pressed={mobilePanel === "chat"} onClick={() => setMobilePanel("chat")}><MessageCircle size={15} />Conversation</button>
      <button className={mobilePanel === "proposal" ? "active" : ""} aria-pressed={mobilePanel === "proposal"} onClick={() => setMobilePanel("proposal")}><MapPin size={15} />Proposal{proposal && <span className="small-dot" />}</button>
    </nav>}

    {checking && !ready ? <main className="managed-loading" aria-busy="true"><div role="status"><LoaderCircle size={20} className="spin" /><h2>Checking for a saved offsite…</h2><p>Your previous conversation and proposal will appear here if you have one.</p></div></main> : <main className={`workspace ${hasStarted ? "planning" : "starting"}`}>
      <section className={`chat-panel ${mobilePanel === "chat" ? "mobile-visible" : ""}`} aria-label="Managed offsite conversation">
        {hasStarted && <div className="chat-panel-header"><div className="concierge-avatar"><Sparkles size={17} /></div><div><h1>Offsite planner</h1><span>{session?.city || city} · Managed session</span></div></div>}
        <div className="chat-scroll">
          {!hasStarted ? <div className="welcome"><span className="eyebrow">{versionLabel}</span><h2>{implementation === "learner" ? "Build the planner." : "Give the agent a brief."}</h2><p>{implementation === "learner" ? hosted ? "This hosted page shows the unfinished starter. Complete the exercises in your local checkout and test on localhost." : "Complete the tools and execution budget exercises, then send a brief to try your changes." : "Plan an offsite, then refine it in the same managed session."}</p>{implementation === "learner" && <button className="managed-lab-link" onClick={() => openStep(hosted ? "lab-get-started" : "lab-tools")}>{hosted ? "Set up your local lab" : "Open the tools exercise"}<ArrowRight size={14} /></button>}<p className="sample-note">Plans use fictional venue data. No live availability checks or bookings.</p></div>
            : <div className="messages" role="log" aria-live="polite" aria-label="Session messages">
              {session?.messages.map(message => <div className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" && <span className="message-sender"><Sparkles size={12} />OFFSITE</span>}
                {message.role === "assistant" ? <div className="message-markdown"><ReactMarkdown>{message.text}</ReactMarkdown></div> : <p>{message.text}</p>}
              </div>)}
              {pending && <div className="message user managed-pending"><p>{pending.text}</p><small>{unconfirmed ? "Delivery not confirmed" : "Waiting for confirmation in session history"}</small></div>}
              {(running || action === "message") && <div className="managed-waiting" role="status"><LoaderCircle size={14} className="spin" /><span>{action === "message" ? "Sending your message…" : embedded ? "The agent is working. You can return to the slides." : "The agent is working. You can reconnect to this session later."}</span></div>}
              {session?.status === "idle" && session.messages.length > 0 && !proposal && !pending && !session.error && <p className="managed-output-note">This turn has no proposal yet. Answer any question above to continue in this session.</p>}
              {proposal && <button className="view-plan-mobile" onClick={() => setMobilePanel("proposal")}>View the proposal<ArrowRight size={14} /></button>}
            </div>}
          <div ref={bottom} />
        </div>
        <div className="chat-bottom">
          {session && session.activity.length > 0 && <details className="managed-activity" open={running || undefined}><summary>Session activity <span>{session.activity.length}</span></summary><div className="activity-list">{session.activity.map(event => <div key={event.id}>{event.state === "running" ? <LoaderCircle size={12} className="spin" /> : <Check size={12} />}<span>{event.label}</span></div>)}</div></details>}
          {notice && <ManagedFeedbackPanel feedback={notice} hosted={hosted} hasSession={Boolean(session?.id)} busy={busy || checking} canRevise={canSend} canRestore={Boolean(pending) && !busy && !running && !checking && !readError} onRead={() => setRefresh(value => value + 1)} onReset={() => void sessionAction("reset")} onRevise={draftRevision} onRestore={restoreDraft} onStep={openStep} />}
          {!hasStarted && <div className="destination-field"><label htmlFor="managed-city">Destination</label><select id="managed-city" className="city-select" value={city} disabled={!ready || busy || Boolean(session?.id)} onChange={event => { if (CITIES.includes(event.target.value as City)) setCity(event.target.value as City); }}>{CITIES.map(destination => <option key={destination}>{destination}</option>)}</select>{session?.id && <span className="managed-city-note">Set for this session</span>}</div>}
          <form className="composer" onSubmit={event => { event.preventDefault(); void sendMessage(input); }}>
            <label htmlFor="managed-input" className="sr-only">Message the offsite agent</label>
            <textarea ref={textarea} id="managed-input" value={input} onChange={event => setInput(event.target.value)} rows={hasStarted ? 2 : 3} maxLength={4000} placeholder={hasStarted ? "What should change about this offsite?" : "12 people, 2 days. Workshops, vegetarian meals, and a $6,000 budget."} disabled={!canSend} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendMessage(input); } }} />
            <div className="composer-bottom"><span><MapPin size={12} />{session?.city || city}</span><button type="submit" aria-label="Send to managed agent" disabled={!canSend || !input.trim()}>{busy || running ? <LoaderCircle size={17} className="spin" /> : <ArrowUp size={18} />}</button></div>
          </form>
          {!hasStarted && <div className="starter-prompts"><button disabled={!canSend} onClick={() => { setInput(prompt); textarea.current?.focus(); }}>Use the example brief<ArrowRight size={14} /></button></div>}
          <p className="chat-disclosure">Pressing Send starts real agent work · Fictional venues · No bookings</p>
        </div>
      </section>

      {hasStarted && <section className={`itinerary-panel ${mobilePanel === "proposal" ? "mobile-visible" : ""}`} aria-label="Managed offsite proposal">
        {proposal ? <div className="plan-content">
          <div className="plan-heading"><div><span className="eyebrow">AGENT PROPOSAL</span><h3>{proposal.title}</h3></div><button className="icon-button" onClick={() => downloadProposal(proposal)} aria-label="Download managed proposal"><ArrowDownToLine size={17} /></button></div>
          <div className="trip-facts"><span><Clock3 size={14} />{proposal.days.length} days</span><span><Users size={14} />{proposal.attendees} people</span><span><Wallet size={14} />{money(totalCost(proposal))} of {money(proposal.budget)}</span></div>
          {running && <p className="managed-revising"><LoaderCircle size={13} className="spin" />Showing the last proposal while the agent works.</p>}
          <div className="day-tabs" role="tablist" aria-label="Proposal days">{proposal.days.map((day, index) => <button key={day.day} id={`managed-day-tab-${index}`} role="tab" aria-selected={dayIndex === index} aria-controls={`managed-day-panel-${index}`} tabIndex={dayIndex === index ? 0 : -1} className={dayIndex === index ? "selected" : ""} onClick={() => setDayIndex(index)} onKeyDown={event => {
            if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? proposal.days.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + proposal.days.length) % proposal.days.length;
              setDayIndex(next); document.getElementById(`managed-day-tab-${next}`)?.focus();
            }
          }}><span>DAY {String(day.day).padStart(2, "0")}</span>{day.title}</button>)}</div>
          {proposal.days[dayIndex] && <div className="day-stops" role="tabpanel" id={`managed-day-panel-${dayIndex}`} aria-labelledby={`managed-day-tab-${dayIndex}`}>
            {proposal.days[dayIndex].stops.map(stop => <article className="stop" key={stop.id}><div className="stop-time"><span>{stop.time}</span><div className="timeline-dot" /></div><div className="stop-body"><div className="stop-meta"><span>{stop.category}</span><span>{stop.durationMinutes} min</span></div><h4>{stop.title}</h4><p>{stop.description}</p><div className="stop-footer"><span><MapPin size={11} />{stop.location}</span></div></div></article>)}
          </div>}
          <details className="proposal-details"><summary>Budget details</summary><dl className="budget-items">{proposal.budgetItems.map((item, index) => <div key={`${item.label}-${index}`}><dt>{item.label}</dt><dd>{money(item.amount)}</dd></div>)}<div className="budget-total"><dt>Estimated total</dt><dd>{money(totalCost(proposal))}</dd></div></dl></details>
          <details className="proposal-details"><summary>Rain backup</summary><p className="rain-plan">{proposal.rainPlan}</p></details>
          <div className="plan-note"><Info size={13} /><p>Generated from illustrative lab venue fixtures. Costs are planning allowances, not live quotes. Flights and lodging are excluded; no bookings have been made.</p></div>
        </div> : <div className="empty-plan"><div className="empty-plan-intro"><h3>{running ? "The agent is working on your brief." : "Your proposal will appear here."}</h3><p>{running ? "The session activity shows real progress. The proposal appears once its output is available." : "Continue the conversation to produce an offsite proposal."}</p></div></div>}
      </section>}
    </main>}
  </div>;
}
