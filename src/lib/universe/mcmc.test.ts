import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { essOf, runMcmc } from "./mcmc.ts";
import { OUR_UNIVERSE } from "./physics.ts";
import { mcmcTableFits, mcmcImageFits } from "./fits.ts";
import { mcmcVotable, parseVotableTableName } from "./votable.ts";

describe("runMcmc", () => {
  it("is deterministic and stays inside the prior box", () => {
    const a = runMcmc(7, OUR_UNIVERSE, "carbon", 400, 80, 4);
    const b = runMcmc(7, OUR_UNIVERSE, "carbon", 400, 80, 4);
    assert.equal(a.samples.length, b.samples.length);
    assert.equal(a.acceptRate, b.acceptRate);
    assert.equal(a.prior, "uniform");
    assert.ok(a.samples.length > 10);
    for (const s of a.samples) {
      assert.ok(s.params.gravity >= 0.35 && s.params.gravity <= 2.2);
      assert.ok(s.params.quantumNoise >= 0 && s.params.quantumNoise <= 0.5);
      assert.ok(s.score >= 0 && s.score <= 1);
    }
    assert.ok(a.acceptRate > 0.05 && a.acceptRate < 0.95);
  });

  it("concentrates near the carbon corridor when started at ΛCDM", () => {
    const gold = runMcmc(3, OUR_UNIVERSE, "carbon", 900, 180, 4);
    assert.ok(gold.map.score > 0.2, `map=${gold.map.score}`);
    assert.ok(gold.mean.gravity > 0.7 && gold.mean.gravity < 1.4, `g=${gold.mean.gravity}`);
    assert.ok(gold.mean.expansion > 0.7 && gold.mean.expansion < 1.4, `H=${gold.mean.expansion}`);
  });
});

describe("essOf", () => {
  it("is ~n for white noise and smaller for a sticky chain", () => {
    const n = 200;
    const white = Array.from({ length: n }, (_, i) => ((i * 17) % 10) / 10);
    const sticky: number[] = [];
    let x = 0;
    for (let i = 0; i < n; i++) {
      x = 0.95 * x + 0.05;
      sticky.push(x);
    }
    assert.ok(essOf(white) > essOf(sticky));
  });
});

describe("mcmc exports", () => {
  it("round-trips into FITS and VOTable", () => {
    const r = runMcmc(1, OUR_UNIVERSE, "carbon", 240, 40, 4);
    const table = mcmcTableFits(r);
    const image = mcmcImageFits(r);
    assert.equal(table.length % 2880, 0);
    assert.equal(image.length % 2880, 0);
    const xml = mcmcVotable(r);
    assert.equal(parseVotableTableName(xml), "chain");
    assert.match(xml, /<TR>/);
  });
});
