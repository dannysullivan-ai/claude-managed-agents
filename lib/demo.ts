import type { City, OffsitePlan, OffsiteReply } from "./types";

const CITY_SAMPLES: Record<City, {
  activityTitle: string;
  activityDescription: string;
  meetingRoom: number;
  meals: number;
  activities: number;
}> = {
  Chicago: {
    activityTitle: "A city-design team walk",
    activityDescription: "Small teams look for examples of thoughtful design, then compare notes. The route and facilitator are still to be selected.",
    meetingRoom: 1800,
    meals: 2160,
    activities: 600,
  },
  "New York": {
    activityTitle: "A neighborhood observation challenge",
    activityDescription: "Small teams gather ideas from a neighborhood walk and share what surprised them. The route and facilitator are still to be selected.",
    meetingRoom: 2100,
    meals: 2280,
    activities: 540,
  },
  "San Francisco": {
    activityTitle: "A waterfront team walk",
    activityDescription: "Pair up for a walking conversation, then regroup to exchange ideas. The waterfront route and facilitator are still to be selected.",
    meetingRoom: 2000,
    meals: 2160,
    activities: 600,
  },
};

/** Fixed illustrative content. No request parsing, venue research or model calls. */
export function getSampleProposal(city: City): OffsitePlan {
  const sample = CITY_SAMPLES[city];
  return {
    title: `Two days together in ${city}`,
    city,
    attendees: 12,
    budget: 6000,
    days: [
      {
        day: 1,
        title: "Connect, align, and make space",
        stops: [
          {
            id: "day-1-priorities", time: "09:00", title: "Align on team priorities", category: "Workshop", durationMinutes: 120,
            location: "Workshop venue · to be selected",
            description: "Start with a team check-in, agree on the outcomes for the offsite, and choose the problems to work through together.",
          },
          {
            id: "day-1-lunch", time: "12:00", title: "Team lunch", category: "Meal", durationMinutes: 75,
            location: "Lunch venue · to be selected",
            description: "Specify substantial vegetarian mains. Confirm dietary counts, allergies and ingredients with the chosen venue before booking.",
          },
          {
            id: "day-1-workshop", time: "14:00", title: "Work through the hard problems", category: "Workshop", durationMinutes: 150,
            location: "Workshop venue · to be selected",
            description: "Work in small groups, compare options, and capture decisions. Include a short break midway through the session.",
          },
          {
            id: "day-1-dinner", time: "18:00", title: "Dinner, with room to talk", category: "Meal", durationMinutes: 90,
            location: "Dinner venue · to be selected",
            description: "Request a table for 12 and vegetarian main-course choices. Leave the evening open for conversation; no reservation has been made.",
          },
        ],
      },
      {
        day: 2,
        title: "Explore, decide, and leave with a plan",
        stops: [
          {
            id: "day-2-experiments", time: "09:00", title: "Turn ideas into experiments", category: "Workshop", durationMinutes: 90,
            location: "Workshop venue · to be selected",
            description: "Review yesterday's decisions and turn the most useful ideas into small, testable next steps.",
          },
          {
            id: "day-2-activity", time: "11:00", title: sample.activityTitle, category: "Team activity", durationMinutes: 90,
            location: "Outdoor route · to be selected",
            description: sample.activityDescription,
          },
          {
            id: "day-2-lunch", time: "13:00", title: "Lunch and shared discoveries", category: "Meal", durationMinutes: 60,
            location: "Lunch venue · to be selected",
            description: "Compare notes from the activity over lunch. Carry the agreed vegetarian choices and dietary requirements into this meal.",
          },
          {
            id: "day-2-commitments", time: "14:30", title: "Decide owners and next steps", category: "Workshop", durationMinutes: 90,
            location: "Workshop venue · to be selected",
            description: "Choose owners, record the next actions, and agree on a follow-up date. Finish with a short team reflection.",
          },
        ],
      },
    ],
    // Illustrative allowances for the whole group, not venue quotes.
    // Hotels and flights are outside this sample budget.
    budgetItems: [
      { label: "Meeting room · 2 days", amount: sample.meetingRoom },
      { label: "Meals & refreshments · 12 people", amount: sample.meals },
      { label: "Team activity", amount: sample.activities },
      { label: "Local transport allowance", amount: 360 },
      { label: "Contingency", amount: 600 },
    ],
    rainPlan: "Use the workshop room for a 90-minute collaborative design challenge instead of the outdoor activity. Confirm room access and any additional charge before booking.",
  };
}

export function createDemoReply(city: City, isFollowUp = false): OffsiteReply {
  return {
    message: isFollowUp
      ? "The saved sample is unchanged. Real venue research and revisions are added in the next lab."
      : `Here's the fixed ${city} sample: 2 days, 12 people, and a $6,000 budget excluding hotels and flights. Venues and costs are illustrative; nothing is researched or booked.`,
    proposal: getSampleProposal(city),
  };
}
