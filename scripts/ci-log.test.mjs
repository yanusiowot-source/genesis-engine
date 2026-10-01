import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { appendCiStep, ciStepRow } from "./ci-log.mjs";

const SCRIPT = fileURLToPath(new URL("./ci-log.mjs", import.meta.url));

test("a row names the step, the status, and the size", () => {
  const row = ciStepRow({ step: "typecheck", status: "failure", bytes: 42, t: 1 });
  assert.deepEqual(row, { t: 1, step: "typecheck", status: "failure", bytes: 42 });
});

test("a bad status is refused", () => {
  assert.throws(() => ciStepRow({ step: "test", status: "ok", bytes: 0 }), /status/);
});

test("append writes one JSON line", () => {
  const dir = mkdtempSync(join(tmpdir(), "ci-log-"));
  const jsonl = join(dir, "steps.jsonl");
  appendCiStep(jsonl, { step: "scripts", status: "success", bytes: 8, t: 2 });
  const parsed = JSON.parse(readFileSync(jsonl, "utf8"));
  assert.equal(parsed.step, "scripts");
  assert.equal(parsed.bytes, 8);
});

test("a missing log file is zero bytes, not a guess", () => {
  const dir = mkdtempSync(join(tmpdir(), "ci-log-"));
  const jsonl = join(dir, "steps.jsonl");
  const log = join(dir, "typecheck.log");
  writeFileSync(log, "error TS2304\n");
  const ran = spawnSync(process.execPath, [SCRIPT, jsonl, "typecheck", "failure", log], {
    encoding: "utf8",
  });
  assert.equal(ran.status, 0);
  assert.equal(JSON.parse(readFileSync(jsonl, "utf8")).bytes, Buffer.byteLength("error TS2304\n"));

  const skipped = spawnSync(
    process.execPath,
    [SCRIPT, jsonl, "test", "skipped", join(dir, "absent.log")],
    { encoding: "utf8" },
  );
  assert.equal(skipped.status, 0);
  const lines = readFileSync(jsonl, "utf8").trim().split("\n");
  assert.equal(JSON.parse(lines[1]).bytes, 0);
  assert.equal(JSON.parse(lines[1]).status, "skipped");
});
