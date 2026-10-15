/** Opt-in exercise wiring; the default reference never uses the unfinished seams. */
import { learnerBudget, learnerCateringPolicy, learnerSessionForTurn, learnerTools } from "../workshop-exercises";
import * as solution from "../workshop-solutions";
import type { OffsitePlan } from "../types";
import type { SessionToken } from "./session-token";
import { ManagedError } from "./config";

export type ExerciseImplementation = {
  tools: typeof learnerTools;
  budget: typeof learnerBudget;
  catering: typeof learnerCateringPolicy;
  sessionForTurn: typeof learnerSessionForTurn;
};
export const LEARNER_EXERCISES: ExerciseImplementation = {
  tools: learnerTools, budget: learnerBudget, catering: learnerCateringPolicy, sessionForTurn: learnerSessionForTurn,
};
export const SOLUTION_EXERCISES: ExerciseImplementation = {
  tools: solution.learnerTools, budget: solution.learnerBudget,
  catering: solution.learnerCateringPolicy, sessionForTurn: solution.learnerSessionForTurn,
};
export type WorkshopRuntime = { mode: "reference" | "learner" | "solution"; continuityFault: boolean; exercises: ExerciseImplementation };

export function workshopRuntime(env: Record<string, string | undefined> = process.env, exercises = LEARNER_EXERCISES): WorkshopRuntime {
  const mode = env.WORKSHOP_IMPLEMENTATION || "reference";
  if (mode !== "reference" && mode !== "learner" && mode !== "solution") throw new ManagedError("WORKSHOP_IMPLEMENTATION must be reference, learner or solution.", 503, "setup_required");
  if (env.WORKSHOP_FAULT && env.WORKSHOP_FAULT !== "continuity") throw new ManagedError("The only supported WORKSHOP_FAULT is continuity.", 503, "setup_required");
  return { mode, continuityFault: mode === "learner" && env.WORKSHOP_FAULT === "continuity",
    exercises: mode === "solution" ? SOLUTION_EXERCISES : exercises };
}

/** Validate the actual outgoing overrides before a paid session can be created. */
export function learnerSessionOverrides(runtime: WorkshopRuntime) {
  if (runtime.mode === "reference") return undefined;
  const tools = runtime.exercises.tools();
  const toolset = tools.length === 1 ? tools[0] : undefined;
  const enabled = toolset?.configs?.filter((config) => config.enabled === true) ?? [];
  const names = enabled.map((config) => config.name).sort();
  if (!toolset || toolset.type !== "agent_toolset_20260401" || toolset.default_config?.enabled !== false
    || names.join(",") !== "bash,read,write"
    || enabled.some((config) => (config.permission_policy ?? toolset.default_config?.permission_policy)?.type !== "always_allow")) {
    throw new ManagedError("Learner tools are incomplete: enable only read, write and bash with always_allow. Run npm run lab:check -- tools before creating a session. No model call was started.", 400, "tools_incomplete");
  }
  const budget = runtime.exercises.budget();
  if (budget.type !== "limit" || budget.max_list_cost.currency !== "USD" || budget.max_list_cost.amount !== "200") {
    throw new ManagedError("Learner budget is invalid: this lab's $2 cap must be the integer-cent string 200, not 2.00 or 2. Run npm run lab:check -- budget. No model call was started.", 400, "budget_invalid");
  }
  return { tools, budget };
}

export function cateringErrors(proposal: OffsitePlan, runtime: WorkshopRuntime): string[] {
  return runtime.mode === "reference" ? [] : runtime.exercises.catering(proposal);
}

/** The message route calls this seam; the continuity defect is explicitly opt-in. */
export async function sessionForMessage(existing: SessionToken | undefined, create: () => Promise<SessionToken>, runtime = workshopRuntime()): Promise<SessionToken> {
  if (runtime.mode === "solution" || runtime.continuityFault) return runtime.exercises.sessionForTurn(existing, create);
  return existing ?? create();
}
