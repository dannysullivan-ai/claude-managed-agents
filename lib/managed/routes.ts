/** One server, two fixed implementations. Each owns its own authenticated cookie. */
import type { NextRequest } from "next/server";
import { getManagedConfig, ManagedError } from "./config";
import type { ManagedConfig } from "./config";
import { emptyConversation, readConversation, sendManagedMessage, startSession } from "./conversation";
import { conversationResponse, failureResponse, requestBody, requestSession, requireSameOrigin } from "./http";
import { createTransport } from "./transport";
import type { ManagedTransport } from "./transport";
import type { SessionToken } from "./session-token";
import { learnerSessionOverrides, sessionForMessage, workshopRuntime } from "./workshop";
import type { ExerciseImplementation, WorkshopRuntime } from "./workshop";

type Implementation = "solution" | "learner";
type Dependencies = {
  config?: () => ManagedConfig;
  transport?: (config: ManagedConfig, runtime: WorkshopRuntime) => ManagedTransport;
  env?: Record<string, string | undefined>;
  exercises?: ExerciseImplementation;
};
export const IMPLEMENTATION_COOKIES = { solution: "offsite_solution_session", learner: "offsite_lab_session" } as const;

export function createManagedRoutes(implementation: Implementation, dependencies: Dependencies = {}) {
  const cookieName = IMPLEMENTATION_COOKIES[implementation];
  function context() {
    // URL selects implementation; process-wide mode cannot turn the lab into the answer.
    const runtime = workshopRuntime({ ...(dependencies.env ?? process.env), WORKSHOP_IMPLEMENTATION: implementation }, dependencies.exercises);
    const configured = (dependencies.config ?? getManagedConfig)();
    // A cookie copied under the other version's name also fails authentication.
    const config = { ...configured, secret: `${configured.secret}:${implementation}` };
    return { config, runtime };
  }
  function transportFor(config: ManagedConfig, runtime: WorkshopRuntime) {
    learnerSessionOverrides(runtime); // Fail locally before network if learner configuration is unfinished.
    return dependencies.transport?.(config, runtime) ?? createTransport(config, { workshop: runtime });
  }

  async function GET(request: NextRequest) {
    try {
      if (!request.cookies.get(cookieName)?.value) return conversationResponse(emptyConversation());
      const { config, runtime } = context();
      const token = requestSession(request, config, cookieName);
      return conversationResponse(token
        ? await readConversation(token, transportFor(config, runtime), Date.now(), runtime)
        : emptyConversation());
    } catch (error) { return failureResponse(error, undefined, undefined, cookieName); }
  }
  // END GET

  async function POST(request: NextRequest) {
    try {
      requireSameOrigin(request);
      const { city } = await requestBody(request);
      const { config, runtime } = context();
      const transport = transportFor(config, runtime);
      let token = requestSession(request, config, cookieName);
      if (token && token.city !== city) throw new ManagedError("Start a new offsite to change cities, then submit a new brief.", 409, "city_locked");
      if (token) return conversationResponse(await readConversation(token, transport, Date.now(), runtime));
      token = await startSession(city, transport);
      return conversationResponse({ ...emptyConversation(), id: token.sessionId, city }, { token, secret: config.secret, cookieName });
    } catch (error) { return failureResponse(error, undefined, undefined, cookieName); }
  }
  // END POST

  async function DELETE(request: NextRequest) {
    try {
      requireSameOrigin(request);
      return conversationResponse(emptyConversation(), { clear: true, cookieName });
    } catch (error) { return failureResponse(error, undefined, undefined, cookieName); }
  }
  // END DELETE

  async function messagePOST(request: NextRequest) {
    let token: SessionToken | undefined;
    let secret: string | undefined;
    try {
      requireSameOrigin(request);
      const { city, message } = await requestBody(request);
      if (!message) throw new ManagedError("Include a message.", 400);
      const { config, runtime } = context();
      secret = config.secret;
      token = requestSession(request, config, cookieName) ?? undefined;
      if (token && token.city !== city) throw new ManagedError("Start a new offsite to change cities, then submit a new brief.", 409, "city_locked");
      const transport = transportFor(config, runtime);
      token = await sessionForMessage(token, () => startSession(city, transport), runtime);
      return conversationResponse(await sendManagedMessage(token, message, transport), { token, secret, cookieName });
    } catch (error) { return failureResponse(error, token, secret, cookieName); }
  }
  // END messagePOST

  return { GET, POST, DELETE, messagePOST };
}
