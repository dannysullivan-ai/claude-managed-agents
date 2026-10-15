"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FolderOpen, X } from "lucide-react";
import { editorUrl, normalizeFolder, type WorkshopSettings } from "@/lib/workshop-links";

export function EditorLink({ file, line, settings, configure, children }: { file: string; line?: number; settings: WorkshopSettings; configure: () => void; children?: React.ReactNode }) {
  const parsed = file.match(/^(.*?):(\d+)$/);
  const path = parsed?.[1] ?? file;
  const url = editorUrl(settings.folder, path, line ?? Number(parsed?.[2] ?? 1));
  const label = children ?? <><code>{file}</code><ExternalLink size={12} /></>;
  return url
    ? <a className="wk-editor-link" href={url} title={`Open ${file} in VS Code`}>{label}</a>
    : <button className="wk-editor-link" onClick={configure} title="Set your local folder to open this file in VS Code">{label}</button>;
}

export function WorkshopSetup({ open, settings, close, save }: { open: boolean; settings: WorkshopSettings; close: () => void; save: (settings: WorkshopSettings) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [folder, setFolder] = useState(settings.folder);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) { setFolder(settings.folder); setError(""); ref.current?.showModal(); }
    else ref.current?.close();
  }, [open, settings]);
  return <dialog className="wk-setup" ref={ref} onCancel={close} aria-labelledby="wk-setup-heading">
    <div className="wk-setup-heading"><div><FolderOpen size={23} /><h2 id="wk-setup-heading">Open files in VS Code</h2></div><button onClick={close} aria-label="Close editor link settings"><X size={20} /></button></div>
    <p>Optional: connect slide links to your local checkout. This setting stays in your browser.</p>
    <form onSubmit={event => {
      event.preventDefault();
      if (folder.trim() && !normalizeFolder(folder)) return setError("Enter an absolute folder path, such as /Users/you/projects/offsite or C:\\projects\\offsite. Use pwd in your terminal to find it.");
      save({...settings, folder:normalizeFolder(folder) ?? ""}); close();
    }}>
      <label htmlFor="wk-folder">Your local project folder</label>
      <input id="wk-folder" placeholder="/Users/you/projects/claude-managed-agents" value={folder} onChange={event => setFolder(event.target.value)} autoComplete="off" />
      <small>After cloning, run <code>pwd</code> in the project folder and paste the absolute path. File links then open VS Code at the right line. VS Code must be installed; your browser may ask to open it.</small>
      {error && <p className="wk-setup-error" role="alert">{error}</p>}
      <button className="wk-primary" type="submit">Save settings</button>
    </form>
    <a href="https://code.visualstudio.com/docs/configure/command-line#_opening-vs-code-with-urls" target="_blank" rel="noreferrer">How VS Code file links work<ExternalLink size={12} /></a>
  </dialog>;
}
