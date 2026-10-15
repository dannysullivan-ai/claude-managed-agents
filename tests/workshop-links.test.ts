import assert from "node:assert/strict";
import test from "node:test";
import { editorUrl, fillSetupCode, normalizeFolder } from "../lib/workshop-links";

test("editor links target the learner's absolute Mac or Windows checkout and encode path punctuation", () => {
  assert.equal(editorUrl("/Users/learner/My project", "lib/workshop-exercises.ts", 11), "vscode://file/Users/learner/My%20project/lib/workshop-exercises.ts:11:1");
  assert.equal(editorUrl("C:\\Users\\Learner\\Offsite", "app/page.tsx", 3), "vscode://file/C:/Users/Learner/Offsite/app/page.tsx:3:1");
  assert.equal(editorUrl("/home/team/# workshop", "lib/types.ts"), "vscode://file/home/team/%23%20workshop/lib/types.ts:1:1");
  assert.equal(normalizeFolder("~/offsite"), null);
  assert.equal(editorUrl("/workshop", "../.env.local"), null);
  assert.equal(editorUrl("/workshop", "/etc/passwd"), null);
});

test("clone commands require a real configured HTTPS URL and quote it as data", () => {
  const template = "git clone {{REPO_URL}} offsite-workshop\ncd offsite-workshop\nnpm ci";
  const missing = fillSetupCode(template, "");
  assert.equal(missing.ready, false);
  assert(!missing.value.includes("{{REPO_URL}}"));
  assert.equal(fillSetupCode(template, "https://github.com/team/offsite.git").value, "git clone 'https://github.com/team/offsite.git' offsite-workshop\ncd offsite-workshop\nnpm ci");
  assert.equal(fillSetupCode(template, "https://token@github.com/team/offsite").ready, false);
  assert.equal(fillSetupCode(template, "javascript:alert(1)").ready, false);
  const unusual = fillSetupCode(template, "https://github.com/team/offsite'$(touch-pwn).git");
  assert.equal(unusual.ready, true);
  assert(unusual.value.includes("'\\''"));
  assert.equal(fillSetupCode("npm test", "").ready, true);
});
