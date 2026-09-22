#!/usr/bin/env node
/**
 * Empty App Builder shells, not living labs.
 * Default is a dry list. --apply deletes. Public repos are never husks.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const DEFAULT_KEEP = [
  "genesis-engine",
  "star-mist-frost-glow",
  "genesis-lab",
  "poryadok-na-diske",
  "yanusiowot-source.github.io",
  "pc-dashboard",
];

export function keepSet(extra = process.env.GENESIS_KEEP_REPOS) {
  const more = extra
    ? extra
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return new Set([...DEFAULT_KEEP, ...more]);
}

export function isHusk(repo, keep = keepSet()) {
  if (!repo || typeof repo.name !== "string") return false;
  if (keep.has(repo.name)) return false;
  if (repo.fork || repo.archived) return false;
  if (repo.private !== true) return false;
  return repo.size === 0;
}

export function selectHusks(repos, keep = keepSet()) {
  return repos.filter((r) => isHusk(r, keep));
}

function ghJson(args) {
  const out = execFileSync("gh", args, { encoding: "utf8" });
  return JSON.parse(out);
}

export function listOwnedRepos(owner = "yanusiowot-source") {
  return ghJson([
    "api",
    `users/${owner}/repos?per_page=100&type=owner`,
    "--paginate",
    "--jq",
    ".",
  ]).flat?.() ?? ghJson(["api", `users/${owner}/repos?per_page=100&type=owner`, "--paginate"]);
}

function flattenPages(data) {
  if (Array.isArray(data) && data.length && Array.isArray(data[0])) return data.flat();
  if (Array.isArray(data)) return data;
  return [];
}

export function deleteRepo(fullName) {
  execFileSync("gh", ["repo", "delete", fullName, "--yes"], { stdio: "inherit" });
}

export function runHygiene({ apply = false, owner = "yanusiowot-source" } = {}) {
  const keep = keepSet();
  const repos = flattenPages(listOwnedRepos(owner));
  const husks = selectHusks(repos, keep);
  return { keep: [...keep], husks, apply };
}

const isMain =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const apply = process.argv.includes("--apply");
  const { husks } = runHygiene({ apply: false });
  if (husks.length === 0) {
    console.log("no husks");
  } else {
    for (const h of husks) {
      console.log(`${apply ? "delete" : "husk"}\t${h.full_name || h.name}\tsize=${h.size}`);
    }
    if (apply) {
      for (const h of husks) {
        const name = h.full_name || `yanusiowot-source/${h.name}`;
        deleteRepo(name);
      }
    }
  }
}
