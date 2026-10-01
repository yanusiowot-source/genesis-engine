import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  deviceView,
  diskPlace,
  faceOnLocal,
  gpuOffered,
  instanceOnScreen,
  packGalaxyInstances,
  packStars,
  QUAD_INDEX,
  QUAD_VERTS,
  STAR_FLOATS,
  skyGpuMark,
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
    assert.equal(skyGpuMark(false, null), "0");
    assert.equal(skyGpuMark(true, null), "wait");
    assert.equal(skyGpuMark(true, false), "0");
    assert.equal(skyGpuMark(true, true), "live");
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

  it("does not mix CSS pixels with a device framebuffer", () => {
    const css = { ox: 200, oy: 150, w: 400, h: 300, scale: 100, rot: 0.2, vis: 1, dpr: 2 };
    const gpu = deviceView(css);
    assert.equal(gpu.w, 800);
    assert.equal(gpu.ox, 400);
    assert.equal(gpu.scale, 200);
    assert.equal(gpu.point, 2);
    const a = instanceOnScreen(0.4, 0.1, 1.2, { ...css, point: 1 });
    const b = instanceOnScreen(0.4, 0.1, 1.2, gpu);
    assert.equal(a, b);
  });

  it("places a disk star as the 2D canvas does at t = 0, without shear", () => {
    const view = { ox: 200, oy: 150, scale: 80, rot: 0.31 };
    const x = 0.22;
    const y = -0.07;
    const local = faceOnLocal(x, y, view.scale);
    const c = Math.cos(view.rot);
    const s = Math.sin(view.rot);
    const gpu = diskPlace(x, y, view);
    assert.ok(Math.abs(gpu.x - (view.ox + local.x * c - local.y * s)) < 1e-9);
    assert.ok(Math.abs(gpu.y - (view.oy + local.x * s + local.y * c)) < 1e-9);
    const rest = diskPlace(x, y, { ...view, rot: 0 });
    const still = faceOnLocal(x, y, view.scale);
    assert.ok(Math.abs(rest.x - (view.ox + still.x)) < 1e-9);
    assert.ok(Math.abs(rest.y - (view.oy + still.y)) < 1e-9);
    const packed = new Float32Array(STAR_FLOATS);
    packStars([star({ x, y })], packed);
    assert.ok(Math.abs(packed[0]! - x) < 1e-6);
    assert.ok(Math.abs(packed[1]! - y) < 1e-6);
    const here = dirname(fileURLToPath(import.meta.url));
    const canvas = readFileSync(join(here, "../../components/galaxy-canvas.tsx"), "utf8");
    const shader = readFileSync(join(here, "sky-gpu.ts"), "utf8");
    assert.match(canvas, /faceOnLocal\(x, y, scale\)/);
    assert.match(canvas, /from "@\/lib\/universe\/sky-place"/);
    assert.doesNotMatch(canvas, /from "@\/lib\/universe\/sky-gpu"/);
    assert.match(canvas, /import\("@\/lib\/universe\/sky-gpu"\)/);
    assert.doesNotMatch(canvas, /px = x \* scale/);
    assert.match(shader, /let x = pos\.x \* c - pos\.y \* s;/);
    assert.match(shader, /let y = pos\.x \* s \+ pos\.y \* c;/);
    assert.match(shader, /let px = u\.origin\.x \+ x \* u\.scale;/);
  });
});
