import Anthropic from "@anthropic-ai/sdk";
import type { BetaManagedAgentsEventParams, BetaManagedAgentsSessionEvent } from "@anthropic-ai/sdk/resources/beta/sessions/events";
import type { City } from "../types";
import { learnerSessionOverrides, workshopRuntime } from "./workshop";
import type { WorkshopRuntime } from "./workshop";
import { OFFSITE_SYSTEM } from "./agent";
import { CATERING_LIMIT_USD } from "../workshop-solutions";
import { ManagedError } from "./config";
import type { ManagedConfig } from "./config";

export type ManagedEvent = BetaManagedAgentsSessionEvent;
export type RemoteSession = { id: string; status: string; metadata: Record<string, string> | null };
export type OutputFile = { filename: string; value: unknown };
export interface ManagedTransport {
  create(city: City, owner: string): Promise<string>;
  session(id: string): Promise<RemoteSession>;
  history(id: string): Promise<ManagedEvent[]>;
  output(id: string, filenames: string[]): Promise<OutputFile | null>;
  send(id: string, events: BetaManagedAgentsEventParams[]): Promise<ManagedEvent[]>;
}

export const SESSION_BUDGET = { type: "limit" as const, max_list_cost: { amount: "200", currency: "USD" as const } };

/** Requests are bounded; all agent execution lives on Anthropic's hosted service. */
export function createTransport(config: ManagedConfig, options: { workshop?: WorkshopRuntime; fetch?: typeof fetch } = {}): ManagedTransport {
  const runtime = options.workshop ?? workshopRuntime();
  const learner = learnerSessionOverrides(runtime);
  const client = new Anthropic({ apiKey: config.apiKey, maxRetries: 0, timeout: 15_000, ...(options.fetch ? { fetch: options.fetch } : {}) });
  const signal = AbortSignal.timeout(45_000);
  return {
    async create(city, owner) {
      const session = await client.beta.sessions.create({
        agent: { type: "agent_with_overrides", id: config.agentId, version: config.agentVersion,
          system: `${OFFSITE_SYSTEM}\nThe selected city for this entire session is ${city}.${runtime.mode === "solution" ? `\nApplication catering policy: at most $${CATERING_LIMIT_USD} per person per day. Divide the whole-group meal amount by attendees and day count to check this rule. Choose a compliant meal package even when a more expensive package fits the total budget. The application independently enforces this cap; explain any conflict and preserve the user's other requirements.` : ""}`,
          ...(learner ? { tools: learner.tools } : {}) },
        environment_id: config.environmentId,
        resources: [{ type: "file", file_id: config.venuesFileId, mount_path: "/venues.json" },
          { type: "file", file_id: config.validatorFileId, mount_path: "/validate.py" }],
        metadata: { application: "offsite-workshop", owner, city, workshop: runtime.mode },
        title: `Offsite · ${city}`,
        budget: learner?.budget ?? SESSION_BUDGET,
      }, { signal });
      return session.id;
    },
    async session(id) {
      const session = await client.beta.sessions.retrieve(id, {}, { signal });
      return { id: session.id, status: session.status, metadata: session.metadata };
    },
    async history(id) {
      const events: ManagedEvent[] = [];
      for await (const event of client.beta.sessions.events.list(id, { order: "asc", limit: 100 }, { signal })) {
        events.push(event);
        if (events.length > 1000) throw new ManagedError("This lab session reached its history limit. Choose New offsite and submit a new brief to start a new session.", 409, "session_stopped");
      }
      return events;
    },
    async output(id, filenames) {
      if (!filenames.length) return null;
      const candidates = [];
      for await (const file of client.beta.files.list({ scope_id: id, betas: ["managed-agents-2026-04-01"], limit: 100 }, { signal })) {
        if (file.scope?.id === id && filenames.includes(file.filename)) candidates.push(file);
        if (candidates.length > 100) throw new ManagedError("Too many output revisions. Choose New offsite and submit a new brief to start a new session.", 409, "session_stopped");
      }
      candidates.sort((a, b) => filenames.indexOf(a.filename) - filenames.indexOf(b.filename));
      const file = candidates[0];
      if (!file) return null;
      if (file.size_bytes > 64_000) throw new ManagedError("The proposal output is too large to display. Ask the agent to write a shorter proposal in this same session, preserving your requirements.", 422, "proposal_invalid");
      const response = await client.beta.files.download(file.id, {}, { signal });
      const raw = await response.text();
      if (raw.length > 64_000) throw new ManagedError("The proposal output is too large to display. Ask the agent to write a shorter proposal in this same session, preserving your requirements.", 422, "proposal_invalid");
      try { return { filename: file.filename, value: JSON.parse(raw) as unknown }; }
      catch { throw new ManagedError("The agent's proposal file is not valid JSON. Ask the agent to repair it in this same session, preserving your requirements.", 422, "proposal_invalid"); }
    },
    async send(id, events) {
      const response = await client.beta.sessions.events.send(id, { events }, { signal, maxRetries: 0 });
      return response.data ?? [];
    },
  };
}
