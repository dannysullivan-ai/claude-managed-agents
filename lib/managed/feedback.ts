/** Shared error categories keep recovery actions independent of message wording. */
export const FEEDBACK_CODES = [
  "tools_incomplete", "budget_invalid", "setup_required", "session_expired", "session_access",
  "request_invalid", "session_busy", "city_locked", "execution_budget", "approval_required",
  "session_stopped", "request_refused", "service_unavailable", "proposal_invalid", "catering_policy",
  "output_pending", "delivery_unknown", "connection_error", "draft_restored",
] as const;

export type FeedbackCode = typeof FEEDBACK_CODES[number];
export type ManagedFeedback = { code: FeedbackCode; message: string };

export function isFeedbackCode(value: unknown): value is FeedbackCode {
  return typeof value === "string" && (FEEDBACK_CODES as readonly string[]).includes(value);
}

export function responseFeedback(body: unknown, fallback: string, code: FeedbackCode = "connection_error"): ManagedFeedback {
  const value = body && typeof body === "object" ? body as Record<string, unknown> : {};
  return { code: isFeedbackCode(value.errorCode) ? value.errorCode : code,
    message: typeof value.error === "string" && value.error ? value.error : fallback };
}

/** A server-confirmed rejection is different from a lost acknowledgement. */
export function messageWasNotSent(body: unknown): boolean {
  return Boolean(body && typeof body === "object" && "messageDelivery" in body && body.messageDelivery === "not_sent");
}

export const isSetupFeedback = (code?: FeedbackCode) => code === "tools_incomplete" || code === "budget_invalid" || code === "setup_required";
export const needsNewSession = (code?: FeedbackCode) => ["session_expired", "session_access", "execution_budget", "approval_required", "session_stopped", "request_refused"].includes(code ?? "");
