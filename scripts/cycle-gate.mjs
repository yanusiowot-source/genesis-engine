#!/usr/bin/env node
/**
 * One cycle at a time. A 5-minute timer must not start a second edit
 * while the previous fire is still writing.
 *
 * Process log: JSONL. digest reads it — not journalctl, not ELK.
 */
import { appendFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const TTL_MS = 8 * 60 * 1000;
/** Desk night, Europe/Belgrade: 00:00–07:59. No second editor. */
export const QUIET_START = 0;
export const QUIET_END = 8;
export const DEFAULT_TZ = "Europe/Belgrade";

export function lockPath(env = process.env) {
  return env.GENESIS_CYCLE_LOCK || "/tmp/genesis-engine-cycle.lock";
}

export function logPath(env = process.env) {
  return env.GENESIS_CYCLE_LOG || "/tmp/genesis-engine-cycle.jsonl";
}

export function readLock(file) {
  try {
    const raw = JSON.parse(readFileSync(file, "utf8"));
    if (!raw || typeof raw.at !== "number") return null;
    return raw;
  } catch {
    return null;
  }
}

export function isBusy(lock, now = Date.now(), ttl = TTL_MS) {
  return Boolean(lock) && now - lock.at <= ttl;
}

export function cycleTz(env = process.env) {
  return env.GENESIS_CYCLE_TZ || DEFAULT_TZ;
}

/** Hour 0–23 in the desk zone. Homology of night, not UTC. */
export function hourInZone(now = Date.now(), zone = DEFAULT_TZ) {
  const h = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "numeric",
    hourCycle: "h23",
  }).format(new Date(now));
  return Number.parseInt(h, 10);
}

export function isQuietHour(now = Date.now(), zone = DEFAULT_TZ) {
  const h = hourInZone(now, zone);
  return h >= QUIET_START && h < QUIET_END;
}

/** One JSONL object per line. Broken lines are dropped, not guessed. */
export function parseProcessLog(text) {
  const events = [];
  for (const line of text.split(/\n/)) {
    const row = line.trim();
    if (!row) continue;
    try {
      const ev = JSON.parse(row);
      if (ev && typeof ev.t === "number" && typeof ev.event === "string") events.push(ev);
    } catch {
      /* skip */
    }
  }
  return events;
}

export function digestProcessLog(events) {
  let acquire = 0;
  let busy = 0;
  let quiet = 0;
  let release = 0;
  const gaps = [];
  let lastAcq = null;
  for (const ev of events) {
    if (ev.event === "acquire") {
      acquire += 1;
      if (lastAcq != null) gaps.push(ev.t - lastAcq);
      lastAcq = ev.t;
    } else if (ev.event === "busy") busy += 1;
    else if (ev.event === "quiet") quiet += 1;
    else if (ev.event === "release") release += 1;
  }
  const meanGap =
    gaps.length === 0 ? 0 : gaps.reduce((s, x) => s + x, 0) / gaps.length;
  const last = events[events.length - 1] ?? null;
  const fires = acquire + busy + quiet;
  return {
    n: events.length,
    acquire,
    busy,
    quiet,
    release,
    skipRate: fires === 0 ? 0 : (busy + quiet) / fires,
    meanGapMs: meanGap,
    open: acquire > release,
    last,
  };
}

function appendLog(event, extra = {}, env = process.env) {
  try {
    const row = JSON.stringify({ t: Date.now(), event, pid: process.pid, ...extra });
    appendFileSync(logPath(env), `${row}\n`);
  } catch {
    /* quota / tmp */
  }
}

export function runCycleCommand(argv = process.argv, env = process.env) {
  const cmd = argv[2] ?? "status";
  const file = lockPath(env);
  const now = Number(env.GENESIS_CYCLE_NOW) || Date.now();

  const sayBusy = (lock) => {
    const left = Math.max(0, Math.round((TTL_MS - (now - lock.at)) / 1000));
    return `busy ${left}s`;
  };

  if (cmd === "acquire") {
    if (isQuietHour(now, cycleTz(env))) {
      appendLog("quiet", { hour: hourInZone(now, cycleTz(env)) }, env);
      return { status: 3, out: "quiet" };
    }
    const lock = readLock(file);
    if (isBusy(lock, now)) {
      appendLog("busy", { leftMs: Math.max(0, TTL_MS - (now - lock.at)) }, env);
      return { status: 2, out: sayBusy(lock) };
    }
    writeFileSync(file, JSON.stringify({ at: now, pid: process.pid }));
    appendLog("acquire", {}, env);
    return { status: 0, out: "free" };
  }

  if (cmd === "release") {
    if (existsSync(file)) unlinkSync(file);
    appendLog("release", {}, env);
    return { status: 0, out: "released" };
  }

  if (cmd === "digest") {
    let text = "";
    try {
      text = readFileSync(logPath(env), "utf8");
    } catch {
      text = "";
    }
    const d = digestProcessLog(parseProcessLog(text));
    return {
      status: 0,
      out: JSON.stringify({
        acquire: d.acquire,
        busy: d.busy,
        quiet: d.quiet,
        release: d.release,
        skipRate: +d.skipRate.toFixed(3),
        meanGapMin: d.meanGapMs ? +(d.meanGapMs / 60000).toFixed(2) : 0,
        open: d.open,
        last: d.last?.event ?? "none",
      }),
    };
  }

  const lock = readLock(file);
  if (isBusy(lock, now)) return { status: 2, out: sayBusy(lock) };
  return { status: 0, out: "free" };
}

const isMain =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const { status, out } = runCycleCommand();
  console.log(out);
  process.exit(status);
}
