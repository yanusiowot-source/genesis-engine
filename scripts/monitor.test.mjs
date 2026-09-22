import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { snapshot } from "./monitor.mjs";

test("snapshot is quiet at Belgrade night and names the lock", () => {
  const dir = mkdtempSync(join(tmpdir(), "monitor-"));
  const env = {
    GENESIS_CYCLE_LOCK: join(dir, "cycle.lock"),
    GENESIS_CYCLE_LOG: join(dir, "cycle.jsonl"),
    GENESIS_CYCLE_TZ: "Europe/Belgrade",
  };
  writeFileSync(
    env.GENESIS_CYCLE_LOG,
    '{"t":1,"event":"acquire"}\n{"t":2,"event":"quiet"}\n',
  );
  const night = Date.UTC(2026, 8, 22, 1, 0, 0);
  const snap = snapshot(env, night, "deadbeef");
  assert.equal(snap.quiet, true);
  assert.equal(snap.lock, "quiet");
  assert.equal(snap.head, "deadbeef");
  assert.equal(snap.digest.quiet, 1);
  assert.equal(snap.digest.acquire, 1);
});

test("snapshot is free on a weekday afternoon with no lock", () => {
  const dir = mkdtempSync(join(tmpdir(), "monitor-"));
  const env = {
    GENESIS_CYCLE_LOCK: join(dir, "cycle.lock"),
    GENESIS_CYCLE_LOG: join(dir, "cycle.jsonl"),
    GENESIS_CYCLE_TZ: "UTC",
  };
  const day = Date.UTC(2026, 8, 22, 14, 0, 0);
  const snap = snapshot(env, day, null);
  assert.equal(snap.quiet, false);
  assert.equal(snap.lock, "free");
  assert.equal(snap.head, null);
});
