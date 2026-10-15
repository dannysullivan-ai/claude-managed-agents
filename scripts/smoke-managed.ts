/** One explicit paid start, then independent read-only reconnects. Never logs credentials. */
import { loadEnvConfig } from "@next/env";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getManagedConfig } from "../lib/managed/config";
import { startSession, sendManagedMessage, readConversation } from "../lib/managed/conversation";
import { createTransport } from "../lib/managed/transport";
import type { SessionToken } from "../lib/managed/session-token";

loadEnvConfig(process.cwd());
const statePath = join(tmpdir(), "offsite-workshop-managed-smoke.json");
async function main() {
  const config = getManagedConfig();
  const transport = createTransport(config);
  if (process.argv.includes("--start")) {
    if (existsSync(statePath)) throw new Error("A rehearsal state already exists. Use --resume to inspect it; no second paid session was created.");
    const token = await startSession("Chicago", transport);
    writeFileSync(statePath, JSON.stringify(token), { mode: 0o600 });
    const accepted = await sendManagedMessage(token, "Plan a 2-day Chicago offsite for 12 people with a $6000 whole-group budget, vegetarian meals, focused collaboration and a rain alternative. Use the fictional fixtures and validate the saved proposal.", transport);
    console.log(JSON.stringify({ phase: "submitted", status: accepted.status, sessionSaved: true, budgetUsd: 2, note: "This process now exits. No browser or local worker executes tools." }));
    return;
  }
  if (!process.argv.includes("--resume") || !existsSync(statePath)) throw new Error("Use --start once, then --resume after the process has exited.");
  const token = JSON.parse(readFileSync(statePath, "utf8")) as SessionToken;
  const snapshot = await readConversation(token, transport);
  console.log(JSON.stringify({ phase: "reconnected", status: snapshot.status, messages: snapshot.messages.length,
    activity: snapshot.activity.map((item) => item.label), proposal: snapshot.proposal ? {
      title: snapshot.proposal.title, attendees: snapshot.proposal.attendees, days: snapshot.proposal.days.length,
      budget: snapshot.proposal.budget, total: snapshot.proposal.budgetItems.reduce((sum, row) => sum + row.amount, 0),
    } : null, ...(snapshot.error ? { error: snapshot.error } : {}) }));
  if (snapshot.status === "error") process.exitCode = 1;
}
main().catch((error: unknown) => {
  console.error(error instanceof Error && error.name === "Error" ? error.message : "Managed rehearsal failed. No credentials were logged; inspect server configuration and the session in Console.");
  process.exitCode = 1;
});
