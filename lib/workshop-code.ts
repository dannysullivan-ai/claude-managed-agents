// Server-side only: this module reads an explicit set of public teaching sources.
// Import it from the workshop Server Component, never from a Client Component.
import { lstat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { slides } from "./workshop-content";
import type { WorkshopCode, WorkshopSlide } from "./workshop-types";

// Literal paths make the runtime boundary explicit. The checked dynamic read
// below opts out of automatic tracing; next.config.ts includes these exact
// public files so the build cannot widen this access to the whole project.
const sourcePaths = {
  "lib/demo.ts": join(process.cwd(), "lib/demo.ts"),
  "lib/types.ts": join(process.cwd(), "lib/types.ts"),
  "lib/managed/agent.ts": join(process.cwd(), "lib/managed/agent.ts"),
  "lib/managed/config.ts": join(process.cwd(), "lib/managed/config.ts"),
  "lib/managed/transport.ts": join(process.cwd(), "lib/managed/transport.ts"),
  "lib/managed/conversation.ts": join(process.cwd(), "lib/managed/conversation.ts"),
  "lib/managed/validation.ts": join(process.cwd(), "lib/managed/validation.ts"),
  "lib/managed/session-token.ts": join(process.cwd(), "lib/managed/session-token.ts"),
  "lib/managed/http.ts": join(process.cwd(), "lib/managed/http.ts"),
  "lib/managed/routes.ts": join(process.cwd(), "lib/managed/routes.ts"),
  "lib/managed/workshop.ts": join(process.cwd(), "lib/managed/workshop.ts"),
  "lib/managed/fixtures/validate.py": join(process.cwd(), "lib/managed/fixtures/validate.py"),
  "lib/managed/fixtures/venues.json": join(process.cwd(), "lib/managed/fixtures/venues.json"),
  "lib/workshop-exercises.ts": join(process.cwd(), "lib/workshop-exercises.ts"),
  "lib/workshop-solutions.ts": join(process.cwd(), "lib/workshop-solutions.ts"),
  "scripts/setup-agent.ts": join(process.cwd(), "scripts/setup-agent.ts"),
  "scripts/smoke-managed.ts": join(process.cwd(), "scripts/smoke-managed.ts"),
  "scripts/lab-check.ts": join(process.cwd(), "scripts/lab-check.ts"),
  "app/api/chat/route.ts": join(process.cwd(), "app/api/chat/route.ts"),
  "app/api/managed/message/route.ts": join(process.cwd(), "app/api/managed/message/route.ts"),
  "app/api/managed/session/route.ts": join(process.cwd(), "app/api/managed/session/route.ts"),
  "app/api/lab/message/route.ts": join(process.cwd(), "app/api/lab/message/route.ts"),
  "app/api/lab/session/route.ts": join(process.cwd(), "app/api/lab/session/route.ts"),
} as const;

export const WORKSHOP_SOURCE_FILES = Object.keys(sourcePaths) as (keyof typeof sourcePaths)[];

const allowedSources = new Set<string>(WORKSHOP_SOURCE_FILES);
const MAX_SOURCE_BYTES = 60_000;
type SourceCache = Map<string, Promise<string>>;

async function readSource(path: string): Promise<string> {
  // Check the exact relative path before touching the filesystem. No env files,
  // absolute paths, traversal, or arbitrary request-supplied paths are accepted.
  if (!allowedSources.has(path)) throw new Error(`Workshop source is not allowlisted: ${path}`);
  const absolute = sourcePaths[path as keyof typeof sourcePaths];
  const info = await lstat(/* turbopackIgnore: true */ absolute);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Workshop source must be a regular file: ${path}`);
  if (info.size > MAX_SOURCE_BYTES) throw new Error(`Workshop source exceeds 60 KB: ${path}`);
  const value = await readFile(/* turbopackIgnore: true */ absolute, "utf8");
  if (Buffer.byteLength(value, "utf8") > MAX_SOURCE_BYTES) throw new Error(`Workshop source exceeds 60 KB: ${path}`);
  return value;
}

function anchorLineOffset(value: string, anchor: string, path: string, kind: "start" | "end"): number {
  if (!anchor) throw new Error(`Workshop ${kind} anchor is empty: ${path}`);
  const position = value.indexOf(anchor);
  if (position < 0) throw new Error(`Workshop ${kind} anchor was not found in ${path}: ${anchor}`);
  if (value.indexOf(anchor, position + 1) !== -1) throw new Error(`Workshop ${kind} anchor is ambiguous in ${path}: ${anchor}`);
  return value.lastIndexOf("\n", position - 1) + 1;
}

/**
 * Anchors are globally unique substrings in the source file. The start includes
 * its entire line; the end excludes its entire line. Omit anchors for a full file.
 * File paths and line numbers are relative/public; the server cwd is never sent.
 */
export async function resolveWorkshopCode(code: WorkshopCode, cache: SourceCache = new Map()): Promise<WorkshopCode> {
  let resolved = { ...code };
  if (code.source) {
    const { path, start, end } = code.source;
    if (!allowedSources.has(path)) throw new Error(`Workshop source is not allowlisted: ${path}`);
    if (!cache.has(path)) cache.set(path, readSource(path));
    const source = await cache.get(path)!;
    const first = start === undefined ? 0 : anchorLineOffset(source, start, path, "start");
    const last = end === undefined ? source.length : anchorLineOffset(source, end, path, "end");
    if (last <= first) throw new Error(`Workshop source range is empty or reversed: ${path}`);
    resolved = { ...code, value: source.slice(first, last), file: path, startLine: source.slice(0, first).split("\n").length };
  }
  for (const annotation of resolved.annotations ?? []) {
    if (!annotation.find || !resolved.value.includes(annotation.find)) {
      throw new Error(`Workshop annotation was not found in ${resolved.file ?? resolved.title}: ${annotation.find}`);
    }
  }
  return resolved;
}

/** A build-time snapshot in production; a fresh source read on dev page render. */
export async function getWorkshopSlides(): Promise<WorkshopSlide[]> {
  const cache: SourceCache = new Map();
  return Promise.all(slides.map(async slide => ({
    ...slide,
    ...(slide.code ? { code: await Promise.all(slide.code.map(code => resolveWorkshopCode(code, cache))) } : {}),
  })));
}
