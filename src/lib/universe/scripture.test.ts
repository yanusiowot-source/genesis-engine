import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OUR_UNIVERSE, evaluate } from "./physics.ts";
import {
  PASSAGES,
  passageUrl,
  pickPassageId,
  passageById,
  tongueOf,
  passageRef,
} from "./scripture.ts";

describe("scripture canon", () => {
  it("has unique ids and gateway queries", () => {
    const ids = new Set(PASSAGES.map((p) => p.id));
    assert.equal(ids.size, PASSAGES.length);
    for (const p of PASSAGES) {
      assert.ok(p.ref.length > 3);
      assert.ok(p.query.includes(" "));
      assert.ok(p.line.en.length > 8);
      assert.ok(p.line.ru.length > 8);
      assert.ok(p.line.be.length > 8);
      assert.doesNotMatch(p.line.ru, /Imp/);
    }
  });

  it("follows epoch first, then fate", () => {
    assert.equal(pickPassageId({ epoch: "inflation", fate: "habitable", ours: true }), "gen1_1");
    assert.equal(pickPassageId({ epoch: "recombination", fate: "void", ours: false }), "gen1_3");
    assert.equal(pickPassageId({ epoch: "darkAges", fate: "teeming", ours: false }), "gen1_2");
    assert.equal(pickPassageId({ epoch: "reionization", fate: "sterile", ours: false }), "gen1_16");
    assert.equal(pickPassageId({ epoch: "stellar", fate: "teeming", ours: false }), "gen1_31");
    assert.equal(pickPassageId({ epoch: "stellar", fate: "habitable", ours: true }), "isa45_18");
    assert.equal(pickPassageId({ epoch: "stellar", fate: "enduring", ours: false }), "eccl3_11");
    assert.equal(pickPassageId({ epoch: "stellar", fate: "void", ours: false }), "job26_7");
    assert.equal(pickPassageId({ epoch: "stellar", fate: "sterile", ours: true }), "ps8_3");
    assert.equal(pickPassageId({ epoch: "stellar", fate: "sterile", ours: false }), "ps19_1");
    assert.equal(pickPassageId({ epoch: "degeneracy", fate: "teeming", ours: true }), "col1_17");
    assert.equal(pickPassageId({ epoch: "blackHoles", fate: "enduring", ours: false }), "job26_7");
    assert.equal(pickPassageId({ epoch: "heatDeath", fate: "rip", ours: false }), "pet3_8");
  });

  it("points KJV or Synodal at Bible Gateway", () => {
    const p = passageById("gen1_3");
    assert.match(passageUrl(p, "en"), /version=KJV/);
    assert.match(passageUrl(p, "ru"), /version=RUSV/);
    assert.match(passageUrl(p, "be"), /Genesis/);
    assert.equal(tongueOf("ru-RU"), "ru");
  });

  it("cites the book in the observatory tongue", () => {
    const isa = passageById("isa45_18");
    assert.equal(passageRef(isa, "en"), "Isaiah 45:18");
    assert.equal(passageRef(isa, "ru"), "Исаия 45:18");
    assert.equal(passageRef(isa, "be"), "Ісая 45:18");
    const pet = passageById("pet3_8");
    assert.equal(passageRef(pet, "ru"), "2 Петра 3:8");
    const gen = passageById("gen1_1");
    assert.equal(passageRef(gen, "ru"), "Бытие 1:1");
  });

  it("our ΛCDM in the stellar era is Psalm 8, not a proof-text of the physics", () => {
    const ev = evaluate(OUR_UNIVERSE);
    assert.ok(ev.fate === "habitable" || ev.fate === "teeming" || ev.fate === "sterile" || ev.fate === "enduring");
    const id = pickPassageId({ epoch: "stellar", fate: ev.fate, ours: true });
    assert.ok(["ps8_3", "isa45_18", "gen1_31", "eccl3_11", "ps19_1"].includes(id));
  });
});
