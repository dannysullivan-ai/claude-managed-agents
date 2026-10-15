/** Local inputs for offline exercises. No credentials, SDK client, or network. */
import venues from "../lib/managed/fixtures/venues.json";
import type { City, OffsitePlan } from "../lib/types";

export function labProposal(city: City = "Chicago", mealIndex = 2, attendees = 12, dayCount = 2): OffsitePlan {
  const options = venues.cities[city];
  const room = options[0], meal = options[mealIndex], activity = options[4];
  const subtotal = room.costUsd * dayCount + meal.costUsd * attendees * dayCount
    + activity.costUsd * attendees + venues.transportPerDayUsd * dayCount;
  return {
    title: `A fictional ${city} offsite`, city, attendees, budget: 10_000,
    days: Array.from({ length: dayCount }, (_, index) => ({ day: index + 1, title: "Collaborate", stops: [
      { id: `work-${index}`, time: "09:00", title: "Workshop", category: "Workshop", durationMinutes: 120, location: room.name, description: "Work together." },
      { id: `meal-${index}`, time: "12:00", title: "Lunch", category: "Meal", durationMinutes: 60, location: meal.name, description: "Vegetarian choices." },
    ] })),
    budgetItems: [
      { label: room.name, amount: room.costUsd * dayCount },
      { label: meal.name, amount: meal.costUsd * attendees * dayCount },
      { label: activity.name, amount: activity.costUsd * attendees },
      { label: "Local transport", amount: venues.transportPerDayUsd * dayCount },
      { label: "Contingency", amount: Math.round(subtotal * venues.contingencyRate * 100) / 100 },
    ],
    rainPlan: "Use the included workshop room for an indoor team exercise.",
  };
}
