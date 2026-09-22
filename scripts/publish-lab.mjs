#!/usr/bin/env node
/**
 * Copy desktop/www (no source) into the public genesis-lab repo and push.
 * The storefront is a build, not a mirror of this tree.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();
const WWW = join(ROOT, "desktop", "www");
const REMOTE = process.env.GENESIS_LAB_REMOTE || "https://github.com/yanusiowot-source/genesis-lab.git";
const KEEP = new Set([".git", "LICENSE", "README.md"]);

function git(cwd, args, inherit = false) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: inherit ? "inherit" : undefined,
  }).trim();
}

if (!existsSync(join(WWW, "index.html"))) {
  console.error("desktop/www missing. Run npm run desktop:build first.");
  process.exit(1);
}

const dir = mkdtempSync(join(tmpdir(), "genesis-lab-"));
try {
  execFileSync("git", ["clone", "--depth", "1", REMOTE, dir], { stdio: "inherit" });
  for (const name of readdirSync(dir)) {
    if (KEEP.has(name)) continue;
    rmSync(join(dir, name), { recursive: true, force: true });
  }
  cpSync(WWW, dir, { recursive: true });
  writeFileSync(join(dir, ".nojekyll"), "");
  writeFileSync(join(dir, "404.html"), readFileSync(join(dir, "index.html")));
  git(dir, ["add", "-A"]);
  const dirty = execFileSync("git", ["status", "--porcelain"], { cwd: dir, encoding: "utf8" });
  if (!dirty.trim()) {
    console.log("genesis-lab already matches this build.");
    process.exit(0);
  }
  const head = git(ROOT, ["rev-parse", "--short", "HEAD"]);
  const name = git(ROOT, ["config", "user.name"]) || "Genesis Engine";
  const email = git(ROOT, ["config", "user.email"]) || "genesis@local";
  git(dir, ["config", "user.name", name]);
  git(dir, ["config", "user.email", email]);
  execFileSync("git", ["commit", "-m", `Public lab from ${head} (build only, no source)`], {
    cwd: dir,
    stdio: "inherit",
  });
  execFileSync("git", ["push", "origin", "HEAD"], { cwd: dir, stdio: "inherit" });
  console.log(`published ${head} → genesis-lab`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
