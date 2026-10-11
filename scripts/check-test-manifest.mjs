#!/usr/bin/env node
/**
 * The `test` script names files. A new `*.test.ts` is not picked up by itself.
 * `npm test` runs this first. A file missing from the list, or a listed file
 * that is not on disk, fails the suite before any test runs.
 *
 * Exit 0 when they match. Exit 1 otherwise. This does not run the tests.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./with-app-env.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function listTestFiles(dir = join(root, "src"), acc = []) {
  return listBySuffix(dir, ".test.ts", acc);
}

function listBySuffix(dir, suffix, acc) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) listBySuffix(path, suffix, acc);
    else if (name.endsWith(suffix)) acc.push(relative(root, path).split("\\").join("/"));
  }
  return acc.sort();
}

/**
 * Scaffold chrome. It expects a blank app title. This repo's card says
 * Genesis Engine, so lab CI does not run it. A new script test must be named
 * in the CI step or added here. Silence is not a third list.
 */
export const HELD_SCRIPT_TESTS = ["scripts/grok-pwa-plugin.test.mjs"];

/** Words on a `node --test` line that are script tests. Comments do not count. */
export function mjsNamedInCi(yml) {
  const listed = [];
  for (const line of yml.split("\n")) {
    if (!line.includes("node --test") || !line.includes(".test.mjs")) continue;
    for (const word of line.trim().split(/\s+/)) {
      if (word.endsWith(".test.mjs")) listed.push(word);
    }
  }
  return listed;
}

export function scriptProblems(onDisk, listed, held = HELD_SCRIPT_TESTS) {
  const problems = [];
  const hold = new Set(held);
  const list = new Set(listed);
  if (list.size !== listed.length) problems.push("CI scripts step repeats a test file");
  if (hold.size !== held.length) problems.push("held script tests repeat a file");
  for (const file of held) {
    if (!onDisk.includes(file)) problems.push(`held script test is not on disk: ${file}`);
    if (list.has(file)) problems.push(`held script test is in the lab CI step: ${file}`);
  }
  for (const file of onDisk) {
    if (!list.has(file) && !hold.has(file)) problems.push(`script test not in CI or the hold list: ${file}`);
  }
  for (const file of listed) {
    if (!onDisk.includes(file)) problems.push(`CI script test is not on disk: ${file}`);
  }
  return problems;
}

export const MANIFEST_COMMAND = "node scripts/check-test-manifest.mjs";

/** The npm names must still point at this file. A renamed no-op would not. */
export function gateScripts(scripts) {
  const problems = [];
  if (scripts?.["check:tests"] !== MANIFEST_COMMAND) {
    problems.push("scripts.check:tests is not the manifest checker");
  }
  const test = typeof scripts?.test === "string" ? scripts.test : "";
  const gateAt = test.indexOf(MANIFEST_COMMAND);
  const runAt = test.indexOf("--test");
  if (gateAt < 0 || runAt < 0 || gateAt > runAt) {
    problems.push("scripts.test does not run the manifest checker before the suite");
  }
  return problems;
}

export function manifestProblems({ listed, missing, stale }) {
  const problems = [];
  if (listed.length === 0) problems.push("scripts.test names no test files");
  if (new Set(listed).size !== listed.length) problems.push("scripts.test repeats a test file");
  for (const file of missing) problems.push(`missing from scripts.test: ${file}`);
  for (const file of stale) problems.push(`listed but not on disk: ${file}`);
  return problems;
}

/** Tokens of `scripts.test` that are test files. Flags and the runner are ignored. */
export function filesNamedInTestScript(script) {
  return script.split(/\s+/).filter((word) => word.endsWith(".test.ts"));
}

export function diffTestManifest(onDisk, listed) {
  const disk = new Set(onDisk);
  const list = new Set(listed);
  return {
    missing: onDisk.filter((file) => !list.has(file)).sort(),
    stale: listed.filter((file) => !disk.has(file)).sort(),
  };
}

export function checkTestManifest() {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const script = pkg.scripts?.test;
  if (typeof script !== "string") throw new Error("package.json has no scripts.test");
  const onDisk = listTestFiles();
  const listed = filesNamedInTestScript(script);
  const diff = diffTestManifest(onDisk, listed);
  const yml = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
  const scriptTests = listBySuffix(join(root, "scripts"), ".test.mjs", []);
  const problems = [
    ...gateScripts(pkg.scripts),
    ...manifestProblems({ listed, ...diff }),
    ...scriptProblems(scriptTests, mjsNamedInCi(yml)),
  ];
  return { onDisk, listed, ...diff, problems };
}

function main() {
  const { listed, problems } = checkTestManifest();
  if (problems.length === 0) {
    console.log(`test manifest: ${listed.length} files, disk matches`);
    return;
  }
  for (const line of problems) console.error(line);
  process.exit(1);
}

if (isMainModule(import.meta.url)) main();
