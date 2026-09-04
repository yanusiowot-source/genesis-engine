import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lookCam, projectLook } from "./galaxy.ts";

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
