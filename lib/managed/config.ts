import type { FeedbackCode } from "./feedback";

export class ManagedError extends Error {
  constructor(message: string, public readonly status = 502, public readonly code: FeedbackCode = status >= 500 ? "connection_error" : "request_invalid") { super(message); }
}
export type ManagedConfig = { apiKey: string; agentId: string; agentVersion: number; environmentId: string; secret: string; venuesFileId: string; validatorFileId: string };

/** Dedicated offsite IDs keep the earlier travel agent isolated. Never fall back to demo. */
export function getManagedConfig(env: Record<string, string | undefined> = process.env): ManagedConfig {
  const names = ["ANTHROPIC_API_KEY", "OFFSITE_AGENT_ID", "OFFSITE_AGENT_VERSION", "OFFSITE_ENVIRONMENT_ID", "SESSION_SECRET", "OFFSITE_VENUES_FILE_ID", "OFFSITE_VALIDATOR_FILE_ID"];
  const missing = names.filter((name) => !env[name]?.trim());
  if (missing.length) throw new ManagedError(`Managed offsite setup is incomplete. Run npm run setup:agent. Missing: ${missing.join(", ")}.`, 503, "setup_required");
  const version = Number(env.OFFSITE_AGENT_VERSION);
  if (!Number.isSafeInteger(version) || version < 1 || env.SESSION_SECRET!.length < 32) throw new ManagedError("Invalid offsite version or session secret. Run npm run setup:agent.", 503, "setup_required");
  if (!/^agent_[A-Za-z0-9]+$/.test(env.OFFSITE_AGENT_ID!) || !/^env_[A-Za-z0-9]+$/.test(env.OFFSITE_ENVIRONMENT_ID!) || ![env.OFFSITE_VENUES_FILE_ID, env.OFFSITE_VALIDATOR_FILE_ID].every((id) => /^file_[A-Za-z0-9]+$/.test(id!))) throw new ManagedError("Invalid offsite resource IDs. Run npm run setup:agent.", 503, "setup_required");
  return { apiKey: env.ANTHROPIC_API_KEY!, agentId: env.OFFSITE_AGENT_ID!, agentVersion: version, environmentId: env.OFFSITE_ENVIRONMENT_ID!, secret: env.SESSION_SECRET!, venuesFileId: env.OFFSITE_VENUES_FILE_ID!, validatorFileId: env.OFFSITE_VALIDATOR_FILE_ID! };
}
