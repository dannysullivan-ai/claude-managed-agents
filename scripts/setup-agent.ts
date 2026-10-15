/** Run npm run setup:agent; add -- --update to explicitly publish a new agent version. No paid session is started. */
import { loadEnvConfig } from "@next/env";
import Anthropic from "@anthropic-ai/sdk";
import type { BetaManagedAgentsAgent } from "@anthropic-ai/sdk/resources/beta/agents/agents";
import type { BetaEnvironment } from "@anthropic-ai/sdk/resources/beta/environments/environments";
import { createHash, randomBytes } from "node:crypto";
import { chmodSync, existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { OFFSITE_SYSTEM, OFFSITE_TOOLS } from "../lib/managed/agent";

loadEnvConfig(process.cwd());

const envPath = join(process.cwd(), ".env.local");
const agentName = "Offsite workshop planner";
const environmentName = "Offsite workshop · hosted tools";
const tools = OFFSITE_TOOLS;
const multiagent = { type: "multiagent_20261001" as const, advisor: { type: "disabled" as const }, subagents: { type: "disabled" as const }, workflows: { type: "disabled" as const } };


/** Update only our settings. Never copy, log, or rewrite an existing API key. */
function saveSettings(settings: Record<string, string>) {
  let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  for (const [name, value] of Object.entries(settings)) {
    const pattern = new RegExp(`^[ \\t]*(?:export[ \\t]+)?${name}[ \\t]*=.*$`, "gm");
    const line = `${name}=${JSON.stringify(value)}`;
    if (pattern.test(content)) content = content.replace(pattern, () => line);
    else content += `${content.endsWith("\n") || !content ? "" : "\n"}${line}\n`;
    process.env[name] = value;
  }
  const temporary = `${envPath}.${randomBytes(6).toString("hex")}.tmp`;
  writeFileSync(temporary, content, { mode: 0o600 });
  renameSync(temporary, envPath);
  chmodSync(envPath, 0o600);
}

async function availableModel(client: Anthropic): Promise<string> {
  const requested = process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-5-5";
  try {
    const model = await client.models.retrieve(requested);
    if (model.lifecycle !== "retired") return model.id;
  } catch (error) {
    if (!(error instanceof Anthropic.APIError) || ![400, 404].includes(error.status ?? 0)) throw error;
  }
  for await (const model of client.models.list()) {
    if (model.line === "sonnet" && model.lifecycle === "active") {
      console.log(`The requested model is unavailable; using available model ${model.id}.`);
      return model.id;
    }
  }
  throw new Error("No available Sonnet model was found in account metadata. Set CLAUDE_MODEL to an available supported model.");
}

async function existingEnvironment(client: Anthropic): Promise<BetaEnvironment | undefined> {
  if (process.env.OFFSITE_ENVIRONMENT_ID?.trim()) return client.beta.environments.retrieve(process.env.OFFSITE_ENVIRONMENT_ID.trim());
  // Recover a resource whose creation succeeded before a prior run saved its ID.
  for await (const environment of client.beta.environments.list()) {
    if (!environment.archived_at && environment.name === environmentName) return environment;
  }
}

async function existingAgent(client: Anthropic): Promise<BetaManagedAgentsAgent | undefined> {
  if (process.env.OFFSITE_AGENT_ID?.trim()) return client.beta.agents.retrieve(process.env.OFFSITE_AGENT_ID.trim());
  for await (const agent of client.beta.agents.list()) {
    if (!agent.archived_at && agent.name === agentName) return agent;
  }
}

/** Content-addressed names recover an upload if a prior response was lost. */
async function ensureFixture(client: Anthropic, name: string, setting: string) {
  const content = readFileSync(join(process.cwd(), "lib/managed/fixtures", name));
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 16);
  const filename = `offsite-${hash}-${name}`;
  let id: string | undefined;
  if (process.env[setting]) {
    try {
      const existing = await client.files.retrieveMetadata(process.env[setting]!);
      if (existing.filename === filename) id = existing.id;
    } catch (error) { if (!(error instanceof Anthropic.APIError) || error.status !== 404) throw error; }
  }
  if (!id) for await (const file of client.files.list()) if (file.filename === filename) { id = file.id; break; }
  if (!id) {
    const file = await client.files.upload({ file: await Anthropic.toFile(content, filename) });
    id = file.id;
    console.log(`Uploaded the ${name} lab fixture.`);
  } else console.log(`Reused the ${name} lab fixture.`);
  saveSettings({ [setting]: id });
}

async function main() {
  const updateRequested = process.argv.includes("--update");
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Set ANTHROPIC_API_KEY in .env.local before running setup.");
  const client = new Anthropic({ maxRetries: 0, timeout: 20_000 });
  const model = await availableModel(client);
  saveSettings({ CLAUDE_MODEL: model,
    ...(!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 ? { SESSION_SECRET: randomBytes(32).toString("hex") } : {}),
  });
  let environment = await existingEnvironment(client);
  if (!environment) {
    environment = await client.beta.environments.create({
      name: environmentName, metadata: { application: "offsite-workshop" },
      config: { type: "cloud", networking: { type: "limited", allowed_hosts: [], allow_package_managers: false } },
    });
    console.log("Created the restricted offsite environment.");
  } else console.log("Reused the existing offsite environment.");
  saveSettings({ OFFSITE_ENVIRONMENT_ID: environment.id });
  await ensureFixture(client, "venues.json", "OFFSITE_VENUES_FILE_ID");
  await ensureFixture(client, "validate.py", "OFFSITE_VALIDATOR_FILE_ID");
  const fingerprint = createHash("sha256").update(JSON.stringify({ model, system: OFFSITE_SYSTEM, tools, multiagent })).digest("hex");
  let agent = await existingAgent(client);
  if (!agent) {
    agent = await client.beta.agents.create({ name: agentName, model, system: OFFSITE_SYSTEM, tools, multiagent,
      metadata: { application: "offsite-workshop", setup_fingerprint: fingerprint } });
    console.log("Created the offsite planner agent.");
  } else if (updateRequested || agent.metadata?.setup_fingerprint !== fingerprint) {
    agent = await client.beta.agents.update(agent.id, { version: agent.version, model, system: OFFSITE_SYSTEM, tools, multiagent,
      metadata: { application: "offsite-workshop", setup_fingerprint: fingerprint } });
    console.log("Updated the existing offsite planner configuration.");
  } else console.log("Reused the existing offsite planner configuration.");
  saveSettings({ OFFSITE_AGENT_ID: agent.id, OFFSITE_AGENT_VERSION: String(agent.version) });
  console.log(`Live configuration saved privately to .env.local (${model}, agent version ${agent.version}).`);
  console.log("The API key and other settings were preserved. No session or model run was started.");
  console.log("Open Live app → Completed demo to see the solution, or Lab starter to run your exercises.");
}

main().catch((error: unknown) => {
  if (error instanceof Anthropic.APIError) console.error(`Setup failed with HTTP ${error.status ?? "error"}. Check account access and requested resource configuration. Any completed resources were saved in .env.local for reuse.`);
  else console.error(error instanceof Error ? error.message : "Setup failed.");
  process.exitCode = 1;
});
