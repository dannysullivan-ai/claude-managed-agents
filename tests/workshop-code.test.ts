import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import nextConfig from "../next.config";
import { getWorkshopSlides, resolveWorkshopCode, WORKSHOP_SOURCE_FILES } from "../lib/workshop-code";
import type { WorkshopCode } from "../lib/workshop-types";

const tab = (source: NonNullable<WorkshopCode["source"]>): WorkshopCode => ({ title: "Actual code", language: "typescript", value: "stale placeholder", source });

test("workshop full files and excerpts preserve actual source text and starting lines", async () => {
  const path = "lib/managed/agent.ts";
  const actual = await readFile(path, "utf8");
  const whole = await resolveWorkshopCode(tab({ path }));
  assert.equal(whole.value, actual);
  assert.equal(whole.file, path);
  assert.equal(whole.startLine, 1);
  const excerpt = await resolveWorkshopCode({ ...tab({ path, start: "export const OFFSITE_TOOLS", end: "export const OFFSITE_SYSTEM" }), annotations: [{ find: "permission_policy", label: "Hosted permission boundary" }] });
  const lines = actual.split("\n");
  const first = lines.findIndex(line => line.includes("export const OFFSITE_TOOLS"));
  const last = lines.findIndex(line => line.includes("export const OFFSITE_SYSTEM"));
  assert.equal(excerpt.value, `${lines.slice(first, last).join("\n")}\n`);
  assert.equal(excerpt.startLine, first + 1);
  assert.equal(excerpt.annotations?.[0].label, "Hosted permission boundary");
});

test("workshop source loader rejects private paths and stale or ambiguous anchors", async () => {
  for (const path of [".env.local", ".env.example", "../.env.local", "/etc/passwd", "lib/managed/../../.env.local", "unknown.ts", "__proto__", "constructor"]) {
    await assert.rejects(resolveWorkshopCode(tab({ path })), /not allowlisted/);
  }
  await assert.rejects(resolveWorkshopCode(tab({ path: "lib/managed/agent.ts", start: "nonexistent source anchor" })), /not found/);
  await assert.rejects(resolveWorkshopCode(tab({ path: "lib/managed/agent.ts", start: "export const" })), /ambiguous/);
  await assert.rejects(resolveWorkshopCode(tab({ path: "lib/managed/agent.ts", start: "export const OFFSITE_SYSTEM", end: "export const OFFSITE_TOOLS" })), /empty or reversed/);
  await assert.rejects(resolveWorkshopCode({ ...tab({ path: "lib/managed/agent.ts" }), annotations: [{ find: "no such annotation", label: "Stale" }] }), /annotation was not found/);
});

test("workshop source map matches its tracing allowlist and serializes no server directory", async () => {
  const traced = nextConfig.outputFileTracingIncludes?.["/workshop"]?.map(path => path.replace(/^\.\//, ""));
  assert.deepEqual(traced, [...WORKSHOP_SOURCE_FILES]);
  assert.ok(WORKSHOP_SOURCE_FILES.every(path => !path.includes(".env") && !path.startsWith("/") && !path.includes("..")));
  for (const path of WORKSHOP_SOURCE_FILES) {
    const resolved = await resolveWorkshopCode(tab({ path }));
    assert.equal(resolved.file, path);
    assert.equal(resolved.value, await readFile(path, "utf8"), `The source map must load the file named ${path}`);
  }
  const loaded = await getWorkshopSlides();
  assert.ok(loaded.length > 0);
  assert.ok(!JSON.stringify(loaded).includes(process.cwd()));
});
