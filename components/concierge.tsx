"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowDownToLine, ArrowRight, ArrowUp, ArrowUpRight, Clock3, Compass, Info, LoaderCircle, MapPin, MessageCircle, Plus, RotateCcw, Sparkles, Users, Wallet, X } from "lucide-react";
import { CITIES } from "@/lib/types";
import type { ChatMessage, City, OffsitePlan, OffsiteReply } from "@/lib/types";

const STORAGE_KEY = "offsite-starter-v1";
const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
const totalCost = (plan: OffsitePlan) => plan.budgetItems.reduce((total, item) => total + item.amount, 0);
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const nonnegative = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

// Browser storage is optional and may contain stale or incomplete data.
function isPlan(value: unknown): value is OffsitePlan {
  if (!record(value) || !CITIES.includes(value.city as City) || !text(value.title) || !text(value.rainPlan) ||
      !nonnegative(value.budget) || !Number.isInteger(value.attendees) || Number(value.attendees) < 1 ||
      !Array.isArray(value.days) || value.days.length < 1 || value.days.length > 10 ||
      !Array.isArray(value.budgetItems) || value.budgetItems.length < 1) return false;
  return value.days.every((day, index) => record(day) && day.day === index + 1 && text(day.title) &&
    Array.isArray(day.stops) && day.stops.length > 0 && day.stops.every(stop => record(stop) &&
      [stop.id, stop.time, stop.title, stop.category, stop.location, stop.description].every(text) &&
      nonnegative(stop.durationMinutes))) &&
    value.budgetItems.every(item => record(item) && text(item.label) && nonnegative(item.amount));
}

function loadSaved(): { city: City; messages: ChatMessage[]; proposal: OffsitePlan } | null {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!record(saved) || !CITIES.includes(saved.city as City) || !isPlan(saved.proposal) ||
        saved.proposal.city !== saved.city || !Array.isArray(saved.messages) || !saved.messages.length ||
        saved.messages.length > 200 || saved.messages.length % 2 !== 0) return null;
    if (!saved.messages.every((message, index) => record(message) && text(message.id) && text(message.text) &&
      message.role === (index % 2 === 0 ? "user" : "assistant"))) return null;
    return { city: saved.city as City, messages: saved.messages as ChatMessage[], proposal: saved.proposal };
  } catch { return null; }
}

function downloadPlan(plan: OffsitePlan) {
  const content = [
    `# ${plan.title}`, "", "Sample proposal — scripted starter; no venues booked.",
    `${plan.attendees} people · ${plan.days.length} days · Budget ${money(plan.budget)}`, "",
    ...plan.days.flatMap(day => [`## Day ${day.day} — ${day.title}`, "", ...day.stops.flatMap(stop => [
      `### ${stop.time} · ${stop.title}`, stop.description,
      `${stop.location} · ${stop.durationMinutes} minutes`, "",
    ])]),
    "## Sample budget", "", ...plan.budgetItems.map(item => `- ${item.label}: ${money(item.amount)}`),
    `- Total: ${money(totalCost(plan))}`, "", "Illustrative allowances, not venue quotes. Flights and lodging are excluded.",
    "", "## Rain backup", "", plan.rainPlan,
  ].join("\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `offsite-${plan.city.toLowerCase().replaceAll(" ", "-")}-proposal.md`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Concierge({ embedded = false }: { embedded?: boolean }) {
  const [city, setCity] = useState<City>("Chicago");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposal, setProposal] = useState<OffsitePlan | null>(null);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  const [input, setInput] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<"chat" | "itinerary">("chat");
  const [showInfo, setShowInfo] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const proposalRef = useRef<HTMLElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);
  const focusInputRef = useRef(false);
  const focusProposalRef = useRef(false);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) { setCity(saved.city); setMessages(saved.messages); setProposal(saved.proposal); }
    setReady(true);
    return () => requestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!busy && ready && focusInputRef.current && mobilePanel === "chat") {
      focusInputRef.current = false;
      inputRef.current?.focus();
    }
  }, [busy, ready, mobilePanel, messages.length]);

  useEffect(() => {
    if (mobilePanel === "itinerary" && focusProposalRef.current) {
      focusProposalRef.current = false;
      proposalRef.current?.focus();
    }
  }, [mobilePanel]);

  useEffect(() => {
    if ((messages.length || pendingMessage) && mobilePanel === "chat") {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      bottomRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "end" });
    }
  }, [messages, pendingMessage, mobilePanel]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (showInfo && !dialog?.open) dialog?.showModal();
    if (!showInfo && dialog?.open) dialog.close();
  }, [showInfo]);

  const hasStarted = messages.length > 0 || pendingMessage !== null;
  const visibleMessages = pendingMessage ? [...messages, pendingMessage] : messages;
  const starters = [
    { label: "Team strategy", message: `Plan a two-day offsite in ${city} for 12 people. We need focused strategy time and clear decisions. Budget $6,000.` },
    { label: "Team connection", message: `Help our 12-person team reconnect at a two-day offsite in ${city}. Include shared meals and a relaxed group activity. Budget $6,000.` },
    { label: "Creative workshop", message: `Plan a creative two-day offsite in ${city} for 12 people. Make room for brainstorming, collaboration and fresh ideas. Budget $6,000.` },
  ];

  async function sendMessage(value: string) {
    const message = value.trim();
    if (!message || !ready || sendingRef.current) return;
    sendingRef.current = true;
    focusInputRef.current = true;
    setBusy(true); setError(null); setInput("");
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", text: message };
    setPendingMessage(userMessage);
    const controller = new AbortController();
    requestRef.current = controller;
    let failureMessage = "We couldn’t load the sample plan. Your message is ready to send again.";
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, city, isFollowUp: messages.length > 0 }), signal: controller.signal,
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        if (record(data) && text(data.error)) failureMessage = `${data.error} Your message is still in the input.`;
        throw new Error("Sample request failed");
      }
      if (!record(data) || !text(data.message) || !isPlan(data.proposal) || data.proposal.city !== city) {
        failureMessage = "The sample plan was incomplete. Your message is ready to send again.";
        throw new Error("Invalid sample response");
      }
      const reply = data as OffsiteReply;
      const completed = [...messages, userMessage, { id: crypto.randomUUID(), role: "assistant" as const, text: reply.message }];
      setMessages(completed); setProposal(reply.proposal); setPendingMessage(null);
      setDayIndex(index => Math.min(index, reply.proposal.days.length - 1));
      // Save only a completed request/response pair, never an optimistic message.
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, messages: completed, proposal: reply.proposal })); } catch { /* The current offsite remains usable without storage. */ }
    } catch {
      if (controller.signal.aborted) return;
      setPendingMessage(null); setInput(message);
      setError(failureMessage);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      sendingRef.current = false;
      requestRef.current = null;
    }
  }

  function newOffsite() {
    if (sendingRef.current) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Reset still works for this page. */ }
    focusInputRef.current = true;
    setMessages([]); setProposal(null); setPendingMessage(null); setInput(""); setError(null);
    setDayIndex(0); setMobilePanel("chat");
  }

  function viewProposal() {
    focusProposalRef.current = true;
    setMobilePanel("itinerary");
  }

  return <div className={`app-shell ${embedded ? "embedded" : ""}`}>
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Offsite home"><Compass size={23} strokeWidth={1.5} /><span>Offsite</span></a>
      <div className="header-actions">
        <a className="workshop-link" href="/workshop">Slides</a>
        <button className="mode-label" onClick={() => setShowInfo(true)}><span className="status-dot" />UI preview<Info size={13} /></button>
        <span className="header-divider" />
        <button className="new-trip" onClick={newOffsite} disabled={!ready || busy}><Plus size={15} /><span>New offsite</span></button>
      </div>
    </header>
    {embedded && hasStarted && <div className="embedded-controls"><span>Sample proposal</span><button className="new-trip" onClick={newOffsite} disabled={!ready || busy}><Plus size={14} />New offsite</button></div>}

    {hasStarted && <nav className="mobile-tabs" aria-label="Workspace">
      <button className={mobilePanel === "chat" ? "active" : ""} aria-pressed={mobilePanel === "chat"} onClick={() => setMobilePanel("chat")}><MessageCircle size={15} />Conversation</button>
      <button className={mobilePanel === "itinerary" ? "active" : ""} aria-pressed={mobilePanel === "itinerary"} onClick={() => setMobilePanel("itinerary")}><MapPin size={15} />Offsite plan{proposal && <span className="small-dot" />}</button>
    </nav>}

    <main className={`workspace ${hasStarted ? "planning" : "starting"}`}>
      <section className={`chat-panel ${mobilePanel === "chat" ? "mobile-visible" : ""}`} aria-label="Offsite planning conversation">
        {hasStarted && <div className="chat-panel-header"><div className="concierge-avatar"><Sparkles size={17} strokeWidth={1.4} /></div><div><h1>Offsite planner</h1><span>{city}</span></div></div>}
        <div className="chat-scroll">
          {!hasStarted ? <div className="welcome">
            <h2>Plan your next offsite.</h2>
            <p>Choose a city and tell us about your team, goals and budget.</p>
            <p className="sample-note">Start with a sample two-day plan for 12 people. This starter uses canned responses.</p>
          </div> : <div className="messages" role="log" aria-live="polite" aria-label="Conversation">
            {visibleMessages.map((message, index) => <div className={`message ${message.role}`} key={message.id}>
              {message.role === "assistant" && <span className="message-sender"><Sparkles size={12} />OFFSITE</span>}
              {message.role === "assistant"
                ? <div className="message-markdown"><ReactMarkdown>{message.text}</ReactMarkdown></div>
                : <p>{message.text}</p>}
              {message.role === "assistant" && index === visibleMessages.length - 1 && proposal && !busy && <button className="view-plan-mobile" onClick={viewProposal}>View the sample plan<ArrowRight size={14} /></button>}
            </div>)}
            {busy && <div className="thinking"><span /><span /><span /><p>Loading the sample plan</p></div>}
          </div>}
          <div ref={bottomRef} />
        </div>
        <div className="chat-bottom">
          {error && <div className="error-message" role="alert"><p>{error}</p><button onClick={() => void sendMessage(input)} disabled={busy || !input.trim()}><RotateCcw size={12} />Try again</button></div>}
          {!hasStarted && <div className="destination-field"><label htmlFor="destination">Destination</label><select className="city-select" id="destination" value={city} onChange={event => { if (CITIES.includes(event.target.value as City)) setCity(event.target.value as City); }} disabled={!ready || busy}>{CITIES.map(destination => <option key={destination} value={destination}>{destination}</option>)}</select></div>}
          <form className="composer" onSubmit={event => { event.preventDefault(); void sendMessage(input); }}>
            <label htmlFor="chat-input" className="sr-only">Describe your offsite</label>
            <textarea ref={inputRef} id="chat-input" value={input} onChange={event => setInput(event.target.value)} maxLength={4000} rows={hasStarted ? 2 : 3} placeholder={hasStarted ? "What would you change about this plan?" : "12 people, 2 days. Strategy and team connection. $6,000 total."} disabled={!ready || busy} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendMessage(input); } }} />
            <div className="composer-bottom"><span><MapPin size={12} />{city}</span><button type="submit" aria-label="Send message" disabled={!input.trim() || !ready || busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <ArrowUp size={18} />}</button></div>
          </form>
          {!hasStarted && <div className="starter-prompts"><span>Try an example</span>{starters.map(starter => <button key={starter.label} disabled={!ready || busy} onClick={() => void sendMessage(starter.message)}>{starter.label}<ArrowUpRight size={15} /></button>)}</div>}
          <p className="chat-disclosure">Scripted starter · No AI calls · Completed plans saved in this browser</p>
        </div>
      </section>

      {hasStarted && <section ref={proposalRef} tabIndex={-1} className={`itinerary-panel ${mobilePanel === "itinerary" ? "mobile-visible" : ""}`} aria-label="Sample offsite proposal">
        {proposal ? <div className="plan-content">
          <div className="plan-heading"><div><span className="eyebrow">Sample proposal</span><h3>{proposal.title}</h3></div><button className="icon-button download-button" onClick={() => downloadPlan(proposal)} aria-label="Download offsite proposal" title="Download offsite proposal"><ArrowDownToLine size={17} /></button></div>
          <div className="trip-facts"><span><Clock3 size={14} />{proposal.days.length} days</span><span><Users size={14} />{proposal.attendees} people</span><span><Wallet size={14} />{money(totalCost(proposal))} of {money(proposal.budget)}</span></div>
          <div className="day-tabs" role="tablist" aria-label="Offsite days">{proposal.days.map((day, index) => <button key={day.day} id={`day-tab-${index}`} role="tab" aria-selected={dayIndex === index} aria-controls={`day-panel-${index}`} tabIndex={dayIndex === index ? 0 : -1} className={dayIndex === index ? "selected" : ""} onClick={() => setDayIndex(index)} onKeyDown={event => {
            if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? proposal.days.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + proposal.days.length) % proposal.days.length;
              setDayIndex(next); document.getElementById(`day-tab-${next}`)?.focus();
            }
          }}><span>DAY {String(day.day).padStart(2, "0")}</span>{day.title}</button>)}</div>
          {proposal.days[dayIndex] && <div className="day-stops" role="tabpanel" id={`day-panel-${dayIndex}`} aria-labelledby={`day-tab-${dayIndex}`}>
            {proposal.days[dayIndex].stops.map(stop => <article className="stop" key={stop.id}>
              <div className="stop-time"><span>{stop.time}</span><div className="timeline-dot" /></div>
              <div className="stop-body"><div className="stop-meta"><span>{stop.category}</span><span>{stop.durationMinutes < 60 ? `${stop.durationMinutes} min` : `${Number((stop.durationMinutes / 60).toFixed(1))} hr`}</span></div><h4>{stop.title}</h4><p>{stop.description}</p><div className="stop-footer"><span><MapPin size={11} />{stop.location}</span></div></div>
            </article>)}
          </div>}
          <details className="proposal-details"><summary>Budget details</summary><dl className="budget-items">{proposal.budgetItems.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{money(item.amount)}</dd></div>)}<div className="budget-total"><dt>Sample total</dt><dd>{money(totalCost(proposal))}</dd></div></dl></details>
          <details className="proposal-details"><summary>Rain backup</summary><p className="rain-plan">{proposal.rainPlan}</p></details>
          <div className="plan-note"><Info size={13} /><p>A fixed sample for the selected city. Your message doesn't tailor it yet. Locations are illustrative; costs are sample allowances, not quotes. Flights and lodging are excluded.</p></div>
        </div> : <div className="empty-plan"><div className="empty-plan-intro"><h3>Loading your sample offsite</h3><p>The two-day proposal will appear here.</p></div></div>}
      </section>}
    </main>

    <dialog ref={dialogRef} className="info-dialog" aria-labelledby="offsite-demo-title" onCancel={() => setShowInfo(false)} onClick={event => { if (event.target === event.currentTarget) setShowInfo(false); }}>
      <div className="dialog-content"><button className="icon-button dialog-close" aria-label="Close information" onClick={() => setShowInfo(false)}><X size={18} /></button><Compass size={28} strokeWidth={1.2} /><h2 id="offsite-demo-title">About this starter</h2><p>This starter uses canned responses. Each city has a fixed two-day sample for 12 people, and follow-ups return a prepared reply. Your message doesn't change the sample plan yet.</p><p>The lab connects this interface to Claude Managed Agents. Open the working agent to try real planning with hosted tools and a persistent session.</p><p>Locations and costs are illustrative. No venues are selected or booked.</p><a href="/agent">Open the managed agent<ArrowUpRight size={15} /></a></div>
    </dialog>
  </div>;
}
