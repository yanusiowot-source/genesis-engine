import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  TTL_MS,
  digestProcessLog,
  hourInZone,
  isBusy,
  isQuietHour,
  lockPath,
  parseProcessLog,
  readLock,
} from "./cycle-gate.mjs";

const SCRIPT = fileURLToPath(new URL("./cycle-gate.mjs", import.meta.url));

function run(args, lock, log) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      GENESIS_CYCLE_LOCK: lock,
      GENESIS_CYCLE_LOG: log || join(tmpdir(), "genesis-cycle-test.jsonl"),
    },
  });
}

test("lockPath reads GENESIS_CYCLE_LOCK", () => {
  assert.equal(lockPath({ GENESIS_CYCLE_LOCK: "/tmp/x.lock" }), "/tmp/x.lock");
  assert.equal(lockPath({}), "/tmp/genesis-engine-cycle.lock");
});

test("isBusy treats missing and stale locks as free", () => {
  assert.equal(isBusy(null), false);
  assert.equal(isBusy({ at: Date.now() - TTL_MS - 1 }), false);
  assert.equal(isBusy({ at: Date.now() }), true);
});

test("acquire refuses a live lock and accepts a stale one", () => {
  const lock = join(mkdtempSync(join(tmpdir(), "cycle-gate-")), "cycle.lock");
  writeFileSync(lock, JSON.stringify({ at: Date.now() }));
  const busy = run(["acquire"], lock);
  assert.equal(busy.status, 2);
  assert.match(busy.stdout, /^busy /);
  writeFileSync(lock, JSON.stringify({ at: Date.now() - TTL_MS - 50 }));
  const free = run(["acquire"], lock);
  assert.equal(free.status, 0);
  assert.equal(free.stdout.trim(), "free");
  const held = readLock(lock);
  assert.ok(held && held.at > Date.now() - 2000);
  const released = run(["release"], lock);
  assert.equal(released.status, 0);
  assert.equal(run(["status"], lock).status, 0);
});

test("digest counts skips and refuses broken lines", () => {
  const text = [
    '{"t":1000,"event":"acquire"}',
    "not-json",
    '{"t":4000,"event":"release"}',
    '{"t":310000,"event":"busy"}',
    '{"t":310000,"event":"acquire"}',
    '{"t":320000,"event":"release"}',
    '{"t":400000,"event":"quiet"}',
    "",
  ].join("\n");
  const events = parseProcessLog(text);
  assert.equal(events.length, 6);
  const d = digestProcessLog(events);
  assert.equal(d.acquire, 2);
  assert.equal(d.busy, 1);
  assert.equal(d.quiet, 1);
  assert.equal(d.release, 2);
  assert.ok(Math.abs(d.skipRate - 2 / 4) < 1e-9);
  assert.equal(d.open, false);
  assert.ok(d.meanGapMs > 300000 - 1);
});

test("Belgrade night is quiet, afternoon is not", () => {
  // 2026-09-20 02:00 CEST = 00:00 UTC
  const night = Date.UTC(2026, 8, 20, 0, 0, 0);
  // 2026-09-20 16:00 CEST = 14:00 UTC
  const day = Date.UTC(2026, 8, 20, 14, 0, 0);
  assert.equal(hourInZone(night, "Europe/Belgrade"), 2);
  assert.equal(isQuietHour(night, "Europe/Belgrade"), true);
  assert.equal(hourInZone(day, "Europe/Belgrade"), 16);
  assert.equal(isQuietHour(day, "Europe/Belgrade"), false);
});

test("acquire logs quiet and does not take the lock at night", () => {
  const dir = mkdtempSync(join(tmpdir(), "cycle-gate-"));
  const lock = join(dir, "cycle.lock");
  const log = join(dir, "cycle.jsonl");
  const night = String(Date.UTC(2026, 8, 20, 1, 0, 0));
  const quiet = spawnSync(process.execPath, [SCRIPT, "acquire"], {
    encoding: "utf8",
    env: {
      ...process.env,
      GENESIS_CYCLE_LOCK: lock,
      GENESIS_CYCLE_LOG: log,
      GENESIS_CYCLE_TZ: "UTC",
      GENESIS_CYCLE_NOW: night,
    },
  });
  assert.equal(quiet.status, 3);
  assert.equal(quiet.stdout.trim(), "quiet");
  assert.equal(existsSync(lock), false);
});
