import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mulberry32 } from "./rng.ts";
import {
  DESERT_EPOCH,
  ETERNAL_CORRIDOR,
  OUR_UNIVERSE,
  PARAM_META,
  SILICON_CORRIDOR,
  derivedAstro,
  eternalDossier,
  evaluate,
  randomParams,
  refine,
  siliconDossier,
  snapParams,
  survey,
} from "./physics.ts";

describe("evaluate", () => {
  it("puts our universe in the carbon Goldilocks, not silicon, and vetoes eternity", () => {
    const ev = evaluate(OUR_UNIVERSE);
    assert.equal(ev.fate, "habitable");
    assert.ok(ev.lifeProb > 0.4 && ev.lifeProb < 0.55);
    assert.ok(ev.siliconProb < 0.05);
    assert.equal(ev.siliconNiche, "impossible");
    assert.ok(ev.eternalProb < 0.03);
    assert.equal(ev.eternalNiche, "closed");
    assert.equal(ev.morphology, "spiral");
    assert.ok(ev.environmentDensity > 0.28 && ev.environmentDensity < 0.4);
    assert.ok(ev.hubbleMix.spiral > ev.hubbleMix.elliptical);
    assert.ok(Math.abs(ev.darkMatterFraction - 0.85) < 0.05);
  });

  it("gives the silicon corridor high Si and low carbon", () => {
    const ev = evaluate(SILICON_CORRIDOR);
    assert.ok(ev.siliconProb > 0.45);
    assert.ok(ev.lifeProb < 0.12);
    assert.ok(ev.siliconNiche === "favored" || ev.siliconNiche === "viable");
    assert.ok(ev.eternalProb < 0.05);
  });

  it("opens the Dyson corridor when Λ is near zero and remnants survive", () => {
    const ev = evaluate(ETERNAL_CORRIDOR);
    assert.equal(ev.fate, "enduring");
    assert.ok(ev.eternalProb > 0.45);
    assert.equal(ev.eternalNiche, "dyson");
    assert.ok(ev.lifeProb < 0.12);
    assert.ok(ev.siliconProb < 0.08);
    assert.ok(ev.remnantStructure > 0.7);
    assert.ok(ev.recollapseRisk < 0.1);
    assert.ok(ev.runawayRisk < 0.1);
  });

  it("makes the desert epoch empty of all three envelopes", () => {
    const ev = evaluate(DESERT_EPOCH);
    assert.ok(ev.lifeProb < 0.08);
    assert.ok(ev.siliconProb < 0.12);
    assert.ok(ev.eternalProb < 0.05);
  });

  it("keeps outputs in [0,1] for random draws", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 48; i++) {
      const ev = evaluate(randomParams(rng));
      assert.ok(ev.lifeProb >= 0 && ev.lifeProb <= 1);
      assert.ok(ev.siliconProb >= 0 && ev.siliconProb <= 1);
      assert.ok(ev.eternalProb >= 0 && ev.eternalProb <= 1);
      assert.ok(ev.structure >= 0 && ev.structure <= 1);
      assert.ok(ev.remnantStructure >= 0 && ev.remnantStructure <= 1);
    }
  });

  it("keeps randomParams inside slider ranges", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 32; i++) {
      const p = randomParams(rng);
      for (const meta of PARAM_META) {
        assert.ok(p[meta.key] >= meta.min && p[meta.key] <= meta.max);
      }
    }
  });

  it("closes eternity as soon as a de Sitter horizon lights", () => {
    const open = evaluate(ETERNAL_CORRIDOR);
    const closed = evaluate({ ...ETERNAL_CORRIDOR, darkEnergy: 0.69 });
    assert.ok(open.eternalProb > 0.4);
    assert.ok(closed.eternalProb < 0.05);
  });
});

describe("snapParams", () => {
  it("quantizes to the slider grid", () => {
    const snapped = snapParams({
      gravity: 1.019999,
      expansion: 0.991,
      darkEnergy: 0.694,
      matter: 0.311,
      complexity: 0.3666,
      quantumNoise: 0.1011,
    });
    for (const meta of PARAM_META) {
      const digits = meta.step < 0.01 ? 3 : 2;
      const v = snapped[meta.key];
      assert.equal(v, Number(v.toFixed(digits)));
      assert.ok(v >= meta.min && v <= meta.max);
    }
  });
});

describe("refine", () => {
  it("is deterministic for a seed and does not lower the target", () => {
    const before = evaluate(OUR_UNIVERSE).lifeProb;
    const a = refine(OUR_UNIVERSE, 99, "carbon");
    const b = refine(OUR_UNIVERSE, 99, "carbon");
    assert.deepEqual(a, b);
    assert.ok(evaluate(a).lifeProb >= before - 1e-9);
  });

  it("does not lower silicon score on the silicon target", () => {
    const before = evaluate(SILICON_CORRIDOR).siliconProb;
    const next = refine(SILICON_CORRIDOR, 12, "silicon");
    assert.ok(evaluate(next).siliconProb >= before - 1e-9);
  });

  it("does not lower eternal score on the eternal target", () => {
    const before = evaluate(ETERNAL_CORRIDOR).eternalProb;
    const next = refine(ETERNAL_CORRIDOR, 21, "eternal");
    assert.ok(evaluate(next).eternalProb >= before - 1e-9);
  });
});

describe("derivedAstro", () => {
  it("lands near Planck / Milky Way ballparks for our universe", () => {
    const d = derivedAstro(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.ok(Math.abs(d.hubble - 67.4) < 0.2);
    assert.ok(Math.abs(d.ageGyr - 13.8) < 0.2);
    assert.ok(d.galaxyKpc > 10 && d.galaxyKpc < 30);
    assert.ok(d.sfr > 0.4 && d.sfr < 4);
    assert.ok(Math.abs(d.omegaK) < 0.01);
    assert.ok(Math.abs(d.rhoCrit - 8.54e-27) / 8.54e-27 < 0.05);
  });
});

describe("siliconDossier", () => {
  it("marks our sky as a water world with a Sun-like star", () => {
    const d = siliconDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(d.starTempK, 5772);
    assert.equal(d.surfaceG, 1);
    assert.equal(d.solvent, "water");
    assert.ok(d.oxygenSink > 0.9);
  });

  it("gives the silicon corridor a hot reducing or molten solvent", () => {
    const d = siliconDossier(SILICON_CORRIDOR, evaluate(SILICON_CORRIDOR));
    assert.ok(d.starTempK > 7000);
    assert.ok(d.solvent === "reducing" || d.solvent === "molten");
    assert.ok(d.oxygenSink < 0.2);
  });
});

describe("eternalDossier", () => {
  it("vetoes our de Sitter sky and leaves the Dyson corridor unbounded", () => {
    const ours = eternalDossier(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(ours.subjective, "finite");
    assert.equal(ours.horizonOpen, false);
    assert.ok(ours.blockers.includes("horizon"));
    const open = eternalDossier(ETERNAL_CORRIDOR, evaluate(ETERNAL_CORRIDOR));
    assert.equal(open.subjective, "unbounded");
    assert.equal(open.horizonOpen, true);
    assert.equal(open.blockers.length, 0);
  });
});

describe("survey", () => {
  it("mixes carbon, silicon and eternal corridors for a fixed seed", () => {
    const rows = survey(64, 1);
    assert.equal(rows.length, 64);
    assert.ok(rows.some((r) => r.evaluation.lifeProb > 0.2));
    assert.ok(rows.some((r) => r.evaluation.siliconProb > 0.3));
    assert.ok(rows.some((r) => r.evaluation.eternalProb > 0.3));
  });
});
