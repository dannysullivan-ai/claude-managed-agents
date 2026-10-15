import venues from "./fixtures/venues.json";
import { CITIES } from "../types";
import type { City, OffsitePlan } from "../types";

type Obj = Record<string, unknown>;
const object = (value: unknown): value is Obj => Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown, max = 600): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const number = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const integer = (value: unknown, min: number, max: number) => number(value) && Number.isInteger(value) && value >= min && value <= max;
const exact = (value: Obj, keys: string[]) => Object.keys(value).length === keys.length && keys.every((key) => key in value);
const money = (amount: number) => Math.round(amount * 100) / 100;

/** Application-owned acceptance boundary. The hosted agent cannot bypass these checks. */
export function validateProposal(input: unknown, city: City): { proposal: OffsitePlan | null; errors: string[] } {
  const errors: string[] = [];
  if (!object(input) || !exact(input, ["title", "city", "attendees", "budget", "days", "budgetItems", "rainPlan"])) return { proposal: null, errors: ["Proposal must contain the documented fields only."] };
  if (!text(input.title, 160) || !text(input.rainPlan, 1500) || input.city !== city || !CITIES.includes(city)) errors.push("Use the pinned city, a short title, and a rain plan.");
  if (!integer(input.attendees, 1, 24) || !number(input.budget) || input.budget < 0 || input.budget > 100_000) errors.push("Use 1–24 attendees and a whole-group USD budget from 0 to 100,000.");
  if (!Array.isArray(input.days) || input.days.length < 1 || input.days.length > 3) return { proposal: null, errors: [...errors, "Plan 1–3 days."] };
  const ids = new Set<string>();
  input.days.forEach((day, index) => {
    if (!object(day) || !exact(day, ["day", "title", "stops"]) || day.day !== index + 1 || !text(day.title, 160) || !Array.isArray(day.stops) || day.stops.length < 2 || day.stops.length > 6) { errors.push(`Day ${index + 1} needs a title and 2–6 stops.`); return; }
    let end = 8 * 60;
    for (const stop of day.stops) {
      if (!object(stop) || !exact(stop, ["id", "time", "title", "category", "durationMinutes", "location", "description"]) || !["id", "title", "category", "location", "description"].every((key) => text(stop[key])) || typeof stop.time !== "string" || !/^\d{2}:\d{2}$/.test(stop.time) || !integer(stop.durationMinutes, 15, 240)) { errors.push("Each stop needs the documented fields, a 24-hour time, and a 15–240 minute duration."); continue; }
      const [hour, minute] = stop.time.split(":").map(Number);
      const start = hour * 60 + minute;
      if (minute > 59 || start < end || start + (stop.durationMinutes as number) > 21 * 60) errors.push("Stops must not overlap and must fit between 08:00 and 21:00.");
      end = start + (stop.durationMinutes as number);
      if (ids.has(stop.id as string)) errors.push("Stop IDs must be unique.");
      ids.add(stop.id as string);
    }
  });
  if (!Array.isArray(input.budgetItems) || input.budgetItems.length !== 5) return { proposal: null, errors: [...errors, "Use exactly five budget items: room, meals, activity, Local transport, Contingency."] };
  const items = new Map<string, number>();
  for (const item of input.budgetItems) {
    if (!object(item) || !exact(item, ["label", "amount"]) || !text(item.label, 160) || !number(item.amount) || item.amount < 0 || money(item.amount) !== item.amount || items.has(item.label)) { errors.push("Budget items need unique labels and nonnegative USD amounts with at most two decimals."); continue; }
    items.set(item.label, item.amount);
  }
  const selected = venues.cities[city].filter((venue) => items.has(venue.name));
  for (const kind of ["room", "meals", "activity"]) if (selected.filter((venue) => venue.kind === kind).length !== 1) errors.push(`Select exactly one fictional ${kind} option from ${city}.`);
  if (selected.length === 3 && number(input.attendees)) {
    for (const venue of selected) {
      const units = venue.unit === "per_day" ? input.days.length : venue.unit === "per_person_per_day" ? input.attendees * input.days.length : input.attendees;
      if (items.get(venue.name) !== money(venue.costUsd * units)) errors.push(`${venue.name}: multiply ${venue.unit} cost $${venue.costUsd} by ${units}.`);
      if ("capacity" in venue && number(venue.capacity) && input.attendees > venue.capacity) errors.push("The chosen room is too small for the group.");
    }
  }
  if (items.get("Local transport") !== venues.transportPerDayUsd * input.days.length) errors.push("Local transport is $120 per day for the group.");
  const subtotal = [...items].filter(([label]) => label !== "Contingency").reduce((total, [, amount]) => total + amount, 0);
  if (items.get("Contingency") !== money(subtotal * venues.contingencyRate)) errors.push("Contingency must be 10% of the other four items, rounded to cents.");
  if (number(input.budget) && money([...items.values()].reduce((total, amount) => total + amount, 0)) > input.budget) errors.push("The whole-group total exceeds the user's budget.");
  const allowedLocations = new Set([...selected.map((venue) => venue.name), "Workshop room"]);
  for (const day of input.days) if (object(day) && Array.isArray(day.stops)) for (const stop of day.stops) if (object(stop) && !allowedLocations.has(String(stop.location))) errors.push("Stop locations must use the selected fictional options or Workshop room.");
  return { proposal: errors.length ? null : input as unknown as OffsitePlan, errors };
}
