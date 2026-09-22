import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { NFW_WASM_B64 } from "./nfw-bytes.ts";
import { bootNfwEmbedded, bootNfwKernel, nfwKernel, nfwWasmMark } from "./nfw-wasm.ts";
import { nfwF, nfwFJs } from "./observatory.ts";

const wasm = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "kernels/nfw.wasm"));

describe("nfw wasm kernel", () => {
  it("marks wait vs live without pretending", () => {
    assert.equal(nfwWasmMark(null), "wait");
    assert.equal(nfwWasmMark(false), "0");
    assert.equal(nfwWasmMark(true), "live");
  });

  it("boots the embedded module and tracks the JS Bartelmann homology", () => {
    assert.equal(bootNfwEmbedded(), true);
    const k = nfwKernel();
    assert.ok(k);
    const xs = [1e-8, 0.2, 1, 1.7, 4];
    for (const x of xs) {
      assert.ok(Math.abs(nfwF(x) - nfwFJs(x)) < 1e-9, `F(${x})`);
      assert.ok(Math.abs(k.nfw_f(x) - nfwFJs(x)) < 1e-9);
    }
    assert.equal(nfwF(1), 1);
  });

  it("keeps the file bytes identical to the embed", () => {
    const fromFile = Buffer.from(wasm);
    const fromB64 = Buffer.from(NFW_WASM_B64, "base64");
    assert.equal(fromB64.equals(fromFile), true);
    assert.equal(bootNfwKernel(wasm), true);
  });
});
