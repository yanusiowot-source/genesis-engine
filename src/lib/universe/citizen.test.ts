import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SPECTRAL_TYPES,
  makeSpectrumTask,
  makeTransitTask,
  typeFromTeff,
} from "./citizen.ts";
import { OUR_UNIVERSE, SILICON_CORRIDOR } from "./physics.ts";

describe("makeSpectrumTask", () => {
  it("is deterministic and labels a real MK type", () => {
    const a = makeSpectrumTask(42, OUR_UNIVERSE);
    const b = makeSpectrumTask(42, OUR_UNIVERSE);
    assert.deepEqual(a.bins, b.bins);
    assert.equal(a.type, b.type);
    assert.ok(SPECTRAL_TYPES.includes(a.type));
    assert.equal(a.bins.length, 28);
    assert.ok(a.bins.every((v) => v >= 0 && v <= 1.0001));
    assert.equal(typeFromTeff(a.teff), a.type);
  });
});

describe("makeTransitTask", () => {
  it("stays near unity flux and is deterministic", () => {
    const a = makeTransitTask(99, OUR_UNIVERSE);
    const b = makeTransitTask(99, OUR_UNIVERSE);
    assert.deepEqual(a.samples, b.samples);
    assert.equal(a.samples.length, 72);
    assert.ok(a.samples.every((v) => v > 0.9 && v < 1.05));
    if (a.hasTransit) {
      const min = Math.min(...a.samples);
      assert.ok(min < 0.995);
    }
  });

  it("still produces a well-formed curve in the silicon corridor", () => {
    const t = makeTransitTask(4, SILICON_CORRIDOR);
    assert.equal(t.kind, "transit");
    assert.ok(t.samples.length > 10);
  });
});
