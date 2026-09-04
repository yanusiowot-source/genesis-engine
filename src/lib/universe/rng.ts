import type { UniverseParams } from "./types";

/** Deterministic 32-bit mulberry32. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  const a = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
  return a || 1;
}

export function hashParams(params: UniverseParams, visualSeed: number): string {
  const parts = [
    params.gravity,
    params.expansion,
    params.darkEnergy,
    params.matter,
    params.complexity,
    params.quantumNoise,
    visualSeed,
  ];
  let h = 2166136261;
  for (const n of parts) {
    const x = Math.round(n * 1e6);
    h ^= x;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

export function catalogId(hash: string): string {
  return `GE-${hash.slice(0, 6)}`;
}

/** Harmless easter: Hitchhiker wink when the catalog hex contains 42. Does not change physics. */
export function isAnswerCatalog(id: string): boolean {
  return /42/i.test(id);
}

const HEADS = [
  "Lyra",
  "Vela",
  "Atlas",
  "Nyx",
  "Caelum",
  "Vesper",
  "Nadir",
  "Helios",
  "Mirage",
  "Kepler",
  "Sable",
  "Aether",
  "Rigel",
  "Thalassa",
  "Oriel",
  "Astra",
];

const TAILS = [
  "Minor",
  "Major",
  "Obscura",
  "Prima",
  "Silentis",
  "Perennis",
  "Nova",
  "Aeterna",
  "Umbra",
  "Clara",
  "Fugax",
  "Serpens",
];

export function nameUniverse(rng: () => number, hash: string): string {
  if (/42/i.test(hash) || /42/i.test(catalogId(hash))) return "Deep Thought";
  const head = HEADS[Math.floor(rng() * HEADS.length)] ?? "Lyra";
  const tail = TAILS[Math.floor(rng() * TAILS.length)] ?? "Minor";
  const numeral = (parseInt(hash.slice(0, 2), 16) % 9) + 1;
  return `${head} ${tail} ${roman(numeral)}`;
}

function roman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let left = n;
  let out = "";
  for (const [v, s] of map) {
    while (left >= v) {
      out += s;
      left -= v;
    }
  }
  return out || "I";
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
