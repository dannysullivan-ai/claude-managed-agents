/** Edit these functions for /lab. The completed app at /agent uses separate answers. */
import type { BetaManagedAgentsAgentToolset20260401Params } from "@anthropic-ai/sdk/resources/beta/agents/agents";
import type { BetaManagedAgentsBudgetLimit } from "@anthropic-ai/sdk/resources/beta/sessions/sessions";
import type { OffsitePlan } from "./types";
import type { SessionToken } from "./managed/session-token";
import venues from "./managed/fixtures/venues.json";

export const CATERING_LIMIT_USD = 70;

// Exercise 1: enable only hosted read, write and bash, with no approval dependency.
export function learnerTools(): BetaManagedAgentsAgentToolset20260401Params[] {
  return [{
    type: "agent_toolset_20260401",
    default_config: { enabled: false },
    configs: [],
  }];
}
// END tools

// Exercise 2: predict why a dollar-formatted value cannot be sent as minor units.
export function learnerBudget(): BetaManagedAgentsBudgetLimit {
  return { type: "limit", max_list_cost: { amount: "2.00", currency: "USD" } };
}
// END budget

// Exercise 3: enforce the per-person-per-day catering cap at application acceptance.
// Use venues.cities[proposal.city] to identify the chosen meal package by its label.
// Return actionable errors; [] means accepted. The hosted validator stays unchanged.
export function learnerCateringPolicy(proposal: OffsitePlan): string[] {
  void proposal;
  void venues;
  return [];
}
// END policy

// Exercise 4: this deliberate defect runs only with WORKSHOP_FAULT=continuity
// AND learner mode. A follow-up must retain its session; a new offsite must create one.
export async function learnerSessionForTurn(
  existing: SessionToken | undefined,
  create: () => Promise<SessionToken>,
): Promise<SessionToken> {
  void existing;
  return create();
}
// END continuity
