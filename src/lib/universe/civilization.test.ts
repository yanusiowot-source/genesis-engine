import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { intelligenceWindow, sparkPath, stageReached, formatDiasporaLine } from "./civilization.ts";
import { DESERT_EPOCH, ETERNAL_CORRIDOR, OUR_UNIVERSE, SILICON_CORRIDOR, evaluate } from "./physics.ts";
import { copyFor, hydrateRu } from "./i18n.ts";

await hydrateRu();

describe("intelligenceWindow", () => {
  it("puts our universe on a carbon path with a modest intelligence envelope", () => {
    const m = intelligenceWindow(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(m.path, "carbon");
    assert.equal(m.collapsed, false);
    assert.ok(m.pIntelligence > 0.02 && m.pIntelligence < 0.35);
    assert.equal(m.stages.length, 5);
    assert.equal(stageReached(m), "tech" );
    assert.ok(m.curve.length >= 16);
    assert.ok(m.stages[0]!.pSurvive > m.stages[3]!.pSurvive);
    assert.ok(m.ships >= 0 && m.ships < 0.5);
    assert.ok(m.ships > 0.02);
  });

  it("puts the silicon corridor on a silicon path with harder minds", () => {
    const m = intelligenceWindow(SILICON_CORRIDOR, evaluate(SILICON_CORRIDOR));
    assert.equal(m.path, "silicon");
    const ours = intelligenceWindow(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    const siMinds = m.stages.find((s) => s.id === "minds")!.pSurvive;
    const cMinds = ours.stages.find((s) => s.id === "minds")!.pSurvive;
    assert.ok(siMinds < cMinds);
  });

  it("puts the Dyson corridor on an eternal path that does not collapse at heat death", () => {
    const m = intelligenceWindow(ETERNAL_CORRIDOR, evaluate(ETERNAL_CORRIDOR));
    assert.equal(m.path, "eternal");
    assert.equal(m.collapsed, false);
    assert.ok(m.pIntelligence > 0.04);
    const last = m.curve[m.curve.length - 1];
    assert.ok((last?.minds ?? 0) > 0.02);
  });

  it("leaves the desert without a chemistry path", () => {
    const m = intelligenceWindow(DESERT_EPOCH, evaluate(DESERT_EPOCH));
    assert.equal(m.path, "none");
    assert.ok(m.pIntelligence < 0.02);
    assert.equal(stageReached(m), "none");
    assert.equal(m.ships, 0);
  });

  it("keeps the ecology analog bounded", () => {
    const m = intelligenceWindow(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    for (const p of m.curve) {
      assert.ok(p.biosphere >= 0 && p.biosphere < 2);
      assert.ok(p.minds >= 0 && p.minds < 2);
    }
  });

  it("reads a thin diaspora on ΛCDM and stays silent on a desert", () => {
    const ours = intelligenceWindow(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    const line = formatDiasporaLine(ours, copyFor("en").civ, { swarmProb: evaluate(OUR_UNIVERSE).swarmProb });
    assert.match(line ?? "", /diaspora analog/i);
    assert.match(line ?? "", /not a fleet/i);
    assert.match(line ?? "", /Fermi/i);
    assert.doesNotMatch(line ?? "", /census|narcotic|gang/i);
    const ru = formatDiasporaLine(ours, copyFor("ru").civ) ?? "";
    assert.match(ru, /не флот/);
    const desert = intelligenceWindow(DESERT_EPOCH, evaluate(DESERT_EPOCH));
    assert.equal(formatDiasporaLine(desert, copyFor("en").civ), null);
  });
});

describe("sparkPath", () => {
  it("emits an SVG path", () => {
    const d = sparkPath([0, 0.4, 0.8, 0.2], 120, 36);
    assert.match(d, /^M/);
    assert.match(d, /L/);
  });
});
