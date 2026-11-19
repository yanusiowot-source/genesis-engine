import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { integrateThree, threeForest } from "./three-body.ts";

describe("three bodies", () => {
  it("keeps Euler's line on a circle and lets a hairline shove leave it", () => {
    const exact = integrateThree(0);
    for (const path of exact) {
      for (const pt of path) {
        assert.equal(Number.isFinite(pt.x) && Number.isFinite(pt.y), true);
        assert.ok(Math.hypot(pt.x, pt.y) < 1.05);
      }
    }
    const shoved = integrateThree(0.0015);
    const far = shoved.some((path) => path.some((pt) => Math.hypot(pt.x, pt.y) > 2));
    assert.equal(far, true);
  });

  it("grows a short forest around that one curve", () => {
    const forest = threeForest();
    assert.equal(forest.filter((b) => b.exact).length, 1);
    assert.equal(forest.length, 9);
  });
});
