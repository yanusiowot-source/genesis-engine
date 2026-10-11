import assert from "node:assert/strict";
import { test } from "node:test";
import { checkTestManifest, diffTestManifest, filesNamedInTestScript, gateScripts, manifestProblems, mjsNamedInCi, scriptProblems } from "./check-test-manifest.mjs";

test("ignores the runner and keeps only test files", () => {
  const named = filesNamedInTestScript(
    "node --experimental-strip-types --test src/a.test.ts src/b.test.ts",
  );
  assert.deepEqual(named, ["src/a.test.ts", "src/b.test.ts"]);
});

test("names a file on disk that the script forgot", () => {
  const diff = diffTestManifest(["src/a.test.ts", "src/b.test.ts"], ["src/a.test.ts"]);
  assert.deepEqual(diff.missing, ["src/b.test.ts"]);
  assert.deepEqual(diff.stale, []);
});

test("names a listed file that is not on disk", () => {
  const diff = diffTestManifest(["src/a.test.ts"], ["src/a.test.ts", "src/gone.test.ts"]);
  assert.deepEqual(diff.missing, []);
  assert.deepEqual(diff.stale, ["src/gone.test.ts"]);
});

test("the working tree matches scripts.test", () => {
  const { missing, stale, listed, problems } = checkTestManifest();
  assert.deepEqual(missing, []);
  assert.deepEqual(stale, []);
  assert.deepEqual(problems, []);
  assert.ok(listed.includes("src/lib/universe/orbits.test.ts"));
  assert.ok(listed.includes("src/lib/universe/disk-gpu.test.ts"));
});

test("an empty list, a repeat, or a no-op script is not a match", () => {
  assert.deepEqual(manifestProblems({ listed: [], missing: [], stale: [] }), [
    "scripts.test names no test files",
  ]);
  assert.ok(
    manifestProblems({ listed: ["src/a.test.ts", "src/a.test.ts"], missing: [], stale: [] }).some((line) =>
      line.includes("repeats"),
    ),
  );
  assert.deepEqual(gateScripts({ "check:tests": "true", test: "true" }), [
    "scripts.check:tests is not the manifest checker",
    "scripts.test does not run the manifest checker before the suite",
  ]);
});

test("a script test must be in the CI step or the hold list", () => {
  const disk = ["scripts/a.test.mjs", "scripts/held.test.mjs"];
  const held = ["scripts/held.test.mjs"];
  assert.deepEqual(scriptProblems(disk, ["scripts/a.test.mjs"], held), []);
  assert.ok(
    scriptProblems(disk, [], held).some((line) => line.includes("not in CI or the hold list")),
  );
  assert.ok(
    scriptProblems(disk, ["scripts/a.test.mjs", "scripts/held.test.mjs"], held).some((line) =>
      line.includes("in the lab CI step"),
    ),
  );
  assert.deepEqual(
    mjsNamedInCi("# scripts/note.test.mjs is a comment\nnode --test scripts/a.test.mjs\n"),
    ["scripts/a.test.mjs"],
  );
});
