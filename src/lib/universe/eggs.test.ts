import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANSWER_SEED,
  answerCatalogForOurs,
  noteEggKey,
  sliderEgg,
} from "./eggs.ts";
import { OUR_UNIVERSE } from "./physics.ts";
import { catalogId, hashParams, isAnswerCatalog, nameUniverse, mulberry32 } from "./rng.ts";

describe("answer seed", () => {
  it("prints 42 in the catalog of our constants", () => {
    const id = answerCatalogForOurs();
    assert.equal(id, catalogId(hashParams(OUR_UNIVERSE, ANSWER_SEED)));
    assert.equal(isAnswerCatalog(id), true);
    const name = nameUniverse(mulberry32(ANSWER_SEED), hashParams(OUR_UNIVERSE, ANSWER_SEED));
    assert.equal(name, "Deep Thought");
  });
});

describe("sliderEgg", () => {
  it("stays quiet on ΛCDM", () => {
    assert.equal(sliderEgg(OUR_UNIVERSE), null);
  });

  it("names a sky with every lever down", () => {
    assert.equal(
      sliderEgg({
        gravity: 0.35,
        expansion: 0.25,
        darkEnergy: 0,
        matter: 0.05,
        complexity: 0,
        quantumNoise: 0,
      }),
      "nothing",
    );
  });

  it("names a sky with every lever up", () => {
    assert.equal(
      sliderEgg({
        gravity: 2.2,
        expansion: 1.9,
        darkEnergy: 1,
        matter: 1.8,
        complexity: 1,
        quantumNoise: 0.5,
      }),
      "overcooked",
    );
  });
});

describe("noteEggKey", () => {
  it("hears 042", () => {
    let buf = "";
    let hit = null as ReturnType<typeof noteEggKey>["hit"];
    for (const k of ["0", "4", "2"]) {
      const next = noteEggKey(buf, k);
      buf = next.buf;
      hit = next.hit;
    }
    assert.equal(hit, "answer");
  });

  it("does not treat a lone 2 as the answer", () => {
    const next = noteEggKey("", "2");
    assert.equal(next.hit, null);
    assert.equal(next.buf, "2");
  });

  it("hears towel and the arrow code", () => {
    let buf = "";
    let hit = null as ReturnType<typeof noteEggKey>["hit"];
    for (const k of ["t", "w", "l"]) {
      const next = noteEggKey(buf, k);
      buf = next.buf;
      hit = next.hit;
    }
    assert.equal(hit, "towel");
    buf = "";
    for (const k of [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
    ]) {
      const next = noteEggKey(buf, k);
      buf = next.buf;
      hit = next.hit;
    }
    assert.equal(hit, "panic");
  });
});
