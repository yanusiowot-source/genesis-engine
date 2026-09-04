import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { goldClass, observerPoints, rankedVotes, zooniverseClassificationsCsv } from "./zooniverse.ts";
import { evaluate, OUR_UNIVERSE, SILICON_CORRIDOR, DESERT_EPOCH, ETERNAL_CORRIDOR } from "./physics.ts";
import type { SkyVote } from "./zooniverse.ts";
import type { UniverseParams } from "./types.ts";

function vote(partial: Partial<SkyVote> & { catalog: string }): SkyVote {
  const params: UniverseParams = OUR_UNIVERSE;
  return {
    name: partial.catalog,
    class: "habitable",
    rating: 3,
    gold: "habitable",
    match: true,
    lifeProb: 0.4,
    siliconProb: 0.01,
    fate: "habitable",
    createdAt: 1,
    params,
    ...partial,
  };
}

describe("goldClass", () => {
  it("labels our universe habitable and the desert void-like", () => {
    assert.equal(goldClass(evaluate(OUR_UNIVERSE)), "habitable");
    const desert = goldClass(evaluate(DESERT_EPOCH));
    assert.ok(desert === "void" || desert === "sterile", desert);
    const si = goldClass(evaluate(SILICON_CORRIDOR));
    assert.ok(si === "silicon" || si === "sterile" || si === "habitable", si);
    assert.equal(goldClass(evaluate(ETERNAL_CORRIDOR)), "eternal");
  });
});

describe("rankedVotes", () => {
  it("puts higher ratings first", () => {
    const rows = rankedVotes([
      vote({ catalog: "A", rating: 2 }),
      vote({ catalog: "B", rating: 5 }),
    ]);
    assert.equal(rows[0]?.catalog, "B");
  });
});

describe("zooniverseClassificationsCsv", () => {
  it("has the Zooniverse header and one data row", () => {
    const csv = zooniverseClassificationsCsv([vote({ catalog: "GE-1" })]);
    const lines = csv.trim().split("\n");
    assert.equal(lines[0], "classification_id,user_name,created_at,subject_ids,workflow_name,gold_standard,annotations,subject_data");
    assert.ok(lines[1]?.includes("GE-1"));
    assert.ok(lines[1]?.includes("genesis-sky-class"));
  });
});

describe("observerPoints", () => {
  it("adds eye and sky points", () => {
    const n = observerPoints(
      { spectrumTried: 4, spectrumOk: 3, transitTried: 2, transitOk: 1 },
      [vote({ catalog: "X", rating: 4, match: true })],
    );
    assert.equal(n, 3 * 2 + 1 + 3 + 4 + 2);
  });
});
