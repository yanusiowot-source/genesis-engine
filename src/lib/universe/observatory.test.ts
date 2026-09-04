import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cmbTempK,
  cosmicAgeGyr,
  epochAt,
  epochBlend,
  evolveStar,
  galaxyVisibility,
  nowMarker,
  sampleMass,
  samplePopulation,
  scaleFactor,
  starLifetimeGyr,
} from "./observatory.ts";
import {
  DESERT_EPOCH,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  darkMatterFraction,
  environmentClass,
  environmentDensity,
  evaluate,
  hubbleMix,
} from "./physics.ts";
import { mulberry32 } from "./rng.ts";

describe("Hubble environment", () => {
  it("places our universe in a group with spiral-dominant mix", () => {
    const env = environmentDensity(OUR_UNIVERSE);
    assert.ok(env > 0.28 && env < 0.4);
    assert.equal(environmentClass(env), "group");
    const mix = hubbleMix(env);
    assert.ok(mix.spiral > 0.5 && mix.spiral < 0.7);
    assert.ok(mix.elliptical > 0.2 && mix.elliptical < 0.4);
    assert.ok(mix.irregular > 0.08 && mix.irregular < 0.2);
    const ev = evaluate(OUR_UNIVERSE);
    assert.equal(ev.morphology, "spiral");
    assert.ok(Math.abs(ev.darkMatterFraction - 0.85) < 0.05);
  });

  it("turns dense, slow skies toward ellipticals", () => {
    const dense = {
      ...OUR_UNIVERSE,
      matter: 1.4,
      expansion: 0.4,
      complexity: 0.5,
      gravity: 1.1,
    };
    const env = environmentDensity(dense);
    assert.equal(environmentClass(env), "cluster");
    assert.ok(hubbleMix(env).elliptical > hubbleMix(env).spiral);
  });

  it("keeps the silicon corridor elliptical and the desert scattered", () => {
    assert.equal(evaluate(SILICON_CORRIDOR).morphology, "elliptical");
    assert.equal(evaluate(DESERT_EPOCH).morphology, "scattered");
  });

  it("keeps dark-matter fraction in (0.6, 0.94)", () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 20; i++) {
      const dm = darkMatterFraction({
        gravity: 1,
        expansion: 0.5 + rng(),
        darkEnergy: rng(),
        matter: 0.1 + rng(),
        complexity: rng(),
        quantumNoise: rng() * 0.4,
      });
      assert.ok(dm >= 0.6 && dm <= 0.94);
    }
  });
});

describe("cosmic clock", () => {
  it("labels the slider epochs in order", () => {
    assert.equal(epochAt(0), "inflation");
    assert.equal(epochAt(0.1), "recombination");
    assert.equal(epochAt(0.2), "darkAges");
    assert.equal(epochAt(0.3), "reionization");
    assert.equal(epochAt(0.55), "stellar");
    assert.equal(epochAt(0.8), "degeneracy");
    assert.equal(epochAt(0.9), "blackHoles");
    assert.equal(epochAt(1), "heatDeath");
  });

  it("crossfades the last stretch of each epoch", () => {
    const mid = epochBlend(0.57);
    assert.equal(mid.from, "stellar");
    assert.equal(mid.to, "degeneracy");
    assert.equal(mid.mix, 0);

    const late = epochBlend(0.42 + (0.72 - 0.42) * 0.9);
    assert.equal(late.from, "stellar");
    assert.equal(late.to, "degeneracy");
    assert.ok(late.mix > 0.4 && late.mix < 1);

    const edge = epochBlend(0.72);
    assert.equal(edge.from, "degeneracy");
    assert.equal(edge.mix, 0);

    const end = epochBlend(1);
    assert.equal(end.from, "heatDeath");
    assert.equal(end.to, "heatDeath");
    assert.equal(end.mix, 0);
  });

  it("lerps galaxy visibility across an epoch boundary", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const a = galaxyVisibility(0.71, ev);
    const b = galaxyVisibility(0.72, ev);
    assert.ok(Math.abs(a - b) < 0.2);
    assert.equal(galaxyVisibility(0.05, ev), 0);
  });

  it("puts our 'now' in the stellar era with CMB near 2.7 K", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const now = nowMarker(OUR_UNIVERSE, ev);
    assert.ok(now >= 0.42 && now <= 0.7);
    assert.equal(epochAt(now), "stellar");
    const cmb = cmbTempK(now, OUR_UNIVERSE);
    assert.ok(cmb > 1.5 && cmb < 6);
    assert.ok(Math.abs(scaleFactor(now) - 1) < 0.4);
    const age = cosmicAgeGyr(now, OUR_UNIVERSE, ev);
    assert.ok(age > 8 && age < 20);
  });

  it("makes recombination thousands of kelvin and a tiny scale factor", () => {
    const t = 0.1;
    assert.ok(cmbTempK(t, OUR_UNIVERSE) > 1500);
    assert.ok(scaleFactor(t) < 0.01);
  });
});

describe("stellar evolution", () => {
  it("gives the Sun ~10 Gyr and a 20 M☉ star a short life", () => {
    assert.ok(Math.abs(starLifetimeGyr(1, 1) - 10) < 0.2);
    assert.ok(starLifetimeGyr(20, 1) < 0.3);
    assert.ok(starLifetimeGyr(1, 1.5) < starLifetimeGyr(1, 1));
  });

  it("evolves 1 M☉ through MS → giant → white dwarf", () => {
    assert.equal(evolveStar(1, 1, 1).stage, "mainSequence");
    assert.equal(evolveStar(1, 9.2, 1).stage, "giant");
    assert.equal(evolveStar(1, 12, 1).stage, "whiteDwarf");
  });

  it("explodes a 15 M☉ star, then leaves a neutron star", () => {
    const tau = starLifetimeGyr(15, 1);
    assert.equal(evolveStar(15, tau * 0.5, 1).stage, "mainSequence");
    assert.equal(evolveStar(15, tau + 0.001, 1).stage, "supernova");
    assert.equal(evolveStar(15, tau + 1, 1).stage, "neutronStar");
    assert.equal(evolveStar(30, tau + 1, 1).stage, "blackHole");
  });

  it("samples a Salpeter-like mass function", () => {
    const rng = mulberry32(11);
    const masses = Array.from({ length: 400 }, () => sampleMass(rng));
    const mean = masses.reduce((a, b) => a + b, 0) / masses.length;
    assert.ok(mean > 0.7 && mean < 3.5);
    assert.ok(masses.every((m) => m >= 0.4 && m <= 40));
  });

  it("builds a population with a main sequence at stellar-era now", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const now = nowMarker(OUR_UNIVERSE, ev);
    const age = cosmicAgeGyr(now, OUR_UNIVERSE, ev);
    const pop = samplePopulation(OUR_UNIVERSE, ev, age, 42, 160);
    assert.ok(pop.length > 40);
    assert.ok(pop.some((s) => s.stage === "mainSequence"));
  });
});
