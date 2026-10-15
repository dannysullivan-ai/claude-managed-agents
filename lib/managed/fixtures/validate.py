"""Run inside the hosted sandbox: validate.py proposal.json venues.json. Standard library only."""
import json
import math
import re
import sys


def validate(plan, catalog):
    errors = []
    if not isinstance(plan, dict) or set(plan) != {"title", "city", "attendees", "budget", "days", "budgetItems", "rainPlan"}:
        return ["Use exactly the documented proposal fields."]
    city = plan.get("city")
    if city not in catalog["cities"]:
        return ["Unsupported city."]
    attendees, days = plan.get("attendees"), plan.get("days")
    if type(attendees) is not int or not 1 <= attendees <= 24:
        return ["Attendees must be an integer from 1 to 24."]
    if not isinstance(days, list) or not 1 <= len(days) <= 3:
        return ["Plan 1–3 days."]
    if type(plan.get("budget")) not in (int, float) or not math.isfinite(plan["budget"]) or not 0 <= plan["budget"] <= 100000:
        return ["Invalid whole-group budget."]
    if not isinstance(plan.get("title"), str) or not plan["title"].strip() or not isinstance(plan.get("rainPlan"), str) or not plan["rainPlan"].strip():
        errors.append("Include a title and rain plan.")
    rows = plan.get("budgetItems")
    if not isinstance(rows, list) or len(rows) != 5:
        return errors + ["Use five budget items: chosen room, meal package, activity, Local transport, Contingency."]
    costs = {}
    for row in rows:
        if not isinstance(row, dict) or set(row) != {"label", "amount"} or not isinstance(row["label"], str) or type(row["amount"]) not in (int, float) or not math.isfinite(row["amount"]) or row["amount"] < 0 or row["label"] in costs:
            return errors + ["Budget items need unique labels and nonnegative numeric USD amounts."]
        costs[row["label"]] = row["amount"]
    selected = [venue for venue in catalog["cities"][city] if venue["name"] in costs]
    for kind in ("room", "meals", "activity"):
        if sum(venue["kind"] == kind for venue in selected) != 1:
            errors.append("Choose exactly one fictional " + kind + " option.")
    for venue in selected:
        units = len(days) if venue["unit"] == "per_day" else attendees * len(days) if venue["unit"] == "per_person_per_day" else attendees
        expected = round(venue["costUsd"] * units, 2)
        if costs[venue["name"]] != expected:
            errors.append(f'{venue["name"]}: {venue["unit"]} requires {units} units, total ${expected}.')
        if venue.get("capacity", attendees) < attendees:
            errors.append("Chosen room cannot fit the group.")
    if costs.get("Local transport") != catalog["transportPerDayUsd"] * len(days):
        errors.append("Local transport is $120 per day for the group.")
    subtotal = sum(amount for label, amount in costs.items() if label != "Contingency")
    if costs.get("Contingency") != round(subtotal * catalog["contingencyRate"] + 1e-8, 2):
        errors.append("Contingency must be exactly 10% of other items, rounded to cents.")
    if sum(costs.values()) > plan["budget"]:
        errors.append("Whole-group total exceeds the user's budget.")
    allowed_locations = {venue["name"] for venue in selected} | {"Workshop room"}
    ids = set()
    for index, day in enumerate(days):
        if not isinstance(day, dict) or set(day) != {"day", "title", "stops"} or day["day"] != index + 1 or not isinstance(day["stops"], list) or not 2 <= len(day["stops"]) <= 6:
            errors.append("Days must be consecutive with a title and 2–6 stops.")
            continue
        end = 480
        for stop in day["stops"]:
            fields = {"id", "time", "title", "category", "durationMinutes", "location", "description"}
            if not isinstance(stop, dict) or set(stop) != fields or any(not isinstance(stop[k], str) or not stop[k].strip() for k in fields - {"durationMinutes"}) or not re.fullmatch(r"\d{2}:\d{2}", stop["time"]) or type(stop["durationMinutes"]) is not int or not 15 <= stop["durationMinutes"] <= 240:
                errors.append("Invalid stop fields, duration, or time.")
                continue
            hour, minute = map(int, stop["time"].split(":"))
            start = hour * 60 + minute
            if minute > 59 or start < end or start + stop["durationMinutes"] > 1260:
                errors.append("Stops overlap or fall outside 08:00–21:00.")
            end = start + stop["durationMinutes"]
            if stop["id"] in ids:
                errors.append("Stop IDs must be unique.")
            ids.add(stop["id"])
            if stop["location"] not in allowed_locations:
                errors.append("Use selected fictional venues or Workshop room as locations.")
    return errors


if __name__ == "__main__":
    try:
        with open(sys.argv[1]) as source:
            proposal = json.load(source)
        with open(sys.argv[2]) as source:
            catalog = json.load(source)
        errors = validate(proposal, catalog)
        print(json.dumps({"valid": not errors, "errors": errors}))
        sys.exit(1 if errors else 0)
    except (OSError, ValueError, KeyError, TypeError, IndexError) as error:
        print(json.dumps({"valid": False, "errors": [str(error)]}))
        sys.exit(1)
