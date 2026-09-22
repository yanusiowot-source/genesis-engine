import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterByMeta, plateScore, upsertArchive } from "./archive.ts";
import {
  ETERNAL_CORRIDOR,
  OUR_SEED,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  SWARM_CORRIDOR,
  evaluate,
} from "./physics.ts";
import type { UniverseRecord } from "./types.ts";

function plate(over: Partial<UniverseRecord> = {}): UniverseRecord {
  const params = over.params ?? OUR_UNIVERSE;
  return {
    id: "A",
    catalog: "GE-AAAAAA",
    name: "Lyra Nova I",
    visualSeed: 1,
    params,
    evaluation: over.evaluation ?? evaluate(params),
    createdAt: 1,
    ...over,
  };
}

describe("upsertArchive", () => {
  it("keeps a star and a field note when a later plate omits them", () => {
    const kept = plate({ starred: true, chronicle: "Kept." });
    const next = plate({ name: "Lyra Nova I" });
    const out = upsertArchive([kept], next);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.starred, true);
    assert.equal(out[0]!.chronicle, "Kept.");
  });

  it("does not copy a note onto a different catalog", () => {
    const kept = plate({ chronicle: "Kept.", starred: true });
    const other = plate({
      id: "B",
      catalog: "GE-BBBBBB",
      name: "Lyra Nova I",
      chronicle: undefined,
    });
    const out = upsertArchive([kept], other);
    assert.equal(out.length, 2);
    const a = out.find((r) => r.id === "A");
    const b = out.find((r) => r.id === "B");
    assert.equal(a?.chronicle, "Kept.");
    assert.equal(a?.starred, true);
    assert.equal(b?.chronicle, undefined);
    assert.equal(b?.starred, undefined);
  });

  it("replaces an unpinned draft of the same birth", () => {
    const born = plate({ id: "A", catalog: "GE-AAAAAA", visualSeed: 7 });
    const tuned = plate({
      id: "B",
      catalog: "GE-BBBBBB",
      visualSeed: 7,
      params: { ...OUR_UNIVERSE, gravity: 1.2 },
    });
    const out = upsertArchive([born], tuned);
    assert.equal(out.length, 1);
    assert.equal(out[0]!.id, "B");
  });

  it("keeps a starred birth when a later draft of the same seed arrives", () => {
    const kept = plate({ id: "A", visualSeed: 7, starred: true });
    const tuned = plate({
      id: "B",
      visualSeed: 7,
      catalog: "GE-BBBBBB",
      params: { ...OUR_UNIVERSE, gravity: 1.2 },
    });
    const out = upsertArchive([kept], tuned);
    assert.equal(out.length, 2);
    assert.ok(out.some((r) => r.id === "A" && r.starred));
    assert.ok(out.some((r) => r.id === "B"));
  });

  it("does not evict the factory ΛCDM plate", () => {
    const home = plate({
      id: "H",
      visualSeed: OUR_SEED,
      params: OUR_UNIVERSE,
    });
    const tuned = plate({
      id: "B",
      visualSeed: OUR_SEED,
      catalog: "GE-BBBBBB",
      params: { ...OUR_UNIVERSE, gravity: 1.2 },
    });
    const out = upsertArchive([home], tuned);
    assert.equal(out.length, 2);
    assert.ok(out.some((r) => r.id === "H"));
    assert.ok(out.some((r) => r.id === "B"));
  });
});

describe("plateScore", () => {
  it("reads carbon on ΛCDM, silicon / eternity / tide on their corridors", () => {
    assert.equal(plateScore(plate()).path, "carbon");
    assert.equal(plateScore(plate({ params: SILICON_CORRIDOR })).path, "silicon");
    assert.equal(plateScore(plate({ params: ETERNAL_CORRIDOR })).path, "eternal");
    assert.equal(plateScore(plate({ params: SWARM_CORRIDOR })).path, "swarm");
    assert.ok(plateScore(plate({ params: SWARM_CORRIDOR })).value > 0.4);
  });
});

describe("filterByMeta", () => {
  it("ANDs named fields and ignores absent keys", () => {
    const home = plate({ id: "H" });
    const tide = plate({ id: "S", params: SWARM_CORRIDOR });
    const starred = plate({ id: "K", starred: true, params: SILICON_CORRIDOR });
    const rows = [home, tide, starred];
    assert.equal(filterByMeta(rows, {}).length, 3);
    assert.deepEqual(
      filterByMeta(rows, { path: "swarm" }).map((r) => r.id),
      ["S"],
    );
    assert.deepEqual(
      filterByMeta(rows, { starred: true, path: "silicon" }).map((r) => r.id),
      ["K"],
    );
    assert.equal(filterByMeta(rows, { fate: "void", path: "swarm" }).length, 0);
    assert.equal(
      filterByMeta([tide], { path: "swarm", fate: tide.evaluation.fate }).length,
      1,
    );
    const tagged = plate({ id: "C", catalog: "GE-CCCCCC" });
    assert.equal(filterByMeta([home, tide, tagged], { catalog: "GE-CCCCCC" }).length, 1);
    assert.equal(
      filterByMeta([tagged], {
        morphology: tagged.evaluation.morphology,
        catalog: "GE-CCCCCC",
      }).length,
      1,
    );
  });
});
