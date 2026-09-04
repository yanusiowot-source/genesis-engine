import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeFitsImage,
  encodeFitsTable,
  galaxyFits,
  readFitsKeyword,
  universeTableFits,
} from "./fits.ts";
import { evaluate, OUR_UNIVERSE } from "./physics.ts";
import { catalogVotable, parseVotableTableName, universeVotable } from "./votable.ts";
import type { UniverseRecord } from "./types.ts";

function fakeRecord(): UniverseRecord {
  return {
    id: "test",
    catalog: "GE-TEST",
    name: "Test sky",
    visualSeed: 1,
    params: OUR_UNIVERSE,
    evaluation: evaluate(OUR_UNIVERSE),
    createdAt: 0,
  };
}

describe("encodeFitsImage", () => {
  it("writes a 2880-aligned header with SIMPLE and BITPIX −32", () => {
    const data = new Float32Array(8 * 8);
    data[0] = 1.5;
    const buf = encodeFitsImage({ width: 8, height: 8, data });
    assert.equal(buf.length % 2880, 0);
    assert.equal(readFitsKeyword(buf, "SIMPLE")?.trim().startsWith("T"), true);
    assert.equal(readFitsKeyword(buf, "BITPIX")?.trim().startsWith("-32"), true);
    assert.equal(readFitsKeyword(buf, "NAXIS1")?.includes("8"), true);
  });
});

describe("encodeFitsTable", () => {
  it("emits EXTEND and a BINTABLE with the requested rows", () => {
    const buf = encodeFitsTable({
      name: "T",
      columns: [
        { name: "A", kind: "E", values: [1, 2, 3] },
        { name: "B", kind: "A", width: 4, values: ["x", "y", "z"] },
      ],
    });
    assert.equal(buf.length % 2880, 0);
    const text = new TextDecoder("ascii").decode(buf);
    assert.match(text, /XTENSION= 'BINTABLE'/);
    assert.match(text, /NAXIS2  =                    3/);
  });
});

describe("galaxyFits", () => {
  it("encodes a disk image for our universe", () => {
    const buf = galaxyFits(fakeRecord());
    assert.ok(buf.length >= 2880 * 2);
    assert.equal(readFitsKeyword(buf, "OBJECT")?.includes("GE-TEST"), true);
  });
});

describe("universeTableFits", () => {
  it("stores six constants", () => {
    const buf = universeTableFits(OUR_UNIVERSE, evaluate(OUR_UNIVERSE));
    const text = new TextDecoder("ascii").decode(buf);
    assert.match(text, /TTYPE1  = 'NAME'/);
    assert.match(text, /NAXIS2  =                    6/);
  });
});

describe("votable", () => {
  it("names tables and escapes nothing extra on our universe", () => {
    const xml = universeVotable(fakeRecord());
    assert.equal(parseVotableTableName(xml), "constants");
    assert.match(xml, /<VOTABLE version="1.3"/);
    assert.match(xml, /<TABLEDATA>/);
    assert.match(xml, /gravity/);
  });

  it("writes a Pan-STARRS cone", () => {
    const xml = catalogVotable({
      ok: true,
      ra: 10.68,
      dec: 41.27,
      radiusDeg: 0.02,
      source: "panstarrs-dr2",
      stars: [
        { name: "PSO J1", ra: 10.68, dec: 41.27, g: 16.1, r: 15.8, i: 15.4, nDet: 12 },
      ],
    });
    assert.equal(parseVotableTableName(xml), "cone");
    assert.match(xml, /PSO J1/);
  });
});
