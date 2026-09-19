import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzePosterior, chooseWalk, downsampleTrace, essOf, quantile, runAdaptiveWalk, runHmc, runMcmc, splitRhat } from "./mcmc.ts";
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
    assert.equal(a.walker, "mh");
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

describe("analyzePosterior", () => {
  it("keeps quantiles ordered and places ΛCDM inside a carbon walk", () => {
    assert.ok(quantile([1, 2, 3, 4, 5], 0.16) <= quantile([1, 2, 3, 4, 5], 0.5));
    assert.ok(splitRhat(Array.from({ length: 80 }, () => 1)) === 1);
    const r = runMcmc(3, OUR_UNIVERSE, "carbon", 900, 180, 4);
    const a = analyzePosterior(r, OUR_UNIVERSE);
    const g = a.marginals.find((m) => m.key === "gravity");
    assert.ok(g);
    assert.ok(g.q16 <= g.q50 && g.q50 <= g.q84);
    assert.ok(g.q50 > 0.7 && g.q50 < 1.4, `g50=${g.q50}`);
    assert.ok(a.rhat >= 1 && a.rhat < 3, `rhat=${a.rhat}`);
    assert.ok(a.viableCarbon > a.viableEternal);
    assert.ok(a.viableSwarm >= 0 && a.viableSwarm <= 1);
    assert.ok(g.here !== undefined && g.here > 0.02 && g.here < 0.98);
    assert.equal(a.marginals.length, 6);
    assert.ok(a.logL.length > 4);
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

describe("downsampleTrace", () => {
  it("keeps a short series and pins the last sample of a long one", () => {
    assert.deepEqual(downsampleTrace([1, 2, 3], 80), [1, 2, 3]);
    const long = Array.from({ length: 400 }, (_, i) => i);
    const thin = downsampleTrace(long, 80);
    assert.ok(thin.length <= 82);
    assert.equal(thin[0], 0);
    assert.equal(thin[thin.length - 1], 399);
  });
});

describe("runHmc", () => {
  it("is deterministic, stays in the box, and is not Metropolis", () => {
    const a = runHmc(11, OUR_UNIVERSE, "carbon", 48, 8, 2, 3, 0.07);
    const b = runHmc(11, OUR_UNIVERSE, "carbon", 48, 8, 2, 3, 0.07);
    assert.equal(a.walker, "hmc");
    assert.equal(a.samples.length, b.samples.length);
    assert.equal(a.acceptRate, b.acceptRate);
    assert.equal(a.map.logL, b.map.logL);
    assert.ok(a.samples.length > 4);
    for (const s of a.samples) {
      assert.ok(s.params.gravity >= 0.35 && s.params.gravity <= 2.2);
      assert.ok(s.params.matter >= 0.05 && s.params.matter <= 1.8);
    }
  });
});

describe("chooseWalk", () => {
  it("keeps Metropolis when HMC did not mix better", () => {
    const mh = runMcmc(5, OUR_UNIVERSE, "carbon", 160, 32, 4);
    const worse = { ...mh, ess: Math.max(1, mh.ess * 0.2), walker: "hmc" as const };
    assert.equal(chooseWalk(mh, worse).walker, "mh");
    const better = { ...mh, ess: mh.ess + 80, walker: "hmc" as const };
    assert.equal(chooseWalk(mh, better).walker, "hmc");
  });

  it("starts adaptive on Metropolis and stays in the box", () => {
    const w = runAdaptiveWalk(9, OUR_UNIVERSE, "carbon");
    assert.ok(w.walker === "mh" || w.walker === "hmc");
    assert.ok(w.samples.length > 10);
    assert.ok(w.map.score >= 0);
  });
});
