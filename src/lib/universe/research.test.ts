import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DESERT_EPOCH,
  ETERNAL_CORRIDOR,
  OUR_UNIVERSE,
  PARAM_META,
  SILICON_CORRIDOR,
  SWARM_CORRIDOR,
  evaluate,
} from "./physics.ts";
import {
  localSensitivity,
  permutationImportance,
  RESEARCH_TARGETS,
  runExpedition,
  scoreOf,
} from "./research.ts";
import { mulberry32 } from "./rng.ts";
import { randomParams } from "./physics.ts";

describe("scoreOf", () => {
  it("ranks our universe high on carbon and low on silicon", () => {
    const ev = evaluate(OUR_UNIVERSE);
    assert.ok(scoreOf(ev, "carbon") > 0.4);
    assert.ok(scoreOf(ev, "silicon") < 0.05);
    assert.ok(scoreOf(ev, "overall") === scoreOf(ev, "carbon"));
    assert.ok(scoreOf(ev, "diversity") < 0.1);
    assert.ok(scoreOf(ev, "eternal") < 0.03);
  });

  it("ranks the von Neumann corridor on the tide", () => {
    const ev = evaluate(SWARM_CORRIDOR);
    assert.equal(scoreOf(ev, "swarm"), ev.swarmProb);
    assert.ok(scoreOf(ev, "overall") === ev.swarmProb);
    assert.ok(ev.swarmProb > scoreOf(ev, "carbon"));
  });

  it("ranks the silicon corridor on silicon, not carbon", () => {
    const ev = evaluate(SILICON_CORRIDOR);
    assert.ok(scoreOf(ev, "silicon") > scoreOf(ev, "carbon"));
    assert.ok(scoreOf(ev, "overall") === scoreOf(ev, "silicon"));
  });

  it("ranks the Dyson corridor on eternal, not carbon", () => {
    const ev = evaluate(ETERNAL_CORRIDOR);
    assert.ok(scoreOf(ev, "eternal") > 0.45);
    assert.ok(scoreOf(ev, "eternal") > scoreOf(ev, "carbon"));
    assert.ok(scoreOf(ev, "overall") === scoreOf(ev, "eternal"));
  });
});

describe("runExpedition", () => {
  it("is deterministic for a seed", () => {
    const a = runExpedition(77, "carbon", OUR_UNIVERSE);
    const b = runExpedition(77, "carbon", OUR_UNIVERSE);
    assert.equal(a.sampleN, b.sampleN);
    assert.equal(a.viableCarbon, b.viableCarbon);
    assert.deepEqual(a.importance, b.importance);
    assert.deepEqual(
      a.best.map((r) => r.score),
      b.best.map((r) => r.score),
    );
  });

  it("finds carbon-viable worlds from a carbon hunt", () => {
    const result = runExpedition(3, "carbon", OUR_UNIVERSE);
    assert.equal(result.sampleN, 280);
    assert.ok(result.viableCarbon >= 1);
    assert.ok(result.best[0]!.score >= 0.15);
    assert.ok(result.thisPercentile > 0.5);
    const sum = result.importance.reduce((a, r) => a + r.value, 0);
    assert.ok(Math.abs(sum - 1) < 1e-6);
    assert.equal(result.importance.length, PARAM_META.length);
    assert.ok(result.insights.includes("rareViable") || result.meanCarbon < 0.5);
  });

  it("finds silicon-viable worlds from a silicon hunt", () => {
    const result = runExpedition(11, "silicon", SILICON_CORRIDOR);
    assert.ok(result.best[0]!.evaluation.siliconProb > 0.3);
    assert.ok(result.thisPercentile > 0.55);
  });

  it("finds Dyson-open worlds from an eternal hunt", () => {
    const result = runExpedition(13, "eternal", ETERNAL_CORRIDOR);
    assert.ok(result.best[0]!.evaluation.eternalProb > 0.3);
    assert.ok(result.thisPercentile > 0.55);
    assert.ok(result.viableEternal >= 1);
  });

  it("finds tide worlds from a swarm hunt", () => {
    const result = runExpedition(17, "swarm", SWARM_CORRIDOR);
    assert.ok(result.best[0]!.evaluation.swarmProb > 0.3);
    assert.ok(result.thisPercentile > 0.55);
    assert.ok(result.viableSwarm >= 1);
    assert.ok(result.meanSwarm > 0);
  });

  it("exposes the tide as a hunt axis", () => {
    assert.ok(RESEARCH_TARGETS.includes("swarm"));
    assert.equal(RESEARCH_TARGETS.length, 6);
  });

  it("keeps a desert sky in a low percentile", () => {
    const result = runExpedition(5, "overall", DESERT_EPOCH);
    assert.ok(result.thisPercentile < 0.55);
  });
});

describe("permutationImportance", () => {
  it("returns a simplex over the six constants", () => {
    const rng = mulberry32(19);
    const rows = Array.from({ length: 80 }, () => randomParams(rng));
    const imp = permutationImportance(rows, "carbon", rng);
    const sum = imp.reduce((a, r) => a + r.value, 0);
    assert.ok(Math.abs(sum - 1) < 1e-6);
    assert.ok(imp[0]!.value >= imp[imp.length - 1]!.value);
  });
});

describe("localSensitivity", () => {
  it("says gravity matters near the silicon corridor", () => {
    const rows = localSensitivity(SILICON_CORRIDOR, "silicon");
    const g = rows.find((r) => r.key === "gravity");
    assert.ok(g && g.value > 0.05);
  });
});
