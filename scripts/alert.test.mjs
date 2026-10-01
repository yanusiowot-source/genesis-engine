import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { alertNow, judgeAlert } from "./alert.mjs";

test("a live hold is not an alert", () => {
  assert.deepEqual(judgeAlert({ open: true, held: true }), { status: 0, out: "ok" });
});

test("a closed journal is not an alert", () => {
  assert.deepEqual(judgeAlert({ open: false, held: false }), { status: 0, out: "ok" });
});

test("an open journal with a free lock is the alert", () => {
  assert.equal(judgeAlert({ open: true, held: false }).status, 1);
});

test("night does not hide a dropped release", () => {
  const dir = mkdtempSync(join(tmpdir(), "alert-"));
  const env = {
    GENESIS_CYCLE_LOCK: join(dir, "cycle.lock"),
    GENESIS_CYCLE_LOG: join(dir, "cycle.jsonl"),
    GENESIS_CYCLE_TZ: "Europe/Belgrade",
  };
  writeFileSync(env.GENESIS_CYCLE_LOG, '{"t":1,"event":"acquire"}\n');
  const night = Date.UTC(2026, 8, 22, 1, 0, 0);
  const result = alertNow(env, night, "abc");
  assert.equal(result.status, 1);
  assert.match(result.out, /lock is free/);
});

test("a released cycle stays quiet", () => {
  const dir = mkdtempSync(join(tmpdir(), "alert-"));
  const env = {
    GENESIS_CYCLE_LOCK: join(dir, "cycle.lock"),
    GENESIS_CYCLE_LOG: join(dir, "cycle.jsonl"),
    GENESIS_CYCLE_TZ: "UTC",
  };
  writeFileSync(
    env.GENESIS_CYCLE_LOG,
    '{"t":1,"event":"acquire"}\n{"t":2,"event":"release"}\n',
  );
  const day = Date.UTC(2026, 8, 22, 14, 0, 0);
  assert.equal(alertNow(env, day, null).status, 0);
});
