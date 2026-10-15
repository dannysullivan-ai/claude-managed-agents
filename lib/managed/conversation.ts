import { randomUUID } from "node:crypto";
import type { City, ChatMessage, OffsitePlan } from "../types";
import { ManagedError } from "./config";
import type { ManagedEvent, ManagedTransport, OutputFile } from "./transport";
import type { FeedbackCode } from "./feedback";
import { newSessionToken } from "./session-token";
import type { SessionToken } from "./session-token";
import { cateringErrors, workshopRuntime } from "./workshop";
import type { WorkshopRuntime } from "./workshop";
import { validateProposal } from "./validation";

export type ManagedConversation = {
  mode: "managed"; id?: string; city?: City; messages: ChatMessage[]; proposal: OffsitePlan | null;
  status: "idle" | "running" | "completed" | "error";
  activity: { id: string; label: string; state: "running" | "complete" }[]; error?: string;
  errorCode?: FeedbackCode; messageDelivery?: "not_sent" | "unknown";
};
export const emptyConversation = (): ManagedConversation => ({ mode: "managed", messages: [], proposal: null, status: "idle", activity: [] });
const MARKER = /^WORKSHOP_OUTPUT:(proposal-[a-f0-9-]{36}\.json)$/;
const blocks = (event: ManagedEvent) => "content" in event && Array.isArray(event.content) ? event.content.filter((block) => block.type === "text").map((block) => block.text) : [];
export function outputNames(events: ManagedEvent[]): string[] {
  return events.filter((event) => event.type === "user.message").flatMap((event) => blocks(event).slice(1).flatMap((text) => text.match(MARKER)?.[1] ?? [])).reverse();
}

/** Persisted complete events are authoritative; deltas are never saved as messages. */
export function projectEvents(id: string, city: City, events: ManagedEvent[]): ManagedConversation {
  const conversation = { ...emptyConversation(), id, city };
  const unique = [...new Map(events.map((event) => [event.id, event])).values()];
  const results = new Set(unique.filter((event) => event.type === "agent.tool_result").map((event) => event.tool_use_id));
  for (const event of unique) {
    if (event.type === "user.message" || event.type === "agent.message") {
      const content = blocks(event);
      const text = (event.type === "user.message" ? content.slice(0, 1) : content).join("\n");
      if (text) conversation.messages.push({ id: event.id, role: event.type === "user.message" ? "user" : "assistant", text });
      if (event.type === "user.message") {
        conversation.status = "running";
        delete conversation.error; delete conversation.errorCode;
      }
    } else if (event.type === "session.status_running" || event.type === "session.status_rescheduled") {
      conversation.status = "running";
      delete conversation.error; delete conversation.errorCode;
    } else if (event.type === "session.status_idle") {
      const reason = event.stop_reason?.type;
      conversation.status = "idle";
      delete conversation.error; delete conversation.errorCode;
      if (reason === "budget_reached" || reason === "requires_action" || reason === "retries_exhausted" || reason === "refusal") {
        conversation.status = "error";
        conversation.errorCode = reason === "budget_reached" ? "execution_budget" : reason === "requires_action" ? "approval_required"
          : reason === "refusal" ? "request_refused" : "session_stopped";
        conversation.error = reason === "budget_reached" ? "The session reached its $2 execution budget. Its history is saved. Choose New offsite and submit a new brief to start a new session."
          : reason === "requires_action" ? "The session is awaiting a tool approval. Approvals are not supported in this lab. Check that read, write and bash use always_allow, then choose New offsite and submit a new brief."
          : reason === "refusal" ? "The agent declined this request. Review the brief, then choose New offsite to submit a revised brief in a new session."
          : "The managed service exhausted its retries for this turn. Reconnect to inspect its saved history; if it remains stopped, choose New offsite and submit a new brief.";
      }
    } else if (event.type === "session.status_terminated") {
      conversation.status = "error"; conversation.errorCode = "session_stopped";
      conversation.error = "This managed session has terminated. Its history is saved. Choose New offsite and submit a new brief to start a new session.";
    } else if (event.type === "agent.tool_use") {
      const command = JSON.stringify(event.input);
      const label = command.includes("validate.py") ? "Checking budget and schedule" : command.includes("outputs/") ? "Saving the proposal" : event.name === "read" ? "Reading the fictional planning fixtures" : "Building the offsite proposal";
      conversation.activity.push({ id: event.id, label, state: results.has(event.id) ? "complete" : "running" });
    }
  }
  conversation.activity = conversation.activity.slice(-8);
  return conversation;
}

export async function startSession(city: City, transport: ManagedTransport): Promise<SessionToken> {
  const owner = randomUUID();
  const id = await transport.create(city, owner);
  return { ...newSessionToken(id, Date.now(), city), owner };
}

async function ownedHistory(token: SessionToken, transport: ManagedTransport) {
  const session = await transport.session(token.sessionId);
  if (session.metadata?.owner !== token.owner || session.metadata?.city !== token.city) throw new ManagedError("This browser does not own that managed session. Choose New offsite and submit a new brief.", 403, "session_access");
  const events = await transport.history(token.sessionId);
  return { session, events };
}

/** Read only. No custom tool execution and no model-advancing event is sent here. */
export async function readConversation(token: SessionToken, transport: ManagedTransport, now = Date.now(), runtime: WorkshopRuntime = workshopRuntime()): Promise<ManagedConversation> {
  const { session, events } = await ownedHistory(token, transport);
  const conversation = projectEvents(token.sessionId, token.city, events);
  if (conversation.status !== "error" && session.status === "running") conversation.status = "running";
  const filenames = outputNames(events);
  const lastUser = events.findLastIndex((event) => event.type === "user.message");
  const currentTurn = events.slice(lastUser + 1);
  const wroteOutput = currentTurn.some((event) => event.type === "agent.tool_use" && JSON.stringify(event.input).includes("/mnt/session/outputs/"));
  // A new revision must not inherit a malformed artifact from the previous turn.
  const candidates = conversation.status === "running" || wroteOutput ? filenames.slice(0, 1) : filenames;
  let output: OutputFile | null;
  try { output = await transport.output(token.sessionId, candidates); }
  catch (error) {
    if (!(error instanceof ManagedError) || error.code !== "proposal_invalid") throw error;
    if (!conversation.errorCode) {
      conversation.status = "error";
      conversation.errorCode = "proposal_invalid";
      conversation.error = error.message;
    }
    return conversation;
  }
  if (output) {
    const checked = validateProposal(output.value, token.city);
    if (checked.proposal) conversation.proposal = checked.proposal;
    else if (!conversation.errorCode) {
      conversation.status = "error"; conversation.errorCode = "proposal_invalid";
      conversation.error = `The proposal failed application checks: ${checked.errors.slice(0, 3).join(" ")} Ask the agent to repair the proposal in this same session, preserving your requirements.`;
    }
  }
  if (conversation.status === "idle" && conversation.messages.length) {
    if (wroteOutput && output?.filename !== filenames[0]) {
      const idle = currentTurn.findLast((event) => event.type === "session.status_idle");
      if (idle && now - Date.parse(idle.processed_at) < 60_000) {
        conversation.status = "running";
        conversation.activity.push({ id: "retrieving-output", label: "Retrieving the saved proposal", state: "running" });
      } else {
        conversation.status = "error"; conversation.errorCode = "output_pending";
        conversation.error = "The completed turn's output is not available yet. Reconnect to check again; the session is saved. Do not resend the brief while checking.";
      }
    } else conversation.status = output?.filename === filenames[0] ? "completed" : "idle";
  }
  if (conversation.proposal) {
    const errors = cateringErrors(conversation.proposal, runtime);
    if (errors.length) {
      conversation.proposal = null;
      // This is an application rejection, not a stopped/failed hosted session.
      // Keep the underlying idle session available for an explicit revision.
      if (conversation.status === "completed") conversation.status = "idle";
      if (!conversation.errorCode) {
        conversation.error = `Catering policy rejected this proposal: ${errors.join(" ")} Ask the agent to revise the meal option in this same session.`;
        conversation.errorCode = "catering_policy";
      }
    }
  }
  return conversation;
}

export async function sendManagedMessage(token: SessionToken, message: string, transport: ManagedTransport): Promise<ManagedConversation> {
  if (!message.trim() || message.length > 4000) throw new ManagedError("Use a message between 1 and 4,000 characters.", 400);
  const { session, events } = await ownedHistory(token, transport);
  const current = projectEvents(token.sessionId, token.city, events);
  if (session.status === "running" || current.status === "running") throw new ManagedError("The agent is still working. Reconnect and wait before sending another message.", 409, "session_busy");
  if (current.status === "error") throw new ManagedError(current.error ?? "The session cannot accept another turn.", 409, current.errorCode ?? "session_stopped");
  let confirmed: ManagedEvent[];
  try {
    confirmed = await transport.send(token.sessionId, [{ type: "user.message", content: [
      { type: "text", text: message.trim() },
      { type: "text", text: `WORKSHOP_OUTPUT:proposal-${randomUUID()}.json` },
    ] }]);
  } catch { throw new ManagedError("Message delivery could not be confirmed. Reconnect to inspect the saved history before sending again.", 502, "delivery_unknown"); }
  return { ...projectEvents(token.sessionId, token.city, [...events, ...confirmed]), status: "running" };
}
