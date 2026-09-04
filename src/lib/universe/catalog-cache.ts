import { kvGet, kvSet } from "./archive";
import type { CatalogResult, CutoutResult } from "./mast";

export type CachedPlate = {
  savedAt: number;
  catalog: Extract<CatalogResult, { ok: true }>;
  cutout?: Extract<CutoutResult, { ok: true }>;
};

export function plateKey(ra: number, dec: number, radiusDeg: number): string {
  return `ps1:${ra.toFixed(4)}:${dec.toFixed(4)}:${radiusDeg.toFixed(3)}`;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function loadPlate(key: string): Promise<CachedPlate | null> {
  const row = await kvGet<CachedPlate>(key);
  if (!row || typeof row.savedAt !== "number") return null;
  if (Date.now() - row.savedAt > WEEK_MS) return null;
  if (!row.catalog || row.catalog.ok !== true) return null;
  return row;
}

export async function savePlate(key: string, plate: CachedPlate): Promise<void> {
  await kvSet(key, plate);
}
