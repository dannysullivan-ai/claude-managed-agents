# Technical reference

Implementation, configuration, and operational details for Offsite. Start with the [quick start](../README.md), the short [instructor handoff](INSTRUCTOR.md), or the [lab runbook](WORKSHOP.md).

## Routes and presentation controls

| Route | Experience |
| --- | --- |
| `/` → `/workshop` | Main entry point: integrated slides and live app, with 20 minutes of teaching followed by a 60-minute lab. |
| `/instructor` | Short instructor handoff, also linked from the app header in a new tab. |
| `/agent` | Completed solution: real managed execution with all four answers, including the catering policy. |
| `/lab` | Lab starter: the same managed UI wired to the four editable learner functions. |
| `/preview` | Separate scripted preview. Fixed sample replies; no AI calls or interpretation of the request. |

All versions use illustrative data. None searches real venues, checks availability, contacts anyone, or makes bookings. The managed versions generate and revise proposals; the scripted preview does not.

Use **Live app** to open the demo and the accent-colored **Back to slides** button to return. Switching preserves the selected app version and keeps its planner mounted; the course title returns to Slides without reloading it. **Start of deck** returns to the welcome slide from either view. Use arrow keys to navigate and **N** for instructor notes. Code tabs support copying and an expanded presentation view; **Escape** returns to the task. The outline jumps to any slide, and lab slides include a timer and progressive hints. The 60-minute lab has 13 steps and four executable code exercises, with prediction, inspection, changes, and verification at each checkpoint.

## Configuration and resource setup

Create `.env.local` from [.env.example](../.env.example) if it does not already exist, and set `ANTHROPIC_API_KEY` privately. Use an API account with Managed Agents access and funded credits. Then run:

```bash
npm run setup:agent
```

The script verifies model availability, creates or reuses a dedicated offsite agent and cloud environment, uploads the fixture and validator, and saves their IDs plus a pinned agent version to `.env.local`. It generates `SESSION_SECRET` if needed. It preserves existing credentials. Provisioning starts no model run.

The managed configuration uses `ANTHROPIC_API_KEY`, `OFFSITE_AGENT_ID`, `OFFSITE_AGENT_VERSION`, `OFFSITE_ENVIRONMENT_ID`, `OFFSITE_VENUES_FILE_ID`, `OFFSITE_VALIDATOR_FILE_ID`, and `SESSION_SECRET`. `CLAUDE_MODEL` is an optional setup-time model choice. Provision once for both managed versions. Their routes select the implementation explicitly; no mode environment switch is needed.

Restart the development server if saved setup values still appear missing. Select **Live app → Completed demo**, choose a city, and submit a brief. Sending a message starts paid execution. Each session has a **$2 list-cost budget** (`"200"` US cents), separate from the offsite's planning budget. Enforcement occurs between model requests, so in-flight work can take the final cost above the cap. [Managed session budgets](https://platform.claude.com/docs/en/managed-agents/budgets)

Run setup again after changing agent instructions or fixtures. Changed configuration publishes a new version; unchanged resources are reused. `npm run setup:agent -- --update` explicitly publishes a new agent version. Start a new session to use updated agent configuration and uploaded fixtures.

## What executes where

The Next.js server creates the session, sends user messages, and reads saved events and output files. Anthropic's hosted sandbox executes the agent's `read`, `write`, and `bash` tools. Browser polling only observes progress: it does not execute custom tools or keep the agent running.

The agent reads the fictional options in [venues.json](../lib/managed/fixtures/venues.json), writes a candidate, and runs [validate.py](../lib/managed/fixtures/validate.py) inside the sandbox. Successful proposals are saved as JSON outputs. The server independently checks the downloaded proposal in [validation.ts](../lib/managed/validation.ts) before displaying it. Unique output names correlate each revision with its user turn; an older proposal cannot count as a completed new revision.

Current base checks cover structure, city, venue capacity, time overlaps, price units, contingency, and total cost against the **proposal's stated budget**. The application does not independently extract and bind every constraint from the free-text brief. The completed app enforces the $70/person/day catering policy. The lab calls its editable policy function, which initially accepts everything. Binding an authoritative total approved budget remains a future extension.

The managed API is intentionally small:

- `POST /api/managed/session` with `{ city }` creates or reconnects to the browser's session.
- `POST /api/managed/message` with `{ message, city }` sends a turn to that session.
- `GET /api/managed/session` reads messages, tool activity, status, and the validated proposal.
- `DELETE /api/managed/session` clears the browser's session cookie only.

The lab has the same endpoints under `/api/lab`. Fixed route handlers select the answer or learner functions, with separate authenticated cookies and session histories. Clearing one version’s cookie leaves the other intact. The scripted `POST /api/chat` remains separate. Keys stay server-side; the browser receives an authenticated HttpOnly session cookie. Mutations enforce same-origin requests. Uncertain message sends are not automatically retried: check the saved history before sending again.

## Persistence and reconnection

After submission is acknowledged, hosted work can continue with the browser closed. Reopening the same site in the same browser recovers events and outputs through the session cookie, which expires seven days after creation. Output files can appear shortly after execution finishes, so the UI briefly keeps checking for the current revision. [Session files](https://platform.claude.com/docs/en/managed-agents/files)

This lab has no account database or cross-device session recovery. Clearing cookies, changing `SESSION_SECRET`, or choosing **New offsite** loses that browser's link to the previous session. New offsite does not cancel or delete the hosted session. The adapter limits a conversation to 1,000 recorded events.

The service retains conversation history unless the session is deleted; sandbox state has a separate 30-day window from sandbox creation. This app does not provide archive, deletion, or long-term retention management. [Session persistence](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)

## Verify the foundation

The [October 15 rehearsal record](LAB_REHEARSAL.md) covers the instructor walkthrough, learner exercises and real session results, including what was not tested.

```bash
npm test
npm run typecheck
npm run build
```

The live rehearsal is explicit and paid:

```bash
npm run smoke:managed -- --start
# The submitting process exits. Run this later in a separate invocation:
npm run smoke:managed -- --resume
```

`--start` creates one capped session and saves private rehearsal state in the operating system's temporary directory. It refuses another start while that state exists. `--resume` only reads the same session; repeat it if execution is still running. The foundation has been rehearsed with the submitting process exited and the completed proposal recovered afterward. Rehearse against your own configured resource versions before teaching.

## Exercise implementation

Under **Live app**, demonstrate **Completed demo**, then select **Lab starter** to build the missing pieces. Learner edits never overwrite the completed answer. The lab blocks creation and sending until its tools/budget checks pass; opening either app alone does not start model work.

Learner tools and budget become actual session-creation overrides. The server refuses invalid values before making a session request; editing those functions does not require reprovisioning. Start a new offsite to exercise the new session configuration. The catering function runs on downloaded, structurally valid proposals before the app accepts them. Its unfinished implementation accepts everything; the completed exercise rejects premium catering while accepting compliant packages. A rejection hides the proposal and leaves the same hosted session available for an explicit revision request. It does not automatically send feedback or ask the agent to retry, and it does not alter the hosted Python validator.

The continuity defect is isolated to the lab behind an optional switch:

```bash
WORKSHOP_FAULT=continuity npm run dev
```

Use the offline continuity check first. For the optional live reproduction, enable the fault only after completing an initial conversation, then compare session IDs and saved history on a follow-up. The unfinished resolver creates a new paid session; it never affects the completed app. After repairing the resolver, verify the checkpoint and return to ordinary `npm run dev`. Keep `WORKSHOP_FAULT` unset for normal use.

[lib/workshop-solutions.ts](../lib/workshop-solutions.ts) contains the functions used by the completed app, plus complete instructor answers for comparison or manual copying. No command overwrites learner edits. An instructor can rehearse the answer checks with `npm run lab:check -- all --solution`; that command tests the answer file, not the learner's work. Finish the lab by running `npm run lab:check -- all`, `npm test`, and `npm run typecheck` against the edited starter, then inspect the real session and proposal evidence.

## Deploy to Vercel

Use the Next.js framework, Node.js 22, and `npm run build`. The scripted preview needs no secrets. For `/agent` and `/lab`, provision resources first, add all managed configuration values from `.env.example` as **server-side** Vercel environment variables, and redeploy. Keep a stable `SESSION_SECRET` across instances; never prefix credentials with `NEXT_PUBLIC_`.

Protect the managed deployment with [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection) or application authentication before sharing it. Same-origin checks are not user authorization or a per-user spending limit: visitors with access can create paid sessions. This foundation has no per-user quota, durable write lock, or production abuse controls. Its short request handlers observe hosted work and need no browser-driven worker, webhook endpoint, or local disk persistence.

See [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) and [environment variables](https://vercel.com/docs/environment-variables). A local successful run does not establish that a deployment has been configured or tested.

## Local editor links

In the deck’s editor-link settings, enter the absolute path to your checkout (`pwd`). Source links then open the corresponding file and line in local VS Code. The path stays in your browser. Code tabs show the source supplied by the running deck; a hosted deck cannot read local edits. GitHub Codespaces has not been configured or tested for this lab.
