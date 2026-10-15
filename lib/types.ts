export const CITIES = ["Chicago", "New York", "San Francisco"] as const;
export type City = (typeof CITIES)[number];

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type OffsiteStop = {
  id: string;
  time: string;
  title: string;
  category: string;
  durationMinutes: number;
  location: string;
  description: string;
};

export type OffsiteDay = {
  day: number;
  title: string;
  stops: OffsiteStop[];
};

export type BudgetItem = { label: string; amount: number };

export type OffsitePlan = {
  title: string;
  city: City;
  attendees: number;
  budget: number;
  days: OffsiteDay[];
  budgetItems: BudgetItem[];
  rainPlan: string;
};

export type OffsiteReply = { message: string; proposal: OffsitePlan };
