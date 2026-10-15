# Instructor handoff

Teach **20 minutes, then build for 60** from `/`, which opens `/workshop`. **Live app / Back to slides** preserves the selected app version; the course title returns to Slides. **Start of deck** returns to the welcome slide. **N / Notes** reveals the rehearsal script. Share with Notes closed; no separate presenter window exists. [WORKSHOP.md](WORKSHOP.md) has the runbook.

## Before learners arrive

Update the welcome slide’s date in `lib/workshop-content.ts` for your session.

Recommended local setup:

```bash
git clone https://github.com/dannysullivan-ai/claude-managed-agents
cd claude-managed-agents
npm install
npm run dev
```

- Editor links use the learner’s absolute checkout folder. Codespaces is untested.
- Require Node.js 22, Python 3 (`python3`), a terminal and editor. Run `npm test`, `npm run typecheck`, and `npm run build`; unfinished exercises do not fail normal tests.
- Confirm Managed Agents access and funded credits. Set `ANTHROPIC_API_KEY` privately in `.env.local`. Credentials stay server-side; never use `NEXT_PUBLIC_`.
- Provision with `npm run setup:agent` and rehearse the demo beforehand. Restart if saved configuration still appears missing.
- One `npm run dev` serves both versions under **Live app**, also available at `/agent` and `/lab`. Keep `WORKSHOP_FAULT` unset. Label previous results as prepared.

The separate `/preview` is scripted. Managed versions use fictional fixtures, without research or bookings. They share provisioning but have separate cookies and histories. A session has a $2 list-cost limit; in-flight work can exceed it.

## Teach — 20 minutes

- **0–8 minutes:** Introduce the goal; define an agent and its decision/tool/result loop using order lookup → carrier status → response. Compare Messages API, Agent SDK and Managed Agents by what the application operates. Explain the boundary, the infrastructure Managed Agents supplies, and the selection criteria. Keep multiagent coordination to an optional capability; this lab uses one agent.
- **8–11 minutes:** Ask the three scenarios before selecting answers. Ticket summary → Messages API; team-hosted investigation → Agent SDK; service-operated continuing investigation → Managed Agents. Explain the requirement driving each choice.
- **11–17.5 minutes:** Introduce Offsite and start or inspect the prepared planner. Explain reusable agent/environment configuration, per-job sessions/events, application acceptance and reconnection. Keep the acceptance explanation to one minute. Ask what closing the tab changes.
- **17.5–20 minutes:** Demonstrate the same session's saved history and proposal, then a follow-up. Preview the lab checkpoints.

Use Chicago: 12 people, two days, $6,000, vegetarian meals, $70/person/day catering, rain backup. After acknowledged submission, close/reopen and inspect the same session ID. A follow-up changes the plan; reconnect only reads. Show tool activity and accepted output. If the plan already costs under $4,000, the follow-up may keep the same selections; show the changed budget and saved turn without claiming a cost reduction.

## Build — 60 minutes

The deck supplies **13 tasks plus three predictions** within the hour. Leave `npm run dev` running in Terminal A. Open Terminal B in the cloned repository, where `package.json` lives, for checks and setup. Pair learners blocked by installation after five minutes. Allow one minute for the policy prediction and 2.5 minutes for execution-budget configuration.

At **task 6**, learners run `npm run setup:agent` once. This repository's npm script wraps SDK resource API calls; it is not an Anthropic CLI. Show `client.beta.environments.create`, `client.files.upload`, and `client.beta.agents.create` in `scripts/setup-agent.ts`, alongside the reuse paths. It creates/reuses the agent and environment, uploads/reuses fixtures, and saves configuration. It creates **no session or model run**. Show only safe summary output—for example, “Reused the existing offsite environment”—never `.env.local` contents.

**Say:** “At each exercise, run its matching check in Terminal B first. A failure is expected. Edit and save the function in `lib/workshop-exercises.ts`, then rerun the same command until it says PASS. These checks run locally with no API or model calls. Use your checkout and localhost; the Vercel page cannot run them or see your edits.”

```bash
npm run lab:check -- tools
npm run lab:check -- budget
npm run lab:check -- policy
npm run lab:check -- continuity
```

Run `npm run lab:check -- all` after all four exercises. The `--` passes the check name to the script. Answers: hosted `read`/`write`/`bash` with `always_allow`; budget `"200"` cents; normalized catering cap; `return existing ?? create()`. Completed answers are in `lib/workshop-solutions.ts`; no command overwrites learner work.

Select **Live app → Lab starter**; invalid tools/budget configuration blocks session creation. The offline continuity checker invokes the learner resolver; normal browser follow-up alone does not prove the fix ran. For optional live reproduction, set `WORKSHOP_FAULT=continuity` after the initial conversation, keep it enabled through the repair test, then remove it. The unfinished resolver creates a new paid session. Prefer offline reproduction.

**Independent exercise:** hide the policy answer. Require `amount / (attendees × days)`: $70 passes; $71 fails. For 12 people over two days, totals are $1,680 and $1,704. Completed instructions include the cap; learner instructions omit it. App code independently enforces it. Rejection hides the proposal. **Revise to meet the $70 limit** fills a draft; the user presses Send. Nothing retries automatically.

**Stretch:** introduce this during the policy task for fast finishers; revisit during final verification. Persist the approved budget separately from `proposal.budget`: approved $6,000 must reject $6,500 cost even if the model claims $7,000 budget. Test accepted, over-limit and model-inflated cases. This extension is not supplied.

## Recovery and completion

For uncertain delivery, inspect history before resending. Reconnect never retries. For setup failure, inspect the prepared app and continue offline; never relabel canned output as live. New offsite clears the browser link without cancelling hosted work.

Completion requires `npm run lab:check -- all`, normal tests and typecheck, plus a real session ID, tools, accepted proposal and same-session follow-up. Recap who operates the loop for API/SDK/Managed Agents, reusable setup versus per-job sessions, saved history, and “instructions guide; code enforces.” Reference or `--solution` checks alone do not complete learner work.

Leave the final **Questions?** slide on screen for optional Q&A. It links to the repository, official documentation and stretch goal; it adds no timed task to the 60-minute lab.
