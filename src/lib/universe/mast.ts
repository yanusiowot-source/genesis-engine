import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchFault } from "./fetch-fault.ts";

export type CatalogStar = {
  name: string;
  ra: number;
  dec: number;
  g: number | null;
  r: number | null;
  i: number | null;
  nDet: number;
};

export type CatalogResult =
  | {
      ok: true;
      ra: number;
      dec: number;
      radiusDeg: number;
      source: "panstarrs-dr2";
      stars: CatalogStar[];
    }
  | { ok: false; error: string };

export type CutoutResult =
  | { ok: true; ra: number; dec: number; mime: string; dataUrl: string }
  | { ok: false; error: string };

const Input = z.object({
  ra: z.number().min(0).max(360),
  dec: z.number().min(-90).max(90),
  radiusDeg: z.number().min(0.005).max(0.15),
});

const CutoutInput = z.object({
  ra: z.number().min(0).max(360),
  dec: z.number().min(-90).max(90),
});

const COL = [
  "objName",
  "raMean",
  "decMean",
  "gMeanPSFMag",
  "rMeanPSFMag",
  "iMeanPSFMag",
  "nDetections",
] as const;

function mag(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 30) return null;
  return n;
}

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parsePanstarrsBody(
  body: { info?: { name: string }[]; data?: unknown[][] },
  query: { ra: number; dec: number; radiusDeg: number },
): CatalogResult {
  const names = (body.info ?? []).map((c) => c.name);
  const idx = (key: string) => names.indexOf(key);
  const map = {} as Record<(typeof COL)[number], number>;
  for (const key of COL) map[key] = idx(key);
  if (map.raMean < 0 || map.decMean < 0) {
    return { ok: false, error: "Unexpected MAST columns." };
  }

  const stars: CatalogStar[] = [];
  for (const row of body.data ?? []) {
    const ra = num(row[map.raMean]);
    const dec = num(row[map.decMean]);
    if (ra === null || dec === null) continue;
    const name = String(row[map.objName] ?? "PSO");
    stars.push({
      name,
      ra,
      dec,
      g: mag(row[map.gMeanPSFMag]),
      r: mag(row[map.rMeanPSFMag]),
      i: mag(row[map.iMeanPSFMag]),
      nDet: num(row[map.nDetections]) ?? 0,
    });
  }
  stars.sort((a, b) => (a.r ?? 99) - (b.r ?? 99));
  return {
    ok: true,
    ra: query.ra,
    dec: query.dec,
    radiusDeg: query.radiusDeg,
    source: "panstarrs-dr2",
    stars: stars.slice(0, 36),
  };
}

/**
 * Cone quality — not Pan-STARRS qualityFlag.
 * Completeness is gri present. nDet is visits, not S/N.
 */
export type CatalogDqNiche = "thin" | "fair" | "clean";

export type CatalogDq = {
  n: number;
  complete: number;
  meanDet: number;
  dropout: number;
  colorOk: number;
  niche: CatalogDqNiche;
};

export function catalogQuality(stars: CatalogStar[]): CatalogDq {
  const n = stars.length;
  if (n === 0) {
    return { n: 0, complete: 0, meanDet: 0, dropout: 0, colorOk: 0, niche: "thin" };
  }
  let gri = 0;
  let det = 0;
  let drop = 0;
  let col = 0;
  for (const s of stars) {
    if (s.g != null && s.r != null && s.i != null) gri += 1;
    else drop += 1;
    det += s.nDet;
    if (s.g != null && s.r != null) {
      const gr = s.g - s.r;
      if (gr > -0.4 && gr < 2.2) col += 1;
    }
  }
  const complete = gri / n;
  const meanDet = det / n;
  const colorOk = col / n;
  let niche: CatalogDqNiche = "thin";
  if (n >= 8 && complete >= 0.65 && meanDet >= 8 && colorOk >= 0.5) niche = "clean";
  else if (n >= 4 && complete >= 0.35) niche = "fair";
  return { n, complete, meanDet, dropout: drop / n, colorOk, niche };
}

export const fetchPanstarrsCone = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<CatalogResult> => {
    const params = new URLSearchParams({
      ra: String(data.ra),
      dec: String(data.dec),
      radius: String(data.radiusDeg),
      pagesize: "40",
      sort: "nDetections",
    });
    params.set("nDetections.gte", "3");

    const url = `https://catalogs.mast.stsci.edu/api/v0.1/panstarrs/dr2/mean.json?${params}`;
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(14_000) });
    } catch (error) {
      const timedOut = fetchFault(error) === "timeout";
      return { ok: false, error: timedOut ? "MAST timed out. Try a smaller cone." : "MAST could not be reached." };
    }
    if (!res.ok) {
      return { ok: false, error: `MAST returned ${res.status}.` };
    }

    let body: { info?: { name: string }[]; data?: unknown[][] };
    try {
      body = (await res.json()) as { info?: { name: string }[]; data?: unknown[][] };
    } catch (error) {
      const timedOut = fetchFault(error) === "timeout";
      return { ok: false, error: timedOut ? "MAST timed out. Try a smaller cone." : "MAST could not be read." };
    }
    return parsePanstarrsBody(body, data);
  });

export function parseFilenamesTsv(text: string): Record<string, string> {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return {};
  const delim = lines[0]!.includes(",") ? "," : /\s+/;
  const header = lines[0]!.trim().split(delim);
  const fi = header.indexOf("filter");
  const short = header.indexOf("shortname");
  const fn = header.indexOf("filename");
  const out: Record<string, string> = {};
  if (fi < 0 || (fn < 0 && short < 0)) return out;
  for (const line of lines.slice(1)) {
    const cols = line.trim().split(delim);
    const filt = cols[fi]?.trim();
    const file = (short >= 0 ? cols[short] : cols[fn])?.trim();
    if (filt && file) out[filt] = file.replace(/^\//, "");
  }
  return out;
}

export const fetchPanstarrsCutout = createServerFn({ method: "POST" })
  .validator((input: unknown) => CutoutInput.parse(input))
  .handler(async ({ data }): Promise<CutoutResult> => {
    const namesUrl = `https://ps1images.stsci.edu/cgi-bin/ps1filenames.py?RA=${data.ra}&DEC=${data.dec}&filters=gri&type=stack`;
    let namesRes: Response;
    try {
      namesRes = await fetch(namesUrl, { signal: AbortSignal.timeout(10_000) });
    } catch (error) {
      const timedOut = fetchFault(error) === "timeout";
      return { ok: false, error: timedOut ? "PS1 filenames timed out." : "PS1 filenames could not be reached." };
    }
    if (!namesRes.ok) return { ok: false, error: `PS1 filenames ${namesRes.status}.` };
    let namesText: string;
    try {
      namesText = await namesRes.text();
    } catch (error) {
      const timedOut = fetchFault(error) === "timeout";
      return { ok: false, error: timedOut ? "PS1 filenames timed out." : "PS1 filenames could not be read." };
    }
    const files = parseFilenamesTsv(namesText);
    const red = files.i ?? files.r ?? files.g;
    const green = files.r ?? files.g ?? files.i;
    const blue = files.g ?? files.r ?? files.i;
    if (!red || !green || !blue) {
      return { ok: false, error: "No PS1 stack at this position." };
    }
    const cut = new URLSearchParams({
      red,
      green,
      blue,
      ra: String(data.ra),
      dec: String(data.dec),
      size: "240",
      output_size: "280",
      format: "jpeg",
      autoscale: "99.5",
    });
    const jpegUrl = `https://ps1images.stsci.edu/cgi-bin/fitscut.cgi?${cut}`;
    let img: Response;
    try {
      img = await fetch(jpegUrl, { signal: AbortSignal.timeout(14_000) });
    } catch (error) {
      const timedOut = fetchFault(error) === "timeout";
      return { ok: false, error: timedOut ? "PS1 cutout timed out." : "PS1 cutout could not be reached." };
    }
    if (!img.ok) return { ok: false, error: `PS1 cutout ${img.status}.` };
    let buf: Buffer;
    try {
      buf = Buffer.from(await img.arrayBuffer());
    } catch (error) {
      const timedOut = fetchFault(error) === "timeout";
      return { ok: false, error: timedOut ? "PS1 cutout timed out." : "PS1 cutout could not be read." };
    }
    if (buf.byteLength < 800) return { ok: false, error: "PS1 cutout was empty." };
    const mime = img.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    if (!mime.startsWith("image/")) {
      return { ok: false, error: "PS1 did not return an image." };
    }
    return {
      ok: true,
      ra: data.ra,
      dec: data.dec,
      mime,
      dataUrl: `data:${mime};base64,${buf.toString("base64")}`,
    };
  });

export const DEFAULT_CONE = {
  ra: 10.6847,
  dec: 41.2692,
  radiusDeg: 0.04,
  label: "M31 nucleus",
};
