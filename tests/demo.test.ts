import assert from "node:assert/strict";
import test from "node:test";
import { createDemoReply, getSampleProposal } from "../lib/demo";
import { CITIES } from "../lib/types";

test("every city's group budget covers the sample without exceeding its cap", () => {
  for (const city of CITIES) {
    const plan = getSampleProposal(city);
    assert.equal(plan.attendees, 12);
    assert.equal(plan.budget, 6000);
    assert.equal(plan.days.length, 2);
    assert.ok(plan.budgetItems.every((item) => Number.isFinite(item.amount) && item.amount > 0));
    const total = plan.budgetItems.reduce((sum, item) => sum + item.amount, 0);
    assert.ok(total <= plan.budget, `${city}: $${total} exceeds the $${plan.budget} cap.`);
    for (const required of [/meeting room/i, /meals/i, /activity/i, /contingency/i]) {
      assert.ok(plan.budgetItems.some((item) => required.test(item.label)));
    }
    assert.ok(plan.budgetItems.every((item) => !/hotels?|flights?/i.test(item.label)));
  }
});

test("each proposal stays in its selected city and uses unselected venue placeholders", () => {
  for (const city of CITIES) {
    const plan = getSampleProposal(city);
    assert.equal(plan.city, city);
    assert.ok(plan.title.includes(city));
    for (const otherCity of CITIES.filter((candidate) => candidate !== city)) {
      assert.ok(!JSON.stringify(plan).includes(otherCity));
    }
    const stops = plan.days.flatMap((day) => day.stops);
    assert.equal(new Set(stops.map((stop) => stop.id)).size, stops.length);
    assert.ok(stops.every((stop) => stop.location.includes("to be selected")));
    assert.ok(stops.some((stop) => /vegetarian/i.test(stop.description)));
    assert.ok(plan.rainPlan.includes("instead of the outdoor activity"));
  }
});

test("sample days have usable visit lengths and no overlapping sessions", () => {
  for (const city of CITIES) {
    const plan = getSampleProposal(city);
    plan.days.forEach((day, index) => {
      assert.equal(day.day, index + 1);
      let previousEnd = 0;
      for (const stop of day.stops) {
        assert.match(stop.time, /^(?:[01]\d|2[0-3]):[0-5]\d$/);
        const [hour, minute] = stop.time.split(":").map(Number);
        const start = hour * 60 + minute;
        assert.ok(stop.durationMinutes > 0);
        assert.ok(start >= previousEnd, `${city}: ${stop.title} overlaps another session.`);
        previousEnd = start + stop.durationMinutes;
        assert.ok(previousEnd <= 21 * 60);
      }
    });
  }
});

test("responses identify the sample and follow-ups do not imply research or revision", () => {
  for (const city of CITIES) {
    const first = createDemoReply(city);
    const followUp = createDemoReply(city, true);
    assert.match(first.message, /fixed .* sample/);
    assert.match(first.message, /nothing is researched or booked/);
    assert.match(first.message, /excluding hotels and flights/);
    assert.match(followUp.message, /sample is unchanged/);
    assert.match(followUp.message, /research and revisions are added in the next lab/);
    assert.deepEqual(followUp.proposal, first.proposal);
  }
});

test("callers can change a returned proposal without changing future samples", () => {
  for (const city of CITIES) {
    const expected = getSampleProposal(city);
    const changed = getSampleProposal(city);
    changed.title = "Changed title";
    changed.days[0].stops[0].description = "Changed session";
    changed.days[1].stops.pop();
    changed.budgetItems[0].amount = 1;
    assert.deepEqual(getSampleProposal(city), expected);
    const reply = createDemoReply(city);
    reply.proposal.days[0].stops.length = 0;
    reply.proposal.budgetItems.push({ label: "Unexpected", amount: 99999 });
    assert.deepEqual(createDemoReply(city, true).proposal, expected);
  }
});
