#!/usr/bin/env node
/**
 * One JSON snapshot of the lab. Not Prometheus, not journalctl.
 * Lock + JSONL digest + desk hour. Git head is optional.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  cycleTz,
  digestProcessLog,
  hourInZone,
  isBusy,
  isQuietHour,
  lockPath,
  logPath,
  parseProcessLog,
  readLock,
} from "./cycle-gate.mjs";

export function gitHead(cwd = process.cwd()) {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

export function snapshot(env = process.env, now = Date.now(), head = gitHead()) {
  const tz = cycleTz(env);
  const quiet = isQuietHour(now, tz);
  const lock = readLock(lockPath(env));
  const busy = isBusy(lock, now);
  let text = "";
  try {
    text = existsSync(logPath(env)) ? readFileSync(logPath(env), "utf8") : "";
  } catch {
    text = "";
  }
  const d = digestProcessLog(parseProcessLog(text));
  return {
    tz,
    hour: hourInZone(now, tz),
    quiet,
    lock: quiet ? "quiet" : busy ? "busy" : "free",
    digest: {
      acquire: d.acquire,
      busy: d.busy,
      quiet: d.quiet,
      release: d.release,
      skipRate: +d.skipRate.toFixed(3),
      open: d.open,
      last: d.last?.event ?? "none",
    },
    head,
  };
}

const isMain =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  console.log(JSON.stringify(snapshot()));
}
