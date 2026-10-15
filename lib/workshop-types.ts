export type WorkshopCode = {
  title: string;
  language: "typescript" | "bash" | "json" | "python";
  value: string;
  focusLines?: number[];
  file?: string;
  startLine?: number;
  variant?: "reference" | "before" | "after" | "exercise" | "command" | "output";
  caption?: string;
  annotations?: { find: string; label: string }[];
  source?: { path: string; start?: string; end?: string };
};

export type WorkshopActivity = {
  kind: "predict" | "challenge" | "discuss";
  question: string;
  options?: string[];
  optionFeedback?: { option: string; correct: boolean; explanation: string }[];
  answer: string;
  explanation?: string;
};

export type WorkshopSlide = {
  id: string;
  phase: "teach" | "lab";
  kind: "title" | "concept" | "decision" | "demo" | "task" | "recap" | "closing";
  title: string;
  minutes: number;
  bullets: string[];
  visual?: "welcome-overview" | "demo-return" | "brief" | "project" | "lab-path" | "ownership" | "resources" | "lifecycle" | "boundary" | "evidence" | "failure" | "definition" | "loop" | "comparison" | "tradeoffs" | "composition" | "infrastructure" | "execution" | "credentials" | "customization" | "intro" | "support-definition" | "support-loop";
  prompt?: string;
  demoAction?: string;
  closing?: { subtitle: string; links: { label: string; href: string; detail: string }[] };
  welcome?: { organization: string; date: string; format: string; subtitle?: string; titleLines?: string[] };
  section?: string;
  activity?: WorkshopActivity;
  activities?: WorkshopActivity[];
  code?: WorkshopCode[];
  task?: {
    goal: string;
    steps: string[];
    check: string;
    hints: string[];
    files: string[];
    change?: string;
    run?: string;
    expected?: string;
    bonus?: { question: string; answer: string };
  };
  notes: string[];
  sources: { label: string; url: string }[];
};
