import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  gpuOffered,
  instanceOnScreen,
  packGalaxyInstances,
  packStars,
  QUAD_INDEX,
  QUAD_VERTS,
  STAR_FLOATS,
} from "./sky-gpu.ts";
import type { GalaxyModel, Star } from "./galaxy.ts";

const star = (over: Partial<Star> = {}): Star => ({
  x: 0.2,
  y: -0.1,
  z: 0,
  r: 1.5,
  rgb: [10, 20, 30],
  a: 0.5,
  phase: 0,
  mass: 1,
  birthGyr: 1,
  ...over,
});

describe("sky-gpu", () => {
  it("does not claim a GPU in node", () => {
    assert.equal(gpuOffered(), false);
  });

  it("packs stars as 8 floats without dropping the first", () => {
    const into = new Float32Array(STAR_FLOATS);
    assert.equal(packStars([star()], into), 1);
    assert.ok(Math.abs(into[0]! - 0.2) < 1e-6);
    assert.ok(Math.abs(into[1]! + 0.1) < 1e-6);
    assert.ok(Math.abs(into[4]! - 10 / 255) < 1e-6);
    assert.equal(into[7], 0.5);
  });

  it("keeps one static quad and appends the field after the disk", () => {
    assert.equal(QUAD_VERTS.length, 8);
    assert.equal(QUAD_INDEX.length, 6);
    const model = {
      stars: [star()],
      field: [star({ x: 0.9, a: 1 })],
    } as GalaxyModel;
    const into = new Float32Array(STAR_FLOATS * 2);
    assert.equal(packGalaxyInstances(model, into), 2);
    assert.ok(Math.abs(into[STAR_FLOATS]! - 0.9) < 1e-6);
    assert.ok(Math.abs(into[STAR_FLOATS + 7]! - 0.85) < 1e-6);
  });

  it("culls sprites that miss the canvas after rotation", () => {
    const view = { ox: 200, oy: 150, w: 400, h: 300, scale: 100, rot: 0, point: 1 };
    assert.equal(instanceOnScreen(0, 0, 1, view), true);
    assert.equal(instanceOnScreen(8, 0, 1, view), false);
    assert.equal(instanceOnScreen(0, -8, 1, view), false);
    const tilted = { ...view, rot: Math.PI / 2 };
    assert.equal(instanceOnScreen(0.1, 0, 1, tilted), true);
  });
});
