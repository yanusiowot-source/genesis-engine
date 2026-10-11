import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGalaxy, type Star } from "./galaxy.ts";
import { OUR_UNIVERSE, evaluate } from "./physics.ts";
import { deviceView, diskPlace, packStars, shaderDiskPlace, STAR_FLOATS } from "./sky-gpu.ts";

const star = (x: number, y: number): Star => ({
  x,
  y,
  z: 0.4,
  r: 1.2,
  rgb: [180, 200, 220],
  a: 0.8,
  phase: 0.3,
  mass: 1,
  birthGyr: 4,
});

/**
 * Contract: deviceView(packStars(world)) ≡ fround(cx + x·scale) · dpr, one dpr.
 * The buffer is Float32. Compare against Math.fround, never against a Float64 literal.
 * A green test that needs +1e-7 in the placer is a bug wearing a fix.
 */
describe("disk gpu at t = 0", () => {
  it("places one packed star where the 2D disk places it, dpr once, no shear", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const model = buildGalaxy(OUR_UNIVERSE, ev, 9);
    const baked = model.stars[0];
    assert.ok(baked);
    const x = 0.22;
    const y = -0.07;
    const sample = star(x, y);
    const packed = new Float32Array(STAR_FLOATS * 2);
    assert.equal(packStars([sample, baked], packed), 2);
    assert.equal(packed[0], Math.fround(x));
    assert.equal(packed[1], Math.fround(y));
    assert.equal(packed[STAR_FLOATS], Math.fround(baked.x));
    assert.equal(packed[STAR_FLOATS + 1], Math.fround(baked.y));
    assert.notEqual(packed[2], 0);

    const css = { ox: 200, oy: 150, w: 400, h: 300, scale: 80, rot: 0, vis: 1, dpr: 2 };
    const before = packed.slice();
    const dev = deviceView(css);
    assert.deepEqual(Array.from(packed), Array.from(before));
    assert.equal(dev.ox, css.ox * css.dpr);
    assert.equal(dev.oy, css.oy * css.dpr);
    assert.equal(dev.scale, css.scale * css.dpr);

    for (const world of [
      { x: packed[0]!, y: packed[1]! },
      { x: packed[STAR_FLOATS]!, y: packed[STAR_FLOATS + 1]! },
    ]) {
      const cssPoint = diskPlace(world.x, world.y, css);
      const expectedX = css.ox + world.x * css.scale;
      const expectedY = css.oy + world.y * css.scale;
      assert.ok(Math.abs(cssPoint.x - expectedX) < 1e-9);
      assert.ok(Math.abs(cssPoint.y - expectedY) < 1e-9);
      const onDevice = shaderDiskPlace(world.x, world.y, dev);
      assert.ok(Math.abs(onDevice.x - expectedX * css.dpr) < 1e-9);
      assert.ok(Math.abs(onDevice.y - expectedY * css.dpr) < 1e-9);
      const doubled = shaderDiskPlace(world.x * css.dpr, world.y * css.dpr, dev);
      assert.ok(Math.abs(doubled.x - expectedX * css.dpr) > 1);
    }
  });
});
