# Offsite

Build a small app with Claude Managed Agents: generate and revise a team offsite proposal, inspect tool activity, and return to the same session. This repository includes a **20-minute technical session**, a **60-minute hands-on lab**, and both completed and unfinished versions of the app.

- **Teaching it?** Open **Instructor guide** in the app header, or read the [handoff document](docs/INSTRUCTOR.md).
- **Following the lab?** Use the slides in the app or the [step-by-step runbook](docs/WORKSHOP.md).
- **Need implementation or deployment details?** See the [technical reference](docs/REFERENCE.md).

## Start locally

Install **Node.js 22** and **Python 3** (`python3`, used by the tests). Use your preferred editor; VS Code is optional.

```bash
git clone https://github.com/dannysullivan-ai/claude-managed-agents
cd claude-managed-agents
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). One server serves the slides and both app versions. Use **Live app**, then **Back to slides** to return without losing the current planner. In Live app, choose:

- **Completed demo:** the working reference, with all four exercise answers.
- **Lab starter:** the same interface, powered by your editable functions.

Both interfaces open without credentials. Sending a request needs agent setup, and the starter also needs its tools and budget exercises completed. All venues and prices are fictional; the app makes no bookings. A separate `/preview` uses scripted replies without AI calls.

## Set up the agent

Keep the development server running in **Terminal A**. Open **Terminal B** in the cloned repository for setup and checks.

Copy [.env.example](.env.example) to `.env.local` if that file does not already exist. Set `ANTHROPIC_API_KEY` privately, using an account with Managed Agents access and funded credits. Never commit the key. Then run:

```bash
npm run setup:agent
```

This creates or reuses the agent and cloud environment, uploads the lab files, and saves configuration to `.env.local`. **Setup starts no session or model run.** Both app versions share this setup. Restart the development server if it still reports missing configuration.

In **Live app → Completed demo**, choose a city and send a brief. **Pressing Send starts paid execution.** Sessions have a $2 list-cost limit; in-flight work can exceed it. See the [configuration reference](docs/REFERENCE.md#configuration-and-resource-setup) for resource versions and limits.

## Complete the exercises

Edit `lib/workshop-exercises.ts` as each slide directs. In **Terminal B**, run the matching check **before editing**; `FAIL` is expected. Edit and save, then rerun until it reports `PASS`.

| After changing… | Run |
| --- | --- |
| Hosted tools | `npm run lab:check -- tools` |
| Execution budget | `npm run lab:check -- budget` |
| Catering policy | `npm run lab:check -- policy` |
| Session reuse | `npm run lab:check -- continuity` |
| All four exercises | `npm run lab:check -- all` |

These checks run locally without credentials or model calls. The `--` passes the check name to the script. Use your checkout and localhost: the hosted Vercel page cannot run these commands or see your edits. Completed answers remain available in `lib/workshop-solutions.ts`.

Finish with:

```bash
npm run lab:check -- all
npm test
npm run typecheck
```

Normal tests verify the supplied foundation and should pass even before the exercises are complete. They do not replace the exercise checks. Run `npm run build` before deploying; follow the [Vercel deployment instructions](docs/REFERENCE.md#deploy-to-vercel) for server-side configuration and access controls.
