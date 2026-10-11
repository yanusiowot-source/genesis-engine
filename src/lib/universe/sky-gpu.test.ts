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
  shaderDiskPlace,
  STAR_FLOATS,
  skyGpuMark,
  starTwinkle,
} from "./sky-gpu.ts";
import { epochBackdropKey, rgbInk } from "./sky-place.ts";
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
  it("reuses one ink string for one star color", () => {
    const a = rgbInk(10, 20, 30);
    assert.equal(a, rgbInk(10, 20, 30));
    assert.equal(a, "rgb(10,20,30)");
    assert.equal(rgbInk(10.2, 20.6, 29.4), "rgb(10,21,29)");
    assert.equal(rgbInk(266, -4, Number.NaN), "rgb(255,0,0)");
    assert.notEqual(rgbInk(11, 20, 30), a);
  });

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
    const fromShader = shaderDiskPlace(x, y, view);
    assert.ok(Math.abs(fromShader.x - gpu.x) < 1e-9);
    assert.ok(Math.abs(fromShader.y - gpu.y) < 1e-9);
    const css = { ox: view.ox, oy: view.oy, w: 400, h: 300, scale: view.scale, rot: view.rot, vis: 1, dpr: 2 };
    const dev = deviceView(css);
    const onDevice = shaderDiskPlace(x, y, dev);
    assert.ok(Math.abs(onDevice.x - gpu.x * css.dpr) < 1e-9);
    assert.ok(Math.abs(onDevice.y - gpu.y * css.dpr) < 1e-9);
    const rd = Math.hypot(x, y);
    const phi = Math.atan2(y, x);
    assert.ok(Math.abs(Math.cos(phi) * rd * view.scale - local.x) < 1e-9);
    assert.ok(Math.abs(Math.sin(phi) * rd * view.scale - local.y) < 1e-9);
    const here = dirname(fileURLToPath(import.meta.url));
    const canvas = readFileSync(join(here, "../../components/galaxy-canvas.tsx"), "utf8");
    const shader = readFileSync(join(here, "sky-gpu.ts"), "utf8");
    assert.match(canvas, /faceOnLocal\(x, y, scale\)/);
    assert.match(canvas, /from "@\/lib\/universe\/sky-place"/);
    assert.doesNotMatch(canvas, /from "@\/lib\/universe\/sky-gpu"/);
    assert.match(canvas, /import\("@\/lib\/universe\/sky-gpu"\)/);
    assert.doesNotMatch(canvas, /px = x \* scale/);
    assert.match(shader, /fn placeDisk\(wx: f32, wy: f32\) -> vec2f/);
    assert.match(shader, /let rx = wx \* c - wy \* s;/);
    assert.match(shader, /let ry = wx \* s \+ wy \* c;/);
    assert.match(shader, /return vec2f\(u\.origin\.x \+ rx \* u\.scale, u\.origin\.y \+ ry \* u\.scale\);/);
    assert.equal((shader.match(/placeDisk\(/g) ?? []).length, 3);
    assert.match(shader, /u\.time/);
    assert.match(shader, /select\(1\.0, pulse, u\.live == 1u\)/);
    assert.equal(starTwinkle(1.2, 0.2, -0.1, false), 1);
    const dim = starTwinkle(0.2, 0.4, 0.1, true);
    const lit = starTwinkle(1.6, 0.4, 0.1, true);
    assert.ok(dim >= 0.24 && dim <= 1);
    assert.ok(lit >= 0.24 && lit <= 1);
    assert.notEqual(dim, lit);
    assert.match(canvas, /function nebulaBreath/);
    assert.match(canvas, /function paintNebula/);
    assert.match(canvas, /function nebulaGrain/);
    assert.doesNotMatch(canvas, /Math\.random\(\)/);
    assert.match(canvas, /function twinkleOf/);
    assert.match(canvas, /data-sky-gpu="0"/);
    assert.match(canvas, /rgbInk\(/);
    assert.match(canvas, /g\.globalAlpha = 1/);
    assert.match(canvas, /const POINT_STAR_PX = 0\.9/);
    assert.match(canvas, /function isPointStar/);
    assert.match(canvas, /size <= POINT_STAR_PX && stage !== "supernova" && stage !== "blackHole"/);
    assert.match(canvas, /wrap\.dataset\.skyGpu = skyGpuMark\(true, null\)/);
    assert.doesNotMatch(canvas, /data-sky-gpu=\{skyGpuMark/);
  });
});

describe("epoch backdrop", () => {
  const base = {
    epoch: "stellar",
    w: 390,
    h: 700,
    dpr: 2,
    seed: 1,
    quantumNoise: 0.1,
    complexity: 0.4,
    structure: 0.5,
    eternalProb: 0,
    whale: false,
    niche: "clear",
    ell1: 1,
    baryonLoad: 1,
  };

  it("keeps the same key when the plate is still and changes when the paint would", () => {
    assert.equal(epochBackdropKey(base), epochBackdropKey({ ...base }));
    assert.notEqual(epochBackdropKey(base), epochBackdropKey({ ...base, niche: "damped" }));
    assert.notEqual(epochBackdropKey(base), epochBackdropKey({ ...base, whale: true }));
    const here = dirname(fileURLToPath(import.meta.url));
    const canvas = readFileSync(join(here, "../../components/galaxy-canvas.tsx"), "utf8");
    assert.match(canvas, /w \* h <= 900_000/);
    assert.match(canvas, /blend\.mix > 0\.02 && blend\.to !== blend\.from/);
    assert.match(canvas, /paintEpoch\(ctx, blend\.to/);
  });
});
