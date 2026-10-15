import { ArrowRight, RefreshCw } from "lucide-react";
import { isSetupFeedback, type ManagedFeedback } from "@/lib/managed/feedback";

type Props = {
  feedback: ManagedFeedback;
  hosted: boolean;
  hasSession: boolean;
  busy: boolean;
  canRevise: boolean;
  canRestore: boolean;
  onRead: () => void;
  onReset: () => void;
  onRevise: () => void;
  onRestore: () => void;
  onStep: (id: string) => void;
};

export function ManagedFeedbackPanel({ feedback, hosted, hasSession, busy, canRevise, canRestore, onRead, onReset, onRevise, onRestore, onStep }: Props) {
  const { code, message } = feedback;
  let title = "Something needs attention";
  let description = message;
  let command: string | undefined;
  let step: { id: string; label: string } | undefined;
  let read = false;
  let reset = false;
  const revision = code === "catering_policy" || code === "proposal_invalid";
  const guidance = isSetupFeedback(code) || code === "draft_restored";

  switch (code) {
    case "tools_incomplete":
      title = "Complete the tools exercise first";
      description = "Enable read, write, and bash in your lab code, then run the check below. This request did not start an agent run.";
      command = "npm run lab:check -- tools";
      step = { id: "lab-tools", label: "Open the tools exercise" };
      break;
    case "budget_invalid":
      title = "Complete the execution budget exercise";
      description = 'Set the $2 limit to "200" cents in your lab code, then run the check below. This request did not start an agent run.';
      command = "npm run lab:check -- budget";
      step = { id: "lab-execution-budget", label: "Open the budget exercise" };
      break;
    case "setup_required":
      title = "This app needs its agent setup";
      description = hosted
        ? "The instructor needs to configure this deployment. For your own lab, add the API key and run setup in your local checkout."
        : "Add your API key to .env.local, then run setup below. Restart the development server if the settings still appear missing.";
      command = "npm run setup:agent";
      step = { id: "lab-credentials", label: "Open the setup instructions" };
      break;
    case "delivery_unknown":
      title = "We couldn’t confirm delivery";
      description = "Check the saved messages before sending again. Your message has not been automatically retried.";
      read = true;
      break;
    case "connection_error":
      title = hasSession ? "We couldn’t read the session" : "We couldn’t check for a saved session";
      description = "Try reconnecting. This only reads saved work; it does not send your brief again.";
      read = true;
      break;
    case "service_unavailable":
      title = "Claude is unavailable for this request";
      description = `${message} Reconnecting only reads saved work; it does not retry your message.`;
      read = true;
      break;
    case "session_expired":
    case "session_access":
      title = "This browser can’t reopen that session";
      description = "Reset the session link, then send your brief again to start a new offsite. The previous conversation will not be carried over.";
      reset = true;
      break;
    case "execution_budget":
      title = "This session reached its $2 execution limit";
      description = "The agent has stopped. To plan again, start a new offsite and submit a new brief. The earlier conversation will not be carried over.";
      reset = true;
      break;
    case "approval_required":
      title = "A tool is waiting for approval";
      description = "This lab does not provide an approval flow. Check the tools configuration, then start a new offsite with the corrected settings.";
      step = { id: "lab-tools", label: "Review the tools configuration" };
      reset = true;
      break;
    case "session_stopped":
    case "request_refused":
      title = code === "request_refused" ? "Claude could not help with this request" : "This session has stopped";
      description = "Review the conversation above. To try another brief, start a new offsite. The previous conversation will not be carried over.";
      reset = true;
      break;
    case "city_locked":
      title = "This session already has a destination";
      description = "Start a new offsite to choose a different city, then submit a new brief.";
      reset = true;
      break;
    case "session_busy":
      title = "The agent is still working";
      description = "Wait for this turn to finish before sending another message. Read its latest progress below.";
      read = true;
      break;
    case "catering_policy":
      title = "The meals are over the catering limit";
      break;
    case "proposal_invalid":
      title = "The proposal needs a correction";
      break;
    case "output_pending":
      title = "The saved proposal isn’t available yet";
      description = "The session history is still available. Check again for the output; you do not need to resend the brief.";
      read = true;
      break;
    case "draft_restored":
      title = "Your message is back in the draft";
      description = "Review the saved conversation before you press Send. Nothing has been resent.";
      break;
    case "request_invalid":
      title = "Check your request";
      break;
  }

  return <section className={`managed-feedback ${guidance ? "is-guidance" : "is-warning"}`} role={guidance ? "status" : "alert"}>
    <h3>{title}</h3>
    <p>{description}</p>
    {(code === "tools_incomplete" || code === "budget_invalid") && hosted && <p className="managed-feedback-context">This hosted page shows the unfinished starter. Make your changes in your local checkout, then test in the app running on localhost.</p>}
    {command && <><p className="managed-feedback-context">Run in a second terminal, from your repository folder. Leave npm run dev running in the first.</p><code className="managed-feedback-command">{command}</code></>}
    <div className="managed-error-actions">
      {step && <button onClick={() => onStep(step.id)}>{step.label}<ArrowRight size={14} /></button>}
      {revision && <button onClick={onRevise} disabled={!canRevise}>{code === "catering_policy" ? "Revise to meet the $70 limit" : "Draft a revision"}</button>}
      {read && <button onClick={onRead} disabled={busy}><RefreshCw size={13} />{hasSession || code === "delivery_unknown" ? "Check history" : "Try reconnecting"}</button>}
      {reset && <button onClick={onReset} disabled={busy}>{code === "session_expired" || code === "session_access" ? "Reset session link" : "Start a new offsite"}</button>}
      {code === "delivery_unknown" && <button onClick={onRestore} disabled={!canRestore}>Return message to draft</button>}
    </div>
    {revision && <p className="managed-feedback-context">This fills the composer with a revision request. Review it, then press Send.</p>}
  </section>;
}
