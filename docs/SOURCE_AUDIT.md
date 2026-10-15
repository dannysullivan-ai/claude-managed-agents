# Teaching source audit

Reviewed 2026-10-15: all 19 teaching slides (20 minutes) in `lib/workshop-content.ts`, current visuals in `components/workshop-visuals.tsx`, and the support/Offsite examples. No live agent calls were made. The sequence is coherent: welcome → outcomes → a familiar agent loop → operational choices → the Offsite project and one run → the 60-minute lab. Audience-facing language uses “lab”; existing internal filenames and paths are unchanged. Public references use official Anthropic documentation; screenshot numbers are retained only as an internal coverage map.

## Claim-to-source map

| Slides / visuals | Supported claim and example | Official documentation |
| --- | --- | --- |
| `learning-goals`, `what-is-managed`, `offsite-scenario` | A configurable hosted harness works through a task. The support example is illustrative; business tools still need integration. Offsite later supplies the real application example using fictional venue allowances. | [Overview](https://platform.claude.com/docs/en/managed-agents/overview), [tools](https://platform.claude.com/docs/en/managed-agents/tools) |
| `three-surfaces`: model and loop | Messages provides model access; Agent SDK supplies a harness; Managed Agents operates one as a service. The ordinary Client SDK can assist tool orchestration and is distinct from Agent SDK. | [Messages](https://platform.claude.com/docs/en/api/messages/create), [tool runner](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner), [SDK overview](https://code.claude.com/docs/en/agent-sdk/overview) |
| `three-surfaces`: process and session | Agent SDK runs a Claude subprocess with persistence/resume primitives; its host operates deployment and storage. Managed sessions retain history behind the API. Offsite still maps access to the correct session. | [SDK hosting](https://code.claude.com/docs/en/agent-sdk/hosting), [SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions), [Managed sessions](https://platform.claude.com/docs/en/managed-agents/sessions) |
| `agent-loop` | A carrier result informs the next model decision: a delivered-but-missing package may require delivery evidence. The notes correctly say a simple lookup, or branching alone, need not require an agent. | [Agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop), [Managed tools](https://platform.claude.com/docs/en/managed-agents/tools) |
| Infrastructure notes in `loop-and-sandbox` | Hosting work, retaining history and exposing progress are distinct from rendering the interface. The later Offsite example reads events while hosted tools execute. | [Overview](https://platform.claude.com/docs/en/managed-agents/overview), [events and history](https://platform.claude.com/docs/en/managed-agents/events-and-streaming), [environments](https://platform.claude.com/docs/en/managed-agents/environments) |
| `loop-and-sandbox` | Orchestration and tool execution are separate. Self-hosted sandboxes move tool execution to customer infrastructure while orchestration stays with Anthropic. Offsite uses the cloud arrangement. | [Self-hosted sandboxes](https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes), [tools](https://platform.claude.com/docs/en/managed-agents/tools) |
| `managed-infrastructure` | Managed cloud execution, long-running persisted sessions, optional parallel delegation, configurable permissions and service credentials, and event history reduce runtime infrastructure work. App user authentication, session authorization and business rules remain application responsibilities. No fixed speedup or blanket production-readiness guarantee. Multiagent orchestration follows current beta documentation, without the older research-preview access claim. | [Overview](https://platform.claude.com/docs/en/managed-agents/overview), [multiagent orchestration](https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration), [secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [events](https://platform.claude.com/docs/en/managed-agents/events-and-streaming) |
| Startup notes | Current documentation starts sandbox provisioning at session creation. The conceptual separation does not imply a fixed latency improvement or lazy provisioning on the first tool. | [Starting the session](https://platform.claude.com/docs/en/managed-agents/sessions#starting-the-session) |
| `managed-resources` | Agent is reusable behavior/tool configuration; environment configures execution; session holds the continuing task; events record messages, tool results and status. | [Overview](https://platform.claude.com/docs/en/managed-agents/overview), [agent setup](https://platform.claude.com/docs/en/managed-agents/agent-setup), [environments](https://platform.claude.com/docs/en/managed-agents/environments) |
| Credential and budget lab notes | The server's Claude API key authenticates application requests. Vaults supply supported external-service credentials, a different function. The session cost limit and offsite spending rule govern different things. | [Secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [vaults](https://platform.claude.com/docs/en/managed-agents/vaults), [budgets](https://platform.claude.com/docs/en/managed-agents/budgets) |
| Customization notes in `managed-resources` and the lab | Developers supply instructions, tools and domain material. Skills can package reusable expertise; caching and compaction are built-in harness facilities. Offsite currently uses instructions and files. | [Agent setup](https://platform.claude.com/docs/en/managed-agents/agent-setup), [skills](https://platform.claude.com/docs/en/managed-agents/skills), [overview](https://platform.claude.com/docs/en/managed-agents/overview) |
| `what-to-reach-for`, `choose-messages`, `choose-sdk`, `choose-managed` | Choosing an integration by required tool work and operational ownership is reasoned workshop guidance, not an exclusive Anthropic use-case rule. The answers allow justified alternatives. | [Messages](https://platform.claude.com/docs/en/api/messages/create), [SDK hosting](https://code.claude.com/docs/en/agent-sdk/hosting), [overview](https://platform.claude.com/docs/en/managed-agents/overview) |
| Composition note in `three-surfaces` | Separate product features can choose different interfaces. No mandatory migration path or prescribed combined architecture is claimed. | This is an architectural inference from the documented interfaces above. |
| `agent-and-app`, `lab-transition` | Managed execution leaves application access and accepted-state decisions with Offsite. Its independent validation is local implementation, not automatic platform enforcement. | [Secure deployment](https://platform.claude.com/docs/en/managed-agents/secure-deployment), [tools](https://platform.claude.com/docs/en/managed-agents/tools) |
| `session-lifecycle`, `close-tab-checkpoint`, `demonstrate-and-build` | Offsite’s fit is an application design judgment based on multi-step tool work, stateful sessions and service-operated execution. Reconnection reads the same session's persisted history; later user turns can continue it. The app's authenticated cookie and polling are its own integration choices. | [Sessions](https://platform.claude.com/docs/en/managed-agents/sessions), [reconnection and history](https://platform.claude.com/docs/en/managed-agents/events-and-streaming#reconnect-without-missing-events) |
| Execution-budget lab | `"200"` is 200 US cents of session list cost. Enforcement occurs between model requests, allowing an in-flight request to cross the threshold. | [Session budgets](https://platform.claude.com/docs/en/managed-agents/budgets) |

## Precision boundaries retained

- **Environment terminology:** the current content describes sandbox settings, and the visual says “configures the workspace.” Reusable configuration remains distinct from the sandbox and session history.
- **Startup and recovery:** preserve the reference's separation model without claiming a first-tool provisioning trigger, speed percentages, automatic retry of every tool, or exactly-once external effects. The documented classroom proof is retained session history after disconnection. The current notes make these limits explicit.
- **Vaults:** do not equate a vault with the server's Claude API key. Outbound credential substitution is not a guarantee that a third party cannot return sensitive data. Offsite has no configured vault, external credential or booking tool.
- **Context:** Offsite does not configure internal compaction, attach an Agent Skill or implement cross-session learning. Skills remain an optional extension. The application still enforces its catering acceptance policy.
- **Tool boundary:** hosted `read`, `write` and `bash` are this workshop's choice. Application-executed custom tools and self-hosted sandboxes have different execution boundaries. The teaching notes preserve that scope.
- **Visible attribution:** recording links and screenshot references remain absent from teaching content. The support flow and integration recommendations are workshop examples, not exclusive platform claims.

## Local evidence

`lib/managed/agent.ts` enables `read`, `write` and `bash`; its prompt uses `venues.json` and `validate.py`. Setup restricts external networking. No skills or vault IDs are configured. The lab's fictional Chicago Table B rate is $55 per person per day, or $1,320 for 12 people over two days.

The browser cookie uses AES-GCM authenticated encryption and HttpOnly, matching the updated “authenticated HttpOnly cookie” wording. Offsite uses read-only history polling, not token streaming. Its new-offsite action clears the browser mapping rather than canceling remote work. The continuity defect starts a fresh session without earlier events, so the scoped visual wording is accurate even though the API supports initial events.

The hosted check helps the model revise. The new app-only catering check does not automatically feed a rejection to Claude; the user explicitly requests another revision. The content now explains this distinction. The application does not independently bind every free-text requirement, also acknowledged in the notes.

## Internal screenshot coverage

| Supplied screenshots | Concept carried into the workshop |
| --- | --- |
| 04, 05, 07, 08 | Model, supplied harness, managed execution and application ownership |
| 06 | Hosting, session history, workspace, isolation, credentials and visibility |
| 11 | Reasoning/orchestration separated from tool execution |
| 12 | Agent, environment and session; current documentation also names events |
| 13 | Runtime resilience, demonstrated through documented session reconnection |
| 14 | External-service credential boundary, distinguished from the app's API key |
| 15 | Startup separation without a benchmark or unsupported provisioning promise |
| 16 | Developer-supplied context and domain expertise, with implemented scope explicit |
| 19, 24 | Session, observed tool work, output and later continuation |
| 33 | Application-owned validation and accepted state beside managed execution |
