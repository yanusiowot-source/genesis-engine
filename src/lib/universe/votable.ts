import type { CatalogResult } from "./mast.ts";
import type { McmcResult } from "./mcmc.ts";
import { PARAM_META } from "./physics.ts";
import type { UniverseRecord } from "./types.ts";

function esc(s: string): string {
  return s
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function td(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "" || (typeof v === "number" && !Number.isFinite(v))) {
    return "<TD/>";
  }
  return `<TD>${esc(String(v))}</TD>`;
}

type Field = { name: string; datatype: string; unit?: string; arraysize?: string };

function fieldXml(f: Field): string {
  const unit = f.unit ? ` unit="${esc(f.unit)}"` : "";
  const arr = f.arraysize ? ` arraysize="${esc(f.arraysize)}"` : "";
  return `<FIELD name="${esc(f.name)}" datatype="${f.datatype}"${unit}${arr}/>`;
}

function votable(resource: string, table: string, fields: Field[], rows: string[][]): string {
  const body = rows
    .map((r) => `        <TR>${r.map((c) => td(c)).join("")}</TR>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<VOTABLE version="1.3" xmlns="http://www.ivoa.net/xml/VOTable/v1.3">
  <DESCRIPTION>Genesis Engine — interpretable homology, not a Boltzmann solver.</DESCRIPTION>
  <RESOURCE name="${esc(resource)}">
    <TABLE name="${esc(table)}">
      ${fields.map(fieldXml).join("\n      ")}
      <DATA>
        <TABLEDATA>
${body}
        </TABLEDATA>
      </DATA>
    </TABLE>
  </RESOURCE>
</VOTABLE>
`;
}

export function catalogVotable(catalog: Extract<CatalogResult, { ok: true }>): string {
  return votable(
    "PanSTARRS_DR2",
    "cone",
    [
      { name: "name", datatype: "char", arraysize: "*" },
      { name: "ra", datatype: "double", unit: "deg" },
      { name: "dec", datatype: "double", unit: "deg" },
      { name: "gMeanPSFMag", datatype: "float", unit: "mag" },
      { name: "rMeanPSFMag", datatype: "float", unit: "mag" },
      { name: "iMeanPSFMag", datatype: "float", unit: "mag" },
      { name: "nDetections", datatype: "int" },
    ],
    catalog.stars.map((s) => [
      s.name,
      s.ra.toFixed(6),
      s.dec.toFixed(6),
      s.g === null ? "" : s.g.toFixed(3),
      s.r === null ? "" : s.r.toFixed(3),
      s.i === null ? "" : s.i.toFixed(3),
      String(s.nDet),
    ]),
  );
}

export function mcmcVotable(result: McmcResult): string {
  return votable(
    "GenesisMCMC",
    "chain",
    [
      { name: "gravity", datatype: "float", unit: "G0" },
      { name: "expansion", datatype: "float", unit: "H0" },
      { name: "darkEnergy", datatype: "float" },
      { name: "matter", datatype: "float" },
      { name: "complexity", datatype: "float" },
      { name: "quantumNoise", datatype: "float" },
      { name: "logL", datatype: "float" },
      { name: "score", datatype: "float" },
      { name: "lifeProb", datatype: "float" },
      { name: "siliconProb", datatype: "float" },
      { name: "eternalProb", datatype: "float" },
      { name: "swarmProb", datatype: "float" },
    ],
    result.samples.map((s) => [
      s.params.gravity.toFixed(4),
      s.params.expansion.toFixed(4),
      s.params.darkEnergy.toFixed(4),
      s.params.matter.toFixed(4),
      s.params.complexity.toFixed(4),
      s.params.quantumNoise.toFixed(4),
      s.logL.toFixed(4),
      s.score.toFixed(4),
      s.lifeProb.toFixed(4),
      s.siliconProb.toFixed(4),
      s.eternalProb.toFixed(4),
      (s.swarmProb ?? 0).toFixed(4),
    ]),
  );
}

export function universeVotable(record: UniverseRecord): string {
  const p = record.params;
  const ev = record.evaluation;
  return votable(
    "GenesisUniverse",
    "constants",
    [
      { name: "key", datatype: "char", arraysize: "*" },
      { name: "value", datatype: "char", arraysize: "*" },
      { name: "unit", datatype: "char", arraysize: "*" },
    ],
    [
      ...PARAM_META.map((m) => [m.key, p[m.key].toFixed(4), m.unit]),
      ["lifeProb", ev.lifeProb.toFixed(4), ""],
      ["siliconProb", ev.siliconProb.toFixed(4), ""],
      ["eternalProb", ev.eternalProb.toFixed(4), ""],
      ["swarmProb", (ev.swarmProb ?? 0).toFixed(4), ""],
      ["catalog", record.catalog, ""],
      ["fate", ev.fate, ""],
    ],
  );
}

export function parseVotableTableName(xml: string): string | null {
  const m = xml.match(/<TABLE name="([^"]+)"/);
  return m ? m[1]! : null;
}
