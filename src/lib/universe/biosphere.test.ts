import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { biosphereOf, sortTaxa } from "./biosphere.ts";
import {
  DESERT_EPOCH,
  ETERNAL_CORRIDOR,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  evaluate,
} from "./physics.ts";

describe("biosphereOf", () => {
  it("puts ΛCDM near Earth's living biomass, plants first", () => {
    const b = biosphereOf(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    assert.equal(b.path, "carbon");
    assert.equal(b.note, "carbon");
    assert.ok(b.worldGtC > 280 && b.worldGtC < 850);
    const ranked = sortTaxa(b.taxa, "biomass");
    assert.equal(ranked[0]?.id, "plants");
    const plants = b.taxa.find((t) => t.id === "plants");
    const animals = b.taxa.find((t) => t.id === "animals");
    assert.ok(plants && animals);
    assert.ok(plants.biomassGtC > 10 * animals.biomassGtC);
    assert.ok(animals.open);
    const prok = b.grades.find((g) => g.id === "prokaryotes");
    const photo = b.grades.find((g) => g.id === "photosynthesis");
    assert.equal(prok?.open, true);
    assert.equal(photo?.open, true);
  });

  it("sorts by species count without changing totals", () => {
    const b = biosphereOf(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    const bySp = sortTaxa(b.taxa, "species");
    const sumA = b.taxa.reduce((s, t) => s + t.biomassGtC, 0);
    const sumB = bySp.reduce((s, t) => s + t.biomassGtC, 0);
    assert.ok(Math.abs(sumA - sumB) < 1e-9);
    assert.ok((bySp[0]?.species ?? 0) >= (bySp[bySp.length - 1]?.species ?? 0));
  });

  it("leaves the desert without a biosphere", () => {
    const b = biosphereOf(DESERT_EPOCH, evaluate(DESERT_EPOCH));
    assert.equal(b.note, "empty");
    assert.equal(b.worldGtC, 0);
    assert.equal(b.taxa.length, 0);
    assert.ok(b.grades.every((g) => !g.open));
  });

  it("gives the silicon corridor lattice/chain mass, not plants", () => {
    const b = biosphereOf(SILICON_CORRIDOR, evaluate(SILICON_CORRIDOR));
    assert.equal(b.note, "silicon");
    assert.ok(b.worldGtC > 5);
    assert.equal(b.taxa.some((t) => t.id === "plants"), false);
    assert.ok(b.taxa.some((t) => t.id === "lattices" || t.id === "chains"));
    const top = sortTaxa(b.taxa, "biomass")[0];
    assert.ok(top && (top.id === "lattices" || top.id === "chains"));
  });

  it("gives the Dyson corridor no wet biomass", () => {
    const b = biosphereOf(ETERNAL_CORRIDOR, evaluate(ETERNAL_CORRIDOR));
    assert.equal(b.note, "eternal");
    assert.equal(b.worldGtC, 0);
    assert.equal(b.taxa.length, 0);
    const minds = b.grades.find((g) => g.id === "minds");
    assert.equal(minds?.open, true);
  });

  it("keeps shares on the simplex when a corridor is open", () => {
    const b = biosphereOf(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    const share = b.taxa.reduce((s, t) => s + t.share, 0);
    assert.ok(Math.abs(share - 1) < 1e-6);
    for (const t of b.taxa) {
      assert.ok(t.biomassGtC >= 0);
      assert.ok(t.species >= 0);
    }
  });
});
