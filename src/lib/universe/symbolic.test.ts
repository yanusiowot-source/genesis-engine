import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OUR_UNIVERSE, evaluate } from "./physics.ts";
import { scoreOf } from "./research.ts";
import {
  complexityOf,
  discoverLaw,
  evalExpr,
  formatExpr,
  predictLaw,
} from "./symbolic.ts";

describe("formatExpr", () => {
  it("prints Gaussians with short symbols", () => {
    const s = formatExpr({ t: "g", k: "gravity", mu: 1, sig: 0.33 });
    assert.equal(s, "N(G;1.00,0.330)");
  });

  it("prints sigmoids and powers", () => {
    const sig = formatExpr({
      t: "s",
      a: { t: "b", op: "-", a: { t: "v", k: "matter" }, b: { t: "c", v: 0.85 } },
    });
    assert.equal(sig, "sig((Ωm - 0.850))");
    const pow = formatExpr({ t: "pow", a: { t: "v", k: "gravity" }, e: -2.15 });
    assert.equal(pow, "G^{-2.15}");
  });
});

describe("discoverLaw", () => {
  it("recovers a carbon law with held-out R² above 0.8", () => {
    const result = discoverLaw(17, "carbon", 400);
    assert.ok(result.best.r2Test > 0.8, `r2Test=${result.best.r2Test}`);
    assert.ok(result.best.formula.includes("N(") || result.best.formula.includes("sig"));
    assert.ok(result.best.complexity >= 1);
    const pred = predictLaw(result.best.expr, OUR_UNIVERSE);
    const truth = scoreOf(evaluate(OUR_UNIVERSE), "carbon");
    assert.ok(Math.abs(pred - truth) < 0.25, `pred=${pred} truth=${truth}`);
  });

  it("is deterministic for a seed", () => {
    const a = discoverLaw(4, "silicon", 80);
    const b = discoverLaw(4, "silicon", 80);
    assert.equal(a.best.formula, b.best.formula);
    assert.equal(a.best.r2Test, b.best.r2Test);
  });
});

describe("evalExpr", () => {
  it("multiplies Gaussians", () => {
    const expr = {
      t: "b" as const,
      op: "*" as const,
      a: { t: "g" as const, k: "gravity" as const, mu: 1, sig: 0.33 },
      b: { t: "c" as const, v: 0.5 },
    };
    const y = evalExpr(expr, OUR_UNIVERSE);
    assert.ok(y > 0.4 && y < 0.55);
    assert.equal(complexityOf(expr), 3);
  });
});
