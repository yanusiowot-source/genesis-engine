import { buildGalaxy, type GalaxyModel } from "./galaxy.ts";
import type { McmcResult } from "./mcmc.ts";
import type { CatalogResult, CatalogStar } from "./mast.ts";
import { PARAM_META } from "./physics.ts";
import type { Evaluation, UniverseParams, UniverseRecord } from "./types.ts";

const BLOCK = 2880;

function padBlock(bytes: Uint8Array): Uint8Array {
  const n = Math.ceil(bytes.length / BLOCK) * BLOCK;
  if (n === bytes.length) return bytes;
  const out = new Uint8Array(n);
  out.set(bytes);
  return out;
}

function card(keyword: string, value: boolean | number | string, comment?: string): string {
  const key = keyword.toUpperCase().padEnd(8, " ").slice(0, 8);
  let val: string;
  if (typeof value === "boolean") {
    val = (value ? "T" : "F").padStart(20, " ");
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) val = "nan".padStart(20, " ");
    else if (Number.isInteger(value) && Math.abs(value) < 1e12) {
      val = String(value).padStart(20, " ");
    } else {
      val = value.toExponential(10).padStart(20, " ");
    }
  } else {
    const inner = value.replace(/'/g, "''").slice(0, 68);
    val = `'${inner}'`;
  }
  let line = `${key}= ${val}`;
  if (comment) {
    if (line.length < 30) line = line.padEnd(30, " ");
    line += ` / ${comment}`;
  }
  return line.padEnd(80, " ").slice(0, 80);
}

function endCard(): string {
  return "END".padEnd(80, " ");
}

function headerBytes(cards: string[]): Uint8Array {
  const text = [...cards, endCard()].join("");
  const padded = text.padEnd(Math.ceil(text.length / BLOCK) * BLOCK, " ");
  const out = new Uint8Array(padded.length);
  for (let i = 0; i < padded.length; i++) out[i] = padded.charCodeAt(i) & 0x7f;
  return out;
}

function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

/** Minimal FITS image HDU (BITPIX = −32, big-endian floats). Opens in DS9. */
export function encodeFitsImage(args: {
  width: number;
  height: number;
  data: Float32Array;
  extra?: { keyword: string; value: boolean | number | string; comment?: string }[];
}): Uint8Array {
  const { width, height, data } = args;
  if (data.length !== width * height) {
    throw new Error("FITS image length must equal width × height.");
  }
  const cards = [
    card("SIMPLE", true, "Standard FITS"),
    card("BITPIX", -32, "IEEE 32-bit float"),
    card("NAXIS", 2),
    card("NAXIS1", width, "X"),
    card("NAXIS2", height, "Y"),
    card("EXTEND", true),
    card("BSCALE", 1),
    card("BZERO", 0),
    card("ORIGIN", "Genesis Engine"),
  ];
  for (const extra of args.extra ?? []) {
    cards.push(card(extra.keyword, extra.value, extra.comment));
  }
  const header = headerBytes(cards);
  const raw = new Uint8Array(data.length * 4);
  const view = new DataView(raw.buffer);
  for (let i = 0; i < data.length; i++) {
    const v = data[i]!;
    view.setFloat32(i * 4, Number.isFinite(v) ? v : 0, false);
  }
  return concat([header, padBlock(raw)]);
}

type ColKind = "E" | "D" | "J" | "A";

export type FitsColumn = {
  name: string;
  kind: ColKind;
  unit?: string;
  width?: number;
  values: (number | string | null)[];
};

function colBytes(kind: ColKind, width: number): number {
  if (kind === "E") return 4;
  if (kind === "D") return 8;
  if (kind === "J") return 4;
  return width;
}

function tform(kind: ColKind, width: number): string {
  if (kind === "A") return `A${width}`;
  return kind;
}

/** Empty primary + BINTABLE. Opens in TOPCAT. */
export function encodeFitsTable(args: {
  name: string;
  columns: FitsColumn[];
  extra?: { keyword: string; value: boolean | number | string; comment?: string }[];
}): Uint8Array {
  const cols = args.columns;
  const rows = cols[0]?.values.length ?? 0;
  for (const c of cols) {
    if (c.values.length !== rows) throw new Error("FITS columns must share length.");
  }
  const widths = cols.map((c) => (c.kind === "A" ? Math.max(1, c.width ?? 24) : 0));
  const rowBytes = cols.reduce((s, c, i) => s + colBytes(c.kind, widths[i] ?? 24), 0);

  const primary = headerBytes([
    card("SIMPLE", true, "Standard FITS"),
    card("BITPIX", 8),
    card("NAXIS", 0),
    card("EXTEND", true),
    card("ORIGIN", "Genesis Engine"),
  ]);

  const cards = [
    card("XTENSION", "BINTABLE", "Binary table"),
    card("BITPIX", 8),
    card("NAXIS", 2),
    card("NAXIS1", rowBytes, "Bytes per row"),
    card("NAXIS2", rows, "Rows"),
    card("PCOUNT", 0),
    card("GCOUNT", 1),
    card("TFIELDS", cols.length),
    card("EXTNAME", args.name),
  ];
  cols.forEach((c, i) => {
    const n = i + 1;
    cards.push(card(`TTYPE${n}`, c.name.slice(0, 16)));
    cards.push(card(`TFORM${n}`, tform(c.kind, widths[i] ?? 24)));
    if (c.unit) cards.push(card(`TUNIT${n}`, c.unit));
  });
  for (const extra of args.extra ?? []) {
    cards.push(card(extra.keyword, extra.value, extra.comment));
  }

  const data = new Uint8Array(rows * rowBytes);
  const view = new DataView(data.buffer);
  for (let r = 0; r < rows; r++) {
    let o = r * rowBytes;
    cols.forEach((c, i) => {
      const v = c.values[r];
      if (c.kind === "E") {
        const n = typeof v === "number" && Number.isFinite(v) ? v : Number.NaN;
        view.setFloat32(o, n, false);
        o += 4;
      } else if (c.kind === "D") {
        const n = typeof v === "number" && Number.isFinite(v) ? v : Number.NaN;
        view.setFloat64(o, n, false);
        o += 8;
      } else if (c.kind === "J") {
        const n = typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : -999;
        view.setInt32(o, n, false);
        o += 4;
      } else {
        const w = widths[i] ?? 24;
        const s = String(v ?? "").slice(0, w).padEnd(w, " ");
        for (let k = 0; k < w; k++) data[o + k] = s.charCodeAt(k) & 0x7f;
        o += w;
      }
    });
  }

  return concat([primary, headerBytes(cards), padBlock(data)]);
}

export function rasterGalaxy(model: GalaxyModel, size = 128): Float32Array {
  const data = new Float32Array(size * size);
  const span = 1.35;
  const stamp = (x: number, y: number, w: number) => {
    const fx = ((x / span + 1) * 0.5) * (size - 1);
    const fy = ((y / span + 1) * 0.5) * (size - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const ix = x0 + dx;
        const iy = y0 + dy;
        if (ix < 0 || iy < 0 || ix >= size || iy >= size) continue;
        const r2 = (fx - ix) ** 2 + (fy - iy) ** 2;
        data[iy * size + ix] += w * Math.exp(-r2);
      }
    }
  };
  for (const s of model.stars) stamp(s.x, s.y, s.a * s.r);
  for (const s of model.field) stamp(s.x, s.y, s.a * s.r * 0.45);
  return data;
}

export function rasterCatalog(stars: CatalogStar[], size = 128): Float32Array {
  const data = new Float32Array(size * size);
  if (!stars.length) return data;
  let ra0 = 0;
  let dec0 = 0;
  for (const s of stars) {
    ra0 += s.ra;
    dec0 += s.dec;
  }
  ra0 /= stars.length;
  dec0 /= stars.length;
  const span = 0.08;
  for (const s of stars) {
    const fx = ((s.ra - ra0) / span + 1) * 0.5 * (size - 1);
    const fy = ((s.dec - dec0) / span + 1) * 0.5 * (size - 1);
    const ix = Math.round(fx);
    const iy = Math.round(fy);
    if (ix < 0 || iy < 0 || ix >= size || iy >= size) continue;
    const mag = s.r ?? s.g ?? 20;
    data[iy * size + ix] += Math.max(0.2, 22 - mag);
  }
  return data;
}

export function rasterMcmcDensity(result: McmcResult, size = 96): Float32Array {
  const data = new Float32Array(size * size);
  const gMeta = PARAM_META.find((m) => m.key === "gravity")!;
  const mMeta = PARAM_META.find((m) => m.key === "matter")!;
  for (const s of result.samples) {
    const gx = (s.params.gravity - gMeta.min) / (gMeta.max - gMeta.min);
    const my = (s.params.matter - mMeta.min) / (mMeta.max - mMeta.min);
    const ix = Math.max(0, Math.min(size - 1, Math.floor(gx * size)));
    const iy = Math.max(0, Math.min(size - 1, Math.floor(my * size)));
    data[iy * size + ix] += 1;
  }
  return data;
}

export function galaxyFits(record: UniverseRecord): Uint8Array {
  const model = buildGalaxy(record.params, record.evaluation, record.visualSeed, 0.7);
  const data = rasterGalaxy(model, 128);
  return encodeFitsImage({
    width: 128,
    height: 128,
    data,
    extra: [
      { keyword: "OBJECT", value: record.catalog, comment: "Simulated disk" },
      { keyword: "BUNIT", value: "ADU", comment: "Surface-brightness analog" },
      { keyword: "GRAVITY", value: record.params.gravity },
      { keyword: "HUBBLE", value: record.params.expansion },
      { keyword: "OMEGAL", value: record.params.darkEnergy },
      { keyword: "OMEGAM", value: record.params.matter },
    ],
  });
}

export function catalogImageFits(catalog: Extract<CatalogResult, { ok: true }>): Uint8Array {
  return encodeFitsImage({
    width: 128,
    height: 128,
    data: rasterCatalog(catalog.stars, 128),
    extra: [
      { keyword: "OBJECT", value: "Pan-STARRS DR2" },
      { keyword: "RA", value: catalog.ra, comment: "deg" },
      { keyword: "DEC", value: catalog.dec, comment: "deg" },
      { keyword: "EQUINOX", value: 2000 },
    ],
  });
}

export function catalogTableFits(catalog: Extract<CatalogResult, { ok: true }>): Uint8Array {
  const stars = catalog.stars;
  return encodeFitsTable({
    name: "PS1_DR2",
    extra: [
      { keyword: "RA", value: catalog.ra },
      { keyword: "DEC", value: catalog.dec },
      { keyword: "EQUINOX", value: 2000 },
    ],
    columns: [
      { name: "NAME", kind: "A", width: 24, values: stars.map((s) => s.name) },
      { name: "RA", kind: "D", unit: "deg", values: stars.map((s) => s.ra) },
      { name: "DEC", kind: "D", unit: "deg", values: stars.map((s) => s.dec) },
      { name: "GMAG", kind: "E", unit: "mag", values: stars.map((s) => s.g) },
      { name: "RMAG", kind: "E", unit: "mag", values: stars.map((s) => s.r) },
      { name: "IMAG", kind: "E", unit: "mag", values: stars.map((s) => s.i) },
      { name: "NDET", kind: "J", values: stars.map((s) => s.nDet) },
    ],
  });
}

export function mcmcTableFits(result: McmcResult): Uint8Array {
  const samples = result.samples;
  return encodeFitsTable({
    name: "MCMC",
    extra: [
      { keyword: "TARGET", value: result.target },
      { keyword: "SEED", value: result.seed },
      { keyword: "ACCEPT", value: result.acceptRate },
      { keyword: "ESS", value: result.ess },
    ],
    columns: [
      { name: "GRAVITY", kind: "E", unit: "G0", values: samples.map((s) => s.params.gravity) },
      { name: "EXPAND", kind: "E", unit: "H0", values: samples.map((s) => s.params.expansion) },
      { name: "OMEGAL", kind: "E", values: samples.map((s) => s.params.darkEnergy) },
      { name: "OMEGAM", kind: "E", values: samples.map((s) => s.params.matter) },
      { name: "COMPLEX", kind: "E", values: samples.map((s) => s.params.complexity) },
      { name: "QNOISE", kind: "E", values: samples.map((s) => s.params.quantumNoise) },
      { name: "LOGL", kind: "E", values: samples.map((s) => s.logL) },
      { name: "SCORE", kind: "E", values: samples.map((s) => s.score) },
      { name: "LIFE", kind: "E", values: samples.map((s) => s.lifeProb) },
      { name: "SILICON", kind: "E", values: samples.map((s) => s.siliconProb) },
      { name: "ETERNAL", kind: "E", values: samples.map((s) => s.eternalProb) },
      { name: "SWARM", kind: "E", values: samples.map((s) => s.swarmProb) },
    ],
  });
}

export function mcmcImageFits(result: McmcResult): Uint8Array {
  return encodeFitsImage({
    width: 96,
    height: 96,
    data: rasterMcmcDensity(result, 96),
    extra: [
      { keyword: "OBJECT", value: "MCMC posterior" },
      { keyword: "CTYPE1", value: "GRAVITY" },
      { keyword: "CTYPE2", value: "MATTER" },
      { keyword: "TARGET", value: result.target },
    ],
  });
}

export function universeTableFits(params: UniverseParams, evaluation: Evaluation): Uint8Array {
  return encodeFitsTable({
    name: "CONSTANTS",
    columns: [
      { name: "NAME", kind: "A", width: 16, values: PARAM_META.map((m) => m.key) },
      { name: "VALUE", kind: "E", values: PARAM_META.map((m) => params[m.key]) },
      { name: "UNIT", kind: "A", width: 8, values: PARAM_META.map((m) => m.unit) },
      {
        name: "LIFE",
        kind: "E",
        values: PARAM_META.map((_, i) => (i === 0 ? evaluation.lifeProb : null)),
      },
    ],
  });
}

export function readFitsKeyword(buf: Uint8Array, key: string): string | null {
  const name = key.toUpperCase().padEnd(8, " ");
  const text = new TextDecoder("ascii").decode(buf.subarray(0, Math.min(buf.length, BLOCK * 4)));
  for (let i = 0; i + 80 <= text.length; i += 80) {
    const line = text.slice(i, i + 80);
    if (line.startsWith("END")) return null;
    if (line.startsWith(name) && line[8] === "=") {
      return line.slice(10).trim();
    }
  }
  return null;
}
