"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Code2, ExternalLink, FolderOpen, List, Maximize, Minimize, Monitor, Pause, Play, RotateCcw, SkipBack, X } from "lucide-react";
import type { WorkshopSlide } from "@/lib/workshop-types";
import { CodePanel } from "./workshop-code-panel";
import { WorkshopVisual } from "./workshop-visuals";
import { WorkshopActivityPanel } from "./workshop-activity";
import { WorkshopSetup } from "./workshop-settings";
import { LAB_REPOSITORY, SETTINGS_KEY, type WorkshopSettings } from "@/lib/workshop-links";

type View = "slide" | "demo";
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export function Workshop({ slides }: { slides: WorkshopSlide[] }) {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<View>("slide");
  const [demo, setDemo] = useState<"starter" | "managed">("managed");
  const [loadedDemo, setLoadedDemo] = useState({ starter: false, managed: false });
  const [notesOpen, setNotesOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [settings, setSettings] = useState<WorkshopSettings>({ repository: LAB_REPOSITORY, folder: "" });
  const [hints, setHints] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const outlineRef = useRef<HTMLDialogElement>(null);
  const starterFrameRef = useRef<HTMLIFrameElement>(null);
  const managedFrameRef = useRef<HTMLIFrameElement>(null);
  const slide = slides[index];
  const elapsed = slides.filter((item, i) => i < index && item.phase === slide.phase).reduce((sum, item) => sum + item.minutes, 0);
  const activities = slide.activities ?? (slide.activity ? [slide.activity] : []);
  const isQuestion = slide.kind === "decision" && activities.length > 0 && !slide.code?.length;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
      if (saved && typeof saved.folder === "string") setSettings({repository:LAB_REPOSITORY,folder:saved.folder});
    } catch { /* The deck remains usable if browser storage is unavailable. */ }
  }, []);

  function saveSettings(value: WorkshopSettings) {
    setSettings(value);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)); } catch { /* Keep settings for this visit. */ }
  }

  const go = useCallback((next: number) => {
    const target = Math.max(0, Math.min(slides.length - 1, next));
    setIndex(target); setView("slide"); setHints(0); setTimerRunning(false);
    setSeconds(slides[target].minutes * 60);
    window.history.replaceState(null, "", `#${slides[target].id}`);
  }, [slides]);

  useEffect(() => {
    const restore = () => {
      const found = slides.findIndex(item => item.id === window.location.hash.slice(1));
      go(found >= 0 ? found : 0);
    };
    restore();
    window.addEventListener("hashchange", restore);
    return () => window.removeEventListener("hashchange", restore);
  }, [go]);

  useEffect(() => {
    const showExercise = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !event.source ||
          (event.source !== starterFrameRef.current?.contentWindow && event.source !== managedFrameRef.current?.contentWindow)) return;
      if (event.data?.type !== "offsite:show-slide" || typeof event.data.slideId !== "string") return;
      const target = slides.findIndex(item => item.id === event.data.slideId);
      if (target >= 0) go(target);
    };
    window.addEventListener("message", showExercise);
    return () => window.removeEventListener("message", showExercise);
  }, [go, slides]);

  useEffect(() => {
    if (!timerRunning) return;
    const tick = window.setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(tick);
  }, [timerRunning]);
  useEffect(() => { if (seconds === 0) setTimerRunning(false); }, [seconds]);
  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    const dialog = outlineRef.current;
    if (outlineOpen && !dialog?.open) dialog?.showModal();
    if (!outlineOpen && dialog?.open) dialog.close();
  }, [outlineOpen]);
  useEffect(() => {
    headingRef.current?.closest("main")?.scrollTo({ top: 0 });
    headingRef.current?.parentElement?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (outlineOpen || document.querySelector("dialog[open]") || view === "demo" || event.metaKey || event.ctrlKey || event.altKey ||
          target.closest("input,textarea,select,button,a,pre,[contenteditable=true]")) return;
      if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); go(index + 1); }
      if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); go(index - 1); }
      if (event.key === "Home") { event.preventDefault(); go(0); }
      if (event.key === "End") { event.preventDefault(); go(slides.length - 1); }
      if (event.key.toLowerCase() === "n") setNotesOpen(value => !value);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [index, go, outlineOpen, view]);

  function openDemo(mode: "starter" | "managed" = loadedDemo.starter || loadedDemo.managed ? demo : slide.phase === "lab" ? "starter" : "managed") {
    setDemo(mode); setLoadedDemo(value => ({ ...value, [mode]: true })); setView("demo");
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shellRef.current?.requestFullscreen();
    } catch { /* Browser window presentation still works when fullscreen is unavailable. */ }
  }

  return <div className="wk-shell" ref={shellRef}>
    <header className="wk-header">
      <button className="wk-brand" onClick={() => setView("slide")} aria-label="Claude Managed Agents — return to slides"><strong>Claude</strong><span>Managed Agents</span></button>
      <div className="wk-header-actions">
        <button onClick={() => go(0)} aria-label="Start of deck" title="Go to the first slide"><SkipBack size={16} /><span>Start of deck</span></button>
        <a className="wk-instructor-link" href="/instructor" target="_blank" rel="noreferrer" aria-label="Instructor guide (opens in a new tab)" title="Instructor guide (opens in a new tab)"><BookOpen size={16} /><span>Instructor guide</span></a>
        <button onClick={() => setSetupOpen(true)} aria-label="Configure VS Code file links"><FolderOpen size={16} /><span>Editor links</span></button>
        <button onClick={() => setOutlineOpen(true)} aria-label="Open session and lab outline"><List size={17} /><span>Outline</span></button>
        <button onClick={() => setNotesOpen(value => !value)} aria-label="Notes" aria-pressed={notesOpen}><BookOpen size={16} /><span>Notes</span></button>
        <button onClick={toggleFullscreen} aria-label={fullscreen ? "Exit fullscreen" : "Present fullscreen"}>{fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}</button>
      </div>
    </header>
    <div className="wk-toolbar">
      <span className="wk-phase">{slide.kind === "closing" ? "Questions and next steps" : slide.phase === "teach" ? "Teaching" : "Hands-on lab"}{slide.kind !== "closing" && <span>{slide.phase === "teach" ? "20 min" : "60 min"}</span>}{slide.kind !== "closing" && slide.section && <span className="wk-section-name">{slide.section}</span>}</span>
      <nav className="wk-view-switch" aria-label="Main navigation">
        <button className={view === "slide" ? "active" : "wk-back-to-slides"} aria-pressed={view === "slide"} onClick={() => setView("slide")}>{view === "demo" ? <><ArrowLeft size={15} />Back to slides</> : <><Code2 size={15} />Slides</>}</button>
        <button className={view === "demo" ? "active" : ""} aria-pressed={view === "demo"} onClick={() => openDemo()}><Monitor size={15} />Live app</button>
      </nav>
    </div>

    <div className={`wk-stage ${notesOpen ? "with-notes" : ""}`}>
      <main className={`wk-slide ${slide.code?.length ? "has-code" : ""} ${slide.kind === "title" ? "is-title" : ""} ${slide.welcome ? "is-welcome" : slide.kind === "closing" ? "is-closing" : ""} ${activities.length ? "has-activity" : ""} ${isQuestion ? "is-question" : ""}`} hidden={view !== "slide"} aria-label={`Slide ${index + 1} of ${slides.length}`}>
        <div className="wk-slide-copy">
          <div className="wk-slide-kicker">{slide.welcome?.organization ?? (isQuestion ? "Checkpoint" : slide.kind === "task" ? "Your task" : slide.kind === "demo" ? "In the app" : slide.phase === "lab" && slide.kind !== "closing" ? "Checkpoint" : "Claude Managed Agents")}</div>
          <h1 ref={headingRef} tabIndex={-1}>{slide.welcome ? (slide.welcome.titleLines ?? [slide.title]).map((line, i) => <span key={line}>{i > 0 ? " " : ""}{line}</span>) : slide.title}</h1>
          {slide.closing && <p className="wk-closing-subtitle">{slide.closing.subtitle}</p>}
          {slide.welcome && <div className="wk-welcome-details">{slide.welcome.subtitle && <p className="wk-welcome-subtitle">{slide.welcome.subtitle}</p>}<div className="wk-welcome-format">{slide.welcome.format.split(" · ").map(part => <p key={part}>{part}</p>)}</div><p className="wk-welcome-date">{slide.welcome.date}</p></div>}
          {!slide.task && slide.bullets.length > 0 && <ul className="wk-bullets">{slide.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}
          {slide.prompt && <p className="wk-discussion"><span>Use this brief</span>{slide.prompt}</p>}
          {slide.kind === "demo" && <button className="wk-primary" onClick={() => openDemo("managed")}>{slide.demoAction ?? "Open the completed demo"}<ArrowRight size={17} /></button>}
          {activities.length > 0 && <WorkshopActivityPanel key={slide.id} activities={activities} />}
          {slide.task && <div className="wk-task-details">
            <div className="wk-task-goal"><p>{slide.task.goal}</p></div>
            <ol className="wk-task-steps">{slide.task.steps.map(step => <li key={step}>{step}</li>)}</ol>
            <div className="wk-check"><Check size={16} /><div><strong>Expected result</strong><p>{slide.task.expected ?? slide.task.check}</p></div></div>
            {slide.task.hints.length > 0 && <><button className="wk-hint-button" onClick={() => setHints(value => Math.min(value + 1, slide.task!.hints.length))} disabled={hints === slide.task.hints.length}>{hints ? "Next hint" : "Need a hint?"}<span>{hints} / {slide.task.hints.length}</span></button>{slide.task.hints.slice(0, hints).map((hint, i) => <p className="wk-hint" key={hint}><span>{i + 1}</span>{hint}</p>)}</>}
            {slide.task.bonus && <details className="wk-bonus"><summary>Finished early? {slide.task.bonus.question}</summary><p>{slide.task.bonus.answer}</p></details>}
          </div>}
        </div>
        {!isQuestion && <div className="wk-slide-media">{slide.closing ? <div className="wk-closing-links">{slide.closing.links.map(link => <a key={link.href} href={link.href} target={link.href.startsWith("https://") ? "_blank" : undefined} rel={link.href.startsWith("https://") ? "noreferrer" : undefined}><div><strong>{link.label}</strong><p>{link.detail}</p></div>{link.href.startsWith("https://") ? <ExternalLink size={18} /> : <ArrowRight size={18} />}</a>)}</div> : slide.code?.length ? <CodePanel key={slide.id} examples={slide.code} settings={settings} configure={() => setSetupOpen(true)} /> : <WorkshopVisual type={slide.visual} />}</div>}
      </main>

      <section className="wk-demo" hidden={view !== "demo"} aria-label="Embedded offsite app">
        <div className="wk-demo-top"><div><button aria-pressed={demo === "managed"} className={demo === "managed" ? "selected" : ""} onClick={() => openDemo("managed")}>Completed demo</button><button aria-pressed={demo === "starter"} className={demo === "starter" ? "selected" : ""} onClick={() => openDemo("starter")}>Lab starter</button></div><span>{demo === "starter" ? "Your editable exercises · separate session" : "Solved exercises · live Claude execution"}</span><a href={demo === "starter" ? "/lab" : "/agent"} target="_blank" rel="noreferrer" aria-label="Open app in a separate tab"><ExternalLink size={16} /></a></div>
        {loadedDemo.starter && <iframe ref={starterFrameRef} title="Offsite lab starter" src="/lab?embed=1" hidden={demo !== "starter"} />}
        {loadedDemo.managed && <iframe ref={managedFrameRef} title="Offsite completed demo" src="/agent?embed=1" hidden={demo !== "managed"} />}
      </section>

      {notesOpen && <aside className="wk-notes" aria-label="Instructor notes">
        <div><h2>Instructor script</h2><button onClick={() => setNotesOpen(false)} aria-label="Close notes"><X size={17} /></button></div>
        <span className="wk-notes-time">{slide.kind === "closing" ? "Optional Q&A · after the lab" : `${formatTime(elapsed * 60)}–${formatTime((elapsed + slide.minutes) * 60)} in ${slide.phase === "teach" ? "teaching" : "lab"}`}</span>
        {slide.notes.map(note => {
          const cue = /^(Say|Show|Ask|Pause|Reveal|Transition|Watch for|If stuck|Check|Do|Timing):\s*/.exec(note);
          return <p key={note} className={cue ? "wk-script-line" : undefined}>{cue && <span>{cue[1]}</span>}{cue ? note.slice(cue[0].length) : note}</p>;
        })}
        {slide.sources.length > 0 && <section><h3>References</h3>{slide.sources.map(source => <a key={source.url + source.label} href={source.url} target="_blank" rel="noreferrer">{source.label}<ExternalLink size={12} /></a>)}</section>}
      </aside>}
    </div>

    <footer className="wk-footer">
      <div className="wk-slide-progress"><span>{String(index + 1).padStart(2, "0")}<span> / {slides.length}</span></span><div><span style={{ width: `${((index + 1) / slides.length) * 100}%` }} /></div></div>
      {slide.phase === "lab" && slide.kind !== "closing" ? <div className="wk-timer"><button onClick={() => setTimerRunning(value => !value)} aria-label={timerRunning ? "Pause task timer" : "Start task timer"}>{timerRunning ? <Pause size={14} /> : <Play size={14} />}{formatTime(seconds)}</button><button onClick={() => { setTimerRunning(false); setSeconds(slide.minutes * 60); }} aria-label="Reset task timer"><RotateCcw size={13} /></button></div> : <span className="wk-footer-hint">← → to navigate <span>N for notes</span></span>}
      <div className="wk-navigation"><button onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous slide"><ArrowLeft size={18} /></button><button onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label="Next slide">Next<ArrowRight size={18} /></button></div>
    </footer>
    <dialog ref={outlineRef} className="wk-outline" onCancel={() => setOutlineOpen(false)} onClick={event => { if (event.target === event.currentTarget) setOutlineOpen(false); }} aria-labelledby="wk-outline-heading">
      <div className="wk-outline-header"><div><h2 id="wk-outline-heading">The session and lab</h2><p>20 minutes teaching. 60 minutes building.</p></div><button onClick={() => setOutlineOpen(false)} aria-label="Close outline"><X size={20} /></button></div>
      {(["teach", "lab"] as const).map(phase => <section key={phase}><h3>{phase === "teach" ? "Teaching / 20 min" : "Hands-on / 60 min"}</h3>{slides.map((item, i) => item.phase === phase && <button key={item.id} className={i === index ? "active" : ""} onClick={() => { go(i); setOutlineOpen(false); }}><span>{String(i + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.kind === "closing" ? "Q&A" : Number.isInteger(item.minutes) ? `${item.minutes} min` : formatTime(item.minutes * 60)}</small></button>)}</section>)}
    </dialog>
    <WorkshopSetup open={setupOpen} settings={settings} close={() => setSetupOpen(false)} save={saveSettings} />
  </div>;
}
