import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adaptiveQuality, buildGalaxy, canvasDpr, encounterOf, lookCam, PIXEL_BUDGET, planetariumScreen, PLANETARIUM_FOV, projectLook } from "./galaxy.ts";
import { evaluate, OUR_UNIVERSE } from "./physics.ts";

describe("inside-sky camera", () => {
  it("places the bulge in front of the default look", () => {
    const cam = lookCam(0, 0);
    const bulge = projectLook(0, 0, 0, cam, PLANETARIUM_FOV);
    assert.ok(bulge);
    assert.ok(bulge.depth > 0.4);
    assert.ok(Math.abs(bulge.x) < 0.12);
    assert.ok(Math.abs(bulge.y) < 0.12);
  });

  it("culls stars behind the observer", () => {
    const cam = lookCam(0, 0);
    assert.equal(projectLook(1.4, 0, 0, cam, PLANETARIUM_FOV), null);
  });

  it("yaw swings the bulge off-center", () => {
    const left = projectLook(0, 0, 0, lookCam(-0.4, 0), PLANETARIUM_FOV);
    const right = projectLook(0, 0, 0, lookCam(0.4, 0), PLANETARIUM_FOV);
    assert.ok(left && right);
    assert.ok(left.x < 0);
    assert.ok(right.x > 0);
  });

  it("pitch looking up puts the plane below center", () => {
    const up = projectLook(0, 0, 0, lookCam(0, 0.35), PLANETARIUM_FOV);
    assert.ok(up);
    assert.ok(up.y > 0);
  });

  it("places a star only through projectLook, then scale", () => {
    const cam = lookCam(0.12, 0.05);
    const ndc = projectLook(0.2, -0.04, 0.01, cam, PLANETARIUM_FOV);
    const screen = planetariumScreen(0.2, -0.04, 0.01, cam, 200, 150, 80);
    assert.ok(ndc && screen);
    assert.ok(Math.abs(screen.x - (200 + ndc.x * 80)) < 1e-9);
    assert.ok(Math.abs(screen.y - (150 + ndc.y * 80)) < 1e-9);
    assert.equal(screen.depth, ndc.depth);
    assert.equal(planetariumScreen(1.4, 0, 0, lookCam(0, 0), 0, 0, 80), null);
  });
});

describe("buildGalaxy", () => {
  it("builds a spiral for our constants without NaN stars", () => {
    const ev = evaluate(OUR_UNIVERSE);
    assert.equal(ev.morphology, "spiral");
    const model = buildGalaxy(OUR_UNIVERSE, ev, 0x4c91a2e1, 0.45);
    assert.ok(model.stars.length > 40);
    for (const star of model.stars.slice(0, 20)) {
      assert.equal(Number.isFinite(star.x) && Number.isFinite(star.y) && Number.isFinite(star.z), true);
      assert.ok(star.rgb.every((c) => c >= 0 && c <= 255));
    }
  });

  it("adds a bar to our disk that a nearby spiral does not get", () => {
    const ours = buildGalaxy(OUR_UNIVERSE, evaluate(OUR_UNIVERSE), 7, 0.5);
    const neighborParams = { ...OUR_UNIVERSE, gravity: 1.08 };
    const neighbor = buildGalaxy(neighborParams, evaluate(neighborParams), 7, 0.5);
    assert.ok(ours.stars.length > neighbor.stars.length);
    assert.ok(ours.dust.length > 0);
    assert.ok(ours.background.some((g) => g.kind === "spiral"));
  });

  it("keeps quality in range without a window", () => {
    const q = adaptiveQuality();
    assert.ok(q.scale >= 0.22 && q.scale <= 1);
    assert.ok(q.dprCap >= 1 && q.dprCap <= 1.6);
  });

  it("caps backing-store pixels on a 4K screen and keeps phones sharp", () => {
    const dpr4k = canvasDpr(3840, 2160, 1.75, 2);
    assert.ok(dpr4k * dpr4k * 3840 * 2160 <= PIXEL_BUDGET * 1.02);
    assert.ok(dpr4k < 0.7);
    assert.ok(canvasDpr(390, 844, 1.1, 3) >= 1);
    assert.ok(canvasDpr(1280, 800, 1.5, 2) <= 1.5);
  });

  it("still builds a disk at the lowest quality", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const model = buildGalaxy(OUR_UNIVERSE, ev, 3, 0.22);
    assert.ok(model.stars.length > 24);
    assert.ok(model.field.length > 10);
  });

  it("puts a MAD jet on a cluster elliptical and none on our disk", () => {
    const ours = buildGalaxy(OUR_UNIVERSE, evaluate(OUR_UNIVERSE), 9, 0.5);
    assert.equal(ours.jet.power, 0);
    const ellP = { ...OUR_UNIVERSE, matter: 1.1 };
    const ell = buildGalaxy(ellP, evaluate(ellP), 9, 0.5);
    assert.equal(evaluate(ellP).morphology, "elliptical");
    assert.ok(ell.jet.power > 0.1);
    assert.ok(ell.jet.flicker > 0.15);
    assert.ok(ell.jet.fill < 0.5);
    assert.equal(ours.jet.fill, 1);
    assert.equal(ell.jet.fr, "fri");
    assert.equal(ours.jet.fr, "none");
  });

  it("gives our disk a major Andromeda-like encounter and a dwarf a minor one", () => {
    const ours = encounterOf(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(ours.kind, "major");
    assert.ok(ours.q > 0.6);
    const dwarfP = { ...OUR_UNIVERSE, matter: 0.1, quantumNoise: 0.45, complexity: 0.15 };
    const dwarfE = evaluate(dwarfP);
    const dwarf = encounterOf(dwarfP, dwarfE);
    assert.ok(dwarf.q < ours.q);
    assert.ok(ours.rTide > dwarf.rTide);
    const built = buildGalaxy(OUR_UNIVERSE, evaluate(OUR_UNIVERSE), 9, 0.5);
    assert.equal(built.encounter.kind, "major");
    assert.ok(built.companion.length > 10);
    assert.ok(built.h0Long >= 0);
    assert.equal(Number.isInteger(built.h0Long), true);
  });
});
