/** Offline learner checks. Intentionally fail until the four editable seams are fixed. */
import assert from "node:assert/strict";
import { learnerBudget, learnerCateringPolicy, learnerSessionForTurn, learnerTools } from "../lib/workshop-exercises";
import * as answers from "../lib/workshop-solutions";
import { learnerSessionOverrides, sessionForMessage, workshopRuntime } from "../lib/managed/workshop";
import type { ExerciseImplementation } from "../lib/managed/workshop";
import { newSessionToken } from "../lib/managed/session-token";
import { CITIES } from "../lib/types";
import { labProposal } from "./lab-fixtures";

const solved: ExerciseImplementation = {
  tools: answers.learnerTools, budget: answers.learnerBudget,
  catering: answers.learnerCateringPolicy, sessionForTurn: answers.learnerSessionForTurn,
};
const solutionMode = process.argv.includes("--solution");
const implementation: ExerciseImplementation = solutionMode ? solved : {
  tools: learnerTools, budget: learnerBudget,
  catering: learnerCateringPolicy, sessionForTurn: learnerSessionForTurn,
};
const runtime = (override: Partial<ExerciseImplementation>) => workshopRuntime(
  { WORKSHOP_IMPLEMENTATION: "learner", WORKSHOP_FAULT: "continuity" }, { ...solved, ...override },
);

const checks: Record<string, () => void | Promise<void>> = {
  tools() {
    const configured = learnerSessionOverrides(runtime({ tools: implementation.tools }));
    assert.ok(configured);
    console.log("  read, write, and bash are enabled. No browser approval is needed.");
  },
  budget() {
    const configured = learnerSessionOverrides(runtime({ budget: implementation.budget }));
    assert.equal(configured?.budget.max_list_cost.amount, "200");
    console.log("  API execution cap is 200 integer cents ($2), separate from the offsite budget.");
  },
  policy() {
    // Boundary inputs isolate policy arithmetic; base fixture pricing is tested elsewhere.
    for (const [people, days] of [[12, 2], [6, 1], [20, 3]]) {
      const proposal = labProposal("Chicago", 2, people, days);
      proposal.budgetItems[1].amount = 70 * people * days;
      assert.deepEqual(implementation.catering(proposal), [], "$70/person/day must be accepted");
      proposal.budgetItems[1].amount = 71 * people * days;
      const errors = implementation.catering(proposal);
      assert.ok(errors.length, `$71/person/day must be rejected for ${people} people × ${days} days; observed acceptance`);
      assert.match(errors.join(" "), /70/, "Rejection must explain the $70 cap");
      assert.match(errors.join(" "), /per.person.per.day/i, "Rejection must explain the units");
    }
    for (const city of CITIES) {
      assert.ok(implementation.catering(labProposal(city, 2)).length, `${city} premium package must fail`);
      assert.deepEqual(implementation.catering(labProposal(city, 3)), [], `${city} basic package must pass`);
    }
    console.log("  $70 passes; $71 fails across group sizes; premium fails and basic passes in all cities.");
  },
  async continuity() {
    const existing = newSessionToken("sesn_existing");
    let creates = 0;
    const create = async () => newSessionToken(`sesn_new${++creates}`);
    const mode = runtime({ sessionForTurn: implementation.sessionForTurn });
    const followUp = await sessionForMessage(existing, create, mode);
    assert.equal(followUp.sessionId, existing.sessionId, "Follow-up created a different session; the original history is no longer attached");
    assert.equal(creates, 0, "A follow-up must not create a session");
    const first = await sessionForMessage(undefined, create, mode);
    const afterReset = await sessionForMessage(undefined, create, mode);
    assert.notEqual(first.sessionId, afterReset.sessionId, "New offsite must create an isolated session");
    assert.equal(creates, 2);
    console.log("  Follow-ups reuse the existing session. New offsites create a new session.");
  },
};

async function main() {
  const selected = process.argv[2] ?? "all";
  if (!(selected in checks) && selected !== "all") {
    console.error("Usage: npm run lab:check -- tools|budget|policy|continuity|all [--solution]");
    process.exitCode = 2;
  } else {
    console.log(`Offline lab checks (${solutionMode ? "instructor answers" : "learner file"}) — no model calls or credentials required.`);
    let failed = 0;
    for (const name of selected === "all" ? Object.keys(checks) : [selected]) {
      try { await checks[name](); console.log(`PASS ${name}`); }
      catch (error) { failed++; console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`); }
    }
    if (failed) console.error(solutionMode
      ? `${failed} completed-solution checkpoint(s) failed. Check the errors above.`
      : `${failed} checkpoint(s) still failing. These checks pass as you complete the exercises. Update lib/workshop-exercises.ts, then rerun this command.`);
    process.exitCode = failed ? 1 : 0;
  }
}
void main();
