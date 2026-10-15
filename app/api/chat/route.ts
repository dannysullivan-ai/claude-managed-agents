import { NextRequest, NextResponse } from "next/server";
import { createDemoReply } from "@/lib/demo";
import { CITIES } from "@/lib/types";
import type { City } from "@/lib/types";

export const runtime = "nodejs";

function failure(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function isSameOrigin(request: NextRequest): boolean {
  const requestUrl = new URL(request.url);
  // Host retains the browser-facing authority when Next normalizes a local URL.
  const host = request.headers.get("host") ?? requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || forwardedProtocol === "https"
    ? `${forwardedProtocol}:` : requestUrl.protocol;
  try {
    const externalUrl = new URL(`${protocol}//${host}`);
    const site = request.headers.get("sec-fetch-site");
    return !externalUrl.username && !externalUrl.password && externalUrl.pathname === "/"
      && !externalUrl.search && !externalUrl.hash && request.headers.get("origin") === externalUrl.origin
      && (!site || site === "same-origin" || site === "none");
  } catch { return false; }
}

/** Fixed sample response for the workshop starter. No model, tools, or paid API calls. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return failure("This action must come from the app's own origin.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return failure("Send a JSON request.", 415);
  const raw = await request.text();
  if (raw.length > 16_000) return failure("The request is too large.", 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return failure("The request must be valid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return failure("Send a message and a supported city.", 400);
  const input = body as Record<string, unknown>;
  if (typeof input.message !== "string" || !input.message.trim() || input.message.length > 4000) {
    return failure("Use a message between 1 and 4,000 characters.", 400);
  }
  if (!(CITIES as readonly unknown[]).includes(input.city)) return failure("Choose Chicago, New York, or San Francisco.", 400);
  if (input.isFollowUp !== undefined && typeof input.isFollowUp !== "boolean") return failure("isFollowUp must be true or false.", 400);
  // The prompt is intentionally not interpreted yet: the lab replaces this seam.
  const reply = createDemoReply(input.city as City, input.isFollowUp === true);
  return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
}
