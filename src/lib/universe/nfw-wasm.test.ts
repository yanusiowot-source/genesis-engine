import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { bootNfwKernel, nfwKernel } from "./nfw-wasm.ts";
import { nfwEinsteinX, nfwF, nfwFJs, nfwKappa, nfwMeanKappa } from "./observatory.ts";

const wasm = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "kernels/nfw.wasm"));

describe("nfw wasm kernel", () => {
  it("boots a 3kb module and tracks the JS Bartelmann homology", () => {
    assert.equal(bootNfwKernel(wasm), true);
    const k = nfwKernel();
    assert.ok(k);
    const xs = [1e-8, 0.2, 1, 1.7, 4];
    for (const x of xs) {
      assert.ok(Math.abs(nfwF(x) - nfwFJs(x)) < 1e-9, `F(${x})`);
      assert.ok(Math.abs(k.nfw_f(x) - nfwFJs(x)) < 1e-9);
    }
    assert.equal(nfwF(1), 1);
    const ks = 0.6;
    assert.ok(Math.abs(nfwMeanKappa(nfwEinsteinX(ks), ks) - 1) < 0.05);
    assert.ok(Math.abs(nfwKappa(1, ks) - (2 * ks) / 3) < 1e-6);
  });
});
