import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Exact public source files only. Keep in sync with WORKSHOP_SOURCE_FILES.
  // Static /workshop builds serialize the snippets; this also covers a future
  // server-rendered workshop without depending on broad filesystem tracing.
  outputFileTracingIncludes: {
    "/workshop": [
      "./lib/demo.ts",
      "./lib/types.ts",
      "./lib/managed/agent.ts",
      "./lib/managed/config.ts",
      "./lib/managed/transport.ts",
      "./lib/managed/conversation.ts",
      "./lib/managed/validation.ts",
      "./lib/managed/session-token.ts",
      "./lib/managed/http.ts",
      "./lib/managed/routes.ts",
      "./lib/managed/workshop.ts",
      "./lib/managed/fixtures/validate.py",
      "./lib/managed/fixtures/venues.json",
      "./lib/workshop-exercises.ts",
      "./lib/workshop-solutions.ts",
      "./scripts/setup-agent.ts",
      "./scripts/smoke-managed.ts",
      "./scripts/lab-check.ts",
      "./app/api/chat/route.ts",
      "./app/api/managed/message/route.ts",
      "./app/api/managed/session/route.ts",
      "./app/api/lab/message/route.ts",
      "./app/api/lab/session/route.ts",
    ],
  },
};
export default config;
