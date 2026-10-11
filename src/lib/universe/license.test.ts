import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fillOrder,
  isPlausibleTx,
  mintReceipt,
  normalizeTx,
  plateOf,
  receiptText,
} from "./license.ts";

const USDT_TX = `0x${"ab".repeat(32)}`;
const BTC_TX = "cd".repeat(32);

describe("license plate", () => {
  it("accepts a BEP20 hash and a Segwit txid", () => {
    assert.equal(isPlausibleTx(USDT_TX, "usdt"), true);
    assert.equal(isPlausibleTx(BTC_TX, "btc"), true);
    assert.equal(isPlausibleTx("nope", "usdt"), false);
    assert.equal(isPlausibleTx(USDT_TX.slice(2), "usdt"), true);
    assert.equal(normalizeTx(USDT_TX.slice(2), "usdt"), USDT_TX);
    assert.equal(isPlausibleTx(`0x${BTC_TX}`, "btc"), true);
    assert.equal(normalizeTx(`0x${BTC_TX}`, "btc"), BTC_TX);
    assert.equal(isPlausibleTx("xyz", "btc"), false);
  });

  it("stamps a stable plate from the tx", () => {
    const a = plateOf(`  ${USDT_TX}  `);
    const b = plateOf(USDT_TX.toUpperCase());
    assert.match(a, /^GE-125-[0-9A-F]{4}$/);
    assert.equal(a, b);
    assert.notEqual(plateOf(USDT_TX), plateOf(BTC_TX));
  });

  it("mints a personal receipt, not a lock", () => {
    const receipt = mintReceipt(normalizeTx(USDT_TX), "usdt");
    assert.ok(receipt);
    assert.equal(receipt.sku, "desktop");
    assert.equal(receipt.plate, plateOf(USDT_TX));
    const text = receiptText(receipt);
    assert.match(text, /personal/i);
    assert.match(text, /not a lock/i);
    assert.match(text, /writes back/i);
    assert.match(text, /1 USD/);
    assert.match(text, /USDT/);
    assert.match(text, /not a lock/i);
    const named = mintReceipt(normalizeTx(BTC_TX), "btc", 15);
    assert.equal(named?.amount, "15");
    assert.match(receiptText(named!), /15 USD/);
    assert.match(receiptText(named!), /Bitcoin/);
    assert.equal(mintReceipt(normalizeTx(USDT_TX), "usdt", 0)?.amount, "1");
    assert.match(text, new RegExp(receipt.plate));
    assert.equal(mintReceipt("nope", "usdt"), null);
  });

  it("fills the order note with plate and tx", () => {
    const note = fillOrder("Paid {amount}. Plate {plate}. Tx {tx}.", "GE-125-AA11", USDT_TX, "7");
    assert.match(note, /GE-125-AA11/);
    assert.match(note, new RegExp(USDT_TX));
    assert.match(note, /Paid 7/);
  });
});
