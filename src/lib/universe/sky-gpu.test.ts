import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gpuOffered, packStars, STAR_FLOATS } from "./sky-gpu.ts";
import type { Star } from "./galaxy.ts";

describe("sky-gpu", () => {
  it("does not claim a GPU in node", () => {
    assert.equal(gpuOffered(), false);
  });

  it("packs stars as 8 floats without dropping the first", () => {
    const stars: Star[] = [
      { x: 0.2, y: -0.1, z: 0, r: 1.5, rgb: [10, 20, 30], a: 0.5, phase: 0, mass: 1, birthGyr: 1 },
    ];
    const into = new Float32Array(STAR_FLOATS);
    assert.equal(packStars(stars, into, 1), 1);
    assert.ok(Math.abs(into[0]! - 0.2) < 1e-6);
    assert.ok(Math.abs(into[1]! + 0.1) < 1e-6);
    assert.ok(Math.abs(into[4]! - 10 / 255) < 1e-6);
    assert.equal(into[7], 0.5);
  });
});
