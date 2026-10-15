import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { CITIES } from "../types";
import type { City } from "../types";
import { ManagedError } from "./config";
import type { ManagedConfig } from "./config";
import { emptyConversation } from "./conversation";
import type { ManagedConversation } from "./conversation";
import { openSession, sealSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./session-token";
import type { SessionToken } from "./session-token";
import type { FeedbackCode } from "./feedback";

export function requireSameOrigin(request: NextRequest): void {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto");
  let expected: string | undefined;
  try {
    const external = new URL(`${proto === "http" || proto === "https" ? `${proto}:` : url.protocol}//${host}`);
    if (!external.username && !external.password && external.pathname === "/" && !external.search && !external.hash) expected = external.origin;
  } catch { /* Fail closed. */ }
  const site = request.headers.get("sec-fetch-site");
  if (!expected || request.headers.get("origin") !== expected || (site && site !== "same-origin" && site !== "none")) throw new ManagedError("This action must come from the app's own origin.", 403);
}

export async function requestBody(request: NextRequest): Promise<{ city: City; message?: string }> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ManagedError("Send a JSON request.", 415);
  const raw = await request.text();
  if (raw.length > 16_000) throw new ManagedError("The request is too large.", 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new ManagedError("The request must be valid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body) || !("city" in body) || !(CITIES as readonly unknown[]).includes(body.city)) throw new ManagedError("Choose Chicago, New York, or San Francisco.", 400);
  if ("message" in body && (typeof body.message !== "string" || !body.message.trim() || body.message.length > 4000)) throw new ManagedError("Use a message between 1 and 4,000 characters.", 400);
  return body as { city: City; message?: string };
}

export function requestSession(request: NextRequest, config: ManagedConfig, cookieName = SESSION_COOKIE): SessionToken | null {
  const cookie = request.cookies.get(cookieName)?.value;
  if (!cookie) return null;
  const token = openSession(cookie, config.secret);
  if (!token) throw new ManagedError("This session cookie expired or is invalid. Choose New offsite and submit a new brief; this browser can no longer reconnect to the previous session.", 401, "session_expired");
  return token;
}
export function conversationResponse(conversation: ManagedConversation, options: { status?: number; token?: SessionToken; secret?: string; clear?: boolean; cookieName?: string } = {}) {
  const response = NextResponse.json(conversation, { status: options.status ?? 200, headers: { "Cache-Control": "no-store" } });
  const cookieName = options.cookieName ?? SESSION_COOKIE;
  if (options.token && options.secret) response.cookies.set(cookieName, sealSession(options.token, options.secret), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS,
  });
  if (options.clear) response.cookies.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
export function failureResponse(error: unknown, token?: SessionToken, secret?: string, cookieName = SESSION_COOKIE) {
  const accessFailure = error instanceof Anthropic.APIError && (error.status === 401 || error.status === 403);
  const errorCode: FeedbackCode = error instanceof ManagedError ? error.code : accessFailure ? "setup_required"
    : error instanceof Anthropic.APIError ? "service_unavailable" : "connection_error";
  const message = error instanceof ManagedError ? error.message : accessFailure
    ? "Claude could not authorize this request. Check the server API key and Managed Agents access, then reconnect to inspect saved history before sending again."
    : error instanceof Anthropic.APIError
      ? `Claude returned HTTP ${error.status ?? "error"}. Reconnect to inspect saved history before sending again; the service could not complete this request.`
      : "The managed connection could not complete. Reconnect to inspect saved history before sending again.";
  // Only our explicit preflight failures establish that a message was not sent.
  // An SDK error (including 401/403) does not establish delivery across the whole request.
  const messageDelivery = error instanceof ManagedError && error.code !== "delivery_unknown" ? "not_sent" : "unknown";
  return conversationResponse({ ...emptyConversation(), ...(token ? { id: token.sessionId, city: token.city } : {}), status: "error", error: message, errorCode, messageDelivery },
    { status: error instanceof ManagedError ? error.status : 502, token, secret, cookieName });
}
