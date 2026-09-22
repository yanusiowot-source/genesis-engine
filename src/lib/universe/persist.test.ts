import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { persistH0, persistLong } from "./persist.ts";

describe("persist H0", () => {
  it("keeps one infinite bar on a single blob", () => {
    const pts: number[][] = [];
    for (let i = 0; i < 12; i++) pts.push([0.01 * i, 0.01 * (i % 3)]);
    const bars = persistH0(pts);
    assert.equal(bars.filter((b) => !Number.isFinite(b.death)).length, 1);
    assert.equal(persistLong(bars, 0.2), 0);
  });

  it("sees two clusters as one long finite bar", () => {
    const pts: number[][] = [];
    for (let i = 0; i < 8; i++) pts.push([0.02 * i, 0]);
    for (let i = 0; i < 8; i++) pts.push([4 + 0.02 * i, 0]);
    const bars = persistH0(pts);
    assert.equal(persistLong(bars, 1), 1);
    assert.equal(persistLong(bars, 0.2) >= 1, true);
  });

  it("is a rotation and translation homology", () => {
    const a: number[][] = [
      [0, 0],
      [0.1, 0],
      [5, 0],
      [5.1, 0],
    ];
    const b = a.map(([x, y]) => [y! + 2, -x! + 1]);
    assert.equal(persistLong(persistH0(a), 1), persistLong(persistH0(b), 1));
  });

  it("reads a 6-d journal the same way as the sky", () => {
    const close: number[][] = [
      [0.2, 0.3, 0.4, 0.5, 0.6, 0.5],
      [0.21, 0.31, 0.41, 0.51, 0.61, 0.51],
    ];
    const far = [...close, [0.9, 0.1, 0.1, 0.1, 0.1, 0.1]];
    assert.equal(persistLong(persistH0(close), 0.5), 0);
    assert.equal(persistLong(persistH0(far), 0.5), 1);
  });
});
