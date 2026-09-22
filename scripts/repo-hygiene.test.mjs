import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_KEEP, isHusk, keepSet, selectHusks } from "./repo-hygiene.mjs";

const keep = keepSet();

test("keep list always holds the lab and the disk shop", () => {
  for (const name of ["genesis-engine", "genesis-lab", "star-mist-frost-glow", "poryadok-na-diske"]) {
    assert.ok(keep.has(name));
  }
  assert.ok(DEFAULT_KEEP.length >= 6);
});

test("GENESIS_KEEP_REPOS extends the allowlist", () => {
  const k = keepSet("extra-lab, another");
  assert.ok(k.has("extra-lab"));
  assert.ok(k.has("genesis-engine"));
});

test("only private size-0 shells are husks", () => {
  assert.equal(isHusk({ name: "meadow-cinder-reef-ever", private: true, size: 0 }), true);
  assert.equal(isHusk({ name: "genesis-engine", private: true, size: 0 }, keep), false);
  assert.equal(isHusk({ name: "empty-public", private: false, size: 0 }), false);
  assert.equal(isHusk({ name: "fat-private", private: true, size: 12 }), false);
  assert.equal(isHusk({ name: "forked", private: true, size: 0, fork: true }), false);
});

test("selectHusks drops the living names", () => {
  const picked = selectHusks(
    [
      { name: "genesis-lab", private: false, size: 80 },
      { name: "star-mist-frost", private: true, size: 0 },
      { name: "autumn-fern-yarrow-aurora", private: true, size: 0 },
    ],
    keep,
  );
  assert.deepEqual(
    picked.map((r) => r.name),
    ["star-mist-frost", "autumn-fern-yarrow-aurora"],
  );
});
