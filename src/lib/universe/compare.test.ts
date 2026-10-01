import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { copyFor, hydrateBe } from "./i18n.ts";
import {
  DESERT_EPOCH,
  CLUSTER_SKY,
  DWARF_SKY,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  friedmannAgeGyr,
} from "./physics.ts";
import {
  compareToOurs,
  formatCompareFlash,
  formatCompareLine,
  compareLines,
  formatDelta,
  plateTitle,
} from "./compare.ts";

await hydrateBe();

describe("compareToOurs", () => {
  it("is silent on ΛCDM", () => {
    const reading = compareToOurs(OUR_UNIVERSE);
    assert.equal(reading.ours, true);
    assert.equal(reading.knobs.length, 0);
    assert.ok(Math.abs(reading.ageDeltaGyr) < 0.05);
    assert.equal(formatCompareLine(reading, copyFor("en")), null);
    assert.equal(formatCompareFlash(reading, copyFor("en")), null);
  });

  it("names the knobs that moved and the Friedmann age gap", () => {
    const heavy = { ...OUR_UNIVERSE, gravity: 1.4 };
    const reading = compareToOurs(heavy);
    assert.equal(reading.ours, false);
    assert.equal(reading.knobs[0]?.key, "gravity");
    assert.ok(Math.abs(reading.knobs[0]!.delta - 0.4) < 1e-9);
    const line = formatCompareLine(reading, copyFor("en"));
    assert.match(line ?? "", /Gravity \+0\.40 G₀/);
    const parts = compareLines(reading, copyFor("en"));
    assert.ok(parts.length >= 1);
    assert.ok(parts.every((part) => !part.startsWith("·")));
    const younger = friedmannAgeGyr(heavy) < friedmannAgeGyr(OUR_UNIVERSE);
    if (younger) assert.match(line ?? "", /Younger than home/);
  });

  it("flashes only the age, not the knobs", () => {
    const heavy = { ...OUR_UNIVERSE, gravity: 1.4 };
    const copy = copyFor("en");
    const reading = compareToOurs(heavy);
    const flash = formatCompareFlash(reading, copy) ?? "";
    const line = formatCompareLine(reading, copy) ?? "";
    assert.match(flash, /home/);
    assert.doesNotMatch(flash, /G₀|Ω|H₀/);
    assert.ok(flash.length < line.length);
    assert.match(formatCompareFlash(reading, copyFor("ru")) ?? "", /дома/);
    assert.match(formatCompareFlash(reading, copyFor("be")) ?? "", /дома/);
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
    const flash = formatCompareFlash(compareToOurs(DESERT_EPOCH), copyFor("en")) ?? "";
    assert.doesNotMatch(flash, /because|therefore|empty|void/i);
  });
});

describe("plateTitle", () => {
  it("names known plates and leaves a random birth alone", () => {
    const en = copyFor("en");
    assert.equal(plateTitle(CLUSTER_SKY, en, "Lyra"), en.presetCluster);
    assert.equal(plateTitle(DWARF_SKY, en, "Lyra"), en.presetDwarf);
    assert.equal(plateTitle(SILICON_CORRIDOR, en, "Lyra"), en.presetSilicon);
    assert.equal(plateTitle(DESERT_EPOCH, en, "Lyra"), en.presetDesert);
    assert.equal(plateTitle(OUR_UNIVERSE, en, "Lyra Minor I"), "Lyra Minor I");
  });
});

describe("formatDelta", () => {
  it("uses a minus sign, not a hyphen-minus", () => {
    assert.equal(formatDelta(-0.21), "−0.21");
    assert.equal(formatDelta(0.4), "+0.40");
  });
});
