import assert from "node:assert/strict";
import test from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { NextRequest } from "next/server";
import venues from "../lib/managed/fixtures/venues.json";
import { CITIES } from "../lib/types";
import type { City, OffsitePlan } from "../lib/types";
import { validateProposal } from "../lib/managed/validation";
import { getManagedConfig, ManagedError } from "../lib/managed/config";
import type { ManagedConfig } from "../lib/managed/config";
import { newSessionToken, openSession, sealSession } from "../lib/managed/session-token";
import { readConversation, sendManagedMessage, projectEvents, outputNames } from "../lib/managed/conversation";
import { createTransport, SESSION_BUDGET } from "../lib/managed/transport";
import type { ManagedEvent, ManagedTransport, OutputFile } from "../lib/managed/transport";
import { failureResponse, requireSameOrigin, requestBody } from "../lib/managed/http";

const secret = "private-test-secret-with-more-than-thirty-two-characters";
const token = newSessionToken("sesn_test", Date.now(), "Chicago");
const outputName = "proposal-11111111-1111-1111-1111-111111111111.json";
const now = new Date().toISOString();
const event = (value: Record<string, unknown>) => ({ processed_at: now, ...value }) as unknown as ManagedEvent;
const user = event({ id: "user1", type: "user.message", content: [{ type: "text", text: "Plan our offsite" }, { type: "text", text: `WORKSHOP_OUTPUT:${outputName}` }] });
const idle = event({ id: "idle", type: "session.status_idle", stop_reason: { type: "end_turn" } });
function validPlan(city: City = "Chicago"): OffsitePlan {
  const options = venues.cities[city];
  const room = options[0], meal = options[2], activity = options[4];
  const subtotal = room.costUsd * 2 + meal.costUsd * 24 + activity.costUsd * 12 + 240;
  return { title: `A fictional ${city} offsite`, city, attendees: 12, budget: 6000,
    days: [1, 2].map((day) => ({ day, title: "Collaborate", stops: [
      { id: `work-${day}`, time: "09:00", title: "Workshop", category: "Workshop", durationMinutes: 120, location: room.name, description: "Work together." },
      { id: `lunch-${day}`, time: "12:00", title: "Lunch", category: "Meal", durationMinutes: 60, location: meal.name, description: "Vegetarian choices." },
    ] })), budgetItems: [{ label: room.name, amount: room.costUsd * 2 }, { label: meal.name, amount: meal.costUsd * 24 },
      { label: activity.name, amount: activity.costUsd * 12 }, { label: "Local transport", amount: 240 }, { label: "Contingency", amount: Math.round(subtotal * 10) / 100 }],
    rainPlan: "Use the included workshop room for an indoor team exercise." };
}
function fake(events: ManagedEvent[], output: OutputFile | null = null) {
  const history = [...events];
  let sends = 0;
  const transport: ManagedTransport = {
    async create() { throw new Error("A follow-up must not create a new session"); },
    async session() { return { id: token.sessionId, status: "idle", metadata: { owner: token.owner, city: token.city } }; },
    async history() { return [...history]; },
    async output() { return output; },
    async send(id, entries) { assert.equal(id, token.sessionId); sends++; const saved = entries.map((entry, index) => event({ id: `sent-${sends}-${index}`, ...entry })); history.push(...saved); return saved; },
  };
  return { transport, history, sends: () => sends };
}

test("managed configuration requires dedicated offsite IDs; $2 means 200 integer cents", () => {
  assert.throws(() => getManagedConfig({}), /incomplete/);
  assert.throws(() => getManagedConfig({ ANTHROPIC_API_KEY: "test", MANAGED_AGENT_ID: "agent_old" }), /OFFSITE_AGENT_ID/);
  assert.deepEqual(SESSION_BUDGET, { type: "limit", max_list_cost: { amount: "200", currency: "USD" } });
});

test("authenticated session cookies hide capability and reject expiry, tampering, and another secret", () => {
  const encoded = sealSession(token, secret);
  assert.deepEqual(openSession(encoded, secret), token);
  assert.ok(!encoded.includes(token.sessionId));
  assert.equal(openSession(encoded, secret, token.expiresAt), null);
  assert.equal(openSession(encoded, "another-private-test-secret-at-least-32-long"), null);
  assert.equal(openSession(encoded.slice(0, -2) + "xx", secret), null);
});

test("fixture unit costs and group budgets are accepted for all cities", () => {
  for (const city of CITIES) assert.deepEqual(validateProposal(validPlan(city), city), { proposal: validPlan(city), errors: [] });
  const perPersonBug = validPlan();
  perPersonBug.budgetItems[1].amount /= perPersonBug.attendees;
  assert.match(validateProposal(perPersonBug, "Chicago").errors.join(" "), /per_person_per_day/);
  const tooSmall = validPlan(); tooSmall.budget = 100;
  assert.match(validateProposal(tooSmall, "Chicago").errors.join(" "), /exceeds/);
  assert.equal(validateProposal(validPlan("New York"), "Chicago").proposal, null);
});

test("strict output validation rejects malformed shape, overlapping agenda, invented venues, and oversized group", () => {
  for (const value of [null, [], {}, { ...validPlan(), extra: true }, { ...validPlan(), days: [null] }, { ...validPlan(), attendees: 25 }]) assert.equal(validateProposal(value, "Chicago").proposal, null);
  const overlap = validPlan(); overlap.days[0].stops[1].time = "09:30";
  assert.equal(validateProposal(overlap, "Chicago").proposal, null);
  const invented = validPlan(); invented.days[0].stops[0].location = "Unverified real hotel";
  assert.equal(validateProposal(invented, "Chicago").proposal, null);
});

test("hosted Python validator accepts the same fixture and catches the planted per-person budget error", () => {
  const dir = mkdtempSync(join(tmpdir(), "offsite-validator-test-"));
  try {
    const path = join(dir, "proposal.json");
    const plan = validPlan();
    writeFileSync(path, JSON.stringify(plan));
    const run = () => spawnSync("python3", ["lib/managed/fixtures/validate.py", path, "lib/managed/fixtures/venues.json"], { timeout: 5000, encoding: "utf8" });
    assert.equal(run().status, 0);
    plan.budgetItems[1].amount /= plan.attendees;
    writeFileSync(path, JSON.stringify(plan));
    const rejected = run();
    assert.equal(rejected.status, 1);
    assert.match(rejected.stdout, /per_person_per_day/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("event reconstruction deduplicates complete messages and hides the internal output marker", () => {
  const snapshot = projectEvents(token.sessionId, "Chicago", [user, user, idle]);
  assert.equal(snapshot.messages.length, 1);
  assert.equal(snapshot.messages[0].text, "Plan our offsite");
  assert.deepEqual(outputNames([user]), [outputName]);
});

test("reconnecting rebuilds the accepted proposal without any send or tool executor", async () => {
  const state = fake([user, event({ id: "tool", type: "agent.tool_use", name: "bash", input: { command: "cp /tmp/proposal.json /mnt/session/outputs/proposal.json" } }), idle], { filename: outputName, value: validPlan() });
  const first = await readConversation(token, state.transport);
  const second = await readConversation(token, state.transport);
  assert.deepEqual(first, second);
  assert.equal(first.status, "completed");
  assert.deepEqual(first.proposal, validPlan());
  assert.equal(state.sends(), 0);
});

test("a missing current output keeps polling briefly; an old proposal cannot mark a revision completed", async () => {
  const state = fake([user, event({ id: "tool", type: "agent.tool_use", name: "write", input: { file_path: "/mnt/session/outputs/proposal.json" } }), idle]);
  assert.equal((await readConversation(token, state.transport)).status, "running");
  const pending = await readConversation(token, state.transport, Date.now() + 90_000);
  assert.equal(pending.status, "error");
  assert.equal(pending.errorCode, "output_pending");
});

test("follow-ups reuse the owned session and uncertain sends are attempted exactly once", async () => {
  const state = fake([user, idle]);
  const accepted = await sendManagedMessage(token, "Make day 2 slower", state.transport);
  assert.equal(accepted.status, "running");
  assert.equal(accepted.messages.length, 2);
  assert.equal(state.sends(), 1);
  const lost = fake([idle]);
  const original = lost.transport.send;
  lost.transport.send = async (id, events) => { await original(id, events); throw new Error("lost acknowledgement"); };
  await assert.rejects(sendManagedMessage(token, "First turn", lost.transport), (error: unknown) => {
    assert.ok(error instanceof ManagedError);
    assert.match(error.message, /could not be confirmed/);
    assert.equal(error.code, "delivery_unknown");
    return true;
  });
  assert.equal(lost.sends(), 1);
});

test("owner mismatch and pending approval never masquerade as working hosted execution", async () => {
  const state = fake([]);
  await assert.rejects(readConversation({ ...token, owner: "someone-else" }, state.transport), /does not own/);
  const waiting = projectEvents(token.sessionId, token.city, [event({ id: "wait", type: "session.status_idle", stop_reason: { type: "requires_action", event_ids: ["tool"] } })]);
  assert.equal(waiting.status, "error");
  assert.equal(waiting.errorCode, "approval_required");
  assert.match(waiting.error!, /approval/);
});

test("failure responses distinguish explicit rejection from uncertain SDK and network delivery", async () => {
  const rejected = failureResponse(new ManagedError("Setup is incomplete", 503, "setup_required"));
  assert.equal(rejected.status, 503);
  assert.equal((await rejected.json()).messageDelivery, "not_sent");
  const uncertain = await failureResponse(new ManagedError("Delivery was not confirmed", 502, "delivery_unknown"), token, secret).json();
  assert.equal(uncertain.id, token.sessionId);
  assert.equal(uncertain.errorCode, "delivery_unknown");
  assert.equal(uncertain.messageDelivery, "unknown");
  for (const status of [401, 403, 429, 503]) {
    const body = await failureResponse(new Anthropic.APIError(status, { message: "private upstream detail" }, undefined, new Headers())).json();
    assert.equal(body.errorCode, status === 401 || status === 403 ? "setup_required" : "service_unavailable");
    assert.equal(body.messageDelivery, "unknown", "SDK status alone must never promise the original message was not sent");
    assert.doesNotMatch(body.error, /private upstream detail/);
  }
  const network = await failureResponse(new Error("socket closed")).json();
  assert.equal(network.errorCode, "connection_error");
  assert.equal(network.messageDelivery, "unknown");
});

test("malformed and oversized SDK output retain history and allow a manual same-session repair", async () => {
  const config: ManagedConfig = { apiKey: "offline-test", agentId: "agent_test", agentVersion: 1, environmentId: "env_test", secret,
    venuesFileId: "file_venues", validatorFileId: "file_validator" };
  for (const artifact of [{ raw: "{bad json", size: 9 }, { raw: "ignored", size: 64_001 }, { raw: "x".repeat(64_001), size: 1 }]) {
    const requests: string[] = [];
    const fetchMock: typeof fetch = async (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      requests.push(url.pathname);
      assert.equal(request.method, "GET", "Observing an artifact must not submit a turn");
      if (url.pathname === "/v1/files") return new Response(JSON.stringify({ data: [{ id: "file_output", filename: outputName, size_bytes: artifact.size, scope: { id: token.sessionId } }], has_more: false }), { headers: { "content-type": "application/json" } });
      assert.equal(url.pathname, "/v1/files/file_output/content");
      return new Response(artifact.raw);
    };
    const state = fake([user, idle]);
    state.transport.output = createTransport(config, { fetch: fetchMock }).output;
    const rejected = await readConversation(token, state.transport);
    assert.equal(rejected.errorCode, "proposal_invalid");
    assert.equal(rejected.status, "error");
    assert.equal(rejected.proposal, null);
    assert.equal(rejected.messages[0].text, "Plan our offsite");
    assert.equal(rejected.id, token.sessionId);
    assert.match(rejected.error!, /same session/);
    assert.equal(state.sends(), 0);
    assert.equal(requests.length, artifact.size > 64_000 ? 1 : 2);
    const repair = await sendManagedMessage(token, "Repair the proposal and preserve our requirements", state.transport);
    assert.equal(repair.id, token.sessionId);
    assert.equal(repair.status, "running");
    assert.equal(repair.errorCode, undefined);
    assert.equal(repair.messages.length, 2);
    assert.equal(state.sends(), 1);
  }
});

test("base proposal rejection is actionable, but unavailable output remains a transport failure", async () => {
  const state = fake([user, idle], { filename: outputName, value: { invalid: true } });
  const rejected = await readConversation(token, state.transport);
  assert.equal(rejected.errorCode, "proposal_invalid");
  assert.equal(rejected.messages.length, 1);
  assert.match(rejected.error!, /same session/);
  const unavailable = new Error("download disconnected");
  state.transport.output = async () => { throw unavailable; };
  await assert.rejects(readConversation(token, state.transport), (error: unknown) => error === unavailable);
  state.transport.output = async () => { throw new ManagedError("Service unavailable", 502, "service_unavailable"); };
  await assert.rejects(readConversation(token, state.transport), (error: unknown) => error instanceof ManagedError && error.code === "service_unavailable");
});

test("a repair turn keeps polling its new artifact instead of reusing the previous malformed output", async () => {
  const state = fake([user, idle]);
  let repaired: OutputFile | null = null;
  state.transport.output = async (_id, filenames) => {
    if (filenames.includes(outputName)) throw new ManagedError("Invalid JSON; ask for repair in this same session.", 422, "proposal_invalid");
    return repaired;
  };
  assert.equal((await readConversation(token, state.transport)).errorCode, "proposal_invalid");
  await sendManagedMessage(token, "Repair the JSON and preserve the original requirements", state.transport);
  const running = await readConversation(token, state.transport);
  assert.equal(running.status, "running");
  assert.equal(running.errorCode, undefined);
  assert.equal(running.messages.length, 2);
  state.history.push(event({ id: "repair-write", type: "agent.tool_use", name: "write", input: { file_path: "/mnt/session/outputs/current.json" } }), { ...idle, id: "repair-idle" });
  assert.equal((await readConversation(token, state.transport)).status, "running", "Wait for the current artifact after hosted work becomes idle");
  repaired = { filename: outputNames(state.history)[0], value: validPlan() };
  const complete = await readConversation(token, state.transport);
  assert.equal(complete.status, "completed");
  assert.equal(complete.errorCode, undefined);
  assert.deepEqual(complete.proposal, validPlan());
  assert.equal(state.sends(), 1, "Only the explicit user repair was sent");
});

test("event errors carry recovery codes, survive output rejection, and clear after a new successful turn", async () => {
  for (const [reason, code] of [["budget_reached", "execution_budget"], ["requires_action", "approval_required"], ["retries_exhausted", "session_stopped"], ["refusal", "request_refused"]]) {
    const stopped = event({ id: `stop-${reason}`, type: "session.status_idle", stop_reason: { type: reason } });
    const state = fake([user, stopped]);
    assert.equal(projectEvents(token.sessionId, token.city, [user, stopped]).errorCode, code);
    state.transport.output = async () => { throw new ManagedError("Bad JSON", 422, "proposal_invalid"); };
    assert.equal((await readConversation(token, state.transport)).errorCode, code, "An artifact error must not reopen a stopped session");
    await assert.rejects(sendManagedMessage(token, "Follow-up", state.transport), (error: unknown) => error instanceof ManagedError && error.code === code);
    assert.equal(state.sends(), 0);
    const renewed = fake([user, stopped, { ...user, id: "user2" }, { ...idle, id: "idle2" }], { filename: outputName, value: validPlan() });
    const complete = await readConversation(token, renewed.transport);
    assert.equal(complete.status, "completed");
    assert.equal(complete.errorCode, undefined);
    assert.equal(complete.error, undefined);
  }
  const terminated = event({ id: "terminated", type: "session.status_terminated" });
  assert.equal(projectEvents(token.sessionId, token.city, [terminated]).errorCode, "session_stopped");
  const busy = fake([user]);
  await assert.rejects(sendManagedMessage(token, "Wait", busy.transport), (error: unknown) => error instanceof ManagedError && error.code === "session_busy");
});

test("managed mutations enforce exact browser origin and bounded JSON payloads", async () => {
  const request = (origin: string, body: unknown) => new NextRequest("http://localhost:3000/api/managed/message", { method: "POST", headers: { host: "127.0.0.1:3000", origin, "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.doesNotThrow(() => requireSameOrigin(request("http://127.0.0.1:3000", {})));
  assert.throws(() => requireSameOrigin(request("https://hostile.test", {})), /own origin/);
  await assert.rejects(requestBody(request("http://127.0.0.1:3000", { city: "Paris" })), /Choose/);
  await assert.rejects(requestBody(request("http://127.0.0.1:3000", { city: "Chicago", message: "x".repeat(4001) })), /4,000/);
});
