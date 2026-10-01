#!/usr/bin/env node
/**
 * One local fault: the journal has an open cycle and nobody holds the lock.
 * Night is not a fault. A live edit is not a fault. No pager, no webhook.
 */
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { isBusy, lockPath, readLock } from "./cycle-gate.mjs";
import { snapshot } from "./monitor.mjs";

export function judgeAlert({ open, held }) {
  if (open && !held) {
    return { status: 1, out: "cycle open but the lock is free" };
  }
  return { status: 0, out: "ok" };
}

export function alertNow(env = process.env, now = Date.now(), head) {
  const snap = head === undefined ? snapshot(env, now) : snapshot(env, now, head);
  const held = isBusy(readLock(lockPath(env)), now);
  return judgeAlert({ open: snap.digest.open, held });
}

const isMain =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const { status, out } = alertNow();
  console.log(out);
  process.exit(status);
}
