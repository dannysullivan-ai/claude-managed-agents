import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { POST } from "../app/api/chat/route";
import { CITIES } from "../lib/types";
import { createDemoReply } from "../lib/demo";

function request(body: unknown, headers: Record<string, string> = {}, url = "http://localhost:3000/api/chat") {
  return new NextRequest(url, {
    method: "POST",
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000", "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

test("each supported city returns its fixed proposal and disables response caching", async () => {
  for (const city of CITIES) {
    const response = await POST(request({ message: "Plan an offsite for our team.", city }));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), createDemoReply(city));
  }
});

test("demo does not pretend to interpret arbitrary requests and explicitly selects its prepared follow-up", async () => {
  const first = await POST(request({ message: "A custom request with unimplemented constraints", city: "Chicago" }));
  const second = await POST(request({ message: "Something completely different", city: "Chicago" }));
  assert.deepEqual(await first.json(), await second.json());
  const followUp = await POST(request({ message: "Revise it", city: "New York", isFollowUp: true }));
  assert.deepEqual(await followUp.json(), createDemoReply("New York", true));
});

test("demo execution ignores old managed configuration and never needs a credential", async () => {
  const previousMode = process.env.AGENT_MODE;
  process.env.AGENT_MODE = "managed";
  try {
    const response = await POST(request({ message: "Show the sample", city: "San Francisco" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), createDemoReply("San Francisco"));
  } finally {
    if (previousMode === undefined) delete process.env.AGENT_MODE;
    else process.env.AGENT_MODE = previousMode;
  }
});

test("origin guard accepts the browser-facing dev Host but rejects cross-site requests", async () => {
  const body = { message: "Plan an offsite", city: "Chicago" };
  assert.equal((await POST(request(body))).status, 200);
  assert.equal((await POST(request(body, { origin: "https://hostile.test" }))).status, 403);
  assert.equal((await POST(request(body, { origin: "" }))).status, 403);
  assert.equal((await POST(request(body, { "sec-fetch-site": "cross-site" }))).status, 403);
  assert.equal((await POST(request(body, { host: "app.example.test", origin: "https://app.example.test", "x-forwarded-proto": "https" }))).status, 200);
  assert.equal((await POST(request(body, { "x-forwarded-host": "hostile.test", origin: "http://hostile.test" }))).status, 403);
});

test("malformed or oversized input is rejected before producing a proposal", async () => {
  for (const body of [null, [], {}, { message: "", city: "Chicago" }, { message: " ", city: "Chicago" },
    { message: "x".repeat(4001), city: "Chicago" }, { message: "Plan it", city: "Paris" },
    { message: "Plan it", city: "Chicago", isFollowUp: "true" }, "{invalid"]) {
    const response = await POST(request(body));
    assert.equal(response.status, 400);
    assert.equal(typeof (await response.json()).error, "string");
  }
  assert.equal((await POST(request("x".repeat(16_001)))).status, 413);
  assert.equal((await POST(request({}, { "content-type": "text/plain" }))).status, 415);
});
