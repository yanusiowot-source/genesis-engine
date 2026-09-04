import { PARAM_META, snapParams } from "./physics";
import type { UniverseParams } from "./types";

const KEYS = {
  g: "gravity",
  x: "expansion",
  l: "darkEnergy",
  m: "matter",
  o: "complexity",
  n: "quantumNoise",
} as const;

type Short = keyof typeof KEYS;

export function encodeUniverse(params: UniverseParams, seed: number): string {
  const q = new URLSearchParams();
  q.set("g", String(params.gravity));
  q.set("x", String(params.expansion));
  q.set("l", String(params.darkEnergy));
  q.set("m", String(params.matter));
  q.set("o", String(params.complexity));
  q.set("n", String(params.quantumNoise));
  q.set("s", String(seed >>> 0));
  return q.toString();
}

export function decodeUniverse(
  search: string,
): { params: UniverseParams; visualSeed: number } | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (!q.has("g") || !q.has("s")) return null;
  const raw: UniverseParams = {
    gravity: num(q.get("g")),
    expansion: num(q.get("x")),
    darkEnergy: num(q.get("l")),
    matter: num(q.get("m")),
    complexity: num(q.get("o")),
    quantumNoise: num(q.get("n")),
  };
  const seed = Number(q.get("s"));
  if (!Number.isFinite(seed)) return null;
  const metaByKey = Object.fromEntries(PARAM_META.map((m) => [m.key, m]));
  for (const short of Object.keys(KEYS) as Short[]) {
    const key = KEYS[short];
    const meta = metaByKey[key];
    if (!meta) continue;
    if (!Number.isFinite(raw[key])) return null;
    raw[key] = Math.min(meta.max, Math.max(meta.min, raw[key]));
  }
  return { params: snapParams(raw), visualSeed: seed >>> 0 || 1 };
}

function num(v: string | null): number {
  return v == null ? Number.NaN : Number(v);
}

export function shareUrl(params: UniverseParams, seed: number): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const path = typeof window === "undefined" ? "/" : window.location.pathname;
  return `${origin}${path}?${encodeUniverse(params, seed)}`;
}
