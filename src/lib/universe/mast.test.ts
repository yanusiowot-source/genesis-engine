import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFilenamesTsv, parsePanstarrsBody } from "./mast.ts";

describe("parsePanstarrsBody", () => {
  it("maps named columns and drops invalid magnitudes", () => {
    const body = {
      info: [
        { name: "objName" },
        { name: "raMean" },
        { name: "decMean" },
        { name: "gMeanPSFMag" },
        { name: "rMeanPSFMag" },
        { name: "iMeanPSFMag" },
        { name: "nDetections" },
      ],
      data: [
        ["PSO J000", 10.68, 41.27, 16.2, 15.8, 15.4, 12],
        ["bad", 10.7, 41.3, -999, 40, 15.1, 4],
      ],
    };
    const r = parsePanstarrsBody(body, { ra: 10.68, dec: 41.27, radiusDeg: 0.04 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.stars.length, 2);
    assert.equal(r.stars[0]?.r, 15.8);
    assert.equal(r.stars[1]?.g, null);
    assert.equal(r.stars[1]?.r, null);
  });

  it("rejects missing RA/Dec columns", () => {
    const r = parsePanstarrsBody({ info: [{ name: "foo" }], data: [] }, {
      ra: 0,
      dec: 0,
      radiusDeg: 0.04,
    });
    assert.equal(r.ok, false);
  });
});

describe("parseFilenamesTsv", () => {
  it("reads filter to filename", () => {
    const text = [
      "ra,dec,objID,filter,mjd,type,filename",
      "10.68,41.27,1,g,1,stack,rings.v3.skycell.a.stk.g.unconv.fits",
      "10.68,41.27,1,r,1,stack,rings.v3.skycell.a.stk.r.unconv.fits",
    ].join("\n");
    const files = parseFilenamesTsv(text);
    assert.equal(files.g?.endsWith("stk.g.unconv.fits"), true);
    assert.equal(files.r?.includes(".stk.r."), true);
  });

  it("parses the space-separated PS1 table", () => {
    const text = [
      "projcell subcell ra dec filter mjd type filename shortname badflag",
      "2159 34 10.6847 41.2692 g 0.0 stack /rings.v3.skycell/2159/034/rings.v3.skycell.2159.034.stk.g.unconv.fits rings.v3.skycell.2159.034.stk.g.unconv.fits 0",
    ].join("\n");
    const files = parseFilenamesTsv(text);
    assert.equal(files.g, "rings.v3.skycell.2159.034.stk.g.unconv.fits");
  });
});
