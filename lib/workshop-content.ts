import type { WorkshopSlide } from "./workshop-types";


export const workshopMeta = {
  title: "Build with Claude Managed Agents",
  subtitle: "Understand the loop. Choose the runtime. Build the app.",
  audience: "201 · Experienced developers",
  teachingMinutes: 20,
  labMinutes: 60,
  durationMinutes: 80,
};

export const slides: WorkshopSlide[] = [
  {
    "id": "workshop-intro",
    "phase": "teach",
    "section": "Welcome",
    "kind": "title",
    "title": "Build Faster with Claude Managed Agents",
    "visual": "welcome-overview",
    "minutes": 0.5,
    "bullets": [],
    "welcome": {
      "titleLines": ["Build Faster", "with Claude", "Managed Agents"],
      "subtitle": "Learn when to use Managed Agents, how they work, and how to build an app with them.",
      "organization": "Anthropic",
      "date": "October 15, 2026",
      "format": "20-minute technical session · 60-minute hands-on lab"
    },
    "notes": [
      "Say: Welcome. Today we will look at how Claude Managed Agents lets your team focus on the product while Anthropic operates the agent infrastructure. We will learn when to use it, see a working application, and then build and debug the pieces that make it work.",
      "Say: We have a 20-minute technical session followed by a 60-minute hands-on lab. The slides, live demo, exercises and answers are all in this app.",
      "Transition: Here is what you will be able to do by the end."
    ],
    "sources": [{ "label": "Managed Agents overview", "url": "https://platform.claude.com/docs/en/managed-agents/overview" }]
  },
  {
    "id": "learning-goals",
    "phase": "teach",
    "section": "Understand agents",
    "kind": "title",
    "title": "What you’ll learn and build",
    "minutes": 0.5,
    "bullets": [
      "Know when to choose Managed Agents.",
      "Understand how an agent works through a task.",
      "Build an app that can start, observe and continue that work."
    ],
    "visual": "intro",
    "notes": [
      "Say: In the next 20 minutes, we will build a clear picture of Managed Agents: what it runs, when to choose it, and how an application works with it. Then you will spend 60 minutes building, changing and debugging a small app.",
      "Say: We will start with a familiar customer-support problem. Once the model makes sense, we will apply it to an offsite planner. The lab gives you the interface and plumbing, so your time goes into useful decisions: which tools to enable, how to enforce a rule, and how to keep a conversation connected.",
      "Show: Point to the three outcomes. Keep the app closed for now.",
      "Transition: Start with what we mean by an agent, before adding any API names."
    ],
    "sources": [
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      }
    ]
  },
  {
    "id": "what-is-managed",
    "phase": "teach",
    "section": "Understand agents",
    "kind": "concept",
    "title": "What is a managed agent?",
    "minutes": 1.5,
    "bullets": [
      "Claude Managed Agents runs an agent loop on your behalf: Claude uses tools and works through a task.",
      "You define instructions, tools and an environment. Anthropic manages execution and session state."
    ],
    "visual": "support-definition",
    "notes": [
      "Say: Imagine a customer says, “Where is my order?” Claude cannot answer reliably from the question alone. It needs the order record, then the carrier status. It chooses an action, receives information from a tool, and decides what to do next.",
      "Say: That repeated work is an agent loop. Claude Managed Agents runs that loop on your behalf. You provide instructions, tools and an environment; Anthropic manages execution and session state. Your application still decides what the agent may access and what actions are allowed.",
      "Show: Follow the customer request into the tool actions in the diagram. This is an illustrative support system, not an integration in our repository.",
      "Transition: Follow one request through the loop to see where the next decision comes from."
    ],
    "sources": [
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      },
      {
        "label": "Managed Agents tools",
        "url": "https://platform.claude.com/docs/en/managed-agents/tools"
      }
    ]
  },
  {
    "id": "agent-loop",
    "phase": "teach",
    "section": "Understand agents",
    "kind": "concept",
    "title": "How does an agent loop work?",
    "minutes": 1,
    "bullets": [
      "Claude looks up the order, reads the carrier status and decides what to do next.",
      "If the carrier says delivered but the customer has no package, the task needs another step."
    ],
    "visual": "support-loop",
    "notes": [
      "Say: The order lookup returns a tracking number. Claude can now use that number to check the carrier. If the carrier says the package is in transit, it may have enough information to draft a useful reply.",
      "Say: Now suppose the carrier says delivered, but the customer still has no package. Claude needs another step: perhaps inspect delivery evidence or read the support policy. The tool result changes what it does next.",
      "Say: The software coordinating these model calls and tool results is called the harness. Claude requests an operation; code executes it and returns the result. A simple fixed lookup can still be ordinary application code. An agent becomes useful when choosing the next action helps with the task.",
      "Show: Trace the normal path, then the delivered-but-missing branch.",
      "Transition: We can build this loop in different ways. The next choice is who operates it."
    ],
    "sources": [
      {
        "label": "Managed Agents tools",
        "url": "https://platform.claude.com/docs/en/managed-agents/tools"
      },
      {
        "label": "Claude Agent SDK",
        "url": "https://code.claude.com/docs/en/agent-sdk/overview"
      }
    ]
  },
  {
    "id": "three-surfaces",
    "phase": "teach",
    "section": "Choose who operates it",
    "kind": "concept",
    "title": "From the Messages API to Managed Agents",
    "minutes": 1.5,
    "bullets": [
      "Messages API: your code sends requests to Claude and handles what happens next.",
      "Agent SDK: Anthropic supplies the agent loop; your team runs the process.",
      "Managed Agents: Anthropic runs the loop and maintains its session."
    ],
    "visual": "comparison",
    "notes": [
      "Say: With the Messages API, your application sends model requests and handles what follows. That can be one answer or a workflow with tools. The ordinary Client SDK also has a tool runner to help coordinate calls, but your application still operates the process.",
      "Say: The Claude Agent SDK supplies an agent loop and tools. It also has session persistence and resume features. Your team runs the process, deploys it and manages its storage.",
      "Say: Managed Agents moves the loop and session operation into the service. You send work, inspect progress and continue the session later. You still own your product rules and user access. These are choices for a feature; one product can use more than one. They are not required stages of a migration.",
      "Show: Read across the ownership rows, rather than treating the three columns as capability levels.",
      "Watch for: The @anthropic-ai/sdk client in this repository calls Managed Agents. It is not the Claude Agent SDK runtime.",
      "Transition: Keep one boundary clear: a managed loop does not mean every business tool automatically runs inside Anthropic."
    ],
    "sources": [
      {
        "label": "Messages API",
        "url": "https://platform.claude.com/docs/en/api/messages/create"
      },
      {
        "label": "Client SDK tool runner",
        "url": "https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-runner"
      },
      {
        "label": "Claude Agent SDK",
        "url": "https://code.claude.com/docs/en/agent-sdk/overview"
      },
      {
        "label": "Hosting the Agent SDK",
        "url": "https://code.claude.com/docs/en/agent-sdk/hosting"
      },
      {
        "label": "Agent SDK sessions",
        "url": "https://code.claude.com/docs/en/agent-sdk/sessions"
      },
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      }
    ]
  },
  {
    "id": "loop-and-sandbox",
    "phase": "teach",
    "section": "Choose who operates it",
    "kind": "concept",
    "title": "Built-in and custom tools in Managed Agents",
    "minutes": 1,
    "bullets": [
      "Built-in tools such as read, write and bash run in the hosted sandbox.",
      "Custom tools run in your application, which returns results to the managed loop."
    ],
    "visual": "execution",
    "notes": [
      "Say: Both branches on this slide are within Managed Agents. In both, Anthropic operates the agent loop. What changes is where the requested tool operation runs.",
      "Say: The first branch uses built-in tools such as read, write and bash. Offsite takes this path: its hosted sandbox reads venue files and runs the Python checker. The browser does not execute those commands.",
      "Say: The second branch is a custom tool, such as a private order lookup. The managed loop requests the tool; your application executes it and returns the result. That application worker must remain available for the work to continue.",
      "Show: Trace both branches back to the same managed loop. Identify Offsite with the built-in branch.",
      "Watch for: This is not a choice between Agent SDK and Managed Agents. MCP tools are another supported integration, outside today’s build. Sandbox provisioning starts at session creation, not the first tool call.",
      "Transition: Beyond the loop, what infrastructure does the service provide?"
    ],
    "sources": [
      {
        "label": "Managed sessions",
        "url": "https://platform.claude.com/docs/en/managed-agents/sessions"
      },
      {
        "label": "Managed Agents tools",
        "url": "https://platform.claude.com/docs/en/managed-agents/tools"
      },
      {
        "label": "Self-hosted tool sandboxes",
        "url": "https://platform.claude.com/docs/en/managed-agents/self-hosted-sandboxes"
      }
    ]
  },
  {
    "id": "managed-infrastructure",
    "phase": "teach",
    "section": "Choose who operates it",
    "kind": "concept",
    "title": "What Managed Agents handles for you",
    "minutes": 1,
    "bullets": [
      "Spend less time building the agent runtime and more time building your product.",
      "You configure the tools, permissions and limits. Anthropic operates the managed infrastructure."
    ],
    "visual": "infrastructure",
    "notes": [
      "Say: This is where the build-faster benefit comes from. You do not have to build and operate the loop, cloud sandbox and session storage yourself. That leaves more time for the feature your users need. It is not a promise that every application ships a fixed number of times faster.",
      "Say: A document review might take minutes or hours. The agent can keep working when the browser disconnects; the application can fetch its saved events and outputs later. It can still stop for approval, a budget limit or an error.",
      "Say: For complex work, multiagent orchestration can delegate independent tasks, such as reviewing separate documents in parallel. You choose what delegation is allowed. Our lab uses a single agent and does not enable this feature.",
      "Say: The platform provides tool permission policies, vaults for supported service credentials, and session events to inspect what happened. You configure these controls. Your application still authenticates its users, authorizes access to each session, integrates its business tools and validates results.",
      "Show: Point to the four capabilities. Separate what the platform provides from what the developer must configure. The lab demonstrates hosted execution, persisted sessions and event history; it does not configure vaults or multiagent orchestration.",
      "Transition: Those capabilities are useful when the task actually needs them. Here is when to reach for Managed Agents."
    ],
    "sources": [
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      },
      {
        "label": "Multiagent orchestration",
        "url": "https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration"
      },
      {
        "label": "Secure deployment",
        "url": "https://platform.claude.com/docs/en/managed-agents/secure-deployment"
      },
      {
        "label": "Session events",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      }
    ]
  },
  {
    "id": "what-to-reach-for",
    "phase": "teach",
    "section": "Choose who operates it",
    "kind": "concept",
    "title": "When do you reach for Managed Agents?",
    "minutes": 1,
    "bullets": [
      "The task needs several steps and tool calls.",
      "Work needs to continue while the user is away.",
      "You want to ship the feature without operating the agent runtime yourself."
    ],
    "visual": "tradeoffs",
    "notes": [
      "Say: Managed Agents is worth considering when a task needs several decisions and tool calls, when the work needs to continue across interactions, and when you want Anthropic to operate that agent process.",
      "Say: A chat box alone does not create that need. A one-response summary may only need a model request. And your team can build continuing work with the API or Agent SDK if it wants to operate the supporting infrastructure. The choice is about the work and the responsibility you want to take on.",
      "Show: Read the three criteria together. Avoid presenting any one as an exclusive Managed Agents capability.",
      "Transition: Apply that reasoning to three short support scenarios."
    ],
    "sources": [
      {
        "label": "Messages API",
        "url": "https://platform.claude.com/docs/en/api/messages/create"
      },
      {
        "label": "Hosting the Agent SDK",
        "url": "https://code.claude.com/docs/en/agent-sdk/hosting"
      },
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      }
    ]
  },
  {
    "id": "choose-messages",
    "phase": "teach",
    "section": "Choose who operates it",
    "kind": "decision",
    "title": "Which would you choose for a ticket summary?",
    "minutes": 1,
    "bullets": [],
    "activity": {
      "kind": "discuss",
      "question": "A support dashboard needs a one-paragraph summary of a ticket. It has all the text and needs one answer. Which would you choose?",
      "options": [
        "Messages API",
        "Claude Agent SDK",
        "Claude Managed Agents"
      ],
      "answer": "Start with the Messages API.",
      "explanation": "One request can return the summary. The requirement does not need an ongoing agent process. Reassess if repeated tools or more workflow control become necessary.",
      "optionFeedback": [
        {
          "option": "Messages API",
          "correct": true,
          "explanation": "One model request can summarize the supplied ticket. This requirement does not need a continuing agent process."
        },
        {
          "option": "Claude Agent SDK",
          "correct": false,
          "explanation": "The Agent SDK could summarize it, but running an agent process adds work this one-response feature does not require."
        },
        {
          "option": "Claude Managed Agents",
          "correct": false,
          "explanation": "Managed Agents could do this, but retained sessions and hosted agent execution are unnecessary for the stated one-response task."
        }
      ]
    },
    "notes": [
      "Ask: A support dashboard needs a one-paragraph summary of a ticket. It has all the text and needs one answer. Which would you choose?",
      "Pause: Give everyone 10–15 seconds to choose. Take one reason, then select an answer to display its feedback.",
      "Show: Choose an answer to display its feedback. Explain the deciding requirement or mistake, then use the reveal cue to connect the result to the lesson.",
      "Reveal: I would start with the Messages API. One request can produce the summary; we have not asked for an ongoing process or repeated tool decisions.",
      "Say: An agent framework could do this too, especially if the product already uses one. The point is that this feature does not require it. If the requirements grow, we can reassess.",
      "Transition: Now add tools and a team that wants to operate the process itself."
    ],
    "sources": [
      {
        "label": "Messages API",
        "url": "https://platform.claude.com/docs/en/api/messages/create"
      },
      {
        "label": "Hosting the Agent SDK",
        "url": "https://code.claude.com/docs/en/agent-sdk/hosting"
      },
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      }
    ]
  },
  {
    "id": "choose-sdk",
    "phase": "teach",
    "section": "Choose who operates it",
    "kind": "decision",
    "title": "Which would you choose for an investigator you host?",
    "minutes": 1,
    "bullets": [],
    "activity": {
      "kind": "discuss",
      "question": "A support team wants Claude to inspect application logs with tools. The team wants to run and manage that process on its own server. Which would you choose?",
      "options": [
        "Messages API",
        "Claude Agent SDK",
        "Claude Managed Agents"
      ],
      "answer": "The Claude Agent SDK fits this requirement.",
      "explanation": "It supplies the loop while the team operates the process. A custom API loop could also work if controlling the loop itself matters.",
      "optionFeedback": [
        {
          "option": "Messages API",
          "correct": false,
          "explanation": "A custom Messages API loop could work, but the Agent SDK supplies the loop and tools while the team still operates the process."
        },
        {
          "option": "Claude Agent SDK",
          "correct": true,
          "explanation": "The team wants a supplied agent loop running in infrastructure it manages. That is the constraint the Agent SDK fits."
        },
        {
          "option": "Claude Managed Agents",
          "correct": false,
          "explanation": "Managed Agents operates the loop on Anthropic’s side. A self-hosted tool sandbox is possible, but it does not give the team operation of the agent process itself."
        }
      ]
    },
    "notes": [
      "Ask: A support team wants Claude to inspect application logs with tools. The team wants to run and manage that process on its own server. Which would you choose?",
      "Pause: Allow 10–15 seconds. Listen for the hosting requirement, not just the word tools.",
      "Show: Choose an answer to display its feedback. Explain the deciding requirement or mistake, then use the reveal cue to connect the result to the lesson.",
      "Reveal: The Claude Agent SDK fits. It gives the team the loop while the team runs the process. That is the responsibility they explicitly want to keep.",
      "Say: A custom Messages API loop is also reasonable if they need tighter control over the loop itself. The SDK is a starting recommendation, not the only possible implementation.",
      "Transition: Change who should operate the process, and see whether your answer changes."
    ],
    "sources": [
      {
        "label": "Messages API",
        "url": "https://platform.claude.com/docs/en/api/messages/create"
      },
      {
        "label": "Hosting the Agent SDK",
        "url": "https://code.claude.com/docs/en/agent-sdk/hosting"
      },
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      }
    ]
  },
  {
    "id": "choose-managed",
    "phase": "teach",
    "section": "Choose who operates it",
    "kind": "decision",
    "title": "Which would you choose for a continuing investigation?",
    "minutes": 1,
    "bullets": [],
    "activity": {
      "kind": "discuss",
      "question": "A delivery investigation needs several tool steps and follow-up later. The team wants Anthropic to run the agent and keep the session. Which would you choose?",
      "options": [
        "Messages API",
        "Claude Agent SDK",
        "Claude Managed Agents"
      ],
      "answer": "Claude Managed Agents fits this requirement.",
      "explanation": "The deciding requirement is service-operated execution with continuing session history. Your application still supplies access to its business tools and decides what the agent may do.",
      "optionFeedback": [
        {
          "option": "Messages API",
          "correct": false,
          "explanation": "The Messages API could support this with your own ongoing workflow and state management, but the team wants the service to operate the agent."
        },
        {
          "option": "Claude Agent SDK",
          "correct": false,
          "explanation": "The Agent SDK supports tools and continued sessions, but your team still hosts its process. That conflicts with the stated operating preference."
        },
        {
          "option": "Claude Managed Agents",
          "correct": true,
          "explanation": "The job needs continuing tool work and retained history, and the team wants Anthropic to run the loop. Managed Agents fits those requirements."
        }
      ]
    },
    "notes": [
      "Ask: A delivery investigation needs several tool steps and follow-up later. The team wants Anthropic to run the agent and keep the session. Which would you choose?",
      "Pause: Give the room 10–15 seconds. Take one reason, then select an answer.",
      "Show: Choose an answer to display its feedback. Explain the deciding requirement or mistake, then use the reveal cue to connect the result to the lesson.",
      "Reveal: Managed Agents fits this requirement. The team wants ongoing tool work and retained history, with the agent process operated by the service.",
      "Say: They still need to authorize access to order data and provide their business tools. An API or SDK implementation could offer the same product behavior with more infrastructure operated by that team.",
      "Transition: We have the decision model. Now apply it to the app you will build."
    ],
    "sources": [
      {
        "label": "Messages API",
        "url": "https://platform.claude.com/docs/en/api/messages/create"
      },
      {
        "label": "Hosting the Agent SDK",
        "url": "https://code.claude.com/docs/en/agent-sdk/hosting"
      },
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      }
    ]
  },
  {
    "id": "offsite-project",
    "phase": "teach",
    "section": "Apply it in Offsite",
    "kind": "concept",
    "title": "The project: Offsite",
    "minutes": 0.75,
    "bullets": [
      "Help someone organize an in-person team gathering.",
      "Turn requirements in chat into an agenda, costs and a rain plan.",
      "Build the missing agent behavior in an existing interface."
    ],
    "visual": "project",
    "notes": [
      "Say: We have compared the ways to run an agent. Now we will apply that reasoning to one project: Offsite, an app for organizing an in-person team gathering.",
      "Say: Someone describes the team, number of days, interests and budget in chat. The app turns those requirements into an agenda, a cost breakdown and a rain backup. Later messages can change the plan.",
      "Show: Point to the chat on the left and proposal on the right. The interface is already built; the lab focuses on the agent configuration, a business rule and conversation continuity.",
      "Transition: First, watch the completed version handle a request. Then we will inspect how it works and build the missing behavior in Lab starter."
    ],
    "sources": []
  },
  {
    "id": "offsite-scenario",
    "phase": "teach",
    "section": "Apply it in Offsite",
    "kind": "demo",
    "title": "Watch the completed app",
    "minutes": 1.25,
    "bullets": [
      "Plan two days for 12 people within $6,000.",
      "Read options, calculate costs, check the proposal and revise it when the brief changes."
    ],
    "visual": "brief",
    "notes": [
      "Say: This is Offsite, our lab application. The request is two days in Chicago for 12 people, within $6,000, with vegetarian meals and a rain backup. The same loop now reads venue options, calculates group costs, checks a proposal and handles revisions.",
      "Show: Open Completed demo at /agent. Use the displayed brief, including catering at or below $70 per person per day. Submit once if doing the live run; otherwise identify the prepared session before showing its result. Keep this same session for the next slides.",
      "Say: One npm run dev serves both versions. Completed demo uses the supplied solutions. Lab starter at /lab uses the four functions you will edit. They share the interface but keep separate sessions, so you can compare behavior without overwriting your work.",
      "Watch for: All venues and prices are fictional. We are not checking availability or making bookings. The fixed / preview is separate from the learner app. Completed demo already enforces the catering rule.",
      "Transition: While the plan runs, map the platform terms to this exact example."
    ],
    "sources": [
      {
        "label": "Managed Agents quickstart",
        "url": "https://platform.claude.com/docs/en/managed-agents/quickstart"
      }
    ],
    "prompt": "Plan a two-day Chicago offsite for 12 people focused on strategy and team connection. Budget: $6,000. Keep catering at or below $70 per person per day, include vegetarian meals and a rain backup."
  },
  {
    "id": "managed-resources",
    "phase": "teach",
    "section": "Apply it in Offsite",
    "kind": "concept",
    "title": "The building blocks of Managed Agents",
    "minutes": 1.5,
    "bullets": [
      "Agent: the planner’s instructions and tools.",
      "Environment: settings for the sandbox that runs tools.",
      "Session: this team’s offsite conversation.",
      "Events: the brief, tool activity, replies and status."
    ],
    "visual": "resources",
    "notes": [
      "Say: The agent is reusable configuration: the planning instructions and the tools Claude can use. The environment holds the settings for its sandbox. Together, they describe how a planning job can run.",
      "Say: The session is this particular team’s offsite. Its events record the brief, tool activity, replies and status. Another team can use the same agent and environment while getting a different session and history.",
      "Say: We supply the domain knowledge: venue data, planning instructions and a checker. Managed execution does not invent those rules. In the lab, setup creates the reusable resources; a session and a user message begin the actual work.",
      "Show: Point to the session ID in the app, then match the other terms to the resource diagram.",
      "Watch for: Events are records within a session, not a fourth resource to provision. The API also allows an initial message during session creation; our lab keeps create and send separate.",
      "Transition: The runtime can finish its work, but the application still has to decide whether to accept the result."
    ],
    "sources": [
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      },
      {
        "label": "Define your agent",
        "url": "https://platform.claude.com/docs/en/managed-agents/agent-setup"
      },
      {
        "label": "Managed sessions",
        "url": "https://platform.claude.com/docs/en/managed-agents/sessions"
      },
      {
        "label": "Session events and history",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      },
      {
        "label": "Cloud environment setup",
        "url": "https://platform.claude.com/docs/en/managed-agents/environments"
      }
    ]
  },
  {
    "id": "agent-and-app",
    "phase": "teach",
    "section": "Apply it in Offsite",
    "kind": "concept",
    "title": "Offsite: what you’ll build in the lab",
    "minutes": 1,
    "bullets": [
      "Offsite is a chat app that turns a team’s brief into an offsite plan.",
      "You’ll configure Claude to read venue options, write a proposal and run the supplied checker.",
      "You’ll add an app rule that rejects meals over $70 per person per day."
    ],
    "visual": "boundary",
    "notes": [
      "Say: Offsite is the project you will work on in the lab. The chat interface, fictional venue data and Python checker are provided. You will configure tools and the execution budget, add the catering rule, and repair session reuse.",
      "Say: Instructions tell Claude what to aim for. The completed planner receives the $70 catering cap up front. Its hosted checker verifies the plan’s structure, prices and total, but not that catering cap.",
      "Say: Offsite’s application code enforces the cap before displaying the proposal. Instructions help Claude plan; code decides what we accept. If a proposal is rejected, the session remains available. The revision button drafts a request stating the rule, and the user presses Send. Rejection alone sends Claude no feedback.",
      "Show: Follow the agent’s planning work into the application’s acceptance check. The UI and Python checker are supplied; learners add the catering check in TypeScript. Save the source walkthrough for the policy exercise.",
      "Watch for: Existing sessions keep their earlier instructions, so use the explicit same-session revision if the cap was missing. Managed Agents tool permission policies govern tool execution; our catering check is separate application code. Enforcing an independently approved total budget remains the stretch task.",
      "Transition: The rejected proposal can still be revised because the same session and its history remain available."
    ],
    "sources": [
      {
        "label": "Managed Agents tools",
        "url": "https://platform.claude.com/docs/en/managed-agents/tools"
      },
      {
        "label": "Secure your deployment",
        "url": "https://platform.claude.com/docs/en/managed-agents/secure-deployment"
      },
      {
        "label": "Managed Agents tool permission policies",
        "url": "https://platform.claude.com/docs/en/managed-agents/permission-policies"
      }
    ]
  },
  {
    "id": "session-lifecycle",
    "phase": "teach",
    "section": "Apply it in Offsite",
    "kind": "concept",
    "title": "Why use Managed Agents for Offsite?",
    "minutes": 1,
    "bullets": [
      "Planning takes several steps: read options, calculate costs, check the plan and revise it.",
      "The same session keeps the brief and earlier work available for follow-up requests.",
      "Anthropic runs the agent while Offsite reads its progress and displays the result."
    ],
    "visual": "lifecycle",
    "notes": [
      "Say: Now that we know what Offsite does, why choose Managed Agents for it? The useful part is a planning process that can use tools, check its work and revise a proposal over several turns. A chat interface alone is not a reason to choose it.",
      "Say: We want Anthropic to operate that process. The service runs the loop and retains session history; Offsite connects the user to the right session, shows progress and decides which proposals to accept. This fits the documented strengths of managed execution and stateful sessions. Our small lab run demonstrates those properties without pretending to be an hours-long job.",
      "Say: The original brief and every follow-up for this offsite belong to one session. If I say “reduce the budget to $4,000,” I want the earlier people, goals and dietary needs to remain available.",
      "Say: Reopening the page is different from sending that follow-up. Reconnect reads saved events and output; it does not submit the original brief again. This app keeps the session link in an authenticated HttpOnly cookie and polls its history while work is running.",
      "Show: Follow the brief through the hosted planning steps and back into Offsite. Then point to Session A on both ends: a later revision stays connected to the same work.",
      "Watch for: This app uses history polling, not token streaming. New offsite clears the browser mapping; it does not cancel remote work. Read history before retrying an uncertain send.",
      "Transition: Before we try it, predict what should still be there when we return."
    ],
    "sources": [
      {
        "label": "When to use Managed Agents",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview#when-to-use-claude-managed-agents"
      },
      {
        "label": "Session events and history",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      },
      {
        "label": "Managed sessions",
        "url": "https://platform.claude.com/docs/en/managed-agents/sessions"
      }
    ]
  },
  {
    "id": "close-tab-checkpoint",
    "phase": "teach",
    "section": "Apply it in Offsite",
    "kind": "decision",
    "title": "What happens when we close the tab?",
    "minutes": 1,
    "bullets": [],
    "activity": {
      "kind": "predict",
      "question": "Claude is checking the 12-person plan. We close the tab, reopen it with the same cookies and click Reconnect. What should happen?",
      "options": [
        "We see the same session and its saved progress",
        "A new session starts the brief again",
        "The agent waits for browser polling to run its tools"
      ],
      "answer": "We see the same session and its saved progress.",
      "explanation": "The hosted loop and tools can continue after the accepted request. Offsite recovers the existing session through its authenticated HttpOnly cookie and reads history. Clearing that mapping is a different action.",
      "optionFeedback": [
        {
          "option": "We see the same session and its saved progress",
          "correct": true,
          "explanation": "Reconnect reads the existing session. The hosted loop and tools can continue independently of the browser; keeping its cookies preserves the session link."
        },
        {
          "option": "A new session starts the brief again",
          "correct": false,
          "explanation": "Starting a new session would create new work. Reconnect is a read of the existing session and should not submit the brief again."
        },
        {
          "option": "The agent waits for browser polling to run its tools",
          "correct": false,
          "explanation": "Polling only reads progress. The hosted loop and tools execute remotely, so they do not need a browser callback to keep running."
        }
      ]
    },
    "notes": [
      "Ask: Claude is checking the 12-person plan. We close the tab, reopen it with the same cookies and click Reconnect. What should happen?",
      "Pause: Wait 10–15 seconds. Take one prediction before selecting an answer and returning to the app.",
      "Show: Choose an answer to display its feedback. Explain the deciding requirement or mistake, then use the reveal cue to connect the result to the lesson.",
      "Reveal: We should see the same session and its saved progress. The hosted loop and tools can continue after the request is accepted; the browser reads their history.",
      "Say: Keeping the cookies matters because they preserve this browser’s session link. Clearing them is a different action. A working API or SDK app could offer recovery too if its team built that infrastructure.",
      "Watch for: If the run completed before the tab closed, say so. Retained history is still visible, but that is not proof of progress during this particular disconnection.",
      "Transition: Check the prediction against the actual app."
    ],
    "sources": [
      {
        "label": "Managed sessions",
        "url": "https://platform.claude.com/docs/en/managed-agents/sessions"
      },
      {
        "label": "Session events and history",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      }
    ]
  },
  {
    "id": "demonstrate-and-build",
    "phase": "teach",
    "section": "Apply it in Offsite",
    "kind": "demo",
    "title": "Live demo: reopen and revise the same plan",
    "minutes": 1.5,
    "bullets": [
      "Open the plan we started earlier. Reconnect to load its saved conversation and proposal.",
      "Ask for a lower budget in that same conversation.",
      "Check that the session ID stays the same, then review whether the revised plan meets the brief."
    ],
    "visual": "demo-return",
    "demoAction": "Return to the completed demo",
    "notes": [
      "Say: Let’s return to the plan we started earlier. First we will check that reopening the app brings back the existing conversation. Then we will ask for a cheaper plan without starting over.",
      "Show: Return to the same Completed demo session. Record its ID, refresh or reconnect, and compare the recovered ID, messages and tool activity. Do not start a new offsite.",
      "Say: The same ID connects this result to our original brief. We are reading the work that already exists, not sending another copy of the task. The app also checks the proposal before it displays it.",
      "Show: Send the displayed budget-only follow-up once. Keep the session ID visible as the new turn is accepted.",
      "Say: I have changed only the budget. The same session keeps the earlier brief available; it does not guarantee every requirement is satisfied. Inspect the revised plan separately. Our application checks cover specific rules, and the approved-budget check remains a stretch task.",
      "Watch for: The original plan may already cost less than $4,000. In that case the agent can keep the same selections. Show the updated budget and new messages; do not claim the total fell if it stayed the same.",
      "Watch for: If the follow-up is still running, leave it running. Name a prepared result as prepared. Do not fill time by submitting duplicate requests.",
      "Transition: You will now build this path, add a policy and test a failure in session continuity."
    ],
    "sources": [
      {
        "label": "Session events and history",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      },
      {
        "label": "Managed sessions",
        "url": "https://platform.claude.com/docs/en/managed-agents/sessions"
      }
    ],
    "prompt": "Keep the same people, goals and dietary needs. Reduce the budget to $4,000."
  },
  {
    "id": "lab-transition",
    "phase": "teach",
    "section": "60-minute hands-on lab",
    "kind": "recap",
    "title": "Now it’s your turn: build Offsite",
    "minutes": 1,
    "bullets": [
      "Connect the app to a managed agent.",
      "Add the catering rule.",
      "Fix a bug that loses the conversation."
    ],
    "visual": "lab-path",
    "notes": [
      "Say: Now it is your turn. The next 60 minutes are hands-on. You will use the existing interface and connection code, configure the agent’s tools and cost limit, provision its resources, and run your first session.",
      "Say: Then you will add the catering rule independently and fix a bug that loses the earlier conversation. The completed app stays available for comparison while you work in Lab starter.",
      "Say: If you finish early, the stretch is to enforce a user-approved budget outside the generated proposal. The goal is evidence you can explain: a real result, a passing policy check and a conversation that continues correctly.",
      "Show: Point to the three lab steps and the Lab starter tab. Keep the code solutions closed until learners have tried the task.",
      "Transition: Start the 60-minute lab timer. On the next slide, clone the repository and run the app; setup comes first."
    ],
    "sources": [
      {
        "label": "Managed Agents quickstart",
        "url": "https://platform.claude.com/docs/en/managed-agents/quickstart"
      },
      {
        "label": "Session events and history",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      }
    ]
  },
  {
    "id": "lab-get-started",
    "phase": "lab",
    "kind": "task",
    "title": "1. Clone and run the lab",
    "minutes": 5,
    "bullets": [
      "Clone the repository.",
      "Install dependencies.",
      "Start the app."
    ],
    "task": {
      "goal": "Run the lab app on your computer.",
      "steps": [
        "Clone the repository.",
        "Enter its folder and install dependencies.",
        "Open http://127.0.0.1:3000/workshop."
      ],
      "change": "No local checkout → a running lab app.",
      "run": "Run the commands below, then open http://127.0.0.1:3000/workshop.",
      "expected": "The lab deck and both app versions load.",
      "check": "The lab deck and both app versions load.",
      "files": [],
      "hints": [
        "Run the install and dev commands inside claude-managed-agents.",
        "Leave the development server running while you use the app."
      ]
    },
    "notes": [
      "Say: Start with these commands: clone the repository, enter its folder, install dependencies and run the app. One development server gives you the deck, Completed demo and Lab starter.",
      "Show: Run the single code block, then open http://127.0.0.1:3000/workshop. There is no repository-configuration step to complete first.",
      "Pause: Give learners about four minutes to install and launch. The checkpoint is the deck loading in their browser.",
      "Watch for: Prepare Git, Node.js 22 and Python 3 before the lab. Python is needed by a later supplied test; no extra Python packages are required. Keep the dev process running.",
      "If stuck: Confirm the terminal is inside claude-managed-agents. Use an existing checkout if already cloned; for an installation delay, observe a working app and return to local setup afterward.",
      "Transition: Next, locate the two app versions and the functions you will edit."
    ],
    "sources": [],
    "section": "Start the app",
    "visual": "brief",
    "code": [
      {
        "title": "Clone, install and run",
        "language": "bash",
        "value": "git clone https://github.com/dannysullivan-ai/claude-managed-agents.git\ncd claude-managed-agents\nnpm install\nnpm run dev",
        "variant": "command",
        "caption": "Run these commands, then open http://127.0.0.1:3000/workshop."
      }
    ]
  },
  {
    "id": "lab-map-code",
    "phase": "lab",
    "kind": "task",
    "title": "2. Find the completed and unfinished versions",
    "minutes": 3,
    "bullets": [
      "Completed demo at /agent uses the supplied solution functions.",
      "Lab starter at /lab uses the four functions you will edit."
    ],
    "task": {
      "goal": "Find the code behind each app version.",
      "steps": [
        "Find the four functions in the exercise file.",
        "Open a second terminal in the repository folder; run the baseline checks.",
        "Optional after cloning: run pwd and paste that path into Editor links. Code filenames then open in VS Code."
      ],
      "change": "Current: one server exposes a completed version and an unfinished exercise. Change: identify the files that determine each version before editing.",
      "run": "Inspect /agent and /lab without sending a request. In a second terminal, run npm test and npm run typecheck.",
      "expected": "Both implementations are clear; baseline checks pass.",
      "check": "Both implementations are clear; baseline checks pass.",
      "files": [
        "lib/workshop-exercises.ts",
        "app/api/lab/message/route.ts",
        "app/api/managed/message/route.ts",
        "lib/managed/routes.ts"
      ],
      "hints": [
        "The optional /preview route is a fixed UI preview. It is not the unfinished managed exercise.",
        "A solution is available for comparison, but /lab executes your learner functions and its checks."
      ]
    },
    "notes": [
      "Say: Completed demo at /agent runs the solution functions. Lab starter at /lab runs the four functions in your exercise file. They use the same interface and shared handlers, but separate session cookies. You can edit your version without replacing the completed example.",
      "Show: Open lib/workshop-exercises.ts and point to tools, budget, catering policy and session selection. The two route tabs are optional context showing which version selects which functions.",
      "Show: Demonstrate Editor links once: run pwd in the checkout, enter that absolute folder path, then click a filename above the code to open VS Code at its line. This optional browser-local setting does not give the app access to the filesystem; the browser asks the editor to open the link.",
      "Pause: Allow two minutes to find the four functions. In a second terminal, run the baseline tests and typecheck from the code tab; no API key is needed. Learners can set Editor links if useful.",
      "Say: Keep npm run dev running in the first terminal. Use the second terminal, in the folder containing package.json, for every lab check. Run each exercise’s check before editing to see the expected failure, then save your change and rerun until PASS. Run all at the end. These checks call your local exercise functions; they do not call Claude or require credentials.",
      "Say: The checkpoint is knowing which function your next edit will change, which app version uses it, and that the supplied baseline checks pass.",
      "Watch for: The optional fixed preview at /preview is neither of these managed versions. There is no environment-mode switch to perform.",
      "Transition: Prepare the private server credential before provisioning."
    ],
    "sources": [],
    "section": "Start the app",
    "visual": "boundary",
    "code": [
      {
        "title": "Editable exercise file",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "reference",
        "source": {
          "path": "lib/workshop-exercises.ts"
        },
        "caption": "Your four edits live here. The route tabs show how each app version selects its functions. Refresh the local deck after edits; a deployed deck shows its build snapshot."
      },
      {
        "title": "Check the supplied baseline",
        "language": "bash",
        "value": "npm test\nnpm run typecheck",
        "variant": "command",
        "caption": "Use a second terminal in the same checkout; leave npm run dev running in the first."
      },
      {
        "title": "Lab message route",
        "language": "typescript",
        "value": "",
        "file": "app/api/lab/message/route.ts",
        "variant": "reference",
        "source": {
          "path": "app/api/lab/message/route.ts"
        },
        "caption": "Lab starter selects the unfinished learner functions. Refresh the local deck after edits; a deployed deck shows its build snapshot."
      },
      {
        "title": "Completed message route",
        "language": "typescript",
        "value": "",
        "file": "app/api/managed/message/route.ts",
        "variant": "reference",
        "source": {
          "path": "app/api/managed/message/route.ts"
        }
      }
    ]
  },
  {
    "id": "lab-credentials",
    "phase": "lab",
    "kind": "task",
    "title": "3. Configure server-side credentials",
    "minutes": 3,
    "bullets": [
      "Add the API key so Offsite’s server can send the planning job to Anthropic.",
      "Keep the key out of browser code; setup will save reusable resource IDs later."
    ],
    "task": {
      "goal": "Give the server its API key.",
      "steps": [
        "Create .env.local without overwriting existing settings.",
        "Set ANTHROPIC_API_KEY privately in your editor.",
        "Leave resource IDs for the setup script."
      ],
      "change": "Current: the interface and offline checks work without credentials. Change: add the server-side ANTHROPIC_API_KEY for setup and real agent execution.",
      "run": "Run the non-overwriting copy block, then edit .env.local in your editor. No live request yet.",
      "expected": "The API key is configured only on the server.",
      "check": "The API key is configured only on the server.",
      "files": [
        ".env.example",
        "lib/managed/config.ts"
      ],
      "hints": [
        "Do not use NEXT_PUBLIC_ for credentials; that prefix exposes values to browser code.",
        "The setup script creates SESSION_SECRET and saves the dedicated resource IDs. You do not invent those IDs.",
        "If API access is unavailable, complete all offline checks and pair with an instructor for live evidence."
      ]
    },
    "notes": [
      "Say: Offsite’s server needs an API key to call Anthropic. The browser does not. Create .env.local only if it is missing, then set ANTHROPIC_API_KEY privately in your editor. Leave the resource IDs to the setup script.",
      "Show: Use only the public example and the non-overwriting copy command on screen. Never display a real key.",
      "Pause: Allow two minutes for configuration. The checkpoint is a private local setting, not a key pasted into the deck or browser.",
      "Watch for: Do not use a NEXT_PUBLIC_ variable. An API key identifies the caller; tool permissions and spending limits are separate. Optional vaults hold third-party credentials, not this server key; we do not configure a vault today.",
      "If stuck: Continue the offline checks and arrange to observe the live portion with a working account.",
      "Transition: Choose where the cost-checking command should execute."
    ],
    "sources": [
      {
        "label": "Authenticate with vaults",
        "url": "https://platform.claude.com/docs/en/managed-agents/vaults"
      }
    ],
    "section": "Configure execution",
    "visual": "boundary",
    "code": [
      {
        "title": "Create local configuration safely",
        "language": "bash",
        "value": "if [ ! -f .env.local ]; then\n  cp .env.example .env.local\nfi",
        "variant": "command",
        "caption": "Terminal B. This leaves an existing .env.local untouched."
      },
      {
        "title": "Configuration contract",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/config.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/config.ts"
        },
        "caption": "Complete code from this repository. Local deck: refresh after editing. A deployed deck shows its build snapshot."
      }
    ]
  },
  {
    "id": "lab-tools-prediction",
    "phase": "lab",
    "section": "Configure execution",
    "kind": "decision",
    "title": "Where should the cost checker run?",
    "minutes": 0.5,
    "bullets": [],
    "activity": {
      "kind": "predict",
      "question": "Offsite needs to run Python to check the proposal. Where should that command execute so planning can continue after the tab closes?",
      "options": [
        "In the hosted tool sandbox",
        "In the browser’s polling callback",
        "In the source-code viewer"
      ],
      "answer": "In the hosted tool sandbox.",
      "explanation": "The agent can call bash to run validate.py on its files. The browser reads progress; it is not the tool worker.",
      "optionFeedback": [
        {
          "option": "In the hosted tool sandbox",
          "correct": true,
          "explanation": "The hosted bash tool can run Python on the session files while the browser is closed."
        },
        {
          "option": "In the browser’s polling callback",
          "correct": false,
          "explanation": "A browser callback stops when the page closes. In this app it reads progress; it does not execute the agent’s tools."
        },
        {
          "option": "In the source-code viewer",
          "correct": false,
          "explanation": "The code viewer displays source for learning. It is not a tool executor and cannot keep the remote planning job running."
        }
      ]
    },
    "notes": [
      "Ask: Offsite needs to run Python to check the proposal. Where should that command execute so planning can continue after the tab closes?",
      "Pause: Give 10 seconds for a choice; keep this checkpoint to 30 seconds.",
      "Show: Choose an answer to display its feedback. Explain the deciding requirement or mistake, then use the reveal cue to connect the result to the lesson.",
      "Reveal: In the hosted sandbox. The agent calls bash; the browser only observes. A worker your team runs is another possible design, but it is not this lab’s execution path.",
      "Transition: Enable the three hosted operations that path needs."
    ],
    "sources": [
      {
        "label": "Managed Agents tools",
        "url": "https://platform.claude.com/docs/en/managed-agents/tools"
      }
    ]
  },
  {
    "id": "lab-tools",
    "phase": "lab",
    "kind": "task",
    "title": "4. Enable the hosted tools",
    "minutes": 4.5,
    "bullets": [
      "Enable read, write and bash in learnerTools().",
      "Keep other tools disabled and avoid an approval worker in this lab."
    ],
    "task": {
      "goal": "Enable the tools the planner needs.",
      "steps": [
        "Open Run tools check. Copy it into a second terminal in the repository folder.",
        "Expect FAIL tools. Enable read, write and bash in learnerTools; save.",
        "Rerun the same command until PASS tools."
      ],
      "change": "Current: configs is empty. Change: explicitly enable the three hosted operations and their permission policy.",
      "run": "npm run lab:check -- tools",
      "expected": "PASS tools.",
      "check": "PASS tools.",
      "files": [
        "lib/workshop-exercises.ts",
        "lib/managed/workshop.ts"
      ],
      "hints": [
        "A model instruction to use a tool does not enable that tool.",
        "The Python command is executed by bash inside the hosted sandbox.",
        "The reference answer is a complete function; replace that function only so later work is preserved.",
        "Keep the typed signature, default_config.enabled false and always_allow for this restricted lab."
      ]
    },
    "notes": [
      "Say: Start by running the tools check. It should fail: the starter has not enabled any tools. Change only learnerTools. Keep tools disabled by default, then explicitly enable read, write and bash with the supplied permission policy.",
      "Show: Open Run tools check and copy the command into Terminal B, in the repository folder. Run it once to show FAIL tools. The -- passes tools to our check script; it chooses one exercise. Trace read to the fixture, write to the proposal, and bash to the Python checker.",
      "Pause: Give learners three minutes to edit and rerun npm run lab:check -- tools. Keep the solution closed until they have tried the configuration.",
      "Say: PASS tools means the outgoing configuration is correct. This check does not create a session or call the model.",
      "If stuck: Start with the toolset shape, then inspect the enabled names. Copy only this function if using the answer.",
      "Watch for: Prompt instructions do not enable tools. always_allow is a restricted classroom choice; bash can itself read and write files.",
      "Transition: Set the execution cost before starting a paid session."
    ],
    "sources": [
      {
        "label": "Managed Agents tools",
        "url": "https://platform.claude.com/docs/en/managed-agents/tools"
      }
    ],
    "section": "Configure execution",
    "visual": "loop",
    "code": [
      {
        "title": "Current function",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "exercise",
        "source": {
          "path": "lib/workshop-exercises.ts",
          "start": "export function learnerTools(",
          "end": "// END tools"
        },
        "caption": "This complete function comes from the editable exercise file. Replace only this function; keep the other exercises. Local deck: refresh after editing. A deployed deck shows its build snapshot.",
        "annotations": [
          {
            "find": "export function learnerTools(",
            "label": "Edit this complete function"
          }
        ]
      },
      {
        "title": "Run tools check",
        "language": "bash",
        "value": "npm run lab:check -- tools",
        "variant": "command",
        "caption": "Keep npm run dev running in Terminal A. Run this in Terminal B, from the folder containing package.json. Expect FAIL before editing; save your change and rerun for PASS tools. No API calls or credentials."
      },
      {
        "title": "Show solution",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-solutions.ts",
        "variant": "after",
        "source": {
          "path": "lib/workshop-solutions.ts",
          "start": "export function learnerTools(",
          "end": "// END tools"
        },
        "caption": "Complete reference answer. Lab starter executes your exercise function; Completed demo executes this answer. Explain the decision before copying.",
        "annotations": [
          {
            "find": "permission_policy: { type: \"always_allow\" }",
            "label": "Hosted execution does not wait for a browser approval worker"
          },
          {
            "find": "{ name: \"bash\", enabled: true }",
            "label": "Run the provided validator in the sandbox"
          }
        ]
      },
      {
        "title": "Full editable file",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "reference",
        "source": {
          "path": "lib/workshop-exercises.ts"
        }
      }
    ]
  },
  {
    "id": "lab-execution-budget",
    "phase": "lab",
    "kind": "task",
    "title": "5. Set the execution budget",
    "minutes": 2.5,
    "bullets": [
      "The API execution cap is separate from the offsite budget.",
      "Represent the $2 session cap as 200 integer US cents."
    ],
    "task": {
      "goal": "Set a $2 execution limit using the correct units.",
      "steps": [
        "Open Run budget check and run it in Terminal B. Expect FAIL budget.",
        "Change learnerBudget’s amount to the string \"200\"; save.",
        "Rerun the same command until PASS budget."
      ],
      "change": "Current: learnerBudget returns a decimal dollar string. Change: return the API's integer minor-unit amount for a $2 list-cost cap.",
      "run": "npm run lab:check -- budget",
      "expected": "PASS budget.",
      "check": "PASS budget.",
      "files": [
        "lib/workshop-exercises.ts",
        "lib/managed/transport.ts"
      ],
      "hints": [
        "The API field is a string, but its unit is still cents. Changing only the numeric type is not the fix.",
        "This limits API list cost, not what the team can spend on rooms and meals."
      ]
    },
    "notes": [
      "Say: We are setting a $2 execution limit, not changing the $6,000 offsite budget. The API expects a whole number of US cents written as a string. Two dollars is the string 200, not 2.00.",
      "Show: Run the failing budget check, then point to learnerBudget and its amount field. Keep type limit and currency USD unchanged.",
      "Pause: Give one minute to make the change and rerun npm run lab:check -- budget.",
      "Say: The checkpoint is PASS budget. We have corrected the units locally before sending a real session request.",
      "Watch for: Changing only the TypeScript value type is not the fix. The unit is cents. The service checks the limit between model requests, so in-flight work can finish above the threshold.",
      "Transition: With tools and cost checked, provision the resources they will use."
    ],
    "sources": [
      {
        "label": "Managed session budgets",
        "url": "https://platform.claude.com/docs/en/managed-agents/budgets"
      }
    ],
    "section": "Configure execution",
    "visual": "evidence",
    "code": [
      {
        "title": "Current function",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "exercise",
        "source": {
          "path": "lib/workshop-exercises.ts",
          "start": "export function learnerBudget(",
          "end": "// END budget"
        },
        "caption": "This complete function comes from the editable exercise file. Replace only this function; keep the other exercises. Local deck: refresh after editing. A deployed deck shows its build snapshot.",
        "annotations": [
          {
            "find": "export function learnerBudget(",
            "label": "Edit this complete function"
          }
        ]
      },
      {
        "title": "Run budget check",
        "language": "bash",
        "value": "npm run lab:check -- budget",
        "variant": "command",
        "caption": "Terminal B, repository folder. Expect FAIL budget before editing. Save learnerBudget, then rerun for PASS budget. This local check does not start a session."
      },
      {
        "title": "Show solution",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-solutions.ts",
        "variant": "after",
        "source": {
          "path": "lib/workshop-solutions.ts",
          "start": "export function learnerBudget(",
          "end": "// END budget"
        },
        "caption": "Complete reference answer. Lab starter executes your exercise function; Completed demo executes this answer. Explain the decision before copying.",
        "annotations": [
          {
            "find": "amount: \"200\"",
            "label": "$2 expressed in integer cents"
          }
        ]
      }
    ]
  },
  {
    "id": "lab-provision",
    "phase": "lab",
    "kind": "task",
    "title": "6. Set up the agent",
    "minutes": 5,
    "bullets": [
      "Give the planner its instructions, cloud environment and fictional venue prices.",
      "Setup prepares those resources; the 12-person planning job starts after a message."
    ],
    "task": {
      "goal": "Create the reusable resources for your planner.",
      "steps": [
        "Run npm run setup:agent in Terminal B.",
        "Open Setup code and follow the highlighted calls.",
        "Compare your terminal with Example output."
      ],
      "change": "Current: local source and an API key. Change: provision the reusable agent/environment and fixture uploads; let the script save their IDs.",
      "run": "npm run setup:agent",
      "expected": "Resources are ready; no planning session has started.",
      "check": "Resources are ready; no planning session has started.",
      "files": [
        "scripts/setup-agent.ts",
        "lib/managed/agent.ts",
        "lib/managed/fixtures/venues.json",
        "lib/managed/fixtures/validate.py"
      ],
      "hints": [
        "A rerun reuses unchanged resources and recovers saved IDs; do not manufacture resource IDs manually.",
        "Learner tools and budget are applied as per-session overrides. Editing those functions does not require re-uploading the fixture.",
        "If access is blocked, pair for the live steps and continue the offline policy/debugging tasks independently.",
        "Confirm tools and budget checks pass before setup; let the script save resource IDs."
      ]
    },
    "notes": [
      "Say: This is our npm script, not an Anthropic CLI command. It calls the API to create or reuse an agent, an environment and two uploaded files, then saves their configuration. No session or model run starts here.",
      "Show: Run npm run setup:agent in Terminal B. Open Setup code and use the four highlights: environment, files, agent, saved configuration. The full script shows the Files API upload call. Compare the terminal with Example output; created or reused are both successful. Keep .env.local closed.",
      "Pause: Allow about three minutes for provisioning and inspection. The checkpoint is created or reused resources with saved IDs.",
      "Say: These resources can be used by many sessions. The next step starts one planning job. Our learner tools and budget are session overrides, so those edits do not require uploading the files again.",
      "If stuck: Check account access and the setup error. Use a working account for the live evidence while continuing offline exercises.",
      "Watch for: Do not invent IDs. Skills are optional packaging; we have not configured one or added cross-session learning.",
      "Transition: Now send one actual planning job."
    ],
    "sources": [
      {
        "label": "Managed Agents quickstart",
        "url": "https://platform.claude.com/docs/en/managed-agents/quickstart"
      },
      {
        "label": "Define your agent",
        "url": "https://platform.claude.com/docs/en/managed-agents/agent-setup"
      },
      {
        "label": "Managed Agents skills",
        "url": "https://platform.claude.com/docs/en/managed-agents/skills"
      }
    ],
    "section": "Run a managed session",
    "visual": "resources",
    "code": [
      {
        "title": "Run setup",
        "language": "bash",
        "value": "npm run setup:agent",
        "variant": "command",
        "caption": "Our setup script calls the Anthropic API and saves configuration. It does not create a session or start the planner."
      },
      {
        "title": "Setup code",
        "language": "typescript",
        "value": "",
        "file": "scripts/setup-agent.ts",
        "variant": "reference",
        "source": {
          "path": "scripts/setup-agent.ts",
          "start": "async function main() {",
          "end": "main().catch"
        },
        "caption": "The complete main() function. Follow the highlights to see what the command prepares; the helper functions are in Full setup script.",
        "annotations": [
          {
            "find": "environment = await client.beta.environments.create",
            "label": "Create the environment"
          },
          {
            "find": "await ensureFixture(client, \"venues.json\"",
            "label": "Upload or reuse files"
          },
          {
            "find": "agent = await client.beta.agents.create",
            "label": "Create the agent"
          },
          {
            "find": "saveSettings({ OFFSITE_AGENT_ID:",
            "label": "Save configuration"
          }
        ]
      },
      {
        "title": "Example output",
        "language": "bash",
        "value": "# Example first-run output (excerpt).\nCreated the restricted offsite environment.\nUploaded the venues.json lab fixture.\nUploaded the validate.py lab fixture.\nCreated the offsite planner agent.\nLive configuration saved privately to .env.local (<model>, agent version <version>).\nThe API key and other settings were preserved. No session or model run was started.",
        "variant": "output",
        "caption": "Illustrative output, not a live run. Your model and version replace the placeholders. An unchanged rerun reports reused resources instead of creating them again."
      },
      {
        "title": "Full setup script",
        "language": "typescript",
        "value": "",
        "file": "scripts/setup-agent.ts",
        "variant": "reference",
        "source": {
          "path": "scripts/setup-agent.ts"
        },
        "annotations": [
          {
            "find": "const file = await client.files.upload",
            "label": "The Files API upload"
          }
        ]
      }
    ]
  },
  {
    "id": "lab-session-send",
    "phase": "lab",
    "kind": "task",
    "title": "7. Create a session and send the brief",
    "minutes": 6,
    "bullets": [
      "Open Lab starter after provisioning; the same server also serves Completed demo.",
      "The first message creates a session; later messages reuse it."
    ],
    "task": {
      "goal": "Start your first real planning session.",
      "steps": [
        "Open Lab starter and choose Chicago.",
        "Submit the provided brief once.",
        "Record the session ID and inspect the message handler."
      ],
      "change": "Current: reusable resources exist. Change: submit one brief through /lab to create this offsite’s session.",
      "run": "Open /lab and submit the brief. The existing npm run dev serves both versions.",
      "expected": "A real session accepts the brief and begins working.",
      "check": "A real session accepts the brief and begins working.",
      "files": [
        "app/api/lab/message/route.ts",
        "lib/managed/routes.ts",
        "lib/managed/conversation.ts",
        "lib/managed/transport.ts"
      ],
      "hints": [
        "If the app says learner tools or budget are incomplete, return to their offline checks; the local guard has not started a model call.",
        "Do not submit again because the first response is slow. Reconnect to inspect acknowledged work.",
        "The first brief prefers the premium meal package so the later application-policy exercise has a concrete existing proposal to inspect.",
        "Keep the dev server running. If saved IDs still appear missing, restart that same command once.",
        "If an old session is attached, New offsite clears its browser link; it does not cancel remote work."
      ]
    },
    "notes": [
      "Say: Open Lab starter, choose Chicago and submit the provided brief once. This is the first step that starts model execution. Keep this session for the remaining tasks rather than creating a new one for every check.",
      "Show: Use the two-day, 12-person brief requesting Table A. Record the session ID when the message is accepted. While it runs, follow the shared message handler: find an existing session or create one, send the user message, and preserve the browser mapping.",
      "Pause: Give learners about four minutes to submit and inspect the code and activity. The checkpoint is an accepted turn with a real session ID; the final proposal may still be running.",
      "If stuck: A tools or budget error means the local guard stopped the call; rerun those checks. If saved IDs still appear missing, restart the same npm run dev command once.",
      "Watch for: Table A is intentional: it gives the later policy exercise a premium package to reject. A slow reply is not a reason to submit again.",
      "Transition: Recover this same work after disconnecting the observer."
    ],
    "sources": [
      {
        "label": "Session events and history",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      }
    ],
    "section": "Run a managed session",
    "visual": "resources",
    "prompt": "Plan a two-day Chicago offsite for 12 people focused on strategy and team connection. Budget: $6,000. Use Chicago Table A (fictional) for vegetarian meals, and include a rain backup.",
    "code": [
      {
        "title": "Complete message handler",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/routes.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/routes.ts",
          "start": "async function messagePOST(",
          "end": "// END messagePOST"
        },
        "annotations": [
          {
            "find": "token = await sessionForMessage",
            "label": "Choose the existing session or create one"
          },
          {
            "find": "await sendManagedMessage",
            "label": "Send work; do not run the tool loop here"
          }
        ],
        "caption": "Complete function inside createManagedRoutes. The full shared file shows its imports and surrounding helpers. Refresh the local deck after edits; a deployed deck shows its build snapshot."
      },
      {
        "title": "Session creation helper",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/conversation.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/conversation.ts",
          "start": "export async function startSession(",
          "end": "async function ownedHistory"
        },
        "caption": "Complete helper. The transport performs the actual SDK request."
      },
      {
        "title": "Full transport implementation",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/transport.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/transport.ts"
        }
      },
      {
        "title": "Full shared route handlers",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/routes.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/routes.ts"
        }
      }
    ]
  },
  {
    "id": "lab-observe-reconnect",
    "phase": "lab",
    "kind": "task",
    "title": "8. Observe and reconnect without resending",
    "minutes": 5,
    "bullets": [
      "Close or refresh the observer after submission is acknowledged.",
      "Read the same session's history and generated output."
    ],
    "task": {
      "goal": "Recover the same session without resending the brief.",
      "steps": [
        "Note the session ID, then refresh or close the app.",
        "Reopen Lab starter and click Reconnect.",
        "Compare the ID, history and output."
      ],
      "change": "Current: a running or completed session already exists. Change: disconnect/reopen the UI only; do not create a new session.",
      "run": "Refresh or reopen /lab, then click Reconnect. Inspect the read-only GET /api/lab/session request.",
      "expected": "The same session returns without a duplicate message.",
      "check": "The same session returns without a duplicate message.",
      "files": [
        "app/api/lab/session/route.ts",
        "lib/managed/routes.ts",
        "lib/managed/conversation.ts",
        "lib/managed/transport.ts"
      ],
      "hints": [
        "A cookie maps this browser to its session. Clearing cookies or choosing New offsite deliberately removes that local mapping.",
        "The app polls saved event history every three seconds while running. There is no SSE/token stream in this implementation.",
        "An output can appear shortly after execution finishes. Wait for the current revision instead of treating an older proposal as the new result.",
        "Keep the same browser cookies. The GET handler reads history and files without sending a new turn."
      ]
    },
    "notes": [
      "Say: After the turn is acknowledged, note its session ID and refresh or close the planner. Reopen Lab starter in the same browser and click Reconnect. Keep the cookies so the app can find the existing session.",
      "Show: Compare the ID and earlier messages, then inspect tool activity and output. Open the GET handler: it reads the saved conversation and files. It does not send another brief or run the tools.",
      "Pause: Allow three minutes for the reconnect and code inspection. The checkpoint is the same session and history without a duplicate user turn.",
      "Watch for: If the run already finished, report that accurately. A previous proposal must not count as a new revision. The app polls history every three seconds while running; it is not streaming tokens.",
      "If stuck: Check whether cookies were cleared or New offsite was selected. Read existing history before retrying a send.",
      "Transition: Add a business rule that the original total-budget check does not enforce."
    ],
    "sources": [
      {
        "label": "Session events and history",
        "url": "https://platform.claude.com/docs/en/managed-agents/events-and-streaming"
      }
    ],
    "section": "Run a managed session",
    "visual": "lifecycle",
    "code": [
      {
        "title": "Complete read-only handler",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/routes.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/routes.ts",
          "start": "async function GET(",
          "end": "// END GET"
        },
        "annotations": [
          {
            "find": "await readConversation",
            "label": "Retrieve the existing session; no new work"
          }
        ],
        "caption": "Complete function inside createManagedRoutes. The full shared file shows its imports and surrounding helpers. Refresh the local deck after edits; a deployed deck shows its build snapshot."
      },
      {
        "title": "Complete conversation reader",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/conversation.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/conversation.ts",
          "start": "export async function readConversation(",
          "end": "export async function sendManagedMessage("
        },
        "annotations": [
          {
            "find": "await ownedHistory",
            "label": "Recover persisted events"
          },
          {
            "find": "await transport.output",
            "label": "Download the artifact for this turn"
          }
        ]
      },
      {
        "title": "Lab session route",
        "language": "typescript",
        "value": "",
        "file": "app/api/lab/session/route.ts",
        "variant": "reference",
        "source": {
          "path": "app/api/lab/session/route.ts"
        }
      },
      {
        "title": "Full shared route handlers",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/routes.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/routes.ts"
        }
      }
    ]
  },
  {
    "id": "lab-policy-prediction",
    "phase": "lab",
    "section": "Add a product policy",
    "kind": "decision",
    "title": "Where should the catering rule live?",
    "minutes": 1,
    "bullets": [],
    "activity": {
      "kind": "predict",
      "question": "The app rejects the meal package, but Claude says it can’t see the catering policy. What should we change?",
      "options": [
        "Give Claude the rule and remove the code check.",
        "Keep the rule only in the app’s validation code.",
        "Give Claude the rule and keep the code check."
      ],
      "answer": "Give Claude the rule and keep the code check.",
      "explanation": "Instructions help Claude plan for the rule. Application code still decides whether to accept the result.",
      "optionFeedback": [
        {
          "option": "Give Claude the rule and remove the code check.",
          "correct": false,
          "explanation": "The instruction helps Claude aim for a compliant plan, but does not enforce the rule. Keep the code check before accepting the proposal."
        },
        {
          "option": "Keep the rule only in the app’s validation code.",
          "correct": false,
          "explanation": "The app can reject an expensive meal, but Claude cannot plan around a rule it has not received. Tell Claude the cap as well."
        },
        {
          "option": "Give Claude the rule and keep the code check.",
          "correct": true,
          "explanation": "Give Claude the rule so it can choose a suitable meal. Keep the code check so the app accepts only compliant proposals."
        }
      ]
    },
    "notes": [
      "Ask: The app rejects the meal package, but Claude says it cannot see the catering policy. What should we change?",
      "Pause: Give everyone 10–15 seconds to choose. This is about where the rule belongs, before we work through the calculation.",
      "Show: Choose an answer to display its feedback. Compare what instructions help Claude do with what application code can enforce.",
      "Reveal: Give Claude the rule and keep the code check. Claude needs the cap to plan around it; the application still checks the result before accepting it. An app rejection alone does not send that rule back to Claude.",
      "Say: New Completed demo sessions receive the cap in their instructions. Lab starter intentionally leaves it out. You will implement the application check, then state the rule in an explicit same-session revision request.",
      "Transition: First define exactly what the catering check should accept and reject."
    ],
    "sources": []
  },
  {
    "id": "lab-policy-requirement",
    "phase": "lab",
    "kind": "task",
    "title": "9. Specify the catering policy",
    "minutes": 3.5,
    "bullets": [
      "Add an application rule: catering costs at most $70 per person per day.",
      "The hosted checker can pass a plan that this extra business rule rejects."
    ],
    "task": {
      "goal": "Define the catering rule before writing code.",
      "steps": [
        "Compare the instructions, hosted checker and application policy.",
        "Calculate the daily per-person meal rate.",
        "Open Run policy check and run it in Terminal B. Expect FAIL policy."
      ],
      "change": "Current: instructions guide planning and the hosted checker validates fixture math, but learnerCateringPolicy accepts every proposal. Change: define an additional application acceptance rule.",
      "run": "npm run lab:check -- policy",
      "expected": "The check fails; the $70 boundary and units are clear.",
      "check": "The check fails; the $70 boundary and units are clear.",
      "files": [
        "lib/workshop-exercises.ts",
        "lib/managed/agent.ts",
        "lib/managed/fixtures/validate.py",
        "lib/managed/fixtures/venues.json",
        "scripts/lab-check.ts"
      ],
      "hints": [
        "budgetItems.amount is already the whole-group amount. The $70 threshold is not a whole-group cap.",
        "Identify the selected meal package using the catalog's kind: meals and exact name/label, rather than assuming one fixed row order.",
        "Boundary inputs isolate the new rule; the existing fixture-pricing validation is checked separately."
      ]
    },
    "notes": [
      "Say: This is a business rule we are adding to Offsite, not a built-in Managed Agents catering policy. Completed demo already tells new sessions the cap and enforces it in code. Lab starter intentionally leaves the cap out of its instructions and begins with Table A, so you can implement and test the missing application check.",
      "Show: Use the reference tabs to trace OFFSITE_SYSTEM in lib/managed/agent.ts, the solution-only system override in lib/managed/transport.ts → createTransport, and lib/managed/fixtures/validate.py → validate. The hosted checker checks prices and total against plan.budget, not the catering rate. Compare the meal’s unit price with its group total.",
      "Pause: Give learners two minutes to run npm run lab:check -- policy, inspect its boundary cases and write the denominator. Keep Show solution closed.",
      "Say: The checkpoint is a failing check and a precise requirement: $70 passes, $71 fails. Convert the whole-group meal amount to a daily per-person rate; match the meal by its catalog name.",
      "If stuck: Dividing only by people leaves the meal total for the whole trip. The second unit in the requirement is per day.",
      "Watch for: A tool permission policy decides whether an operation may execute. This TypeScript policy decides whether our product accepts the resulting proposal.",
      "Transition: Implement that acceptance decision without changing the agent’s hosted checker."
    ],
    "sources": [
      {
        "label": "Managed Agents tool permission policies",
        "url": "https://platform.claude.com/docs/en/managed-agents/permission-policies"
      }
    ],
    "section": "Add a product policy",
    "visual": "evidence",
    "code": [
      {
        "title": "Run policy check",
        "language": "bash",
        "value": "npm run lab:check -- policy",
        "variant": "command",
        "caption": "Terminal B, repository folder. Run before implementing the policy. FAIL policy is expected: the starter accepts an over-limit meal. The next task is to fix it."
      },
      {
        "title": "Current policy function",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "exercise",
        "source": {
          "path": "lib/workshop-exercises.ts",
          "start": "export function learnerCateringPolicy(",
          "end": "// END policy"
        },
        "caption": "This complete function comes from the editable exercise file. Replace only this function; keep the other exercises. Local deck: refresh after editing. A deployed deck shows its build snapshot.",
        "annotations": [
          {
            "find": "export function learnerCateringPolicy(",
            "label": "Edit this complete function"
          }
        ]
      },
      {
        "title": "Planning fixtures",
        "language": "json",
        "value": "",
        "file": "lib/managed/fixtures/venues.json",
        "variant": "reference",
        "source": {
          "path": "lib/managed/fixtures/venues.json"
        },
        "annotations": [
          {
            "find": "\"name\": \"Chicago Table A (fictional)\"",
            "label": "Premium meal package used in the walkthrough"
          }
        ]
      },
      {
        "title": "Complete offline checker",
        "language": "typescript",
        "value": "",
        "file": "scripts/lab-check.ts",
        "variant": "reference",
        "source": {
          "path": "scripts/lab-check.ts"
        }
      },
      {
        "title": "Base agent instructions",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/agent.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/agent.ts",
          "start": "export const OFFSITE_SYSTEM ="
        },
        "caption": "Shared planning instructions used by Lab starter. Completed sessions append the $70 cap separately when they are created.",
        "annotations": [
          {
            "find": "run python3 /mnt/session/uploads/validate.py",
            "label": "Ask Claude to run the deterministic hosted checker"
          }
        ]
      },
      {
        "title": "Hosted checker",
        "language": "python",
        "value": "",
        "file": "lib/managed/fixtures/validate.py",
        "variant": "reference",
        "source": {
          "path": "lib/managed/fixtures/validate.py"
        },
        "caption": "Checks fixture prices, structure, schedule and total against plan.budget. It does not enforce the application’s $70 catering rule.",
        "annotations": [
          {
            "find": "if sum(costs.values()) > plan[\"budget\"]:",
            "label": "Compare total cost to the budget in the generated proposal"
          }
        ]
      },
      {
        "title": "Completed session instructions",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/transport.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/transport.ts",
          "start": "async create(city, owner) {",
          "end": "async session(id) {"
        },
        "caption": "New solution sessions receive the cap in a system override. Learner sessions omit it; existing sessions are not retroactively changed. The full transport file is shown in the session-creation task.",
        "annotations": [
          {
            "find": "runtime.mode === \"solution\"",
            "label": "Append the catering instruction only for the completed version"
          },
          {
            "find": "Application catering policy: at most",
            "label": "Tell Claude the rule before it plans"
          }
        ]
      }
    ]
  },
  {
    "id": "lab-policy-implement",
    "phase": "lab",
    "kind": "task",
    "title": "10. Implement and verify the policy",
    "minutes": 7,
    "bullets": [
      "Reject a proposal in application code when its catering rate exceeds $70.",
      "Tell the agent the rule and request a cheaper meal option in the same session."
    ],
    "task": {
      "goal": "Implement the catering rule independently.",
      "steps": [
        "Write learnerCateringPolicy before opening the solution.",
        "Save, then run the policy check in Terminal B until PASS policy.",
        "Reconnect, review the revision draft and press Send."
      ],
      "change": "Current: the policy returns []. Change: enforce the $70 normalized rate at application acceptance without changing hosted fixture validation.",
      "run": "npm run lab:check -- policy. Then Reconnect and submit the explicit revision request in /lab.",
      "expected": "PASS policy; a compliant revision can be accepted.",
      "check": "PASS policy; a compliant revision can be accepted.",
      "files": [
        "lib/workshop-exercises.ts",
        "lib/managed/workshop.ts",
        "lib/managed/conversation.ts"
      ],
      "hints": [
        "The app first performs base schema/fixture validation, then calls the learner policy. The policy can work with the validated OffsitePlan shape.",
        "Return an error with the actual rate, the $70 cap and the per-person-per-day unit. This helps a user request the right revision.",
        "The policy is application TypeScript, not a Managed Agents permission setting. No setup rerun or new session is needed. The read-only rejection sends no agent event; state the rule in the explicit revision.",
        "Write the denominator and $70/$71 boundary behavior first. Include a multi-day case that catches missing day normalization.",
        "Match the catalog meal name to the budget label. Return [] or an error with the actual rate, limit and units.",
        "If the saved plan already complies, use the deterministic fixtures to demonstrate rejection; keep the same session for revision."
      ],
      "bonus": {
        "question": "Can a proposal raise its own approved budget?",
        "answer": "Store the approved cap in application-owned session state. Reject a $6,500 proposal when the approved cap is $6,000, even if proposal.budget says $7,000. Add that deterministic test, and require an explicit user action to change the approved cap. Keep the required catering checks passing."
      }
    },
    "notes": [
      "Say: This is your independent exercise. Implement learnerCateringPolicy in application code. Find the selected meal package, calculate its daily per-person rate, and return either no errors or a clear explanation. Try the requirement and tests before opening the solution.",
      "Pause: Give four minutes of independent work. Help with the units or the failing case before offering code. Point fast finishers to the expandable approved-budget stretch on this slide.",
      "Show: After PASS policy, inspect readConversation in the Application policy gate tab. It calls validateProposal, then cateringErrors. An error sets conversation.proposal to null and leaves an idle hosted session available for a revision.",
      "Say: Reconnect to the Table A proposal and observe the rejection. The app’s revision action fills a draft that states the $70 cap and preserves the other requirements. Review it and press Send, or use the Table B request on this slide. Until you send, no feedback reaches Claude.",
      "If stuck: Trace cateringErrors in lib/managed/workshop.ts to your selected learner function. Match the meal label, divide by people and days, then inspect the $70 and $71 cases. Copy only this function after explaining the calculation.",
      "Watch for: Completed demo gives new sessions the rule in advance and executes lib/workshop-solutions.ts. Lab starter intentionally leaves that instruction out and executes your function. Older sessions may also need the rule stated explicitly. No validator change or provisioning rerun is needed.",
      "Transition: Keep this session. Next we will test a bug that could detach a follow-up from its history."
    ],
    "sources": [
      {
        "label": "Managed Agents tool permission policies",
        "url": "https://platform.claude.com/docs/en/managed-agents/permission-policies"
      }
    ],
    "section": "Add a product policy",
    "visual": "evidence",
    "prompt": "Use Chicago Table B (fictional) instead. Our catering cap is $70 per person per day. Keep the same people, days, goals and dietary needs, and recalculate the complete budget.",
    "code": [
      {
        "title": "Current policy function",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "exercise",
        "source": {
          "path": "lib/workshop-exercises.ts",
          "start": "export function learnerCateringPolicy(",
          "end": "// END policy"
        },
        "caption": "This complete function comes from the editable exercise file. Replace only this function; keep the other exercises. Local deck: refresh after editing. A deployed deck shows its build snapshot.",
        "annotations": [
          {
            "find": "export function learnerCateringPolicy(",
            "label": "Edit this complete function"
          }
        ]
      },
      {
        "title": "Run policy check",
        "language": "bash",
        "value": "npm run lab:check -- policy",
        "variant": "command",
        "caption": "Terminal B, repository folder. Rerun after saving learnerCateringPolicy. PASS policy verifies the $70 boundary across group sizes, trip lengths and cities; it does not send a revision to Claude."
      },
      {
        "title": "Show solution",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-solutions.ts",
        "variant": "after",
        "source": {
          "path": "lib/workshop-solutions.ts",
          "start": "export function learnerCateringPolicy(",
          "end": "// END policy"
        },
        "caption": "Complete reference answer. Lab starter executes your exercise function; Completed demo executes this answer. Explain the decision before copying.",
        "annotations": [
          {
            "find": "const rate = meal.amount / (proposal.attendees * proposal.days.length);",
            "label": "Normalize the whole-group total to the policy unit"
          },
          {
            "find": "return rate > CATERING_LIMIT_USD",
            "label": "Accept the exact boundary; reject only above it"
          }
        ]
      },
      {
        "title": "Application policy gate",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/conversation.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/conversation.ts",
          "start": "export async function readConversation(",
          "end": "export async function sendManagedMessage("
        },
        "annotations": [
          {
            "find": "const checked = validateProposal",
            "label": "First repeat base validation in application code"
          },
          {
            "find": "const errors = cateringErrors",
            "label": "Then apply this app’s business rule"
          },
          {
            "find": "conversation.proposal = null",
            "label": "Withhold the rejected proposal; no agent event is sent"
          }
        ]
      }
    ]
  },
  {
    "id": "lab-continuity-prediction",
    "phase": "lab",
    "section": "Debug session continuity",
    "kind": "decision",
    "title": "What proves the follow-up kept the same offsite?",
    "minutes": 0.5,
    "bullets": [],
    "activity": {
      "kind": "predict",
      "question": "We send “Reduce the budget to $4,000.” What evidence should we check before trusting that the original 12-person brief was retained?",
      "options": [
        "The same session ID and earlier events",
        "A confident-sounding answer",
        "The same reusable agent ID"
      ],
      "answer": "The same session ID and earlier events.",
      "explanation": "The session and events show that the earlier brief remains available, not that every requirement was fulfilled. The offline check separately executes the edited resolver and counts new-session creation.",
      "optionFeedback": [
        {
          "option": "The same session ID and earlier events",
          "correct": true,
          "explanation": "The same session keeps the earlier brief available. Check the resulting plan separately: retained history does not guarantee that every requirement was fulfilled."
        },
        {
          "option": "A confident-sounding answer",
          "correct": false,
          "explanation": "A new session can produce a convincing answer using defaults or inference. Wording alone does not prove the original conversation was retained."
        },
        {
          "option": "The same reusable agent ID",
          "correct": false,
          "explanation": "An agent ID identifies reusable configuration. Separate conversations can use the same agent while having different session IDs and histories."
        }
      ]
    },
    "notes": [
      "Ask: We send “Reduce the budget to $4,000.” What evidence shows that the original 12-person brief was retained?",
      "Pause: Allow 10–15 seconds before selecting an answer.",
      "Show: Choose an answer to display its feedback. Explain the deciding requirement or mistake, then use the reveal cue to connect the result to the lesson.",
      "Reveal: Check the same session ID and earlier events. That shows the earlier brief is available, not that every requirement was met. The shared agent ID only identifies configuration.",
      "Transition: Test session creation directly instead of grading how convincing the answer sounds."
    ],
    "sources": []
  },
  {
    "id": "lab-continuity-reproduce",
    "phase": "lab",
    "kind": "task",
    "title": "11. Reproduce the session bug",
    "minutes": 4.5,
    "bullets": [
      "The opt-in exercise creates a fresh session for a follow-up.",
      "Use session identity as evidence, not the apparent quality of the reply."
    ],
    "task": {
      "goal": "Find why a follow-up loses the conversation.",
      "steps": [
        "Open Run continuity check and run it in Terminal B. Expect FAIL continuity.",
        "Trace the existing token and create callback.",
        "Explain the cause before opening the solution."
      ],
      "change": "Current: the normal reference resolver reuses sessions. Change: exercise the isolated learner resolver, which currently always creates one.",
      "run": "npm run lab:check -- continuity. The browser defect command is optional and explicitly opt-in.",
      "expected": "FAIL continuity: the follow-up incorrectly creates a new session.",
      "check": "The offline check executes your resolver and exposes unnecessary creation.",
      "files": [
        "lib/workshop-exercises.ts",
        "lib/managed/workshop.ts",
        "app/api/lab/message/route.ts",
        "lib/managed/routes.ts"
      ],
      "hints": [
        "Agent ID is reusable configuration; it cannot substitute for the session ID that holds the previous conversation.",
        "The create callback is only needed when no existing session is attached.",
        "Do not compensate by copying the entire chat into a fresh session on every turn. Repair the lifecycle decision.",
        "Optional live reproduction: keep a completed Lab session attached, then restart with WORKSHOP_FAULT=continuity. Keep the flag enabled through repair verification; a faulty follow-up may create another paid session."
      ]
    },
    "notes": [
      "Say: Run the continuity check before editing. It executes your learner resolver with an existing session and counts creation calls. Normal browser follow-ups use the supplied resolver unless the optional fault mode is enabled, so browser success alone does not prove your edit ran.",
      "Show: Compare learnerSessionForTurn with the wrapper that calls it. Inspect the existing token and the create callback. State the hypothesis from that code before opening the answer.",
      "Pause: Give learners about three minutes to run the failure and trace the call. The checkpoint is FAIL continuity with a new identity and an unexpected creation call.",
      "If stuck: Follow what the starter does when existing already has a value. Creating a new token discards this app’s connection to the earlier session.",
      "Watch for: The optional live defect requires an attached completed Lab conversation, then a restart with WORKSHOP_FAULT=continuity. It affects /lab only and may start another paid session. Keep the flag enabled when verifying the repaired function live; the offline reproduction is sufficient for the core task.",
      "Transition: Fix the lifecycle decision while keeping separate offsites separate."
    ],
    "sources": [],
    "section": "Debug session continuity",
    "visual": "failure",
    "code": [
      {
        "title": "Run continuity check",
        "language": "bash",
        "value": "npm run lab:check -- continuity",
        "variant": "command",
        "caption": "Terminal B, repository folder. Run before editing the resolver. FAIL continuity is expected. This check simulates sessions locally; no API key or browser fault flag is needed."
      },
      {
        "title": "Current resolver",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "exercise",
        "source": {
          "path": "lib/workshop-exercises.ts",
          "start": "export async function learnerSessionForTurn(",
          "end": "// END continuity"
        },
        "caption": "This complete function comes from the editable exercise file. Replace only this function; keep the other exercises. Local deck: refresh after editing. A deployed deck shows its build snapshot.",
        "annotations": [
          {
            "find": "export async function learnerSessionForTurn(",
            "label": "Edit this complete function"
          }
        ]
      },
      {
        "title": "Live resolver wiring",
        "language": "typescript",
        "value": "",
        "file": "lib/managed/workshop.ts",
        "variant": "reference",
        "source": {
          "path": "lib/managed/workshop.ts",
          "start": "export async function sessionForMessage("
        },
        "caption": "The HTTP route calls this wrapper. Only the explicit fault mode selects the learner resolver."
      },
      {
        "title": "Optional browser reproduction",
        "language": "bash",
        "value": "WORKSHOP_FAULT=continuity npm run dev",
        "variant": "command",
        "caption": "Stop Terminal A first. Keep this flag enabled through live verification of your repair. A faulty follow-up may start a new paid session."
      }
    ]
  },
  {
    "id": "lab-continuity-fix",
    "phase": "lab",
    "kind": "task",
    "title": "12. Repair and verify session reuse",
    "minutes": 6,
    "bullets": [
      "Keep an existing session; create one only when there is none.",
      "Test both follow-up continuity and new-offsite isolation."
    ],
    "task": {
      "goal": "Keep follow-ups in their original session.",
      "steps": [
        "Reuse an existing token; otherwise create a session. Save the function.",
        "In Terminal B, run continuity, then all checks, tests and typecheck.",
        "Optional: verify live with the flag enabled, then remove it."
      ],
      "change": "Current: every call creates a new token. Change: branch on existing session ownership before creating anything.",
      "run": "npm run lab:check -- continuity, then npm run lab:check -- all, npm test and npm run typecheck.",
      "expected": "Your resolver passes continuity and isolation checks.",
      "check": "Your resolver passes continuity and isolation checks.",
      "files": [
        "lib/workshop-exercises.ts",
        "lib/managed/workshop.ts",
        "scripts/lab-check.ts"
      ],
      "hints": [
        "Returning existing avoids the creation side effect as well as retaining the right ID.",
        "Testing only follow-ups could hide a bug that accidentally shares one session between unrelated offsites.",
        "Keep the other three completed functions when copying a resolver answer. Do not overwrite the whole exercise file.",
        "The offline check executes your edited resolver. A normal browser follow-up bypasses it; keep WORKSHOP_FAULT=continuity enabled for optional live verification."
      ]
    },
    "notes": [
      "Say: Change only the resolver. Keep the supplied session when one exists; call create only when there is no session. Avoid the creation side effect, not just a different returned ID.",
      "Show: Run the continuity check again: it executes your edited resolver. Then run all four learner checks, the normal tests and typecheck. The checks cover both follow-ups and two independent new offsites.",
      "Pause: Give learners four minutes to implement and verify. The checkpoint is PASS continuity and four passing learner checks.",
      "Say: Reusing one global session would preserve history but mix unrelated offsites. Correct behavior preserves one conversation and still creates separate sessions for new work.",
      "If stuck: Use the existing token as the first branch. Preserve the other three edited functions if copying the resolver solution.",
      "Watch for: To verify live, keep WORKSHOP_FAULT=continuity enabled while sending a follow-up to an idle Lab session. Confirm the ID stays the same after your edit; then stop the server and restart normal npm run dev without the flag. Removing the flag first bypasses the edited resolver.",
      "Transition: Collect the evidence, then take the stretch task if time remains."
    ],
    "sources": [],
    "section": "Debug session continuity",
    "visual": "evidence",
    "code": [
      {
        "title": "Current resolver",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-exercises.ts",
        "variant": "exercise",
        "source": {
          "path": "lib/workshop-exercises.ts",
          "start": "export async function learnerSessionForTurn(",
          "end": "// END continuity"
        },
        "caption": "This complete function comes from the editable exercise file. Replace only this function; keep the other exercises. Local deck: refresh after editing. A deployed deck shows its build snapshot.",
        "annotations": [
          {
            "find": "export async function learnerSessionForTurn(",
            "label": "Edit this complete function"
          }
        ]
      },
      {
        "title": "Verify the repair",
        "language": "bash",
        "value": "npm run lab:check -- continuity\nnpm run lab:check -- all\nnpm test\nnpm run typecheck",
        "variant": "command",
        "caption": "Terminal B, repository folder. First expect PASS continuity. Then all should report PASS tools, PASS budget, PASS policy and PASS continuity. npm test and typecheck check the rest of the app."
      },
      {
        "title": "Show solution",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-solutions.ts",
        "variant": "after",
        "source": {
          "path": "lib/workshop-solutions.ts",
          "start": "export async function learnerSessionForTurn(",
          "end": "// END continuity"
        },
        "caption": "Complete reference answer. Lab starter executes your exercise function; Completed demo executes this answer. Explain the decision before copying.",
        "annotations": [
          {
            "find": "return existing ?? create();",
            "label": "Reuse first; create only when absent"
          }
        ]
      },
      {
        "title": "Disable the optional fault",
        "language": "bash",
        "value": "npm run dev",
        "variant": "command",
        "caption": "Only after verifying the repaired resolver with the flag still enabled: stop the server and run this normal command. Removing the flag switches back to the supplied resolver."
      }
    ]
  },
  {
    "id": "lab-complete",
    "phase": "lab",
    "kind": "task",
    "title": "13. Verify the build and try the stretch goal",
    "minutes": 2,
    "bullets": [
      "Show the managed run, the catering checks and the repaired session resolver.",
      "Stretch: enforce an approved budget that model output cannot change."
    ],
    "task": {
      "goal": "Show your evidence, then try the stretch.",
      "steps": [
        "After all four edits, run all in Terminal B. Expect four PASS results.",
        "Record the real session and accepted proposal.",
        "Stretch: enforce an approved budget outside model output."
      ],
      "change": "Current: all four learner seams are implemented. Change: document the evidence and select a justified next step; no additional required code.",
      "run": "npm run lab:check -- all",
      "expected": "Four checks pass and live evidence is identified.",
      "check": "Four checks pass and live evidence is identified.",
      "files": [
        "lib/workshop-exercises.ts",
        "docs/WORKSHOP.md"
      ],
      "hints": [
        "A canned plan is not live evidence. A synthetic test trace proves its invariant, not an API round trip.",
        "A one-response ticket summary may still fit Messages API even when another feature uses Managed Agents.",
        "If credentials blocked the live run, state that separately from passing offline checks."
      ],
      "bonus": {
        "question": "Stretch goal: can a generated proposal raise its own approved budget?",
        "answer": "Store the approved budget outside model output and check total cost against it. A test should reject a $6,500 proposal when the approved cap is $6,000, even when proposal.budget says $7,000. Define an explicit user action for changing that approved cap."
      }
    },
    "notes": [
      "Say: Show what you have proved: a real session and accepted proposal, the catering boundary checks, and a resolver that preserves follow-ups while separating new offsites. If live access was blocked, identify that honestly; the offline checks prove different things.",
      "Show: Run npm run lab:check -- all without the solution flag. Use the learner results, not the completed example, as evidence.",
      "Say: The stretch is to store the approved budget outside model output. With an approved $6,000 cap, reject a $6,500 plan even if proposal.budget claims $7,000. That closes a real gap in the current validator.",
      "Pause: Use this two-minute checkpoint to record evidence or outline the deterministic stretch test. Fast finishers can implement it; it is optional.",
      "If stuck: Keep the approved amount in application-owned session state, and require an explicit user action to change it.",
      "Transition: Let’s finish by naming what we learned from building and debugging the app."
    ],
    "sources": [
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      }
    ],
    "section": "Verify and extend",
    "visual": "evidence",
    "code": [
      {
        "title": "Run all checks",
        "language": "bash",
        "value": "npm run lab:check -- all",
        "variant": "command",
        "caption": "Terminal B, repository folder. Run after completing all four exercises. Expect PASS tools, PASS budget, PASS policy and PASS continuity. This checks your saved learner code; live evidence is a separate step."
      },
      {
        "title": "Full solution file",
        "language": "typescript",
        "value": "",
        "file": "lib/workshop-solutions.ts",
        "variant": "after",
        "caption": "The completed functions used by /agent. Your /lab version executes lib/workshop-exercises.ts. Copy only the function you need; never overwrite other learner work.",
        "source": {
          "path": "lib/workshop-solutions.ts"
        }
      }
    ]
  },
  {
    "id": "lab-recap",
    "phase": "lab",
    "section": "What we learned",
    "kind": "recap",
    "title": "What did we learn?",
    "minutes": 1,
    "bullets": [
      "Messages API: model access. Agent SDK: a loop you host. Managed Agents: a hosted loop and sessions.",
      "Configure an agent and environment; create a session for each task.",
      "Read events and send follow-ups to the same session.",
      "Instructions guide Claude; application code enforces business rules."
    ],
    "visual": "evidence",
    "notes": [
      "Say: Messages API gives model access. Agent SDK supplies a loop you host. Managed Agents operates the loop and maintains sessions. Setup prepares reusable agent and environment configuration; creating a session and sending a message starts a particular job.",
      "Show: Point to setup, the same session’s events and the passing application check in the evidence diagram.",
      "Pause: Ask one quick recall question: what would break if every follow-up created a new session? Take one short answer: the follow-up would lose the existing conversation.",
      "Say: Read events to observe work and send follow-ups to the same session. That keeps history available; it does not guarantee every requirement is satisfied. Instructions guide the plan. Application code enforces the rules for accepting it.",
      "Watch for: If live access was blocked, distinguish passing offline checks from a managed run you actually observed."
    ],
    "sources": [
      {
        "label": "Managed Agents overview",
        "url": "https://platform.claude.com/docs/en/managed-agents/overview"
      },
      {
        "label": "Managed Agents sessions",
        "url": "https://platform.claude.com/docs/en/managed-agents/sessions"
      },
      {
        "label": "Security risks and sandbox boundaries",
        "url": "https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks"
      }
    ]
  },
  {
    "id": "questions",
    "phase": "lab",
    "section": "Questions and next steps",
    "kind": "closing",
    "title": "Questions?",
    "minutes": 0,
    "bullets": [],
    "closing": {
      "subtitle": "Keep building with Claude Managed Agents.",
      "links": [
        { "label": "Lab repository", "href": "https://github.com/dannysullivan-ai/claude-managed-agents", "detail": "Starter, completed code and instructor guide" },
        { "label": "Official documentation", "href": "https://platform.claude.com/docs/en/managed-agents/overview", "detail": "Managed Agents concepts, setup and API reference" },
        { "label": "Try the stretch goal", "href": "#lab-complete", "detail": "Enforce an approved budget outside model output" }
      ]
    },
    "notes": [
      "Say: Thank you. The repository has the starter, completed functions and instructor guide. The documentation link is the place to continue exploring Managed Agents.",
      "Ask: What questions do you have about choosing an interface, running a session or keeping application rules in code?",
      "Show: Leave these links on screen during questions. Open the stretch goal only if someone wants to continue working on the approved-budget check.",
      "Timing: This is an optional closing screen after the 60-minute lab. The recap remains the final timed teaching slide."
    ],
    "sources": []
  }
];
