import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ExternalLink } from "lucide-react";
import "./instructor.css";

export const metadata: Metadata = { title: "Instructor guide — Claude Managed Agents" };

export default async function InstructorPage() {
  // Fixed public document, rendered at build time from the repository's handoff.
  const guide = await readFile(join(process.cwd(), "docs/INSTRUCTOR.md"), "utf8");
  return <div className="instructor-page">
    <header className="instructor-header">
      <a href="/workshop"><ArrowLeft size={16} />Back to slides</a>
      <a href="https://github.com/dannysullivan-ai/claude-managed-agents/blob/main/docs/INSTRUCTOR.md" target="_blank" rel="noreferrer">View source<ExternalLink size={14} /></a>
    </header>
    <main className="instructor-content">
      <div className="instructor-kicker">Claude Managed Agents · Teaching resources</div>
      <ReactMarkdown components={{ a: ({ href, children }) => <a href={href === "WORKSHOP.md" ? "https://github.com/dannysullivan-ai/claude-managed-agents/blob/main/docs/WORKSHOP.md" : href}>{children}</a> }}>{guide}</ReactMarkdown>
    </main>
  </div>;
}
