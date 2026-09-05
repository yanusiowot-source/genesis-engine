import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copyFor } from "./i18n.ts";
import {
  DESERT_EPOCH,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  friedmannAgeGyr,
} from "./physics.ts";
import { compareToOurs, formatCompareLine, formatDelta } from "./compare.ts";

describe("compareToOurs", () => {
  it("is silent on ΛCDM", () => {
    const reading = compareToOurs(OUR_UNIVERSE);
    assert.equal(reading.ours, true);
    assert.equal(reading.knobs.length, 0);
    assert.ok(Math.abs(reading.ageDeltaGyr) < 0.05);
    assert.equal(formatCompareLine(reading, copyFor("en")), null);
  });

  it("names the knobs that moved and the Friedmann age gap", () => {
    const heavy = { ...OUR_UNIVERSE, gravity: 1.4 };
    const reading = compareToOurs(heavy);
    assert.equal(reading.ours, false);
    assert.equal(reading.knobs[0]?.key, "gravity");
    assert.ok(Math.abs(reading.knobs[0]!.delta - 0.4) < 1e-9);
    const line = formatCompareLine(reading, copyFor("en"));
    assert.match(line ?? "", /Gravity \+0\.40 G₀/);
    const younger = friedmannAgeGyr(heavy) < friedmannAgeGyr(OUR_UNIVERSE);
    if (younger) assert.match(line ?? "", /Younger than home/);
  });

  it("reads the silicon corridor in three authored languages", () => {
    const reading = compareToOurs(SILICON_CORRIDOR);
    assert.equal(reading.ours, false);
    assert.ok(reading.knobs.some((k) => k.key === "gravity" || k.key === "matter"));
    const en = formatCompareLine(reading, copyFor("en")) ?? "";
    const ru = formatCompareLine(reading, copyFor("ru")) ?? "";
    const be = formatCompareLine(reading, copyFor("be")) ?? "";
    assert.match(en, /G₀/);
    assert.match(ru, /Гравитац|Плотност|Тёмн/);
    assert.match(be, /Гравітац|Шчыльнасц|Цёмн/);
    assert.doesNotMatch(en, /census|open source/i);
  });

  it("does not invent a cause for a desert", () => {
    const line = formatCompareLine(compareToOurs(DESERT_EPOCH), copyFor("en")) ?? "";
    assert.doesNotMatch(line, /because|therefore|life cannot/i);
    assert.match(line, /H₀|Ω/);
  });
});

describe("formatDelta", () => {
  it("uses a minus sign, not a hyphen-minus", () => {
    assert.equal(formatDelta(-0.21), "−0.21");
    assert.equal(formatDelta(0.4), "+0.40");
  });
});
