import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ANSWER_SEED,
  answerCatalogForOurs,
  isEggPrefix,
  noteEggKey,
  sliderEgg,
} from "./eggs.ts";
import { OUR_UNIVERSE, DESERT_EPOCH } from "./physics.ts";
import { catalogId, hashParams, isAnswerCatalog, namePlate, nameUniverse, mulberry32 } from "./rng.ts";

describe("answer seed", () => {
  it("prints 42 in the catalog of our constants", () => {
    const id = answerCatalogForOurs();
    assert.equal(id, catalogId(hashParams(OUR_UNIVERSE, ANSWER_SEED)));
    assert.equal(isAnswerCatalog(id), true);
    const name = nameUniverse(mulberry32(ANSWER_SEED), hashParams(OUR_UNIVERSE, ANSWER_SEED));
    assert.equal(name, "Deep Thought");
    assert.equal(namePlate(ANSWER_SEED, hashParams(OUR_UNIVERSE, ANSWER_SEED)), "Deep Thought");
  });
});

describe("namePlate", () => {
  it("keeps the birth name when the constants move", () => {
    const seed = 0xabcde;
    const home = namePlate(seed, hashParams(OUR_UNIVERSE, seed));
    const desert = namePlate(seed, hashParams(DESERT_EPOCH, seed));
    assert.equal(home, desert);
    assert.notEqual(home, "Deep Thought");
  });

  it("drops Deep Thought when the catalog leaves 42", () => {
    const ours = hashParams(OUR_UNIVERSE, ANSWER_SEED);
    const desert = hashParams(DESERT_EPOCH, ANSWER_SEED);
    assert.equal(namePlate(ANSWER_SEED, ours), "Deep Thought");
    assert.notEqual(namePlate(ANSWER_SEED, desert), "Deep Thought");
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
    buf = "";
    for (const k of ["t", "a", "u"]) {
      const next = noteEggKey(buf, k);
      buf = next.buf;
      hit = next.hit;
    }
    assert.equal(hit, "tau");
    buf = "";
    hit = null;
    for (const k of ["т", "а", "у"]) {
      const next = noteEggKey(buf, k);
      buf = next.buf;
      hit = next.hit;
    }
    assert.equal(hit, "tau");
    buf = "";
    hit = null;
    for (const k of ["к", "и", "т", "а"]) {
      const next = noteEggKey(buf, k);
      buf = next.buf;
      hit = next.hit;
    }
    assert.equal(hit, "tau");
  });

  it("hears von Neumann, classified, highway, and the zone", () => {
    const type = (keys: string[]) => {
      let buf = "";
      let hit = null as ReturnType<typeof noteEggKey>["hit"];
      for (const k of keys) {
        const next = noteEggKey(buf, k);
        buf = next.buf;
        hit = next.hit;
      }
      return hit;
    };
    assert.equal(type(["v", "n", "m"]), "tide");
    assert.equal(type(["a", "5", "1"]), "fiftyone");
    assert.equal(type(["r", "6", "0"]), "highway");
    assert.equal(type(["z", "o", "n"]), "zone");
    assert.equal(type(["i", "c", "e"]), "ice");
    assert.equal(type(["w", "o", "w"]), "wow");
    assert.equal(type(["w", "i", "t"]), "witness");
    assert.equal(type(["g", "t"]), "throat");
    assert.equal(type(["v", "n"]), null);
  });

  it("holds shortcut letters as prefixes of r60, zon, and twl", () => {
    assert.equal(isEggPrefix("r"), true);
    assert.equal(isEggPrefix("r6"), true);
    assert.equal(isEggPrefix("zo"), true);
    assert.equal(isEggPrefix("tw"), true);
    assert.equal(isEggPrefix("w"), true);
    assert.equal(isEggPrefix("wo"), true);
    assert.equal(isEggPrefix("wi"), true);
    assert.equal(isEggPrefix("g"), true);
    assert.equal(isEggPrefix("gt"), false);
    assert.equal(isEggPrefix("b"), false);
    assert.equal(isEggPrefix("r60"), false);
  });
});
