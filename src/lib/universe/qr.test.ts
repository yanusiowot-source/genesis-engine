import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PAY_BTC, PAY_USDT_BEP20 } from "./studio.ts";
import { qrGrid, qrSvg } from "./qr.ts";

describe("pay QR", () => {
  it("encodes the USDT rail with a finder in the corner", () => {
    const { size, data } = qrGrid(PAY_USDT_BEP20);
    assert.ok(size >= 21);
    assert.equal(data.length, size);
    assert.equal(data[0]?.length, size);
    const origin = data[1]?.[1];
    const inner = data[2]?.[2];
    assert.equal(origin, true);
    assert.equal(inner, false);
  });

  it("draws a scannable SVG for both rails", () => {
    const usdt = qrSvg(PAY_USDT_BEP20);
    const btc = qrSvg(PAY_BTC);
    assert.match(usdt, /<svg /);
    assert.match(usdt, /fill="#ffffff"/);
    assert.ok((usdt.match(/<rect /g) ?? []).length > 80);
    assert.notEqual(usdt, btc);
  });
});
