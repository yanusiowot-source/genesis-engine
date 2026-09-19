import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluate, OUR_UNIVERSE, DESERT_EPOCH } from "./physics.ts";
import { pickEncounter } from "./encounters.ts";

describe("pickEncounter", () => {
  it("is deterministic on a seed", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const a = pickEncounter(42, ev);
    const b = pickEncounter(42, ev);
    assert.deepEqual(a, b);
    assert.ok(a);
    assert.match(a.kind, /wow|throat|classified|tau|zone|whale/);
  });

  it("always still blinks on a desert", () => {
    const ev = evaluate(DESERT_EPOCH);
    let hits = 0;
    for (let s = 1; s <= 40; s++) {
      if (pickEncounter(s * 997, ev)) hits += 1;
    }
    assert.equal(hits, 40);
  });
});
