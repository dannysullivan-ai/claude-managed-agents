/** Instructor answers, executed by the completed solution mode. Learner edits stay separate. */
import type { BetaManagedAgentsAgentToolset20260401Params } from "@anthropic-ai/sdk/resources/beta/agents/agents";
import type { BetaManagedAgentsBudgetLimit } from "@anthropic-ai/sdk/resources/beta/sessions/sessions";
import type { OffsitePlan } from "./types";
import type { SessionToken } from "./managed/session-token";
import venues from "./managed/fixtures/venues.json";
export const CATERING_LIMIT_USD = 70;

export function learnerTools(): BetaManagedAgentsAgentToolset20260401Params[] {
  return [{
    type: "agent_toolset_20260401",
    default_config: { enabled: false, permission_policy: { type: "always_allow" } },
    configs: [
      { name: "read", enabled: true },
      { name: "write", enabled: true },
      { name: "bash", enabled: true },
    ],
  }];
}
// END tools

export function learnerBudget(): BetaManagedAgentsBudgetLimit {
  return { type: "limit", max_list_cost: { amount: "200", currency: "USD" } };
}
// END budget

export function learnerCateringPolicy(proposal: OffsitePlan): string[] {
  const mealNames = new Set(venues.cities[proposal.city]
    .filter((option) => option.kind === "meals").map((option) => option.name));
  const meal = proposal.budgetItems.find((item) => mealNames.has(item.label));
  if (!meal) return ["Choose a known catering package before approval."];
  const rate = meal.amount / (proposal.attendees * proposal.days.length);
  return rate > CATERING_LIMIT_USD
    ? [`Catering is $${rate.toFixed(2)} per person per day; the limit is $${CATERING_LIMIT_USD}. Choose a cheaper meal package.`]
    : [];
}
// END policy

export async function learnerSessionForTurn(
  existing: SessionToken | undefined,
  create: () => Promise<SessionToken>,
): Promise<SessionToken> {
  return existing ?? create();
}
// END continuity
