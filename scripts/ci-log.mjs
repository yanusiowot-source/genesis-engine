#!/usr/bin/env node
/**
 * One JSONL row per CI step. The raw text stays in the log file.
 * This does not upload anywhere. GitHub Actions keeps the files as an artifact.
 */
import { appendFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const STATUSES = new Set(["success", "failure", "skipped", "cancelled"]);

export function ciStepRow({ step, status, bytes, t = Date.now() }) {
  if (typeof step !== "string" || !/^[a-z][a-z0-9-]{0,40}$/.test(step)) {
    throw new Error("step");
  }
  if (!STATUSES.has(status)) throw new Error(`status ${status}`);
  if (!Number.isInteger(bytes) || bytes < 0) throw new Error("bytes");
  return { t, step, status, bytes };
}

export function appendCiStep(jsonl, row) {
  const line = `${JSON.stringify(ciStepRow(row))}\n`;
  appendFileSync(jsonl, line);
  return line;
}

function bytesOf(file) {
  if (!file || !existsSync(file)) return 0;
  return statSync(file).size;
}

const isMain =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const [, , jsonl, step, status, logfile] = process.argv;
  if (!jsonl || !step || !status) {
    console.error("usage: ci-log.mjs <jsonl> <step> <status> [logfile]");
    process.exit(2);
  }
  appendCiStep(jsonl, { step, status, bytes: bytesOf(logfile) });
}
