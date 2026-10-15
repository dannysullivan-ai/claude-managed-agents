# Build with Claude Managed Agents

An 80-minute technical session and lab for experienced developers: **20 minutes of technical teaching and demonstration, followed by a 60-minute lab**. Open `/`, which redirects to the integrated `/workshop` shell. **Slides** and **Live app** switch views while preserving the selected app version and its mounted planner; the Offsite logo returns to Slides. The in-app deck is the learner guide; [INSTRUCTOR.md](INSTRUCTOR.md) is the short delivery hand-off. The teaching explains what Managed Agents is, when to choose it over the Messages API or Agent SDK, how its execution works, and what that looks like in a real app.

The sequence is deliberate: a familiar support task establishes the agent loop, an ownership comparison explains the integration choices, and Offsite becomes the concrete build only after that foundation. Questions appear on separate slides. Technical controls are introduced when the lab needs them rather than crowded into the opening.

## Using the presenter script

Every slide has a delivery script in its instructor notes. **Say** paragraphs are written to speak aloud. **Show** identifies the screen or code to point at, and **Transition** connects the slide to the next step. Source links remain separate references; they are not part of the narration.

On the existing audience-question slides, **Ask**, **Pause** and **Reveal** give the question, a 10–15-second thinking interval, and the reason behind the recommendation. Choosing any option displays immediate correct/incorrect feedback with an explanation; discuss the specific requirement or misconception rather than only reading the answer label. Lab tasks include a work interval, the expected checkpoint and an **If stuck** cue. **Watch for** contains operational details or common mistakes to use when relevant.

Rehearse the script against the actual app. Keep the independent policy exercise closed to solutions during its first work interval. Let learners explain the units and failing case before using rescue code. The short [instructor hand-off](INSTRUCTOR.md) covers preparation and run order; these slide notes supply the delivery words and actions.

## The teaching sequence — 20 minutes

Welcome learners with the title and date, then set the outcomes: choose the right integration, understand the loop, and build an application that can start, observe and continue work. Then use the illustrative question **“Where is my order?”** Claude can look up the order, use its tracking number to read carrier status, and decide whether it has enough information to reply. If the carrier reports delivery but the customer has no package, it may inspect delivery evidence or policy next. A simple lookup can still be ordinary application code; an agent is useful when its flexible choice of further actions helps the task.

**Claude Managed Agents runs an agent loop on your behalf:** Claude uses tools and works through a task. You define instructions, tools and an environment; Anthropic manages execution and session state. The support example illustrates that model; it is not implemented in this repository. [Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview)

| Minutes | Slide | Teaching action |
| --- | --- | --- |
| 0–0.5 | How to Build Claude Managed Agents | Welcome learners and introduce the 20 + 60 format |
| 0.5–1 | What you’ll learn and build | Set the three learning outcomes |
| 1–2.5 | What is a managed agent? | Define an agent through choosing actions and using returned information |
| 2.5–4 | How does an agent loop work? | Follow order lookup → carrier status → reply or further investigation |
| 4–6 | From the Messages API to Managed Agents | Compare who operates the model calls, loop and process |
| 6–7 | Built-in and custom tools in Managed Agents | Follow two tool-execution paths within the same managed loop |
| 7–8 | When do you reach for Managed Agents? | Identify the requirements that make managed execution useful |
| 8–9 | Which would you choose for a ticket summary? | Choose for a one-response ticket summary |
| 9–10 | Which would you choose for an investigator you host? | Choose for an investigation process the team wants to host |
| 10–11 | Which would you choose for a continuing investigation? | Choose for a continuing investigation operated as a service |
| 11–11.75 | The project: Offsite | Explain the project, chat-to-proposal flow and learner work |
| 11.75–13 | Watch the completed app | Show the completed target and start one prepared/rehearsed run |
| 13–14.5 | The building blocks of Managed Agents | Map configuration and recorded work to that same run |
| 14.5–15.5 | Offsite: what you’ll build in the lab | Explain why the app independently checks the proposal |
| 15.5–16.5 | Why use Managed Agents for Offsite? | Connect multi-step tool work, continuing sessions and managed execution to the project |
| 16.5–17.5 | What happens when we close the tab? | Predict before reconnecting |
| 17.5–19 | Live demo: reopen and revise the same plan | Inspect recovery and send a budget-only revision |
| 19–20 | Now it’s your turn: build Offsite | Begin the 60-minute hands-on lab with clone and setup |

There are **19 teaching slides, including four standalone audience checkpoints**. The three choice questions stay in customer support: summarize a ticket, investigate logs in a team-operated process, and continue an investigation using service-operated execution. Each answer names its driving requirement and acknowledges that another interface could work with different operating choices. The final prediction asks what should happen when the planner's browser tab closes.

| Surface | What it provides | What your team operates |
| --- | --- | --- |
| Messages API | Model responses and tool-use messages; an optional Client SDK tool runner | Your application process and the workflow around those calls |
| Claude Agent SDK | An agent loop, tools and session persistence/resume features | The agent process, deployment and storage |
| Claude Managed Agents | A hosted agent loop and retained session history | Product integration, access controls, accepted output and any application-executed business tools |

These are choices for a feature, not a mandatory migration. They can coexist within one product. The ordinary `@anthropic-ai/sdk` API client in this repository is not the Claude Agent SDK. The Client SDK's optional tool runner helps coordinate calls but does not host the process. Agent SDK also has continuity features; Managed Agents changes who operates execution rather than being the only possible way to preserve work. [Messages API](https://platform.claude.com/docs/en/api/messages/create), [tool runner](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner), [SDK hosting](https://code.claude.com/docs/en/agent-sdk/hosting), [SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions)

A **harness** coordinates the repeated model/tool/result cycle. A **sandbox** is an isolated environment for code and files. Both tool paths shown in the talk use Managed Agents: built-in tools such as read/write/bash execute in the hosted sandbox, while a custom business tool such as order lookup executes in application code and returns its result to the same managed loop. The custom executor must remain available; the example does not imply automatic hosting of arbitrary business services. The Offsite lab instead uses hosted `read`, `write` and `bash`, so its required tool work can continue without a browser executor. Current session creation starts sandbox provisioning; there is no claim that it waits for the first tool call or produces a guaranteed speed improvement. [Tools](https://platform.claude.com/docs/en/managed-agents/tools), [session creation](https://platform.claude.com/docs/en/managed-agents/sessions)

**Offsite is introduced on slide 12; the completed demo follows on slide 13.** First explain its purpose: organize an in-person team gathering, turn chat requirements into a proposal, and implement missing agent behavior in the supplied UI. Then use one run through the remaining slides: two days in Chicago for 12 people within $6,000, including vegetarian meals, a $70-per-person-per-day catering cap and a rain backup. The demo shows the result; resources map configuration and events to that run; the app boundary explains acceptance; lifecycle explains the same session ID; prediction and reconnection supply one continuity proof. Identify a prepared result as prepared. Do not repeat a full app tour or claim progress during a disconnection that did not actually occur.

The separate `/preview` route returns a fixed UI sample. It is not Lab starter at `/lab`. Venues and prices are fictional in both app versions; no live availability checks or bookings are implemented. The actual exercise modifies configuration, application policy and session selection in the supplied managed app.

## The lab — 60 minutes

The learner edits four complete functions in `lib/workshop-exercises.ts`. The UI, API routes, session cookies, managed transport, hosted validator and source-viewing deck are supplied. One `npm run dev` serves both **Completed demo** and **Lab starter** under **Live app**. Standalone `/agent` and `/lab` links and embedded views remain available. They share the UI and handler implementation but select solution and learner functions respectively. Separate session cookies isolate the two versions. There is no server-mode switching and no overwrite of learner files.

| Lab time | Task | Current state → required action | Evidence |
| --- | --- | --- | --- |
| 0–5 | Clone and run | Clone → npm install → npm run dev | Deck and both app versions load |
| 5–8 | Map the code | Find both implementations and run baseline checks | Routes and four functions identified; normal tests and typecheck pass |
| 8–11 | Credentials | No private key → prepare server-side `.env.local` | Key stays out of browser code |
| 11–16 | Hosted tools | Empty configuration → enable `read`, `write`, `bash` | `PASS tools` |
| 16–18.5 | Execution budget | Decimal dollars → integer-cent string `"200"` | `PASS budget` |
| 18.5–23.5 | Provision | Local files → reusable agent/environment/uploads | Setup saves IDs; no model run starts |
| 23.5–29.5 | Create/send | Configuration → one real offsite session | Session ID, accepted user turn, hosted activity |
| 29.5–34.5 | Observe/reconnect | Existing work → disconnect/read without resending | Same ID and history; accepted artifact |
| 34.5–39 | Specify policy | Give the agent the rule and enforce a separate catering cap | Failing policy check and correct unit calculation |
| 39–46 | Implement policy | Always accepts → reject above $70/person/day | Boundary checks pass; explicit compliant revision |
| 46–51 | Reproduce bug | Opt-in resolver always creates → inspect identity/history | Failing continuity check with controlled creation count |
| 51–57 | Repair/verify | New session on every turn → reuse when present | All four checkpoints and normal checks pass |
| 57–59 | Verify/extend | Working seams → explain evidence and next requirement | Live evidence distinguished from offline test evidence |
| 59–60 | What did we learn? | Recall ownership, setup versus a job, session events and app rules | Explain what the service runs and what the app enforces |

The deck has **37 slides: 19 teaching slides, 17 lab slides and a closing screen**. The lab contains 13 tasks, two 30-second questions before tools and continuity, a one-minute policy question, and a final one-minute recap. An untimed Questions slide follows with links to the repository, official documentation and stretch goal. The policy question asks why Claude needs the rule in its instructions while the app still enforces it; the unit calculation stays in the exercise. These questions are included in the corresponding task blocks above, so the lab remains 60 minutes. Each task presents one goal, two or three short actions and a one-line success check. File links appear above the code on the right. Detailed instructions remain in the speaking notes, expandable hints and code panels. The complete current functions and answer functions are loaded from the actual source files rather than duplicated snippets. Refresh the locally running lab after editing to reload its source view. A deployed lab shows the source snapshot included in that deployment; it does not read a learner’s local checkout. Use the expanded code view for full-file context; copy one function at a time to preserve other exercise work.

### Clone and run the lab

```bash
git clone https://github.com/dannysullivan-ai/claude-managed-agents.git
cd claude-managed-agents
npm install
npm run dev
```

Open `http://127.0.0.1:3000`; it redirects to `/workshop`. Use **Slides** for the guide and **Live app** for Completed demo and Lab starter. Leave the same server running. An existing checkout does not need to be cloned again.

Instructor prerequisite: prepare Git, Node.js 22 and Python 3. Python is used by one supplied test; no additional Python packages are required. A funded API key is needed later for real managed execution, not to load the app or run offline checks.

### 1–3. Inspect the app and prepare credentials

Select **Live app** and inspect Completed demo and Lab starter without submitting yet. Compare `app/api/managed/message/route.ts` with `app/api/lab/message/route.ts`; both use `lib/managed/routes.ts` with different implementations. The fixed `/preview` is separate from these two managed versions. Do not tell learners to build a missing route or paste an application over it.

Open `lib/workshop-exercises.ts` and identify the four functions. `lib/workshop-solutions.ts` contains the completed functions. `/lab` executes the exercise functions; `/agent` executes the completed solution functions. Editing the learner file does not change the solution functions. The deck exposes current function, Show solution, full-file context and runnable check tabs where relevant.

During code orientation, start with the four editable functions in `lib/workshop-exercises.ts`. The Lab and Completed route tabs provide optional context. Optionally set **Editor links** once: enter the absolute checkout folder shown by `pwd`, then click a code filename to open VS Code at that line. This browser-local preference does not grant filesystem access. Leave `npm run dev` running in **Terminal A**. Open **Terminal B** in the cloned repository—the folder containing `package.json`—and establish the baseline:

```bash
npm test
npm run typecheck
```

The normal suite covers the supplied implementation without requiring unfinished learner functions to pass. Use the separate checks below as you reach each exercise:

| Exercise | Function to edit | Command in Terminal B |
| --- | --- | --- |
| Hosted tools | `learnerTools` | `npm run lab:check -- tools` |
| Execution budget | `learnerBudget` | `npm run lab:check -- budget` |
| Catering policy | `learnerCateringPolicy` | `npm run lab:check -- policy` |
| Session continuity | `learnerSessionForTurn` | `npm run lab:check -- continuity` |

Run the matching command **before editing** to see the expected `FAIL`. Edit and save that function in `lib/workshop-exercises.ts`, then rerun the same command until it reports `PASS`. Run `npm run lab:check -- all` after completing all four exercises. The `--` passes the check name to the npm script.

These are local checks: no API requests, model calls or credentials are needed. The hosted Vercel page cannot execute terminal commands or read local edits. Work in the cloned repository and test the edited app on localhost. Keep Terminal A running while you use Terminal B.

Create a configuration file without overwriting an existing one:

```bash
if [ ! -f .env.local ]; then
  cp .env.example .env.local
fi
```

Open `.env.local` privately in an editor and set `ANTHROPIC_API_KEY`. Preserve existing settings. Leave the `OFFSITE_*` resource IDs and `SESSION_SECRET` to the setup script. Do not put the key in source, screenshots or a `NEXT_PUBLIC_` variable.

**Checkpoint:** the learner explains why the browser calls the application server and never needs the Anthropic key. If account setup is blocked, continue the offline exercises and pair for the live demonstration.

### 4. Configure the hosted tools

Run `npm run lab:check -- tools` before editing. Replace only `learnerTools()` in `lib/workshop-exercises.ts`:

- Keep the toolset type `agent_toolset_20260401` and `default_config.enabled: false`.
- Enable exactly `read`, `write` and `bash` with `always_allow` for this restricted lab environment.
- Keep web access and other tools out of this exercise.

The full replacement function is in the deck's reference-answer tab and in `lib/workshop-solutions.ts`. Rerun the check; expect `PASS tools`. Explain why the hosted runtime executes the Python validator through `bash`, while the browser only observes progress. Do not present the tool list as a fine-grained file security boundary: shell commands themselves can read and write files.

The learner runtime checks the configuration before attempting an SDK session call. An incomplete tool function causes a local error, not a paid run with missing tools. [Managed Agents tools](https://platform.claude.com/docs/en/managed-agents/tools)

### 5. Correct the execution budget

Run `npm run lab:check -- budget`. The starter returns `amount: "2.00"`; the required $2 API list-cost cap is `amount: "200"` with `currency: "USD"`. Replace only `learnerBudget()` and expect `PASS budget`.

The API uses a whole number of US cents encoded as a string. Its cap is independent of the $6,000 offsite allowance. It prevents new model requests after the threshold; an in-flight request can finish above it. The checker rejects the starter value locally, so reproducing an invalid live request is unnecessary. [Session budgets](https://platform.claude.com/docs/en/managed-agents/budgets)

**Checkpoint:** ask the learner to distinguish `$2` execution cost, `"200"` API units and `$6,000` business budget.

### 6. Provision reusable resources

After tools and budget checks pass, run:

```bash
npm run setup:agent
```

This is the repository's npm script, not an Anthropic CLI command. Open **Setup code** to follow the highlighted environment, file, agent and configuration calls in `main()`. **Full setup script** includes the Files API upload helper. The script verifies model availability, creates or reuses the dedicated offsite agent and cloud environment, uploads the fixture and validator, and saves the IDs and pinned agent version privately. It does not create a session or start a model run.

Compare the terminal summary with **Example output**. That tab is an illustrative first-run excerpt, with model/version placeholders; a rerun can report reused resources. Keep `.env.local` closed while presenting. The instructor provisions the completed demo beforehand; learners run setup here for their own lab.

The setup agent uses the provided reference definition. For `/lab`, `createTransport` applies the learner's tools and budget as **per-session overrides**. Changing those functions does not require re-provisioning the same fixture files. Changes to uploaded fixtures or agent configuration do require another setup run and a new session.

**Checkpoint:** ask whether an agent and environment existing means the planning task has started. It has not; the session needs a user message. [Quickstart](https://platform.claude.com/docs/en/managed-agents/quickstart)

### 7–8. Start, observe and recover the real session

Keep the existing development server running. Select **Live app → Lab starter**, choose Chicago and submit. If setup has saved the resource IDs but the app still reports them missing, restart the same `npm run dev` command once to refresh configuration; no version switch is needed:


> Plan a two-day Chicago offsite for 12 people focused on strategy and team connection. Budget: $6,000. Use Chicago Table A (fictional) for vegetarian meals, and include a rain backup.

This submission starts paid execution. The first message creates a session if no owned session is attached. Subsequent messages use the same session. The reference answers to tools and budget are not loaded automatically: the runtime calls the functions the learner edited.

After submission is acknowledged, record the visible session ID and close or refresh the planner. Reopen the same site in the same browser and click **Reconnect**. Keep its cookies. Expect the same ID, recorded messages, hosted activity and eventually a validated proposal. The exact words and timing are not graded.

The same session and its earlier events show that the original brief remains available. They do not prove the revised plan satisfies every requirement. Inspect the output separately and distinguish the application's implemented checks from constraints it does not yet enforce.

The app polls `GET /api/lab/session` every three seconds while running. That route retrieves the existing session, saved event history and output files. An authenticated HttpOnly cookie identifies the browser's session. Reading does not submit another user turn or execute custom tools. This implementation uses history polling, not SSE or token streaming. Source tabs show the complete GET handler in `lib/managed/routes.ts`, the thin Lab route, `readConversation()` and the full shared handler file. [Session events and history](https://platform.claude.com/docs/en/managed-agents/events-and-streaming)

**Checkpoint:** a lost acknowledgement should lead to a history read before another send. The app does not automatically retry an uncertain send. A newer artifact may appear shortly after execution finishes; the previous accepted proposal must not count as completion of a new turn.

### 9–10. Independent exercise: add the catering acceptance policy

The preceding question uses a concrete failure: the app rejects a meal package, but Claude has not received the catering rule. The best fix is to give Claude the rule and keep the application check. Instructions guide planning; code determines acceptance. The exercise then makes the numerical rule precise.

The new rule is **at most $70 per person per day** for catering. It applies even when the group total is below $6,000. This is an **Offsite business rule implemented in application code**, not a built-in Managed Agents catering policy. Managed Agents tool permission policies instead control whether enabled server-executed tools run, wait for approval or undergo a permission check. [Permission policies](https://platform.claude.com/docs/en/managed-agents/permission-policies)

The three layers are deliberately separate:

| Layer | Actual source | What it does |
| --- | --- | --- |
| Instructions | `lib/managed/agent.ts` → `OFFSITE_SYSTEM`; `lib/managed/transport.ts` → `createTransport` | Shared instructions describe planning and hosted checking. New completed sessions append the $70 cap as a system override; learner sessions intentionally omit it. The demo brief also states the cap. |
| Hosted deterministic check | `lib/managed/fixtures/validate.py` → `validate` | Check structure, schedule, fixture prices and total against the generated `plan.budget`. It does not enforce the catering cap. |
| Application acceptance | `lib/managed/conversation.ts` → `readConversation` → `cateringErrors` → `learnerCateringPolicy` | Independently base-validate the output, calculate the meal rate, and withhold a noncompliant proposal from display. |

`lib/workshop-solutions.ts` exports the $70 limit and implements the completed check. `createTransport` uses that limit to instruct new completed sessions before they plan. `/lab` intentionally omits that added instruction and calls the unfinished function in `lib/workshop-exercises.ts` until the learner changes it. The initial Lab brief intentionally requests the $85 Table A package. The agent has not been given the new catering cap through that brief, so its passing hosted check is not proof that the application will accept the result. The reference tabs show the shared instructions, solution-only session override and hosted checker before learners implement the extra rule. Sessions created before the instruction change retain their earlier context; state the rule in an explicit follow-up to revise them.

The fixture uses `kind: "meals"`, `unit: "per_person_per_day"` and `costUsd`. The proposal's matching `budgetItems.amount` is the whole-group total. `Chicago Table A (fictional)` costs $85/person/day; `Chicago Table B (fictional)` costs $55/person/day. For 12 people and two days, Table A produces $2,040 of catering:

```text
rate = meal amount / (attendees × number of days)
     = 2040 / (12 × 2)
     = 85 dollars per person per day
```

Run `npm run lab:check -- policy` before editing. The starter's empty error list accepts everything, so the over-cap case fails. Replace only `learnerCateringPolicy(proposal)`:

1. Find known meal package names in `venues.cities[proposal.city]`.
2. Match the selected package to a proposal budget item's label.
3. Normalize its whole-group amount by attendees and day count.
4. Return `[]` at or below the cap, or an actionable error above it. Include the $70 limit and its units.

Work from the requirement and tests before opening the complete answer. First write the denominator and decide what should happen at exactly $70 and at $71. Then implement the function independently. The answer tab is a rescue path, not the first action; anyone using it must still explain the units and verify their own function. Tests cover $70 acceptance, $71 rejection across different group sizes/day counts, and premium/basic packages in all cities. These synthetic boundary inputs isolate the new policy; ordinary fixture pricing is checked separately.

Fast finishers can open the stretch on this policy task as soon as their required checks pass: store the approved budget outside model output, then reject a $6,500 plan under an approved $6,000 cap even if `proposal.budget` says $7,000. The final task repeats the extension and its completion criteria.

Run:

```bash
npm run lab:check -- policy
```

Expect `PASS policy`. In `readConversation`, `validateProposal` performs base validation, then `cateringErrors` calls the selected application policy. On rejection, `conversation.proposal = null` prevents the proposal from being displayed, and a completed conversation returns to idle with an actionable error. This read-only path sends no event to Claude. **This exercise changes application acceptance only.** Do not edit the hosted Python validator, rerun setup, or create a fresh session for the local policy change.

Reconnect to the existing proposal. If it uses the requested premium package, the app now rejects it while leaving the hosted artifact and session intact. **Revise to meet the $70 limit** fills a draft stating the rule and preserving other requirements; it does not send the message. Review the draft and press **Send**, or send this explicit request:

> Use Chicago Table B (fictional) instead. Our catering cap is $70 per person per day. Keep the same people, days, goals and dietary needs, and recalculate the complete budget.

The model can revise in the same session and the new result can pass. The completed agent receives the rule up front in newly created sessions, but code still enforces it independently. Neither a read-only rejection nor filling a revision draft automatically sends feedback; the user must send the follow-up. If the original proposal already chose a compliant package, show the deterministic rejected fixture as the policy evidence rather than manufacturing a live failure.

**Checkpoint:** distinguish the hosted validator's autonomous feedback loop from the new application policy and explicit user revision.

### 11–12. Diagnose and repair continuity

Run:

```bash
npm run lab:check -- continuity
```

This offline test calls the actual resolver wrapper and executes the learner's edited `learnerSessionForTurn` with a controlled session and creation callback. The starter ignores `existing` and always creates a session. Expect `FAIL continuity`. Inspect the changed identity and creation count, state a hypothesis, and inspect the full resolver and wrapper before changing code. A normal browser follow-up uses the supplied resolver and does not prove this edited function ran; only the explicit continuity fault mode selects it in `/lab`.

The Completed demo is unaffected by this defect; the optional fault applies only to the Lab starter. An **optional** live reproduction requires a completed initial conversation still attached to the browser. Stop Terminal A, then run:

```bash
WORKSHOP_FAULT=continuity npm run dev
```

Send a budget-only follow-up and compare session IDs and history. This explicitly enabled bug can start another paid session. A plausible response is not proof of retained context: the model may infer sensible defaults. Keep the flag enabled through any live verification after the repair. The core task is fully reproducible offline; never present its synthetic IDs as a live trace.

Repair only `learnerSessionForTurn`: return the existing token when present, otherwise call `create()`. A correct implementation avoids the creation side effect for a follow-up and still creates distinct sessions for new offsites.

Verify:

```bash
npm run lab:check -- continuity
npm run lab:check -- all
npm test
npm run typecheck
```

Expect four learner checkpoints to pass, plus the normal suite. The continuity check executes the edited resolver and verifies both retained sessions and separate new offsites. For optional live verification, **leave `WORKSHOP_FAULT=continuity` enabled**, wait for an idle Lab session, send a follow-up and confirm its ID remains unchanged. If you remove the flag first, browser success tests the supplied resolver rather than your repair.

Only after that optional live verification, stop Terminal A and return to:

```bash
npm run dev
```

The Lab starter still uses your edited policy. Removing the fault switch restores the supplied session resolver; it does not undo the learner file. Do not overwrite learner files or change versions to verify the fix.

**Checkpoint:** test both continuity and isolation. Reusing one global session would preserve some history while associating it with the wrong offsite.

### 13. Review evidence and attempt the stretch goal

Show the real session ID and accepted artifact, the policy boundary checks, and the fixed continuity test. Identify any live step blocked by account access. A fixed sample is not a live result, and a passing offline test is not an API round trip.

**Stretch for fast finishers: enforce the approved budget outside model output.** Store the user-approved cap in application-owned session state, and validate the proposal total against that stored cap. Add a deterministic test: an approved budget of $6,000 rejects a $6,500 plan even when the generated `proposal.budget` claims $7,000. Define an explicit user action for changing the approved cap; do not let model output change it implicitly.

This is a meaningful extension because the current base validator checks the budget stated inside the generated proposal. The stretch closes that product-policy gap. It is optional and not claimed as implemented. Keep it separate from sourced venue research, bookings, multiagent orchestration and other unrelated expansions.

## Product and execution boundaries

The core uses hosted built-in tools. Its loop can continue with the browser closed; application-executed custom tools would need an available application worker and are outside this exercise.

The local `lib/managed/fixtures/venues.json` and `validate.py` files are mounted at `/mnt/session/uploads/venues.json` and `/mnt/session/uploads/validate.py`. The agent checks `/tmp/proposal.json`, then writes both `proposal.json` and the unique `WORKSHOP_OUTPUT` revision file under `/mnt/session/outputs/`. The application uses the revision marker to avoid presenting an older accepted artifact as a new result.

Instructions describe the desired plan and ask Claude to run the hosted Python validator. That deterministic checker covers structure, schedule, fixture prices and totals, but not the $70 meal cap. The application independently checks the downloaded output, then applies the selected catering rule; a rejected proposal stays stored remotely but is withheld from the app display. The existing total-budget check uses the proposal's stated budget. Binding an independently approved budget and all other brief constraints to application-owned session state remains an extension; the lab does not claim to have solved it.

New offsite clears this browser's session mapping. It does not cancel or delete hosted work. The app has no cross-device account store. Explain these actual behaviors rather than implying that managed session storage removes application identity or persistence requirements.

## Instructor preparation and rescue

Before delivery, confirm the repository clones, Node/Python are available, API access is funded and the current resource versions have been rehearsed. The source screenshots omit live coding and embedded product demos, so they cannot establish runnable code contracts; the source tabs use the repository's actual implementation.

The supplied rescue is **`lib/workshop-solutions.ts`**, with complete functions also available in the deck. Let a blocked pair explain the failing case, then copy only the needed function. Do not overwrite unrelated learner edits. Pairing with a working account supports the live steps while offline exercises remain available to everyone.

An instructor can check the answer implementation without changing the learner file:

```bash
npm run lab:check -- all --solution
```

This is an instructor rehearsal command, not proof of learner completion. The learner's evidence must come from `npm run lab:check -- all` without `--solution`.

The completed and learner versions, four editable seams, opt-in continuity defect, offline checks and reference answers are implemented. Recorded fallback traces and a fully packaged classroom distribution still depend on instructor preparation. Do not claim that an unprepared recording exists. A prepared completed live session can support the demonstration if clearly identified; avoid fabricated progress or exact latency promises.

## Requirements to evidence

| Requirement | Implementation | Evidence |
| --- | --- | --- |
| Technical talk: what, when and how | Outcomes → support example → ownership comparison → choices → Offsite demo | Literal definitions, separate audience questions and one continuity proof |
| Honest choice of API/SDK/Managed | Three audience scenarios with answer reveals | Each recommendation names its driving constraint and tradeoff |
| 20 minutes + 60 minutes | Seventeen teaching slides; thirteen lab tasks, three brief questions and one recap | Slide durations sum to 20 and 60 |
| Integrated teaching and app | Deck, source tabs, file links and persistent embedded planner | Learner can read instructions and inspect the same live session |
| Detailed runnable lab | Concise task actions with notes, hints and code panels | Real commands and complete source functions/files |
| Independent coding exercise | Catering cap implemented from requirement and tests before the answer | Correct denominator; $70 accepted and $71 rejected |
| Fast-finisher stretch | Application-owned approved budget | $6,500 rejected under an approved $6,000 cap even if output raises its own budget |
| Short instructor hand-off | Separate docs/INSTRUCTOR.md | Run order, the two app versions, checkpoints and rescue guidance |
| Usable delivery script | Structured speaking and demonstration cues on all 37 slides | Spoken explanations, question pauses, work intervals and rescue cues |
| Concrete feature and planted bug | Application catering policy; opt-in session resolver defect | Policy boundary tests and continuity/isolation checks |
| Real managed execution | Hosted tools, recorded events and generated artifact | Session ID, accepted output and read-only recovery |
| Honest completion | Reference, learner code and test/live evidence distinguished | Normal tests alone cannot stand in for learner checkpoint completion |

## Source adaptation and terminology

The user-provided screenshot collection informed the teaching structure. Its local index is `Documents/Codex/2026-10-15/ca/outputs/slide-screenshots/index.txt`; embedded demos and live coding were excluded. This internal map records the adaptation. **Visible slide references link only to current official Anthropic documentation**, not the source recording.

| Supplied source slides | Coverage in this lab |
| --- | --- |
| 04, 05, 07, 08 | Definition and loop lead into a three-way ownership comparison and separate support scenarios |
| 06 | Infrastructure compressed into the tool-boundary explanation, then made concrete during setup and recovery |
| 11 | Separate the model decision from tool execution; order lookup is conceptual, hosted Python execution is the lab |
| 12 | Agent, environment and session explained through Offsite; current docs also identify events |
| 13, 19 | Session history, browser reconnection and later turns; no promise of exactly-once side effects or automatic retry of every operation |
| 14 | Just-in-time credential task separates API key, tool permissions and optional external-service vaults |
| 15 | Reasoning and environment startup are separate concerns; no benchmark repeated, and current provisioning semantics are explicit |
| 16 | Resource mapping and provisioning explain instructions, domain files and checks; optional skills are not represented as implemented |
| 18, 24 | Setup, provisioning, first session and observation moved into the actual runnable TypeScript lab |
| 33 | Product validation and accepted state remain application responsibilities |

Use **agent**, **environment**, **session** and **events** consistently. Explain **harness** through the loop rather than using it as an unexplained definition. Source references in the app describe platform behavior; the fixtures, acceptance rule and session cookie are this repository's implementation choices.

The app uses read-only event-history polling, not the original demo's streaming path. Its authenticated HttpOnly cookie maps this browser to a session; clearing the cookie does not cancel or delete hosted work. Reusing a session differs from recreating one on every follow-up. A fresh session could be seeded intentionally, but the planted bug does not replay the previous conversation.

Current official references include [overview](https://platform.claude.com/docs/en/managed-agents/overview), [quickstart](https://platform.claude.com/docs/en/managed-agents/quickstart), [events/history](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [tools](https://platform.claude.com/docs/en/managed-agents/tools), [budgets](https://platform.claude.com/docs/en/managed-agents/budgets), [vaults](https://platform.claude.com/docs/en/managed-agents/vaults), [agent setup](https://platform.claude.com/docs/en/managed-agents/agent-setup) and [Agent SDK hosting](https://code.claude.com/docs/en/agent-sdk/hosting). Use the source links on each slide for the relevant claim.
