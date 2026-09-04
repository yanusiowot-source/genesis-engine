import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGalaxy, lookCam, projectLook } from "./galaxy.ts";
import { evaluate, OUR_UNIVERSE } from "./physics.ts";

describe("inside-sky camera", () => {
  it("places the bulge in front of the default look", () => {
    const cam = lookCam(0, 0);
    const bulge = projectLook(0, 0, 0, cam, 1.22);
    assert.ok(bulge);
    assert.ok(bulge.depth > 0.4);
    assert.ok(Math.abs(bulge.x) < 0.12);
    assert.ok(Math.abs(bulge.y) < 0.12);
  });

  it("culls stars behind the observer", () => {
    const cam = lookCam(0, 0);
    assert.equal(projectLook(1.4, 0, 0, cam, 1.22), null);
  });

  it("yaw swings the bulge off-center", () => {
    const left = projectLook(0, 0, 0, lookCam(-0.4, 0), 1.22);
    const right = projectLook(0, 0, 0, lookCam(0.4, 0), 1.22);
    assert.ok(left && right);
    assert.ok(left.x < 0);
    assert.ok(right.x > 0);
  });

  it("pitch looking up puts the plane below center", () => {
    const up = projectLook(0, 0, 0, lookCam(0, 0.35), 1.22);
    assert.ok(up);
    assert.ok(up.y > 0);
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
});
