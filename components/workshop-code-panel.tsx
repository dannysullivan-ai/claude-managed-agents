"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Maximize, Minimize, WrapText } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";
import type { WorkshopCode } from "@/lib/workshop-types";
import { fillSetupCode, type WorkshopSettings } from "@/lib/workshop-links";
import { EditorLink } from "./workshop-settings";

const theme = { ...themes.vsDark, styles: [...themes.vsDark.styles, { types: ["comment"], style: { color: "#93a4bf" } }] };
const labels = { reference: "Existing code", before: "Before the change", after: "Completed solution", exercise: "Learner code", command: "Run in your terminal", output: "Example terminal output" };

export function CodePanel({ examples, settings, configure }: { examples: WorkshopCode[]; settings: WorkshopSettings; configure: () => void }) {
  const [selected, setSelected] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [expanded, setExpanded] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [annotation, setAnnotation] = useState<number | null>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const example = examples[selected] ?? examples[0];
  const prepared = fillSetupCode(example.value, settings.repository);
  const lines = prepared.value.trimEnd().split("\n");
  const base = example.startLine ?? 1;
  const annotations = (example.annotations ?? []).map(item => ({ ...item, line: lines.findIndex(line => line.includes(item.find)) }));
  const focused = new Set([...(example.focusLines ?? []).map(line => line - 1), ...annotations.map(item => item.line)]);

  useEffect(() => { setCopyState("idle"); setAnnotation(null); codeRef.current?.scrollTo({ top: 0, left: 0 }); }, [selected]);
  useEffect(() => {
    if (expanded && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!expanded && dialogRef.current?.open) dialogRef.current.close();
  }, [expanded]);

  async function copy() {
    try { await navigator.clipboard.writeText(prepared.value); setCopyState("copied"); }
    catch {
      if (codeRef.current) {
        const range = document.createRange(); range.selectNodeContents(codeRef.current);
        const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
      }
      setCopyState("failed");
    }
  }

  function showAnnotation(index: number) {
    setAnnotation(index);
    const pre = codeRef.current;
    const line = pre?.querySelector<HTMLElement>(`[data-code-line="${annotations[index].line}"]`);
    if (pre && line) pre.scrollTo({ top: line.getBoundingClientRect().top - pre.getBoundingClientRect().top + pre.scrollTop - pre.clientHeight / 3, behavior: "auto" });
  }

  const panel = <div className={`wk-code-panel ${example.variant === "after" ? "is-change" : ""}`}>
    <div className="wk-code-top">
      <div className="wk-code-tabs" role="tablist" aria-label="Code examples">{examples.map((item, index) =>
        <button key={item.title} role="tab" aria-selected={selected === index} aria-controls="wk-active-code" tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? examples.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + examples.length) % examples.length;
          setSelected(next); (event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus();
        }} className={selected === index ? "selected" : ""}>{item.title}</button>)}</div>
      <div className="wk-code-actions"><button className="wk-copy" onClick={copy} disabled={!prepared.ready} aria-label={`Copy ${example.title}`}>{copyState === "copied" ? <Check size={15} /> : <Copy size={15} />}<span>{copyState === "copied" ? "Copied" : "Copy"}</span></button><button className="wk-copy" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Close expanded code" : "Expand code for presenting"}>{expanded ? <Minimize size={15} /> : <Maximize size={15} />}</button></div>
    </div>
    <div className="wk-code-context"><span>{labels[example.variant ?? "reference"]}</span>{example.file && <EditorLink file={example.file} line={base} settings={settings} configure={() => { setExpanded(false); configure(); }} />}<button className="wk-wrap" aria-pressed={wrap} onClick={() => setWrap(value => !value)} title="Wrap long lines"><WrapText size={14} />Wrap</button></div>
    {example.caption && <p className="wk-code-caption">{example.caption}</p>}
    {!prepared.ready && <div className="wk-code-configure" role="status">Setup command unavailable. Reload the page or use the clone instructions in README.</div>}
    {annotations.length > 0 && <div className="wk-annotations" aria-label="Highlighted code changes">{annotations.map((item, index) => <button key={item.label} className={annotation === index ? "selected" : ""} onClick={() => showAnnotation(index)}><span>{index + 1}</span>{item.label}<small>L{base + item.line}</small></button>)}</div>}
    <Highlight theme={theme} code={prepared.value.trimEnd()} language={example.language}>
      {({ tokens, getLineProps, getTokenProps }) => <pre ref={codeRef} id="wk-active-code" role="tabpanel" className={`wk-code ${wrap ? "wrapped" : ""}`} tabIndex={0} aria-label={example.title}>
        <code>{tokens.map((line, index) => <div key={index} data-code-line={index} style={getLineProps({ line }).style} className={`wk-code-line ${focused.has(index) ? "focused" : ""} ${annotation !== null && annotations[annotation]?.line === index ? "called-out" : ""}`}>
          <span className="wk-line-number" aria-hidden="true">{base + index}</span>
          <span className="wk-line-code">{line.map((token, key) => { const props = getTokenProps({ token }); return <span key={key} className={props.className} style={props.style}>{token.content}</span>; })}</span>
        </div>)}</code>
      </pre>}
    </Highlight>
    <div className="wk-code-bottom"><span>{example.language} · {lines.length} lines</span><span role="status">{copyState === "failed" ? "Code selected. Press ⌘C or Ctrl+C." : copyState === "copied" ? "Copied without line numbers." : expanded ? "Esc to return to the task." : "Full context · Expand to present"}</span></div>
  </div>;
  return <>{!expanded && panel}<dialog ref={dialogRef} className="wk-code-dialog" aria-label="Expanded code example" onCancel={() => setExpanded(false)}>{expanded && panel}</dialog></>;
}
