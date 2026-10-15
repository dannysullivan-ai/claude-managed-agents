# Lab rehearsal — October 15, 2026

**Result: every required lab task passed.** The instructor demo and learner build both completed real Managed Agents runs. No blocking runtime issue was reproduced. Minor wording issues found during the rehearsal were corrected.

## What was actually tested

Cloned the public GitHub repository into an isolated temporary checkout, installed dependencies, and ran the app under Node.js 22.23.3. Python 3.14.4 was available. Learner edits were made only in that checkout; the published starter remains unfinished.

The live rehearsal used an existing funded account. Only the API key was supplied to the new checkout; resource IDs were discovered by setup. Setup reused the existing environment and fixtures, published updated agent configuration, then reused everything on its second run. A completely new account's onboarding and initial environment/file creation were not exercised.

Two real sessions were created, each with the supplied $2 execution cap: one for Completed demo and one for Lab starter. They used five user turns in total: an initial brief and budget follow-up for the demo; an initial brief, catering revision and session-repair follow-up for the learner. No simulated responses were substituted for these live results.

## Instructor rehearsal

- Opened the public Vercel deck and instructor handoff.
- Navigated all **35 slides**, opened every slide's notes, checked **47 code tabs**, and copied their contents. Command copies matched their displayed commands.
- Selected all **21 answer choices** and verified the corresponding explanation appeared.
- Ran the completed demo, closed the browser after submission was acknowledged, and reopened the same session with its saved conversation and proposal.
- Sent the displayed $4,000 follow-up. The session ID stayed the same; the revised proposal retained 12 people and two days and changed its budget field to $4,000.
- Confirmed Back to slides preserves the current slide, selected app, mounted iframe and unsent draft. Completed demo and Lab starter retained separate session cookies.

## Learner rehearsal

| Task | Result and evidence |
| --- | --- |
| 1. Clone and run | Public clone succeeded; `npm install` completed with no reported vulnerabilities. Deck and both interfaces loaded. |
| 2. Find the code | Four exercise functions and separate solution identified. All 40 baseline tests and typecheck passed before completing the exercises. |
| 3. Credentials | Empty key produced a clear setup instruction. Configured the key privately in the isolated checkout; it was never shown in the browser or logs. |
| 4. Tools | `FAIL tools` before editing; enabled read, write and bash; saved and obtained `PASS tools`. |
| 5. Execution budget | `FAIL budget` with `"2.00"`; changed to `"200"`; obtained `PASS budget`. |
| 6. Provision | Setup saved reusable configuration without starting a planning session. A second run reused resources and the agent version. |
| 7. First session | Submitted the supplied Chicago/Table A brief once. The real session completed with an accepted proposal. |
| 8. Reconnect | Closed the browser after acknowledgement. Reopening recovered the same ID, messages, tool activity and proposal, with zero POST requests. |
| 9. Policy requirement | Existing Table A meals cost $2,040 for 12 people over two days: $85/person/day. The unfinished policy check failed as expected. |
| 10. Policy implementation | Implemented the learner function from the requirement. Boundary checks passed. Reopening withheld the existing proposal. The revision button filled a draft without sending; pressing Send revised the same session to Table B at $55/person/day. |
| 11. Reproduce session bug | Offline check failed because the learner resolver created a new session for an existing conversation. |
| 12. Repair session reuse | Reused the existing token before calling create. Continuity and isolation checks passed. With `WORKSHOP_FAULT=continuity` enabled, a real follow-up retained the same ID and prior messages. |
| 13. Verify and recap | All four learner checks, all 40 normal tests, typecheck and production build passed under Node.js 22. The final live plan retained 12 people, two days and compliant meals; the last follow-up also produced no stops before 10 a.m. |

The initial instructor and learner turns reached idle in approximately 14 and 13 seconds respectively, based on saved event timestamps. These are observations from this run, not expected classroom timings or a service guarantee.

The learner's catering revision reduced the proposal total from **$3,828 to $3,036**. Both downloaded proposals also passed the supplied Python validator independently.

New offsite was checked separately: it sent only DELETE, cleared the learner cookie, preserved the completed-demo cookie, and started no new model work.

## Friction found and corrected

1. **Old environment-template wording:** it described `/` as a scripted starter and mentioned an earlier project. Updated it to identify Completed demo and Lab starter correctly.
2. **Old setup success message:** it directed learners using the earlier app layout. It now names the current Live app version tabs.
3. **Shifted slide numbers:** the runbook's project/demo references had not accounted for the new welcome slide. Corrected to slides 11 and 12.
4. **Budget demo expectation:** the initial completed plan already cost $3,036, so lowering its allowance to $4,000 did not require cheaper selections. Added a speaking cue to inspect the changed budget and new turn without claiming a cost reduction.

## Delivery assessment

| Dimension | Assessment | Evidence |
| --- | --- | --- |
| Getting started | 8/10 | Fresh clone/install and working local app; prerequisite tools and funded account were already available. |
| Commands and code | 9/10 | All four fail/edit/save/pass cycles, complete function sources, copied commands and live overrides tested. |
| Errors and recovery | 9/10 | Missing credential, intentional exercise failures, real policy rejection, read-only reconnect and explicit revision tested. Normal suite also covers uncertain sends and malformed output. |
| Documentation | 8/10 | All notes, code tabs and audience choices reviewed; minor stale wording corrected. |
| Developer environment | 9/10 | Node.js 22 install, runtime, tests, typecheck and build verified. |
| Upgrade path, community, measurement | Not scored | Ongoing product operations are outside this teaching-lab rehearsal. |

## What remains a delivery judgment

- This was an accelerated mechanical rehearsal, not a timed classroom with human learners. The 20-minute/60-minute pacing still needs a human dry run; do not infer a classroom duration from automation speed.
- The optional approved-budget stretch was reviewed for its requirement and acceptance criteria. It was not implemented as a new product feature. It still requires application-owned state, explicit budget changes and tests that reject model-inflated budgets.
- Codespaces, Windows setup and the operating system's VS Code launch confirmation were not exercised. Editor URL generation is covered by the passing tests.
- Live results used the local app and real Anthropic service. The public Vercel deck and guide were inspected, but this rehearsal did not start paid sessions through the public deployment.

Rehearse with the actual instructor's account and display before delivery. Keep the learner file unfinished in the distributed repository, use the supplied solutions for rescue, and identify any prepared result as prepared.
