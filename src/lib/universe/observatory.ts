import type {
  CosmicEpoch,
  Evaluation,
  StellarStage,
  UniverseParams,
} from "./types";
import { clamp, lerp, mulberry32 } from "./rng.ts";
import { derivedAstro } from "./physics.ts";

export const EPOCH_MARKS: { id: CosmicEpoch; t: number }[] = [
  { id: "inflation", t: 0 },
  { id: "recombination", t: 0.1 },
  { id: "darkAges", t: 0.18 },
  { id: "reionization", t: 0.28 },
  { id: "stellar", t: 0.42 },
  { id: "degeneracy", t: 0.72 },
  { id: "blackHoles", t: 0.86 },
  { id: "heatDeath", t: 0.96 },
];

export function epochAt(t: number): CosmicEpoch {
  const x = clamp(t, 0, 1);
  let current: CosmicEpoch = "inflation";
  for (const mark of EPOCH_MARKS) {
    if (x + 1e-9 >= mark.t) current = mark.id;
  }
  return current;
}

export type EpochBlend = { from: CosmicEpoch; to: CosmicEpoch; mix: number };

/** Smoothstep mix into the next epoch over the last ~28% of each segment. */
export function epochBlend(t: number): EpochBlend {
  const x = clamp(t, 0, 1);
  const marks = EPOCH_MARKS;
  const last = marks[marks.length - 1];
  if (!last) return { from: "inflation", to: "inflation", mix: 0 };
  if (x >= last.t) return { from: last.id, to: last.id, mix: 0 };
  let from = marks[0] ?? last;
  let to = last;
  for (let i = 0; i < marks.length - 1; i++) {
    const a = marks[i];
    const b = marks[i + 1];
    if (!a || !b) continue;
    if (x >= a.t && x < b.t) {
      from = a;
      to = b;
      break;
    }
  }
  const span = Math.max(1e-6, to.t - from.t);
  const u = (x - from.t) / span;
  const window = 0.28;
  const raw = (u - (1 - window)) / window;
  const mix = raw <= 0 ? 0 : raw >= 1 ? 1 : raw * raw * (3 - 2 * raw);
  return { from: from.id, to: to.id, mix };
}

function visForEpoch(id: CosmicEpoch, ev: Evaluation): number {
  if (id === "inflation" || id === "recombination") return 0;
  if (id === "darkAges") return 0.04 * ev.structure;
  if (id === "reionization") return 0.35 * ev.structure;
  if (id === "stellar") return 0.55 + 0.45 * ev.structure;
  if (id === "degeneracy") return 0.4 + 0.25 * ev.structure;
  if (id === "blackHoles") return 0.1 + 0.16 * (ev.eternalProb ?? 0);
  return 0.025 + 0.1 * (ev.eternalProb ?? 0);
}

/** Scale factor a=1 at t=0.55 (stellar-era "now"). Homology, not Friedmann. */
export function scaleFactor(t: number): number {
  const x = clamp(t, 0, 1);
  if (x <= 0.1) return (1 / 1100) * Math.pow(Math.max(x / 0.1, 1e-6), 3);
  if (x <= 0.55) {
    const u = (x - 0.1) / 0.45;
    return Math.exp(lerp(Math.log(1 / 1100), 0, u));
  }
  return Math.exp(lerp(0, Math.log(14), (x - 0.55) / 0.45));
}

export function cmbTempK(t: number, params: UniverseParams): number {
  const t0 = 2.725 * Math.max(params.expansion, 0.25);
  return t0 / Math.max(scaleFactor(t), 1e-9);
}

/** Map slider position to a physical age. Early universe is compressed. */
export function cosmicAgeGyr(
  t: number,
  params: UniverseParams,
  ev: Evaluation,
): number {
  const ageNow = derivedAstro(params, ev).ageGyr;
  const x = clamp(t, 0, 1);
  if (x < 0.42) return ageNow * 0.08 * Math.pow(x / 0.42, 3);
  if (x < 0.72) {
    const u = (x - 0.42) / 0.3;
    return lerp(ageNow * 0.08, ageNow, u);
  }
  const u = (x - 0.72) / 0.28;
  const far = Math.max(ageNow, ev.stellarLifetimeGyr) * 80;
  return lerp(ageNow, far, u * u);
}

/** Where "today" sits on the cosmic clock for this universe. */
export function nowMarker(params: UniverseParams, ev: Evaluation): number {
  const age = derivedAstro(params, ev).ageGyr;
  const span = Math.max(age, ev.stellarLifetimeGyr, 1);
  return clamp(0.42 + 0.28 * clamp(age / (span + 8), 0, 1), 0.42, 0.7);
}

/** Wall-clock rate while evolving. A full 0→1 sweep takes ~15 s. */
export const EVOLVE_RATE = 0.065;

/** One display-frame of cosmic time. Canvas rAF is the only caller. */
export function stepCosmicTime(
  t: number,
  dt: number,
  rate = EVOLVE_RATE,
): { t: number; done: boolean } {
  const next = t + Math.min(0.05, Math.max(0, dt)) * rate;
  if (next >= 1) return { t: 1, done: true };
  return { t: next, done: false };
}

export function galaxyVisibility(t: number, ev: Evaluation): number {
  const blend = epochBlend(t);
  if (blend.mix <= 0 || blend.from === blend.to) return visForEpoch(blend.from, ev);
  return lerp(visForEpoch(blend.from, ev), visForEpoch(blend.to, ev), blend.mix);
}

export type StarState = {
  stage: StellarStage;
  teff: number;
  logL: number;
  rgb: [number, number, number];
  radiusScale: number;
  flash: number;
};

/** Main-sequence lifetime of a star of mass M, scaled by G. Sun ≈ 10 Gyr at G=1. */
export function starLifetimeGyr(mass: number, gravity: number): number {
  return (10 * Math.pow(Math.max(mass, 0.08), -2.5)) /
    Math.pow(Math.max(gravity, 0.2), 2.15);
}

/** Salpeter IMF inverse-CDF, 0.4–40 M☉. */
export function sampleMass(rng: () => number): number {
  const mMin = 0.4;
  const mMax = 40;
  const alpha = 1.35;
  const a = Math.pow(mMin, -alpha);
  const b = Math.pow(mMax, -alpha);
  return Math.pow(a - rng() * (a - b), -1 / alpha);
}

export function teffToRgb(teff: number): [number, number, number] {
  const t = clamp(teff, 2400, 40000);
  if (t < 3700) {
    const u = (t - 2400) / 1300;
    return [
      255,
      Math.round(lerp(110, 180, u)),
      Math.round(lerp(70, 120, u)),
    ];
  }
  if (t < 6000) {
    const u = (t - 3700) / 2300;
    return [
      255,
      Math.round(lerp(180, 236, u)),
      Math.round(lerp(120, 210, u)),
    ];
  }
  if (t < 10000) {
    const u = (t - 6000) / 4000;
    return [
      Math.round(lerp(255, 230, u)),
      Math.round(lerp(236, 236, u)),
      Math.round(lerp(210, 255, u)),
    ];
  }
  const u = clamp((t - 10000) / 15000, 0, 1);
  return [
    Math.round(lerp(230, 180, u)),
    Math.round(lerp(236, 210, u)),
    255,
  ];
}

export function evolveStar(
  mass: number,
  ageGyr: number,
  gravity: number,
): StarState {
  if (ageGyr < 0) {
    return {
      stage: "unborn",
      teff: 2800,
      logL: -2.4,
      rgb: [70, 60, 52],
      radiusScale: 0,
      flash: 0,
    };
  }
  const tau = starLifetimeGyr(mass, gravity);
  const giantStart = tau * 0.88;
  const snWindow = Math.max(0.008, tau * 0.02);

  if (ageGyr < giantStart) {
    const L = Math.pow(mass, 3.5);
    const R = Math.pow(mass, 0.8);
    const teff = 5772 * Math.pow(Math.max(L, 1e-6) / Math.max(R * R, 1e-6), 0.25);
    return {
      stage: "mainSequence",
      teff,
      logL: Math.log10(Math.max(L, 1e-6)),
      rgb: teffToRgb(teff),
      radiusScale: R,
      flash: 0,
    };
  }

  if (ageGyr < tau) {
    const L = Math.pow(mass, 3.5) * 70;
    const R = Math.pow(mass, 0.8) * 14;
    const teff = clamp(3400 + 280 * Math.min(mass, 10), 2800, 4800);
    return {
      stage: "giant",
      teff,
      logL: Math.log10(Math.max(L, 1e-6)),
      rgb: [255, 168, 108],
      radiusScale: R,
      flash: 0,
    };
  }

  if (mass >= 8 && ageGyr < tau + snWindow) {
    const fade = 1 - (ageGyr - tau) / snWindow;
    return {
      stage: "supernova",
      teff: 22000,
      logL: 8.5,
      rgb: [255, 248, 236],
      radiusScale: 8 + 50 * fade,
      flash: clamp(fade, 0, 1),
    };
  }

  if (mass < 8) {
    return {
      stage: "whiteDwarf",
      teff: 9000,
      logL: -1.55,
      rgb: [210, 222, 255],
      radiusScale: 0.12,
      flash: 0,
    };
  }
  if (mass < 25) {
    return {
      stage: "neutronStar",
      teff: 6e5,
      logL: -2.1,
      rgb: [170, 196, 255],
      radiusScale: 0.05,
      flash: 0,
    };
  }
  return {
    stage: "blackHole",
    teff: 0,
    logL: -3,
    rgb: [36, 36, 42],
    radiusScale: 0.09,
    flash: 0,
  };
}

export type PopStar = {
  mass: number;
  teff: number;
  logL: number;
  stage: StellarStage;
  rgb: [number, number, number];
};

export function samplePopulation(
  params: UniverseParams,
  ev: Evaluation,
  ageGyr: number,
  seed: number,
  n: number,
): PopStar[] {
  const rng = mulberry32(seed);
  const out: PopStar[] = [];
  for (let i = 0; i < n; i++) {
    const mass = sampleMass(rng);
    const born = ev.timeToStarsGyr + rng() * Math.max(ageGyr * 0.85, 0.05);
    const state = evolveStar(mass, ageGyr - born, params.gravity);
    if (state.stage === "unborn") continue;
    out.push({
      mass,
      teff: state.teff,
      logL: state.logL,
      stage: state.stage,
      rgb: state.rgb,
    });
  }
  return out;
}

export function censusOf(stars: PopStar[]): {
  ms: number;
  giant: number;
  remnant: number;
  supernova: number;
} {
  let ms = 0;
  let giant = 0;
  let remnant = 0;
  let supernova = 0;
  for (const s of stars) {
    if (s.stage === "mainSequence") ms += 1;
    else if (s.stage === "giant") giant += 1;
    else if (s.stage === "supernova") supernova += 1;
    else remnant += 1;
  }
  return { ms, giant, remnant, supernova };
}

export function einsteinRadius(ev: Evaluation, params: UniverseParams): number {
  return 0.07 + 0.28 * ev.darkMatterFraction * Math.sqrt(Math.max(params.matter, 0.05));
}

/** SIS-like deflection. Returns image-plane offset for a source at (x, y). */
export function lensDeflect(
  x: number,
  y: number,
  thetaE: number,
): { x: number; y: number; stretch: number } {
  const b = Math.hypot(x, y);
  if (b < 1e-4) return { x, y, stretch: 1 };
  const k = thetaE / Math.max(b, 0.05);
  const radial = 1 - k * 0.55;
  return {
    x: x * radial,
    y: y * radial,
    stretch: 1 + k * 1.4,
  };
}
