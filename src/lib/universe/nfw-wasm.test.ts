import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { NFW_WASM_B64 } from "./nfw-bytes.ts";
import { bootNfwEmbedded, bootNfwKernel, nfwFillGrid, nfwKernel, nfwWasmMark, wasmSimdOffered } from "./nfw-wasm.ts";
import { nfwF, nfwFJs, nfwKappa, nfwMeanKappa } from "./observatory.ts";

const wasm = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "kernels/nfw.wasm"));

describe("nfw wasm kernel", () => {
  it("marks wait vs live without pretending", () => {
    assert.equal(nfwWasmMark(null), "wait");
    assert.equal(nfwWasmMark(false), "0");
    assert.equal(nfwWasmMark(true), "live");
    assert.equal(
      wasmSimdOffered(),
      WebAssembly.validate(
        new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, 0x03,
          0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0x0b,
        ]),
      ),
    );
  });

  it("boots the embedded module and tracks the JS Bartelmann homology", async () => {
    assert.equal(await bootNfwEmbedded(), true);
    const k = nfwKernel();
    assert.ok(k);
    const xs = [1e-8, 0.2, 1, 1.7, 4];
    for (const x of xs) {
      assert.ok(Math.abs(nfwF(x) - nfwFJs(x)) < 1e-9, `F(${x})`);
      assert.ok(Math.abs(k.nfw_f(x) - nfwFJs(x)) < 1e-9);
    }
    assert.equal(nfwF(1), 1);
  });

  it("fills a kappa grid that tracks the scalar kernel", async () => {
    assert.equal(await bootNfwEmbedded(), true);
    const n = 8;
    const x0 = 0.2;
    const x1 = 4;
    const ks = 0.45;
    const grid = nfwFillGrid(n, x0, x1, ks);
    assert.ok(grid);
    assert.equal(grid.kappa.length, n);
    for (let i = 0; i < n; i++) {
      const xx = x0 + ((x1 - x0) * (i + 1)) / n;
      assert.ok(Math.abs(grid.kappa[i]! - nfwKappa(xx, ks)) < 1e-9, `κ ${xx}`);
      assert.ok(Math.abs(grid.mean[i]! - nfwMeanKappa(xx, ks)) < 1e-9, `⟨κ⟩ ${xx}`);
    }
  });

  it("keeps the file bytes identical to the embed", () => {
    const fromFile = Buffer.from(wasm);
    const fromB64 = Buffer.from(NFW_WASM_B64, "base64");
    assert.equal(fromB64.equals(fromFile), true);
    assert.equal(bootNfwKernel(wasm), true);
  });
});
