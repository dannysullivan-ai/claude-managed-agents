import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import * as answers from "../lib/workshop-solutions";
import { labProposal } from "../scripts/lab-fixtures";
import { createTransport, SESSION_BUDGET } from "../lib/managed/transport";
import type { ManagedEvent, ManagedTransport } from "../lib/managed/transport";
import type { ManagedConfig } from "../lib/managed/config";
import { getManagedConfig, ManagedError } from "../lib/managed/config";
import { readConversation, sendManagedMessage } from "../lib/managed/conversation";
import { newSessionToken } from "../lib/managed/session-token";
import { learnerSessionOverrides, sessionForMessage, workshopRuntime } from "../lib/managed/workshop";
import type { ExerciseImplementation } from "../lib/managed/workshop";
import { validateProposal } from "../lib/managed/validation";
import { CITIES } from "../lib/types";
import type { City } from "../lib/types";
import { createManagedRoutes, IMPLEMENTATION_COOKIES } from "../lib/managed/routes";
import type { WorkshopRuntime } from "../lib/managed/workshop";
import { outputNames } from "../lib/managed/conversation";

const solved: ExerciseImplementation = {
  tools: answers.learnerTools, budget: answers.learnerBudget,
  catering: answers.learnerCateringPolicy, sessionForTurn: answers.learnerSessionForTurn,
};
const learner = (overrides: Partial<ExerciseImplementation> = {}) => workshopRuntime(
  { WORKSHOP_IMPLEMENTATION: "learner", WORKSHOP_FAULT: "continuity" }, { ...solved, ...overrides },
);
const config: ManagedConfig = {
  apiKey: "offline-test-key", agentId: "agent_test", agentVersion: 1, environmentId: "env_test",
  secret: "offline-test-secret-with-at-least-32-characters", venuesFileId: "file_venues", validatorFileId: "file_validator",
};

test("actual SDK session payload uses learner overrides; reference keeps its configured tools", async () => {
  const bodies: Record<string, unknown>[] = [];
  const fetchMock: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    assert.equal(request.method, "POST");
    assert.equal(new URL(request.url).pathname, "/v1/sessions");
    bodies.push(JSON.parse(await request.text()));
    return new Response(JSON.stringify({ id: "sesn_offline" }), { status: 200, headers: { "content-type": "application/json" } });
  };
  await createTransport(config, { workshop: learner(), fetch: fetchMock }).create("Chicago", "owner");
  assert.deepEqual((bodies[0].agent as { tools: unknown }).tools, answers.learnerTools());
  assert.doesNotMatch((bodies[0].agent as { system: string }).system, /Application catering policy:/, "The learner's policy must remain its independent exercise");
  assert.deepEqual(bodies[0].budget, answers.learnerBudget());
  assert.equal((bodies[0].metadata as { workshop: string }).workshop, "learner");

  await createTransport(config, { workshop: workshopRuntime({}), fetch: fetchMock }).create("Chicago", "owner");
  assert.equal("tools" in (bodies[1].agent as object), false);
  assert.deepEqual(bodies[1].budget, SESSION_BUDGET);
  assert.equal((bodies[1].metadata as { workshop: string }).workshop, "reference");
});

test("unfinished tools or dollar-formatted execution budget fail before any network request", () => {
  let requests = 0;
  const fetchMock: typeof fetch = async () => { requests++; throw new Error("Network must not run"); };
  assert.throws(() => createTransport(config, { fetch: fetchMock, workshop: learner({ tools: () => [] }) }), (error: unknown) => {
    assert.ok(error instanceof ManagedError);
    assert.equal(error.code, "tools_incomplete");
    assert.match(error.message, /Learner tools.*No model call/);
    return true;
  });
  for (const amount of ["2.00", "2", "20000"]) {
    assert.throws(() => createTransport(config, { fetch: fetchMock, workshop: learner({ budget: () => ({ type: "limit", max_list_cost: { amount, currency: "USD" } }) }) }), (error: unknown) => {
      assert.ok(error instanceof ManagedError);
      assert.equal(error.code, "budget_invalid");
      assert.match(error.message, /integer-cent string 200/);
      return true;
    });
  }
  assert.equal(requests, 0);
  assert.throws(() => workshopRuntime({ WORKSHOP_IMPLEMENTATION: "typo" }), /reference, learner or solution/);
  assert.throws(() => workshopRuntime({ WORKSHOP_FAULT: "typo" }), /only supported/);
  assert.ok(learnerSessionOverrides(learner()));
});

test("instructor policy checks normalized catering cost, not the full group total", () => {
  for (const city of CITIES) {
    assert.ok(answers.learnerCateringPolicy(labProposal(city, 2)).length);
    assert.deepEqual(answers.learnerCateringPolicy(labProposal(city, 3)), []);
  }
  for (const [people, days] of [[12, 2], [6, 1], [20, 3]]) {
    const plan = labProposal("Chicago", 2, people, days);
    plan.budgetItems[1].amount = 70 * people * days;
    assert.deepEqual(answers.learnerCateringPolicy(plan), []);
    plan.budgetItems[1].amount = 71 * people * days;
    assert.match(answers.learnerCateringPolicy(plan).join(" "), /71.00.*70/);
  }
});

test("downloaded proposal passes base checks then learner and solution policies reject without blocking same-session revision", async () => {
  const token = newSessionToken("sesn_existing");
  const filename = "proposal-11111111-1111-1111-1111-111111111111.json";
  const events = [
    { id: "user1", type: "user.message", content: [{ type: "text", text: "Use Table A" }, { type: "text", text: `WORKSHOP_OUTPUT:${filename}` }] },
    { id: "idle", type: "session.status_idle", stop_reason: { type: "end_turn" } },
  ].map((event) => ({ processed_at: new Date().toISOString(), ...event })) as ManagedEvent[];
  let sends = 0;
  let downloads = 0;
  const plan = labProposal();
  assert.deepEqual(validateProposal(plan, "Chicago").errors, []);
  const transport: ManagedTransport = {
    async create() { throw new Error("Revision must reuse the session"); },
    async session(id) { assert.equal(id, token.sessionId); return { id, status: "idle", metadata: { owner: token.owner, city: token.city } }; },
    async history() { return events; },
    async output(id) { assert.equal(id, token.sessionId); downloads++; return { filename, value: plan }; },
    async send(id, entries) {
      assert.equal(id, token.sessionId); sends++;
      return entries.map((entry, index) => ({ id: `sent-${index}`, processed_at: new Date().toISOString(), ...entry })) as ManagedEvent[];
    },
  };
  const accepted = await readConversation(token, transport, Date.now(), workshopRuntime({}));
  assert.deepEqual(accepted.proposal, plan);
  for (const runtime of [learner(), workshopRuntime({ WORKSHOP_IMPLEMENTATION: "solution" })]) {
    const rejected = await readConversation(token, transport, Date.now(), runtime);
    assert.equal(rejected.proposal, null);
    assert.equal(rejected.status, "idle");
    assert.equal(rejected.errorCode, "catering_policy");
    assert.match(rejected.error!, /85.00.*70.*same session/);
  }
  assert.equal(downloads, 3);
  assert.equal(sends, 0, "Application policy never sends automatic repair instructions");
  const revised = await sendManagedMessage(token, "Use Table B and update all dependent totals", transport);
  assert.equal(revised.id, token.sessionId);
  assert.equal(revised.status, "running");
  assert.equal(revised.errorCode, undefined);
  assert.equal(revised.messages.length, 2);
  assert.equal(sends, 1);
});

test("completed solution selects all four answers and never executes unfinished learner overrides", async () => {
  const broken: ExerciseImplementation = {
    tools: () => { throw new Error("unfinished learner tools"); },
    budget: () => { throw new Error("unfinished learner budget"); },
    catering: () => { throw new Error("unfinished learner policy"); },
    sessionForTurn: async () => { throw new Error("unfinished learner continuity"); },
  };
  const runtime = workshopRuntime({ WORKSHOP_IMPLEMENTATION: "solution", WORKSHOP_FAULT: "continuity" }, broken);
  assert.deepEqual(runtime.exercises, solved);
  assert.equal(runtime.continuityFault, false);
  let requests = 0;
  const fetchMock: typeof fetch = async (input, init) => {
    requests++;
    const body = JSON.parse(await new Request(input, init).text());
    assert.deepEqual(body.agent.tools, answers.learnerTools());
    assert.match(body.agent.system, /Application catering policy: at most \$70 per person per day/);
    assert.deepEqual(body.budget, answers.learnerBudget());
    assert.equal(body.metadata.workshop, "solution");
    return new Response(JSON.stringify({ id: "sesn_solution" }), { status: 200, headers: { "content-type": "application/json" } });
  };
  assert.equal(await createTransport(config, { workshop: runtime, fetch: fetchMock }).create("Chicago", "owner"), "sesn_solution");
  assert.equal(requests, 1);
  assert.match(runtime.exercises.catering(labProposal()).join(" "), /85.00.*70/);
  assert.deepEqual(runtime.exercises.catering(labProposal("Chicago", 3)), []);
  const existing = newSessionToken("sesn_existing");
  let creates = 0;
  const create = async () => newSessionToken(`sesn_solution${++creates}`);
  assert.equal(await sessionForMessage(existing, create, runtime), existing);
  assert.equal(creates, 0);
  assert.notEqual((await sessionForMessage(undefined, create, runtime)).sessionId, existing.sessionId);
  assert.equal(creates, 1);
  assert.equal(workshopRuntime({ WORKSHOP_IMPLEMENTATION: "learner" }, broken).exercises, broken);
});

test("continuity defect is explicit; solved resolver preserves history and reset isolates a new trip", async () => {
  const existing = newSessionToken("sesn_existing");
  let creates = 0;
  const create = async () => newSessionToken(`sesn_new${++creates}`);
  const broken = learner({ sessionForTurn: async (_existing, make) => make() });
  assert.notEqual((await sessionForMessage(existing, create, broken)).sessionId, existing.sessionId);
  assert.equal(creates, 1);
  assert.equal((await sessionForMessage(existing, create, learner())).sessionId, existing.sessionId);
  assert.equal(creates, 1);
  const reset = await sessionForMessage(undefined, create, learner());
  assert.notEqual(reset.sessionId, existing.sessionId);
  assert.equal(creates, 2);
  for (const env of [{}, { WORKSHOP_FAULT: "continuity" }, { WORKSHOP_IMPLEMENTATION: "learner" }]) {
    const guarded = workshopRuntime(env, broken.exercises);
    assert.equal((await sessionForMessage(existing, create, guarded)).sessionId, existing.sessionId);
  }
  assert.equal(creates, 2);
});

test("one-server routes isolate cookies, policy, polling and continuity even with a conflicting process mode", async () => {
  const sessions = new Map<string, { owner: string; city: City; mode: string; events: ManagedEvent[] }>();
  let creates = 0;
  let sends = 0;
  const transport = (_config: ManagedConfig, runtime: WorkshopRuntime): ManagedTransport => ({
    async create(city, owner) {
      const id = `sesn_route${++creates}`;
      sessions.set(id, { city, owner, mode: runtime.mode, events: [] });
      return id;
    },
    async session(id) {
      const saved = sessions.get(id)!;
      assert.equal(saved.mode, runtime.mode, "A handler must never observe the other version's session");
      return { id, status: "idle", metadata: { owner: saved.owner, city: saved.city, workshop: saved.mode } };
    },
    async history(id) { return sessions.get(id)!.events; },
    async output(id, names) { return names[0] ? { filename: names[0], value: labProposal(sessions.get(id)!.city) } : null; },
    async send(id, entries) {
      sends++;
      const saved = entries.map((entry, index) => ({ id: `${id}-turn${sends}-${index}`, processed_at: new Date().toISOString(), ...entry })) as ManagedEvent[];
      sessions.get(id)!.events.push(...saved, { id: `${id}-idle${sends}`, type: "session.status_idle", processed_at: new Date().toISOString(), stop_reason: { type: "end_turn" } } as ManagedEvent);
      return saved;
    },
  });
  const unfinishedPolicy: ExerciseImplementation = { ...solved, catering: () => [], sessionForTurn: async (_existing, create) => create() };
  const base = { config: () => config, transport, exercises: unfinishedPolicy };
  const completed = createManagedRoutes("solution", { ...base, env: { WORKSHOP_IMPLEMENTATION: "learner" } });
  const lab = createManagedRoutes("learner", { ...base, env: { WORKSHOP_IMPLEMENTATION: "solution" } });
  const request = (method = "GET", cookie = "", message?: string) => new NextRequest("http://127.0.0.1:3000/api/test", {
    method, headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000", "content-type": "application/json", cookie },
    ...(method === "POST" ? { body: JSON.stringify({ city: "Chicago", ...(message ? { message } : {}) }) } : {}),
  });
  const solutionStart = await completed.POST(request("POST"));
  const labStart = await lab.POST(request("POST"));
  assert.equal(solutionStart.status, 200); assert.equal(labStart.status, 200);
  const solutionId = (await solutionStart.json()).id;
  const labId = (await labStart.json()).id;
  assert.notEqual(solutionId, labId);
  const s = solutionStart.cookies.get(IMPLEMENTATION_COOKIES.solution)!;
  const l = labStart.cookies.get(IMPLEMENTATION_COOKIES.learner)!;
  assert.ok(s.value && l.value);
  let jar = `${s.name}=${s.value}; ${l.name}=${l.value}`;
  assert.equal((await (await completed.GET(request("GET", jar))).json()).id, solutionId);
  assert.equal((await (await lab.GET(request("GET", jar))).json()).id, labId);
  assert.equal((await lab.GET(request("GET", `${l.name}=${s.value}`))).status, 401, "Renaming a completed cookie cannot authenticate it as a lab cookie");
  await completed.messagePOST(request("POST", jar, "Completed brief"));
  await lab.messagePOST(request("POST", jar, "Lab brief"));
  const completeRead = await (await completed.GET(request("GET", jar))).json();
  const labRead = await (await lab.GET(request("GET", jar))).json();
  assert.equal(completeRead.proposal, null); assert.match(completeRead.error, /Catering policy rejected/);
  assert.ok(labRead.proposal); assert.equal(labRead.messages[0].text, "Lab brief");
  assert.equal(sends, 2, "Polling does not send messages");
  assert.equal((await (await lab.messagePOST(request("POST", jar, "Same lab offsite"))).json()).id, labId);
  assert.equal(creates, 2, "The learner defect stays inactive without its explicit switch");

  const faultyLab = createManagedRoutes("learner", { ...base, env: { WORKSHOP_FAULT: "continuity" } });
  const changed = await faultyLab.messagePOST(request("POST", jar, "Follow-up with planted fault"));
  const changedId = (await changed.json()).id;
  assert.notEqual(changedId, labId);
  const newLabCookie = changed.cookies.get(IMPLEMENTATION_COOKIES.learner)!;
  jar = `${s.name}=${s.value}; ${newLabCookie.name}=${newLabCookie.value}`;
  const fixedLab = createManagedRoutes("learner", { ...base, exercises: solved, env: { WORKSHOP_FAULT: "continuity" } });
  assert.equal((await (await fixedLab.messagePOST(request("POST", jar, "Fixed follow-up"))).json()).id, changedId);
  assert.equal((await (await completed.GET(request("GET", jar))).json()).id, solutionId);
  assert.equal(creates, 3);
  assert.equal(outputNames(sessions.get(solutionId)!.events).length, 1);
  const reset = await lab.DELETE(request("DELETE", jar));
  assert.ok(reset.cookies.get(IMPLEMENTATION_COOKIES.learner));
  assert.equal(reset.cookies.get(IMPLEMENTATION_COOKIES.solution), undefined);
});

test("unfinished lab opens without a session but cannot create or send before offline configuration passes", async () => {
  let transports = 0;
  const routes = createManagedRoutes("learner", {
    config: () => config, env: {}, exercises: { ...solved, tools: () => [] },
    transport() { transports++; throw new Error("No transport should be constructed"); },
  });
  const get = new NextRequest("http://127.0.0.1:3000/api/lab/session");
  assert.equal((await routes.GET(get)).status, 200);
  const post = () => new NextRequest(get.url, { method: "POST", headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json" }, body: JSON.stringify({ city: "Chicago", message: "Test" }) });
  for (const response of [await routes.POST(post()), await routes.messagePOST(post())]) {
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.equal(body.errorCode, "tools_incomplete");
    assert.equal(body.messageDelivery, "not_sent");
  }
  const invalidBudget = createManagedRoutes("learner", {
    config: () => config, env: {}, exercises: { ...solved, budget: () => ({ type: "limit", max_list_cost: { amount: "2.00", currency: "USD" } }) },
    transport() { transports++; throw new Error("No transport should be constructed"); },
  });
  const budgetResponse = await invalidBudget.messagePOST(post());
  assert.equal(budgetResponse.status, 400);
  const budgetBody = await budgetResponse.json();
  assert.equal(budgetBody.errorCode, "budget_invalid");
  assert.equal(budgetBody.messageDelivery, "not_sent");
  assert.equal(transports, 0);
});

test("both versions open without credentials; configuration is required only when starting real work", async () => {
  for (const implementation of ["solution", "learner"] as const) {
    let configReads = 0;
    let transports = 0;
    const routes = createManagedRoutes(implementation, {
      config() { configReads++; return getManagedConfig({}); },
      transport() { transports++; throw new Error("No network should run without configuration"); },
      env: {},
    });
    const request = (method = "GET") => new NextRequest("http://127.0.0.1:3000/api/test", {
      method, headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json" },
      ...(method === "POST" ? { body: JSON.stringify({ city: "Chicago", message: "Our unsent brief" }) } : {}),
    });
    const empty = await routes.GET(request());
    assert.equal(empty.status, 200);
    assert.equal((await empty.json()).id, undefined);
    assert.equal(configReads, 0);
    for (const response of [await routes.POST(request("POST")), await routes.messagePOST(request("POST"))]) {
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.errorCode, "setup_required");
      assert.equal(body.messageDelivery, "not_sent");
    }
    assert.equal(configReads, 2);
    assert.equal(transports, 0);
  }
});
