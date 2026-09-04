import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bfLabel, defaultHypothesis, testHypothesis } from "./bayes.ts";

describe("testHypothesis", () => {
  it("finds support that quiet quantum noise favors carbon", () => {
    const h = defaultHypothesis();
    const r = testHypothesis(21, h, 280);
    assert.ok(r.nCond + r.nNot === r.n);
    assert.ok(r.pCond > r.pNot, `pCond=${r.pCond} pNot=${r.pNot}`);
    assert.ok(r.pGreater > 0.8, `pGreater=${r.pGreater}`);
    assert.ok(r.bf10 > 1, `bf=${r.bf10}`);
    assert.ok(r.pCondLo < r.pCond && r.pCond < r.pCondHi);
  });

  it("is deterministic", () => {
    const h = defaultHypothesis();
    const a = testHypothesis(8, h, 120);
    const b = testHypothesis(8, h, 120);
    assert.equal(a.kCond, b.kCond);
    assert.equal(a.bf10, b.bf10);
  });
});

describe("bfLabel", () => {
  it("grades Jeffreys-style", () => {
    assert.equal(bfLabel(12), "strong");
    assert.equal(bfLabel(4), "moderate");
    assert.equal(bfLabel(1.1), "none");
  });
});
