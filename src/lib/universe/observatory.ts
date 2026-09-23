import type {
  CosmicEpoch,
  Evaluation,
  HaloModelId,
  HaloNiche,
  TfNiche,
  FpNiche,
  MlBranch,
  ImfNiche,
  MassMethodNiche,
  AgnNiche,
  AgnMode,
  AgnDrive,
  GrmhdState,
  BzGeometry,
  FluxTransport,
  FanaroffRiley,
  AcousticNiche,
  DiskNiche,
  Fate,
  StellarStage,
  UniverseParams,
} from "./types";
import { clamp, lerp, mulberry32 } from "./rng.ts";
import { derivedAstro, omegaBaryon } from "./physics.ts";
import { nfwFillGrid, nfwKernel } from "./nfw-wasm.ts";

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

/** The epoch the HUD and sky name — blend majority, not the hard fence. */
export function epochShown(t: number): CosmicEpoch {
  const blend = epochBlend(t);
  return blend.mix >= 0.5 ? blend.to : blend.from;
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

/** Ended skies do not wear a healthy disk at Now. */
function fateSky(ev: Evaluation): number {
  if (ev.fate === "void" || ev.fate === "fog") return 0;
  if (ev.fate === "rip") return 0.05;
  if (ev.fate === "crunch") return 0.1;
  if (ev.fate === "flash") return 0.16;
  return 1;
}

/** Color of an ended sky. Habitable skies get none — the disk is the show. */
export function fateWash(fate: Fate): { r: number; g: number; b: number; a: number } | null {
  if (fate === "rip") return { r: 255, g: 72, b: 48, a: 0.18 };
  if (fate === "crunch") return { r: 255, g: 128, b: 32, a: 0.16 };
  if (fate === "flash") return { r: 255, g: 220, b: 140, a: 0.14 };
  return null;
}

export function galaxyVisibility(t: number, ev: Evaluation): number {
  const blend = epochBlend(t);
  const base =
    blend.mix <= 0 || blend.from === blend.to
      ? visForEpoch(blend.from, ev)
      : lerp(visForEpoch(blend.from, ev), visForEpoch(blend.to, ev), blend.mix);
  return base * fateSky(ev);
}

/** Slider pin for today: a=1, T=2.725 K, age = derivedAstro.ageGyr. */
export const NOW_T = 0.55;

/** Scale factor a=1 at NOW_T. a=1/1100 at last scattering (t=0.1). */
export function scaleFactor(t: number): number {
  const x = clamp(t, 0, 1);
  if (x <= 0.1) return (1 / 1100) * Math.pow(Math.max(x / 0.1, 1e-6), 3);
  if (x <= NOW_T) {
    const u = (x - 0.1) / (NOW_T - 0.1);
    return Math.exp(lerp(Math.log(1 / 1100), 0, u));
  }
  return Math.exp(lerp(0, Math.log(14), (x - NOW_T) / (1 - NOW_T)));
}

/** T₀ is measured, not scaled by H. T = 2.725 K / a. */
export function cmbTempK(t: number, _params?: UniverseParams): number {
  return 2.725 / Math.max(scaleFactor(t), 1e-9);
}

/**
 * Photon-baryon acoustic scale. ℓ₁ ≈ 220 on our sky.
 * More matter or a closed geometry → larger angle on the wall → lower ℓ.
 */
export function acousticScale(params: UniverseParams, _ev?: Evaluation): number {
  const om = Math.max(params.matter, 0.05);
  const ob = omegaBaryon(params);
  const h = Math.max(params.expansion, 0.25);
  const ok = 1 - params.matter - params.darkEnergy;
  const geo = 1 + 0.32 * clamp(ok, -0.55, 0.8);
  return clamp(
    220 * Math.sqrt(0.31 / om) * Math.pow(h, -0.18) * Math.pow(0.049 / ob, 0.08) * geo,
    80,
    520,
  );
}

/** Wall cells are enlarged by this so ℓ₁ is visible. The HUD still shows ℓ₁. */
export const ACOUSTIC_VISUAL = 12;

export type AcousticPeak = { n: number; ell: number; dtt: number; odd: boolean };

export type AcousticDossier = {
  niche: AcousticNiche;
  ell1: number;
  oddEven: number;
  baryonLoad: number;
  peaks: AcousticPeak[];
  curve: { ell: number; dtt: number }[];
};

/** First four TT peaks. Odd heights load with Ωb; the third feels the halo. */
let acousticHold: { key: string; d: AcousticDossier } | null = null;

export function acousticDossier(params: UniverseParams, ev: Evaluation): AcousticDossier {
  const key = skyKey(params, ev);
  if (acousticHold?.key === key) return acousticHold.d;
  const ell1 = acousticScale(params, ev);
  const ob = omegaBaryon(params);
  const load = ob / 0.049;
  const dm = ev.darkMatterFraction;
  const silk = clamp(1400 * Math.sqrt(Math.max(load, 0.4)), 700, 2200);
  const a1 =
    5800 *
    (0.72 + 0.28 * clamp(load, 0.4, 1.8)) *
    (0.65 + 0.35 * dm);
  const oddBoost = 0.75 + 0.55 * clamp(load, 0.35, 2);
  const a2 = a1 / (1.55 * oddBoost);
  const a3 = a2 * (0.82 + 0.45 * dm) * Math.exp(-(((3 * ell1) / silk) ** 2));
  const a4 = a3 * 0.58 * Math.exp(-(((4.2 * ell1) / silk) ** 2));
  const ratios = [1, 2.45, 3.64, 5.09];
  const amps = [a1, a2, a3, a4];
  const peaks: AcousticPeak[] = ratios.map((r, i) => ({
    n: i + 1,
    ell: ell1 * r,
    dtt: Math.max(amps[i] ?? 0, 0),
    odd: i % 2 === 0,
  }));
  const oddEven = a1 / Math.max(a2, 1);
  const curve: { ell: number; dtt: number }[] = [];
  for (let i = 0; i <= 48; i++) {
    const ell = 40 + (1480 * i) / 48;
    let dtt = 80 * Math.exp(-(((ell - 80) / 90) ** 2));
    for (const p of peaks) {
      const w = 55 + p.n * 18;
      dtt += p.dtt * Math.exp(-(((ell - p.ell) / w) ** 2));
    }
    curve.push({ ell, dtt });
  }

  let niche: AcousticNiche;
  if (load < 0.38 && a1 < 1200) niche = "silent";
  else if ((peaks[2]?.dtt ?? 0) < a1 * 0.1) niche = "damped";
  else if (load > 1.32 && oddEven > 2.15) niche = "loaded";
  else niche = "clear";

  const d: AcousticDossier = {
    niche,
    ell1,
    oddEven,
    baryonLoad: load,
    peaks,
    curve,
  };
  acousticHold = { key, d };
  return d;
}


/** Map slider position to a physical age. Today (NOW_T) is derivedAstro.ageGyr. */
export function cosmicAgeGyr(
  t: number,
  params: UniverseParams,
  ev: Evaluation,
): number {
  const ageNow = derivedAstro(params, ev).ageGyr;
  const x = clamp(t, 0, 1);
  if (x < 0.42) return ageNow * 0.08 * Math.pow(x / 0.42, 3);
  if (x <= NOW_T) {
    const u = (x - 0.42) / (NOW_T - 0.42);
    return lerp(ageNow * 0.08, ageNow, u);
  }
  const u = (x - NOW_T) / (1 - NOW_T);
  const far = Math.max(ageNow, ev.stellarLifetimeGyr) * 80;
  return lerp(ageNow, far, u * u);
}

/** Today on the slider. a=1, T=2.725 K. */
export function nowMarker(_params?: UniverseParams, _ev?: Evaluation): number {
  return NOW_T;
}

/**
 * Slider tick landing: a hair inside the era whose mark you touched.
 * Not home, not the heat-death latch — those are named jumps.
 */
export function epochTickT(id: CosmicEpoch): number {
  const i = EPOCH_MARKS.findIndex((m) => m.id === id);
  const mark = EPOCH_MARKS[i];
  if (!mark) return 0;
  if (id === "recombination") return mark.t;
  const nextT = EPOCH_MARKS[i + 1]?.t ?? 1;
  return mark.t + (nextT - mark.t) * 0.18;
}

/** Named leaps: Spark and Dawn sit in-era; Stars goes home; End latches. */
export function epochJumpT(
  id: CosmicEpoch,
  params: UniverseParams,
  ev: Evaluation,
): number {
  if (id === "heatDeath") return 1;
  if (id === "stellar") return nowMarker(params, ev);
  return epochTickT(id);
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

/** ∫ m^{-x} dm. */
function imfPowerInt(m0: number, m1: number, x: number): number {
  const a = 1 - x;
  const lo = Math.max(m0, 1e-6);
  const hi = Math.max(m1, lo + 1e-8);
  if (Math.abs(a) < 1e-6) return Math.log(hi / lo);
  return (Math.pow(hi, a) - Math.pow(lo, a)) / a;
}

function samplePowerLaw(rng: () => number, m0: number, m1: number, x: number): number {
  const a = 1 - x;
  const u = rng();
  const lo = Math.max(m0, 1e-6);
  const hi = Math.max(m1, lo + 1e-8);
  if (Math.abs(a) < 1e-6) return lo * Math.pow(hi / lo, u);
  const p0 = Math.pow(lo, a);
  const p1 = Math.pow(hi, a);
  return Math.pow(p0 + u * (p1 - p0), 1 / a);
}

export type ImfShape = {
  mMin: number;
  mBreak: number;
  mMax: number;
  xLo: number;
  xHi: number;
};

/** Piecewise ξ(m) ∝ m^{-x}. Chabrier ≈ Kroupa; Salpeter is one slope. */
export function imfShape(x: number, niche: ImfNiche): ImfShape {
  const xHi = clamp(x, 1.5, 3.05);
  if (niche === "salpeter") {
    return { mMin: 0.4, mBreak: 0.4, mMax: 40, xLo: xHi, xHi };
  }
  if (niche === "bottom") {
    return { mMin: 0.08, mBreak: 0.5, mMax: 100, xLo: xHi, xHi };
  }
  if (niche === "top") {
    return { mMin: 0.15, mBreak: 1, mMax: 150, xLo: 0.85, xHi };
  }
  return { mMin: 0.08, mBreak: 0.5, mMax: 120, xLo: 1.3, xHi };
}

/** Number per unit mass. Continuous at the break. */
export function imfXi(m: number, shape: ImfShape): number {
  const mass = clamp(m, shape.mMin, shape.mMax);
  const alo = Math.pow(shape.mBreak, shape.xLo - shape.xHi);
  if (mass <= shape.mBreak + 1e-12) return alo * Math.pow(mass, -shape.xLo);
  return Math.pow(mass, -shape.xHi);
}

export function imfMeanMass(x: number, niche: ImfNiche): number {
  const s = imfShape(x, niche);
  const alo = Math.pow(s.mBreak, s.xLo - s.xHi);
  const nLo = s.mBreak <= s.mMin + 1e-9 ? 0 : alo * imfPowerInt(s.mMin, s.mBreak, s.xLo);
  const nHi = imfPowerInt(Math.max(s.mBreak, s.mMin), s.mMax, s.xHi);
  const mLo = s.mBreak <= s.mMin + 1e-9 ? 0 : alo * imfPowerInt(s.mMin, s.mBreak, s.xLo - 1);
  const mHi = imfPowerInt(Math.max(s.mBreak, s.mMin), s.mMax, s.xHi - 1);
  return (mLo + mHi) / Math.max(nLo + nHi, 1e-12);
}

export function imfSnFrac(x: number, niche: ImfNiche): number {
  const s = imfShape(x, niche);
  const cut = 8;
  if (cut >= s.mMax) return 0;
  const alo = Math.pow(s.mBreak, s.xLo - s.xHi);
  const nLo = s.mBreak <= s.mMin + 1e-9 ? 0 : alo * imfPowerInt(s.mMin, s.mBreak, s.xLo);
  const nHi = imfPowerInt(Math.max(s.mBreak, s.mMin), s.mMax, s.xHi);
  const tot = nLo + nHi;
  const loBound = Math.max(cut, s.mBreak, s.mMin);
  const nSn = imfPowerInt(loBound, s.mMax, s.xHi);
  return clamp(nSn / Math.max(tot, 1e-12), 0, 1);
}

function imfSegmentMass(s: ImfShape, m0: number, m1: number): number {
  const lo = Math.max(m0, s.mMin);
  const hi = Math.min(m1, s.mMax);
  if (hi <= lo + 1e-12) return 0;
  const alo = Math.pow(s.mBreak, s.xLo - s.xHi);
  let mass = 0;
  if (lo < s.mBreak) {
    mass += alo * imfPowerInt(lo, Math.min(hi, s.mBreak), s.xLo - 1);
  }
  if (hi > s.mBreak) {
    mass += imfPowerInt(Math.max(lo, s.mBreak), hi, s.xHi - 1);
  }
  return mass;
}

/** Mass fraction between mLo and mHi. */
export function imfMassFrac(x: number, niche: ImfNiche, mLo: number, mHi: number): number {
  const s = imfShape(x, niche);
  const tot = imfSegmentMass(s, s.mMin, s.mMax);
  return imfSegmentMass(s, mLo, mHi) / Math.max(tot, 1e-12);
}

/**
 * Instantaneous recycling. Mass locked in m ≲ 0.9 plus remnants.
 * Top-heavy returns gas; bottom-heavy buries it in dwarfs.
 */
export function imfReturn(x: number, niche: ImfNiche): number {
  const lock = imfMassFrac(x, niche, 0, 0.9);
  const remnant = 0.14 * imfMassFrac(x, niche, 0.9, 400);
  return clamp(1 - lock - remnant, 0.1, 0.78);
}

/** Metal yield analog. SN II dominate. Not a Woosley table. */
export function imfYield(x: number, niche: ImfNiche): number {
  return clamp(0.14 * imfMassFrac(x, niche, 8, 400), 0.002, 0.14);
}

export type ImfSample = { m: number; xi: number };

export function imfCurve(x: number, niche: ImfNiche, n = 12): ImfSample[] {
  const s = imfShape(x, niche);
  const count = Math.max(6, n);
  const xi1 = Math.max(imfXi(1, s), 1e-12);
  const out: ImfSample[] = [];
  const ln0 = Math.log(s.mMin);
  const ln1 = Math.log(s.mMax);
  for (let i = 0; i < count; i++) {
    const m = Math.exp(ln0 + ((ln1 - ln0) * i) / (count - 1));
    out.push({ m, xi: imfXi(m, s) / xi1 });
  }
  return out;
}

/**
 * Inverse-CDF of ξ(m). Default Salpeter 0.4–40 M☉.
 * Pass x and niche to follow the galaxy IMF, not a fixed slope.
 */
export function sampleMass(
  rng: () => number,
  x = 2.35,
  niche: ImfNiche = "salpeter",
): number {
  const s = imfShape(x, niche);
  if (s.mBreak <= s.mMin + 1e-9) {
    return samplePowerLaw(rng, s.mMin, s.mMax, s.xHi);
  }
  const alo = Math.pow(s.mBreak, s.xLo - s.xHi);
  const nLo = alo * imfPowerInt(s.mMin, s.mBreak, s.xLo);
  const nHi = imfPowerInt(s.mBreak, s.mMax, s.xHi);
  if (rng() * (nLo + nHi) < nLo) return samplePowerLaw(rng, s.mMin, s.mBreak, s.xLo);
  return samplePowerLaw(rng, s.mBreak, s.mMax, s.xHi);
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
    const mass = sampleMass(rng, imfHighMass(params, ev), imfNicheOf(imfHighMass(params, ev)));
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

/**
 * Einstein ring from the mass profile: mean Σ(<R) = Σcrit.
 * Homology, not a lensed source at zs=1. SIS images still use this θE.
 */
export const LENS_SIGMA_CRIT = 0.195;

export function enclosedMass(
  r: number,
  params: UniverseParams,
  ev: Evaluation,
  halo = true,
): number {
  const x = Math.max(r, 1e-4);
  const v = circularSpeed(x, params, ev, halo);
  return v * v * x;
}

export function meanSigma(
  r: number,
  params: UniverseParams,
  ev: Evaluation,
  halo = true,
): number {
  const x = Math.max(r, 1e-4);
  return enclosedMass(x, params, ev, halo) / (Math.PI * x * x);
}

let einsteinHold: { key: string; r: number } | null = null;

export function einsteinRadius(ev: Evaluation, params: UniverseParams): number {
  const key = skyKey(params, ev);
  if (einsteinHold?.key === key) return einsteinHold.r;
  let lo = 0.05;
  let hi = 1.2;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (meanSigma(mid, params, ev) > LENS_SIGMA_CRIT) lo = mid;
    else hi = mid;
  }
  const r = clamp((lo + hi) / 2, 0.08, 1.1);
  einsteinHold = { key, r };
  return r;
}

export type EinsteinSample = { r: number; kappa: number };

/** Mean convergence ⟨κ⟩(<r) = Σ̄ / Σcrit. Equals 1 on the Einstein ring. */
export function einsteinProfile(
  params: UniverseParams,
  ev: Evaluation,
  n = 12,
): EinsteinSample[] {
  const count = Math.max(6, n);
  const out: EinsteinSample[] = [];
  for (let i = 0; i < count; i++) {
    const r = 0.06 + (1.05 * i) / (count - 1);
    out.push({ r, kappa: meanSigma(r, params, ev) / LENS_SIGMA_CRIT });
  }
  return out;
}

/**
 * Bartelmann 1996. x = r / rs.
 * F(x): arctanh (x<1), 1 (x=1), arctan (x>1).
 */
export function nfwFJs(x: number): number {
  const u = Math.abs(x);
  if (u < 1e-6) return Math.log(2 / Math.max(u, 1e-8));
  if (Math.abs(u - 1) < 1e-5) return 1;
  if (u < 1) {
    const d = Math.sqrt(Math.max(1e-12, 1 - u * u));
    return Math.atanh(Math.min(0.999999, d)) / d;
  }
  const d = Math.sqrt(u * u - 1);
  return Math.atan(d) / d;
}

export function nfwF(x: number): number {
  const k = nfwKernel();
  return k ? k.nfw_f(x) : nfwFJs(x);
}

export function nfwKappa(x: number, ks: number): number {
  const k = nfwKernel();
  if (k) return k.nfw_kappa(x, ks);
  const u = Math.max(Math.abs(x), 1e-5);
  if (Math.abs(u - 1) < 1e-4) return (2 * ks) / 3;
  return (2 * ks * (1 - nfwFJs(u))) / (u * u - 1);
}

/** Mean convergence inside x. Tangential critical where this is 1. */
export function nfwMeanKappa(x: number, ks: number): number {
  const k = nfwKernel();
  if (k) return k.nfw_mean_kappa(x, ks);
  const u = Math.max(Math.abs(x), 1e-5);
  return (4 * ks * (Math.log(u / 2) + nfwFJs(u))) / (u * u);
}

/** Deflection in units of rs: α/rs = x ⟨κ⟩. */
export function nfwDeflectX(x: number, ks: number): number {
  return Math.max(x, 1e-5) * nfwMeanKappa(x, ks);
}

export function nfwEinsteinX(ks: number): number {
  const k = nfwKernel();
  if (k) return k.nfw_einstein_x(ks);
  let lo = 0.15;
  let hi = 14;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (nfwMeanKappa(mid, ks) > 1) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Radial critical: λr = 1 − 2κ + ⟨κ⟩ = 0. 0 if the halo is too shallow. */
export function nfwRadialX(ks: number): number {
  const xE = nfwEinsteinX(ks);
  let prev = 1 - 2 * nfwKappa(0.08, ks) + nfwMeanKappa(0.08, ks);
  const n = 36;
  const grid = nfwFillGrid(n, 0.08, xE, ks);
  if (grid) {
    for (let i = 0; i < grid.kappa.length; i++) {
      const xx = 0.08 + ((xE - 0.08) * (i + 1)) / n;
      const lam = 1 - 2 * grid.kappa[i]! + grid.mean[i]!;
      if (prev > 0 !== lam > 0) return xx;
      prev = lam;
    }
    return 0;
  }
  for (let i = 1; i <= n; i++) {
    const xx = 0.08 + ((xE - 0.08) * i) / n;
    const lam = 1 - 2 * nfwKappa(xx, ks) + nfwMeanKappa(xx, ks);
    if (prev > 0 !== lam > 0) return xx;
    prev = lam;
  }
  return 0;
}

/** κs so that NFW ⟨κ⟩(θE/rs) = 1. Same ring as the mass, different deflection. */
let ksHold: { key: string; v: number } | null = null;

export function nfwKappaS(params: UniverseParams, ev: Evaluation): number {
  const key = skyKey(params, ev);
  if (ksHold?.key === key) return ksHold.v;
  const rs = Math.max(nfwScale(params, ev), 1e-4);
  const te = einsteinRadius(ev, params);
  const xE = Math.max(te / rs, 0.2);
  const g = Math.log(xE / 2) + nfwF(xE);
  const v = clamp((xE * xE) / (4 * Math.max(g, 1e-4)), 0.04, 22);
  ksHold = { key, v };
  return v;
}

export function nfwLensImages(x: number, y: number, rs: number, ks: number): LensImage[] {
  const ts = Math.max(rs, 1e-4);
  const b = Math.hypot(x, y);
  const xE = nfwEinsteinX(ks);
  if (b < 1e-4) {
    return [{ x: xE * ts, y: 0, stretch: 10, parity: 1 }];
  }
  const ux = x / b;
  const uy = y / b;
  const ysrc = b / ts;
  const stretchKM = (k: number, kt: number) => {
    const lamT = 1 - kt;
    const lamR = 1 - 2 * k + kt;
    return Math.min(12, 1 / Math.max(Math.abs(lamT * lamR), 0.05));
  };
  const stretchAt = (xx: number) => stretchKM(nfwKappa(xx, ks), nfwMeanKappa(xx, ks));
  const images: LensImage[] = [];
  const n = 48;
  let prevOuter = 0.2 - nfwDeflectX(0.2, ks) - ysrc;
  const xHi = Math.max(12, xE * 1.6);
  const outer = nfwFillGrid(n, 0.2, xHi, ks);
  if (outer) {
    for (let i = 0; i < outer.kappa.length; i++) {
      const xx = 0.2 + ((xHi - 0.2) * (i + 1)) / n;
      const val = xx * (1 - outer.mean[i]!) - ysrc;
      if (prevOuter <= 0 && val >= 0 && xx > xE * 0.85) {
        const r = xx * ts;
        images.push({ x: ux * r, y: uy * r, stretch: stretchKM(outer.kappa[i]!, outer.mean[i]!), parity: 1 });
        break;
      }
      prevOuter = val;
    }
  } else {
    for (let i = 1; i <= n; i++) {
      const xx = 0.2 + ((xHi - 0.2) * i) / n;
      const val = xx - nfwDeflectX(xx, ks) - ysrc;
      if (prevOuter <= 0 && val >= 0 && xx > xE * 0.85) {
        const r = xx * ts;
        images.push({ x: ux * r, y: uy * r, stretch: stretchAt(xx), parity: 1 });
        break;
      }
      prevOuter = val;
    }
  }
  if (images.length === 0) {
    const xx = Math.max(ysrc, xE);
    const r = (ysrc + nfwDeflectX(xx, ks)) * ts;
    images.push({ x: ux * r, y: uy * r, stretch: stretchAt(xx), parity: 1 });
  }
  let prevInner = nfwDeflectX(0.06, ks) - 0.06 - ysrc;
  const inner = nfwFillGrid(n, 0.06, xE, ks);
  if (inner) {
    for (let i = 0; i < inner.kappa.length; i++) {
      const xx = 0.06 + ((xE - 0.06) * (i + 1)) / n;
      const val = xx * inner.mean[i]! - xx - ysrc;
      if (prevInner > 0 && val <= 0) {
        const r = xx * ts;
        images.push({ x: -ux * r, y: -uy * r, stretch: stretchKM(inner.kappa[i]!, inner.mean[i]!) * 0.7, parity: -1 });
        break;
      }
      prevInner = val;
    }
  } else {
    for (let i = 1; i <= n; i++) {
      const xx = 0.06 + ((xE - 0.06) * i) / n;
      const val = nfwDeflectX(xx, ks) - xx - ysrc;
      if (prevInner > 0 && val <= 0) {
        const r = xx * ts;
        images.push({ x: -ux * r, y: -uy * r, stretch: stretchAt(xx) * 0.7, parity: -1 });
        break;
      }
      prevInner = val;
    }
  }
  return images;
}

/**
 * Circular speed at radius r (disk units). Halo on: NFW (Navarro–Frenk–White).
 * Halo off: baryons — Hernquist on ellipticals, Plummer bulge + exponential disk otherwise.
 * G enters as v² ∝ G M / r.
 */
/** Mesh inner bin. Not the Plummer length — that is plummerScale(). */
export const DISK_SOFTEN = 0.03;
/** Radial mesh for Q(r). Not SPH, not a live grid hydro. */
export const DISK_MESH = 16;

/**
 * Plummer 1911. Φ = −GM / √(r²+a²).
 * v_c² = GM r² / (r²+a²)^{3/2}. Regular at r=0; Keplerian at r ≫ a.
 */
export function plummerCircular(r: number, mass: number, a: number): number {
  const x2 = r * r;
  const a2 = Math.max(a, 1e-4) * Math.max(a, 1e-4);
  return Math.sqrt(Math.max(0, (mass * x2) / Math.pow(x2 + a2, 1.5)));
}

/** Softening / bulge scale. Noise puffs the core; ellipticals are fatter. */
export function plummerScale(params: UniverseParams, ev: Evaluation): number {
  const extra = ev.morphology === "elliptical" ? 0.055 : ev.morphology === "scattered" ? 0.01 : 0.0;
  return clamp(0.028 + params.quantumNoise * 0.07 + extra, 0.025, 0.16);
}

/**
 * Hernquist 1990. M(<r) = M r²/(r+a)². v_c² = GM r/(r+a)².
 * Cusp ρ ∝ r⁻¹. Ellipticals and bulges, not a Plummer globular.
 */
export function hernquistCircular(r: number, mass: number, a: number): number {
  const x = Math.max(r, 0);
  const aa = Math.max(a, 1e-4);
  return Math.sqrt((mass * x) / ((x + aa) * (x + aa)));
}

/** Half-mass r½ = (1+√2) a. Virial homology: a ∝ √M_b so L ∝ σ⁴. Noise puffs Re. */
export const FJ_SIZE = 0.49;

export function hernquistScale(params: UniverseParams, ev: Evaluation): number {
  const mb =
    (1 - ev.darkMatterFraction) * Math.max(params.matter, 0.05) * Math.max(params.gravity, 0.2);
  const size = FJ_SIZE * Math.sqrt(Math.max(mb, 0.02));
  const puff = 1 + params.quantumNoise * 1.35;
  return clamp(size * puff, 0.05, 0.45);
}

/** Virial radius in disk units. Homology, not a measured R200. */
export const NFW_RVIR = 1.45;

/**
 * NFW concentration c = Rvir / rs.
 * Denser, quieter skies sit more concentrated. MW analog ~ 10–15.
 */
export function nfwConcentration(params: UniverseParams, ev: Evaluation): number {
  return clamp(
    8 + ev.structure * 8 - params.quantumNoise * 4 + ev.darkMatterFraction * 2,
    4,
    22,
  );
}

/**
 * Blumenthal-like contraction. Cooling baryons drag the cusp in.
 * Superposition of NFW + disk is not this: rs itself shrinks.
 */
export function baryonContraction(params: UniverseParams, ev: Evaluation): number {
  const fb = Math.max(0.04, 1 - ev.darkMatterFraction);
  const cool = 0.78 + 0.22 * clamp(ev.structure, 0, 1);
  const quiet = 0.65 + 0.35 * (1 - params.quantumNoise);
  return clamp(1 + 2.8 * fb * cool * quiet, 1, 2.6);
}

/** SN/AGN analog: noise excavates a core. Cusp–core, not a second halo. */
export function nfwCoreRadius(params: UniverseParams, ev: Evaluation): number {
  const burst = clamp(params.quantumNoise * (1.2 - ev.structure), 0, 1);
  return burst * 0.1;
}

export function nfwScale(params: UniverseParams, ev: Evaluation): number {
  return NFW_RVIR / (nfwConcentration(params, ev) * baryonContraction(params, ev));
}

/** M(<r)/Mvir. Optional core rc replaces r with √(r²+rc²) — a cored cusp. */
export function nfwMassFraction(r: number, rs: number, c: number, rc = 0): number {
  const g = (u: number) => Math.log(1 + u) - u / (1 + u);
  const reff = Math.sqrt(Math.max(r, 0) ** 2 + Math.max(rc, 0) ** 2);
  const x = reff / Math.max(rs, 1e-4);
  return g(x) / Math.max(g(Math.max(c, 0.5)), 1e-6);
}

export function nfwCircular(r: number, mass: number, rs: number, c: number, rc = 0): number {
  const x = Math.max(r, 1e-4);
  return Math.sqrt(Math.max(0, (mass * nfwMassFraction(x, rs, c, rc)) / x));
}

/** Einasto 1965. ρ = ρs exp{ −d_n [(r/rs)^α − 1] }. Finite at r=0. CDM α ~ 0.17. */
export function einastoAlpha(params: UniverseParams, ev: Evaluation): number {
  return clamp(0.17 - params.quantumNoise * 0.07 + (1 - ev.darkMatterFraction) * 0.03, 0.08, 0.3);
}

export function einastoDn(alpha: number): number {
  return 3 / Math.max(alpha, 0.05) - 1 / 3;
}

export function einastoRho(x: number, alpha: number): number {
  const d = einastoDn(alpha);
  return Math.exp(-d * (Math.pow(Math.max(x, 1e-8), alpha) - 1));
}

/** Unnormalized NFW 3D density. Diverges as 1/x at the origin. */
export function nfwRho(x: number): number {
  const u = Math.max(x, 1e-8);
  return 1 / (u * (1 + u) * (1 + u));
}

export function logSlope(rho: (x: number) => number, x: number): number {
  const h = Math.max(x * 0.12, 1e-9);
  const a = Math.max(x - h, 1e-12);
  const b = x + h;
  return (Math.log(rho(b)) - Math.log(rho(a))) / (Math.log(b) - Math.log(a));
}

export type HaloCompareSample = { x: number; einasto: number; nfw: number; burkert: number };

/** ρ(x)/ρ(1). Same dimensionless radius for NFW, Einasto, Burkert. */
export function haloDensityCompare(alpha: number, n = 14): HaloCompareSample[] {
  const count = Math.max(8, n);
  const e1 = Math.max(einastoRho(1, alpha), 1e-8);
  const n1 = Math.max(nfwRho(1), 1e-8);
  const b1 = Math.max(burkertRho(1), 1e-8);
  const out: HaloCompareSample[] = [];
  const x0 = 0.04;
  const x1 = 6;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = Math.exp(Math.log(x0) + t * (Math.log(x1) - Math.log(x0)));
    out.push({
      x,
      einasto: einastoRho(x, alpha) / e1,
      nfw: nfwRho(x) / n1,
      burkert: burkertRho(x) / b1,
    });
  }
  return out;
}

const EINSTO_MESH = 28;

export function einastoMassFraction(
  r: number,
  rs: number,
  alpha: number,
  rvir: number,
): number {
  const n = EINSTO_MESH;
  const rmax = Math.max(rvir, r, 1e-3);
  const rsSafe = Math.max(rs, 1e-4);
  let mR = 0;
  let mVir = 0;
  for (let i = 0; i < n; i++) {
    const a = (rmax * i) / n;
    const b = (rmax * (i + 1)) / n;
    const mid = 0.5 * (a + b);
    const dm = 4 * Math.PI * mid * mid * einastoRho(mid / rsSafe, alpha) * (b - a);
    mVir += dm;
    if (b <= r) mR += dm;
    else if (a < r) mR += dm * ((r - a) / Math.max(b - a, 1e-8));
  }
  return mR / Math.max(mVir, 1e-8);
}

export function einastoCircular(
  r: number,
  mass: number,
  rs: number,
  alpha: number,
  rvir: number,
): number {
  const x = Math.max(r, 1e-4);
  return Math.sqrt(Math.max(0, (mass * einastoMassFraction(x, rs, alpha, rvir)) / x));
}

/** Burkert 1995. ρ = ρ₀ / [(1+x)(1+x²)], x=r/r₀. Finite core, outer r⁻³. Empirical, not heated NFW. */
export function burkertRho(x: number): number {
  const u = Math.max(x, 0);
  return 1 / ((1 + u) * (1 + u * u));
}

function burkertG(x: number): number {
  const u = Math.max(x, 0);
  return Math.log((1 + u) * Math.sqrt(1 + u * u)) - Math.atan(u);
}

export function burkertMassFraction(r: number, rc: number, rvir: number): number {
  const a = Math.max(rc, 1e-4);
  return burkertG(Math.max(r, 0) / a) / Math.max(burkertG(rvir / a), 1e-8);
}

export function burkertCircular(r: number, mass: number, rc: number, rvir: number): number {
  const x = Math.max(r, 1e-4);
  return Math.sqrt(Math.max(0, (mass * burkertMassFraction(x, rc, rvir)) / x));
}

/** r_max / r₀ for Burkert. Homology of the known peak, not a SPARC fit. */
export const BURKERT_RMAX = 3.24;

export function burkertRmax(rc: number): number {
  return BURKERT_RMAX * Math.max(rc, 1e-4);
}

/** r₀ tracks the luminous scale (Salucci). Noise puffs the core. */
export function burkertScale(params: UniverseParams, ev: Evaluation): number {
  return clamp(diskScale(ev) * (1.1 + params.quantumNoise * 0.85), 0.06, 0.4);
}

/** Cored isothermal: v² → const. Not NFW, not Einasto. */
export function isothermalCircular(r: number, mass: number, a: number): number {
  const x = Math.max(r, 1e-4);
  const core = Math.max(a, 0.05);
  return Math.sqrt((mass * x * x) / (x * x + core * core));
}

/**
 * coreNFW (Read, Agertz, Collins 2016).
 * M(<r) = M_NFW(<r) tanh^n(r/rc). n=0 cusp, n=1 full core.
 * n = tanh(κ t_SF). rc = η R_1/2, η = 1.75. Not a live dwarf hydro.
 */
export const CORENWF_ETA = 1.75;

export function coreNfwIndex(params: UniverseParams, ev: Evaluation): number {
  const tSF = Math.max(ev.lifeWindowGyr, 0);
  const x = imfHighMass(params, ev);
  const niche = imfNicheOf(x);
  const sn = imfMassFrac(x, niche, 8, 400);
  const sn0 = imfMassFrac(IMF_CHABRIER, "chabrier", 8, 400);
  const boost = 0.62 + 0.75 * (sn / Math.max(sn0, 1e-4));
  const kappa = (0.16 + params.quantumNoise * 0.14) * boost;
  return clamp(Math.tanh(kappa * tSF), 0, 1);
}

export function coreNfwRadius(params: UniverseParams, ev: Evaluation): number {
  return clamp(CORENWF_ETA * diskScale(ev), 0.06, 0.42);
}

export function coreNfwMassFraction(
  r: number,
  rs: number,
  c: number,
  rc: number,
  n: number,
): number {
  const m = nfwMassFraction(r, rs, c);
  const t = Math.tanh(Math.max(r, 0) / Math.max(rc, 1e-4));
  return m * Math.pow(Math.max(t, 1e-8), clamp(n, 0, 1));
}

export function coreNfwCircular(
  r: number,
  mass: number,
  rs: number,
  c: number,
  rc: number,
  n: number,
): number {
  const x = Math.max(r, 1e-4);
  return Math.sqrt(Math.max(0, (mass * coreNfwMassFraction(x, rs, c, rc, n)) / x));
}

/** Empirical core once δ is high enough to reach on the lever (max 0.5). Scattered still wins. */
export const BURKERT_NOISE = 0.42;

export function haloModel(params: UniverseParams, ev: Evaluation): HaloModelId {
  if (ev.morphology === "scattered") return "corenfw";
  if (params.quantumNoise >= BURKERT_NOISE) return "burkert";
  if (ev.morphology === "elliptical") return "isothermal";
  return "einasto";
}

/** Face-on glow, in units of the halo radius. Not a density integral. */
export function haloWashShape(model: HaloModelId): { core: number; shoulder: number } {
  if (model === "burkert" || model === "corenfw" || model === "isothermal") {
    return { core: 0.22, shoulder: 0.55 };
  }
  if (model === "nfw") return { core: 0.03, shoulder: 0.22 };
  return { core: 0.08, shoulder: 0.34 };
}

export function haloCircular(
  r: number,
  params: UniverseParams,
  ev: Evaluation,
  model?: HaloModelId,
): number {
  const kind = model ?? haloModel(params, ev);
  const mass = Math.max(params.matter, 0.05) * Math.max(params.gravity, 0.2) * ev.darkMatterFraction;
  const cEff = nfwConcentration(params, ev) * baryonContraction(params, ev);
  const rs = NFW_RVIR / cEff;
  if (kind === "nfw") return nfwCircular(r, mass, rs, cEff, nfwCoreRadius(params, ev));
  if (kind === "burkert") return burkertCircular(r, mass, burkertScale(params, ev), NFW_RVIR);
  if (kind === "corenfw") {
    return coreNfwCircular(
      r,
      mass,
      rs,
      cEff,
      coreNfwRadius(params, ev),
      coreNfwIndex(params, ev),
    );
  }
  if (kind === "isothermal") return isothermalCircular(r, mass, 0.52 + ev.darkMatterFraction * 0.22);
  return einastoCircular(r, mass, rs, einastoAlpha(params, ev), NFW_RVIR);
}

export function circularSpeed(
  r: number,
  params: UniverseParams,
  ev: Evaluation,
  halo = true,
): number {
  const aSoft = plummerScale(params, ev);
  const x = Math.max(r, 1e-4);
  const rd = diskScale(ev);
  const baryon = 1 - ev.darkMatterFraction;
  const mass = Math.max(params.matter, 0.05) * Math.max(params.gravity, 0.2);
  const bulgeFrac = ev.morphology === "elliptical" ? 0.82 : ev.morphology === "scattered" ? 0.08 : 0.22;
  const enclosed = 1 - Math.exp(-x / rd) * (1 + x / rd);
  const vDisk2 = (baryon * mass * (1 - bulgeFrac) * enclosed) / x;
  const hole = bhMass(params, ev);
  const bulgeMass = Math.max(baryon * mass * bulgeFrac - hole, 0);
  const vBulge =
    ev.morphology === "elliptical"
      ? hernquistCircular(x, bulgeMass, hernquistScale(params, ev))
      : plummerCircular(x, bulgeMass, aSoft);
  const vHalo = halo ? haloCircular(x, params, ev) : 0;
  return Math.sqrt(Math.max(0, vDisk2 + vBulge * vBulge + vHalo * vHalo + hole / x));
}

function skyKey(params: UniverseParams, ev: Evaluation): string {
  return `${params.gravity.toFixed(4)}|${params.matter.toFixed(4)}|${params.expansion.toFixed(4)}|${params.darkEnergy.toFixed(4)}|${params.quantumNoise.toFixed(4)}|${params.complexity.toFixed(4)}|${ev.morphology}|${ev.darkMatterFraction.toFixed(4)}|${ev.structure.toFixed(3)}|${ev.lifeWindowGyr.toFixed(2)}`;
}

const OMEGA_BINS = 32;
const OMEGA_R0 = 0.01;
const OMEGA_R1 = 1.55;
const OMEGA_LOG0 = Math.log(OMEGA_R0);
const OMEGA_LOG1 = Math.log(OMEGA_R1);
let omegaHold: { key: string; lut: Float64Array } | null = null;

function lutR(i: number): number {
  const t = i / (OMEGA_BINS - 1);
  return Math.exp(OMEGA_LOG0 + t * (OMEGA_LOG1 - OMEGA_LOG0));
}

function lutOmega(r: number, lut: Float64Array): number {
  const x = Math.min(OMEGA_R1, Math.max(r, OMEGA_R0));
  const t = ((Math.log(x) - OMEGA_LOG0) / (OMEGA_LOG1 - OMEGA_LOG0)) * (OMEGA_BINS - 1);
  const i = Math.min(OMEGA_BINS - 2, Math.max(0, Math.floor(t)));
  const f = t - i;
  return lut[i] * (1 - f) + lut[i + 1] * f;
}

/** Ω(r) from a 32-bin log LUT. Same homology as circularSpeed, not a live N-body. */
export function circularOmega(r: number, params: UniverseParams, ev: Evaluation): number {
  const key = skyKey(params, ev);
  if (!omegaHold || omegaHold.key !== key) {
    const lut = new Float64Array(OMEGA_BINS);
    for (let i = 0; i < OMEGA_BINS; i++) {
      const rr = lutR(i);
      lut[i] = circularSpeed(rr, params, ev, true) / rr;
    }
    omegaHold = { key, lut };
  }
  return lutOmega(r, omegaHold.lut);
}

/** κ² = 4Ω² + r dΩ²/dr. Homology of epicyclic frequency. */
export function epicyclicKappa(
  r: number,
  params: UniverseParams,
  ev: Evaluation,
): number {
  const x = Math.max(r, 0.06);
  const dr = 0.05;
  const omega = circularOmega(x, params, ev);
  const xp = x + dr;
  const xm = Math.max(x - dr, 0.04);
  const op = circularOmega(xp, params, ev);
  const om = circularOmega(xm, params, ev);
  const dOmega2 = (op * op - om * om) / (xp - xm);
  return Math.sqrt(Math.max(1e-6, 4 * omega * omega + x * dOmega2));
}

export type DiskDossier = {
  niche: DiskNiche;
  Q: number;
  kappa: number;
  shear: number;
  pitchDeg: number;
  mesh: ToomreSample[];
  unstable: number;
  plummerA: number;
};

export type ToomreSample = { r: number; Q: number };

function diskScale(ev: Evaluation): number {
  return ev.morphology === "elliptical" ? 0.11 : ev.morphology === "scattered" ? 0.34 : 0.2;
}

/** Exponential baryon Σ, pinned so mid-disk matches the Toomre calibration. */
export function baryonSigma(r: number, params: UniverseParams, ev: Evaluation): number {
  const rd = diskScale(ev);
  const mid = Math.max(
    0.04,
    (1 - ev.darkMatterFraction) * Math.max(params.matter, 0.05) * Math.max(params.gravity, 0.25),
  );
  return Math.max(0.02, mid * Math.exp(-(r - 0.45) / rd));
}

export function toomreAt(r: number, params: UniverseParams, ev: Evaluation): number {
  const x = Math.max(r, DISK_SOFTEN);
  const kappa = epicyclicKappa(x, params, ev);
  const sigma = 0.11 + params.quantumNoise * 0.58;
  const Sigma = baryonSigma(x, params, ev);
  return clamp((sigma * kappa) / (3.05 * Sigma), 0.28, 5.6);
}

export function toomreProfile(
  params: UniverseParams,
  ev: Evaluation,
  n = DISK_MESH,
): ToomreSample[] {
  const count = Math.max(6, n);
  const out: ToomreSample[] = [];
  for (let i = 0; i < count; i++) {
    const r = DISK_SOFTEN + (1.35 * i) / (count - 1);
    out.push({ r, Q: toomreAt(r, params, ev) });
  }
  return out;
}

/**
 * Toomre Q ~ σ κ / (π G Σ) on a radial mesh. Homology, not SPH.
 */
let diskHold: { key: string; d: DiskDossier } | null = null;

export function diskDossier(params: UniverseParams, ev: Evaluation): DiskDossier {
  const key = skyKey(params, ev);
  if (diskHold?.key === key) return diskHold.d;
  const r = 0.45;
  const Q = toomreAt(r, params, ev);
  const kappa = epicyclicKappa(r, params, ev);
  const vin = circularSpeed(0.22, params, ev) / 0.22;
  const vout = circularSpeed(0.95, params, ev) / 0.95;
  const shear = clamp(vin / Math.max(vout, 1e-3) - 1, 0, 3);
  const pitchDeg = clamp(
    21 / (1 + 0.5 * shear) * (0.62 + 0.38 * Math.min(Q, 2.5)),
    6,
    32,
  );
  const mesh = toomreProfile(params, ev);
  const unstable = mesh.filter((s) => s.Q < 1.05).length;
  let niche: DiskNiche;
  if (ev.morphology === "elliptical" || ev.morphology === "scattered" || shear < 0.1) niche = "rigid";
  else if (Q < 1.05) niche = "fragmenting";
  else if (Q > 2.55) niche = "hot";
  else niche = "marginal";
  const d: DiskDossier = { niche, Q, kappa, shear, pitchDeg, mesh, unstable, plummerA: plummerScale(params, ev) };
  diskHold = { key, d };
  return d;
}

/** Pin: our outer disk lands near 220 km/s. Homology, not a SPARC fit. */
export const ROTATION_V0 = 440;

let rotHold: { key: string; n: number; s: RotationSample[] } | null = null;

export type RotationSample = {
  r: number;
  v: number;
  vBaryon: number;
  vKms: number;
  vNfw: number;
  vBurkert: number;
};

export function rotationCurve(
  params: UniverseParams,
  ev: Evaluation,
  n = 20,
): RotationSample[] {
  const key = skyKey(params, ev);
  const count = Math.max(8, n);
  if (rotHold?.key === key && rotHold.n === count) return rotHold.s;
  const samples: RotationSample[] = [];
  for (let i = 0; i < count; i++) {
    const r = 0.012 + (1.53 * i) / (count - 1);
    const v = circularSpeed(r, params, ev, true);
    const vBaryon = circularSpeed(r, params, ev, false);
    samples.push({
      r,
      v,
      vBaryon,
      vKms: v * ROTATION_V0,
      vNfw: Math.sqrt(vBaryon * vBaryon + haloCircular(r, params, ev, "nfw") ** 2),
      vBurkert: Math.sqrt(vBaryon * vBaryon + haloCircular(r, params, ev, "burkert") ** 2),
    });
  }
  rotHold = { key, n: count, s: samples };
  return samples;
}

export function baryonMassAnalog(params: UniverseParams, ev: Evaluation): number {
  return (1 - ev.darkMatterFraction) * Math.max(params.matter, 0.05) * Math.max(params.gravity, 0.2);
}

/** Pin: our sky sits on M_b ∝ v⁴. Homology of McGaugh, not a SPARC fit. */
export const TF_V0 = 197;
export const TF_K = 0.049;
export const TF_EXP = 4;
/** Pin: a dense elliptical sits on L ∝ σ⁴. Homology of Faber–Jackson, not a fit. */
export const FJ_SIG0 = 110;
export const FJ_K = 0.066;

/** Projected Re / a for Hernquist 1990. */
export const HERNQUIST_RE = 1.8153;
/** Observed plane: log Re = 1.24 log σ − 0.82 log Ie (Hyde & Bernardi-ish). Not virial. */
export const FP_A = 1.24;
export const FP_B = -0.82;

export type RarSample = { r: number; gObs: number; gBar: number };

export function rarProfile(params: UniverseParams, ev: Evaluation, n = 12): RarSample[] {
  const count = Math.max(8, n);
  const out: RarSample[] = [];
  for (let i = 0; i < count; i++) {
    const r = 0.08 + (1.2 * i) / (count - 1);
    const v = circularSpeed(r, params, ev, true);
    const vb = circularSpeed(r, params, ev, false);
    out.push({ r, gObs: (v * v) / r, gBar: (vb * vb) / r });
  }
  return out;
}

export type ScalingDossier = {
  vFlatKms: number;
  baryonMass: number;
  tfRatio: number;
  niche: TfNiche;
  rar: RarSample[];
  sigmaKms: number;
  fjRatio: number;
  fjNiche: TfNiche;
  kind: "tf" | "fj";
  re: number;
  ie: number;
  fpSigmaKms: number;
  fpRatio: number;
  virialRatio: number;
  fpNiche: FpNiche;
  upsilon: number;
  dynMass: number;
  mlBranch: MlBranch;
  imfX: number;
  imfNiche: ImfNiche;
  upsilonStar: number;
  imfMean: number;
  imfSn: number;
  imfCurve: ImfSample[];
  imfR: number;
  imfY: number;
  bhMass: number;
  magorrian: number;
  rSoi: number;
  agnNiche: AgnNiche;
  agn: AgnDossier;
  grmhd: GrmhdDossier;
  sersicN: number;
  massSeq: FpMassSample[];
  massEst: MassEstimates;
};

let scaleHold: { key: string; d: ScalingDossier } | null = null;

export function sigmaAnalog(params: UniverseParams, ev: Evaluation): number {
  const a = Math.max(hernquistScale(params, ev), 0.05);
  const v = circularSpeed(a, params, ev, false);
  const v2 = Math.max(1e-8, v * v - bhMass(params, ev) / a);
  return clamp((Math.sqrt(v2) / Math.SQRT2) * ROTATION_V0, 40, 420);
}

export function effectiveRadius(params: UniverseParams, ev: Evaluation): number {
  return HERNQUIST_RE * hernquistScale(params, ev);
}

export function surfaceIe(params: UniverseParams, ev: Evaluation): number {
  const re = Math.max(effectiveRadius(params, ev), 1e-4);
  return baryonMassAnalog(params, ev) / (re * re);
}

/** Kinematic σ in the well — light is baryonic, the potential is not. */
export function fpSigma(params: UniverseParams, ev: Evaluation): number {
  const re = Math.max(effectiveRadius(params, ev), 0.05);
  return clamp((circularSpeed(re, params, ev, true) / Math.SQRT2) * ROTATION_V0, 40, 420);
}

/** Pin: dense elliptical on the observed plane. Homology, not a fit. */
export const FP_K = 0.000508;
export const FP_VIRIAL_K = 0.0000112;
/** Dynamical-mass pin (cluster elliptical). Valley is L* (our disk). */
export const FP_M0 = 1.1;
export const FP_MSTAR = 0.31;
/** High-mass slope Υ ∝ M^α (Cappellari / Hyde). */
export const FP_ML_HI = 0.35;
/** Dwarf upturn Υ ∝ M^{-β}. */
export const FP_ML_LO = 0.55;

export function dynMassAnalog(params: UniverseParams, _ev?: Evaluation): number {
  return Math.max(params.matter, 0.05) * Math.max(params.gravity, 0.2);
}

function upsilonRaw(m: number): number {
  const x = Math.max(m, 0.05) / FP_MSTAR;
  return x >= 1 ? Math.pow(x, FP_ML_HI) : Math.pow(1 / Math.max(x, 0.08), FP_ML_LO);
}

/** U-shaped dynamical Υ(M). Normalized so the cluster pin is 1. */
export function upsilonAtMass(m: number): number {
  return clamp(upsilonRaw(m) / upsilonRaw(FP_M0), 0.48, 2.8);
}

export function massToLight(params: UniverseParams, ev?: Evaluation): number {
  return upsilonAtMass(dynMassAnalog(params, ev));
}

export function mlBranch(m: number): MlBranch {
  if (m < FP_MSTAR * 0.72) return "dwarf";
  if (m > FP_MSTAR * 1.85) return "giant";
  return "valley";
}

/** High-mass ξ(m) ∝ m^{-x}. Chabrier ~2.3, Salpeter 2.35. */
export const IMF_CHABRIER = 2.3;
export const IMF_SALPETER = 2.35;

export function imfHighMass(params: UniverseParams, ev: Evaluation): number {
  const m = dynMassAnalog(params, ev);
  const q = params.quantumNoise;
  let x = IMF_CHABRIER;
  if (ev.morphology === "elliptical") {
    x = IMF_SALPETER + 0.48 * clamp(Math.log10(Math.max(m / FP_MSTAR, 0.12)), 0, 1.15);
  } else if (ev.morphology === "scattered" || ev.morphology === "irregular") {
    x = IMF_CHABRIER - 0.55 * q - (ev.morphology === "scattered" ? 0.22 : 0.08);
  }
  x -= 0.18 * (0.5 - params.complexity);
  return clamp(x, 1.5, 3.05);
}

export function imfNicheOf(x: number): ImfNiche {
  if (x < 2.05) return "top";
  if (x < 2.33) return "chabrier";
  if (x < 2.55) return "salpeter";
  return "bottom";
}

/** Stellar M/L relative to Chabrier. Steeper x → more dwarfs → higher Υ*. */
export function upsilonStar(params: UniverseParams, ev: Evaluation): number {
  return clamp(Math.pow(10, 0.52 * (imfHighMass(params, ev) - IMF_CHABRIER)), 0.55, 2.3);
}

/**
 * Three mass methods. Photometry assumes Chabrier. Virial is enclosed within Re.
 * Lens is enclosed within θE. Not a mass sheet, not SPS.
 */
export type MassEstimates = {
  mStar: number;
  mPhot: number;
  mVirial: number;
  mLens: number;
  photBias: number;
  darkWithin: number;
  niche: MassMethodNiche;
};

export function massEstimates(params: UniverseParams, ev: Evaluation): MassEstimates {
  const mStar = Math.max(baryonMassAnalog(params, ev), 1e-6);
  const yStar = Math.max(upsilonStar(params, ev), 0.4);
  const mPhot = mStar / yStar;
  const re = Math.max(effectiveRadius(params, ev), 0.05);
  const mBarRe = enclosedMass(re, params, ev, false);
  const mVirial = enclosedMass(re, params, ev, true);
  const te = einsteinRadius(ev, params);
  const mLens = enclosedMass(te, params, ev, true);
  const photBias = mPhot / mStar;
  const darkWithin = clamp((mVirial - mBarRe) / Math.max(mVirial, 1e-6), 0, 0.85);
  const photOff = Math.abs(mPhot - mStar) / mStar;
  const virOff = Math.abs(mVirial - mStar) / mStar;
  const lensVir = Math.abs(mLens - mVirial) / Math.max(mVirial, 1e-6);
  let niche: MassMethodNiche;
  if (photOff < 0.18 && virOff < 0.22 && lensVir < 0.25) niche = "agree";
  else if (photOff > 0.18 && lensVir < 0.25) niche = "imf";
  else if (virOff > 0.22 && photOff < 0.18) niche = "halo";
  else niche = "split";
  return { mStar, mPhot, mVirial, mLens, photBias, darkWithin, niche };
}

export function bulgeMassAnalog(params: UniverseParams, ev: Evaluation): number {
  const frac = ev.morphology === "elliptical" ? 0.82 : ev.morphology === "scattered" ? 0.08 : 0.22;
  return baryonMassAnalog(params, ev) * frac;
}

/** Bulge σ. Disk rotation is not M–σ. */
export function bulgeSigmaKms(params: UniverseParams, ev: Evaluation): number {
  const mb = bulgeMassAnalog(params, ev);
  const a = ev.morphology === "elliptical" ? hernquistScale(params, ev) : plummerScale(params, ev);
  const r = Math.max(a, 1e-4);
  const v =
    ev.morphology === "elliptical" ? hernquistCircular(r, mb, a) : plummerCircular(r, mb, a);
  return clamp((v / Math.SQRT2) * ROTATION_V0, 30, 420);
}

/** King 2003: M_BH ∝ σ⁴ (momentum). Silk–Rees 1998: ∝ σ⁵ (energy). Pin Magorrian ≈ 0.005 on the cluster elliptical. Disks are damped. */
export const BH_SIG_EXP = 4;
export const BH_K = 0.1207;
export const MAGORRIAN_PIN = 0.005;
/** Analog σ of the Magorrian-pin sky. Silk–Rees equals King there, then steeper. */
export const SR_SIG_EXP = 5;
export const SR_PIN_SIG = 0.2176;
export const SR_K = BH_K / SR_PIN_SIG;

function bhDamp(ev: Evaluation): number {
  return ev.morphology === "elliptical" ? 1 : ev.morphology === "scattered" ? 0.08 : 0.0005;
}

let bhHold: { key: string; m: number } | null = null;

export function bhMass(params: UniverseParams, ev: Evaluation): number {
  const key = skyKey(params, ev);
  if (bhHold?.key === key) return bhHold.m;
  const sig = bulgeSigmaKms(params, ev) / ROTATION_V0;
  const m = BH_K * bhDamp(ev) * Math.pow(Math.max(sig, 0.05), BH_SIG_EXP);
  bhHold = { key, m };
  return m;
}

/** Energy-driven hole. Same damp as King. Not the mass that feeds the jet. */
export function silkReesMass(params: UniverseParams, ev: Evaluation): number {
  const sig = bulgeSigmaKms(params, ev) / ROTATION_V0;
  return SR_K * bhDamp(ev) * Math.pow(Math.max(sig, 0.05), SR_SIG_EXP);
}

export function magorrianRatio(params: UniverseParams, ev: Evaluation): number {
  return bhMass(params, ev) / Math.max(bulgeMassAnalog(params, ev), 1e-6);
}

export function sphereOfInfluence(params: UniverseParams, ev: Evaluation): number {
  const sig = bulgeSigmaKms(params, ev) / ROTATION_V0;
  return bhMass(params, ev) / Math.max(sig * sig, 1e-6);
}

/** Energy coupling ε. Momentum load Ṗ/(L/c). Homology, not a simulation. */
export const AGN_COUPLE_E = 0.05;
export const AGN_COUPLE_P = 1.1;
/** Rest-energy scale so Magorrian pin can unbind the bulge (Silk–Rees). */
export const AGN_BIND = 400;

export function eddingtonRatio(params: UniverseParams, ev: Evaluation): number {
  const r = imfReturn(imfHighMass(params, ev), imfNicheOf(imfHighMass(params, ev)));
  const mag = Math.max(magorrianRatio(params, ev), 1e-4);
  const feed =
    ev.morphology === "scattered" || ev.morphology === "irregular"
      ? 0.45
      : ev.morphology === "elliptical"
        ? r < 0.34
          ? 0.12
          : 0.28
        : 0.0008;
  return clamp((0.0025 * feed * r) / mag, 0.0004, 1.6);
}

export type AgnDossier = {
  lambda: number;
  mode: AgnMode;
  drive: AgnDrive;
  niche: AgnNiche;
  heat: number;
  wind: number;
  bind: number;
};

let agnHold: { key: string; d: AgnDossier } | null = null;

export function agnDossier(params: UniverseParams, ev: Evaluation): AgnDossier {
  const key = skyKey(params, ev);
  if (agnHold?.key === key) return agnHold.d;
  const mag = magorrianRatio(params, ev);
  const lambda = eddingtonRatio(params, ev);
  let mode: AgnMode = "off";
  let drive: AgnDrive = "none";
  if (mag >= 0.0012) {
    if (lambda >= 0.06 && ev.morphology !== "elliptical") {
      mode = "wind";
      drive = "momentum";
    } else if (lambda >= 0.12 && ev.morphology === "elliptical") {
      mode = "wind";
      drive = lambda > 0.35 ? "energy" : "momentum";
    } else if (ev.morphology === "elliptical" && mag > 0.0032) {
      mode = "jet";
      drive = "energy";
    } else {
      mode = "jet";
      drive = "energy";
    }
  }
  const sig = bulgeSigmaKms(params, ev) / ROTATION_V0;
  const bind =
    (AGN_COUPLE_E * AGN_BIND * bhMass(params, ev)) /
    Math.max(bulgeMassAnalog(params, ev) * sig * sig, 1e-8);
  const heat = clamp(mode === "jet" ? bind * 1.15 : bind * 0.25, 0, 1);
  const wind = mode === "wind" ? clamp(AGN_COUPLE_P * lambda, 0, 2.4) : 0;
  let niche: AgnNiche;
  if (mode === "off") niche = "quiet";
  else if (mode === "wind" && lambda > 0.07) niche = "quasar";
  else if (
    mode === "jet" &&
    heat > 0.22 &&
    ev.morphology === "elliptical" &&
    lambda < 0.04
  ) {
    niche = "quench";
  } else niche = "maintain";
  const d: AgnDossier = { lambda, mode, drive, niche, heat, wind, bind };
  agnHold = { key, d };
  return d;
}

export function agnNicheOf(params: UniverseParams, ev: Evaluation): AgnNiche {
  return agnDossier(params, ev).niche;
}

/** Kerr ISCO in units of M. Bardeen, Press, Teukolsky 1972. */
export function kerrIsco(a: number): number {
  const aa = clamp(a, -0.998, 0.998);
  const z1 =
    1 +
    Math.pow(1 - aa * aa, 1 / 3) * (Math.pow(1 + aa, 1 / 3) + Math.pow(1 - aa, 1 / 3));
  const z2 = Math.sqrt(3 * aa * aa + z1 * z1);
  const s = aa >= 0 ? 1 : -1;
  return 3 + z2 - s * Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
}

/** Novikov–Thorne radiative efficiency. Schwarzschild → 0.057. */
export function novikovThorne(a: number): number {
  const r = kerrIsco(a);
  return 1 - Math.sqrt(Math.max(0, 1 - 2 / (3 * r)));
}

/** Dimensionless spin. Coherent gas spins up; dry mergers and noise knock it down. */
export function kerrSpin(params: UniverseParams, ev: Evaluation): number {
  const r = imfReturn(imfHighMass(params, ev), imfNicheOf(imfHighMass(params, ev)));
  const q = params.quantumNoise;
  let a: number;
  if (ev.morphology === "elliptical") {
    a = (r < 0.34 ? 0.58 : 0.74) - q * 0.22;
  } else if (ev.morphology === "scattered" || ev.morphology === "irregular") {
    a = 0.12 + r * 0.18;
  } else {
    a = 0.52 + (0.1 - q) * 0.8;
  }
  return clamp(a, 0, 0.998);
}

export function grmhdStateOf(params: UniverseParams, ev: Evaluation, agn: AgnDossier): GrmhdState {
  if (agn.mode === "jet" && agn.lambda < 0.08) return "mad";
  if (agn.mode === "wind" && agn.lambda > 0.15) return "thin";
  if (agn.mode === "off") return agn.lambda < 0.03 ? "sane" : "thin";
  return "sane";
}

/** ADAF: λ too low to radiate. MAD is an arrested ADAF, not a thin disk. */
export function isAdaf(state: GrmhdState, lambda: number): boolean {
  return state !== "thin" && lambda < 0.05;
}

export function fanaroffRiley(state: GrmhdState, niche: AgnNiche): FanaroffRiley {
  if (state !== "mad") return "none";
  if (niche === "quasar") return "frii";
  return "fri";
}

/** Horizon flux Φ/√M analog. MAD saturates near 50. */
export function horizonFlux(state: GrmhdState, a: number): number {
  if (state === "mad") return 42 + 16 * a;
  if (state === "thin") return 3.5;
  return 7 + 4 * a;
}

/**
 * Plasma β = P_gas / P_mag. Magnetic pressure P_B = B²/8π ∝ Φ².
 * MAD stalls when P_B ~ ram pressure (Narayan, Igumenshchev, Abramowicz 2003).
 */
export function plasmaBeta(phi: number): number {
  const mag = Math.pow(Math.max(phi, 1) / 50, 2);
  return clamp(1 / mag, 0.2, 250);
}

/** P_B / P_ram. Arrested near 1. */
export function magRamRatio(phi: number): number {
  return clamp(Math.pow(Math.max(phi, 1) / 50, 2), 0.002, 1.8);
}

/** Magnetospheric radius in r_g. Arrested when r_m ≳ r₊. */
export function magnetoRadius(phi: number, a: number): number {
  const aa = clamp(a, 0, 0.998);
  const rPlus = 1 + Math.sqrt(Math.max(0, 1 - aa * aa));
  return clamp((phi / 50) * 6, 0.15 * rPlus, 12);
}

/**
 * Magnetization σ = b²/ρ near the horizon.
 * Funnel σ ≫ 1; dense streams σ ≲ 1. Mean is high only in MAD.
 */
export function magnetization(state: GrmhdState, phi: number): number {
  const mag = Math.max(phi, 1) / 50;
  if (state === "mad") return clamp(5.5 * mag, 1.8, 12);
  if (state === "thin") return clamp(0.08 * mag, 0.02, 0.2);
  return clamp(0.6 * mag, 0.08, 1.2);
}

/**
 * Volume filling factor of dense gas. MAD accretes in interchange streams
 * (Narayan, Igumenshchev, Abramowicz 2003). The rest is magnetosphere.
 */
export function madFill(state: GrmhdState, magRam: number): number {
  if (state !== "mad") return 1;
  return clamp(0.38 / Math.max(magRam, 0.4), 0.08, 0.42);
}

/** Flux-eruption variability. MAD flickers; SANE is quieter. Not a light curve. */
export function madVar(state: GrmhdState, a: number, magRam: number): number {
  if (state !== "mad") return state === "thin" ? 0.05 : 0.12;
  return clamp(0.22 + 0.45 * a * magRam, 0.18, 0.9);
}

/**
 * t_diff / t_adv for net vertical flux.
 * Thin disks slip (Lubow, Papaloizou, Pringle 1994): extra (H/R).
 * Thick flows drag flux in. MAD piles it, then expels the rest.
 */
export function fluxAdvection(state: GrmhdState, lambda: number): number {
  const aspect = state === "thin" ? 0.05 : state === "sane" ? 0.35 : 0.55;
  const slip = state === "thin" ? aspect : 1;
  const inflow = state === "thin" ? 0.45 : state === "sane" ? 1.1 : 3.4;
  return clamp((slip * inflow * (0.25 + Math.sqrt(Math.max(lambda, 1e-4)))) / aspect, 0.03, 40);
}

export function fluxTransportOf(state: GrmhdState, lambda: number): FluxTransport {
  const ratio = fluxAdvection(state, lambda);
  if (state === "mad" && ratio > 1) return "expel";
  if (ratio > 1) return "advect";
  return "diffuse";
}

/** Ω_H in units c³/GM. r₊ = 1 + √(1−a²). a→1 ⇒ Ω_H → 1/2. */
export function horizonOmega(a: number): number {
  const aa = clamp(a, 0, 0.998);
  const rPlus = 1 + Math.sqrt(Math.max(0, 1 - aa * aa));
  return aa / (2 * rPlus);
}

/** Znajek: max power at Ω_F = Ω_H / 2. */
export function fieldOmega(a: number): number {
  return 0.5 * horizonOmega(a);
}

export const BZ_KAPPA: Record<BzGeometry, number> = {
  monopole: 0.053,
  parabolic: 0.044,
};

/** Tchekhovskoy, Narayan, McKinney 2010. */
export function bzSpinCorrection(omegaH: number): number {
  const w = omegaH;
  return Math.max(0.12, 1 + 1.38 * w * w - 9.2 * w * w * w * w);
}

export function bzGeometryOf(state: GrmhdState): BzGeometry {
  return state === "mad" ? "parabolic" : "monopole";
}

/**
 * Blandford–Znajek 1977: P ∝ Φ² Ω_F (Ω_H − Ω_F).
 * Max at matched load Ω_F = Ω_H / 2. Energy from the hole, not the disk.
 * load is Ω_F/Ω_H. Open or short circuit → P = 0. Not a HARM dump.
 */
export function blandfordZnajek(
  a: number,
  phi: number,
  mBH: number,
  geometry: BzGeometry = "parabolic",
  load = 0.5,
): number {
  const ohm = horizonOmega(a);
  const of = clamp(load, 0, 1) * ohm;
  const kappa = BZ_KAPPA[geometry] / BZ_KAPPA.parabolic;
  return (
    Math.max(0, mBH) *
    kappa *
    Math.pow(phi / 50, 2) *
    4 *
    of *
    Math.max(0, ohm - of) *
    bzSpinCorrection(ohm)
  );
}

/** Christodoulou: extractable spin energy / Mc². Extremal → 1 − 1/√2 ≈ 0.29. */
export function spinEnergy(a: number): number {
  const aa = clamp(a, 0, 0.998);
  return 1 - Math.sqrt((1 + Math.sqrt(Math.max(0, 1 - aa * aa))) / 2);
}

/**
 * Blandford–Payne 1982: magneto-centrifugal disk wind.
 * Needs a disk field. Scales with accretion, not Ω_H².
 */
export function blandfordPayne(lambda: number, mBH: number, state: GrmhdState): number {
  const disk = state === "thin" ? 1.35 : state === "sane" ? 0.55 : 0.1;
  return Math.max(0, mBH) * disk * clamp(lambda, 0.0004, 1.6);
}

export type GrmhdDossier = {
  aStar: number;
  isco: number;
  ntEff: number;
  state: GrmhdState;
  phi: number;
  bz: number;
  bp: number;
  omegaH: number;
  omegaF: number;
  geometry: BzGeometry;
  kappa: number;
  winner: "bz" | "bp" | "none";
  spinE: number;
  etaBz: number;
  beta: number;
  magRam: number;
  rMag: number;
  fluxAdv: number;
  fluxNiche: FluxTransport;
  sigma: number;
  fill: number;
  flicker: number;
  adaf: boolean;
  fr: FanaroffRiley;
};

let grmhdHold: { key: string; d: GrmhdDossier } | null = null;

export function grmhdDossier(params: UniverseParams, ev: Evaluation): GrmhdDossier {
  const key = skyKey(params, ev);
  if (grmhdHold?.key === key) return grmhdHold.d;
  const agn = agnDossier(params, ev);
  const aStar = kerrSpin(params, ev);
  const state = grmhdStateOf(params, ev, agn);
  const phi = horizonFlux(state, aStar);
  const geometry = bzGeometryOf(state);
  const bz = blandfordZnajek(aStar, phi, bhMass(params, ev), geometry);
  const bp = blandfordPayne(agn.lambda, bhMass(params, ev), state);
  const mBH = Math.max(bhMass(params, ev), 1e-12);
  let winner: "bz" | "bp" | "none";
  if (bz < 1e-10 && bp < 1e-10) winner = "none";
  else winner = bz >= bp ? "bz" : "bp";
  const magRam = magRamRatio(phi);
  const etaBz = agn.mode === "off" ? 0 : clamp(bz / Math.max(agn.lambda * mBH, 1e-12), 0, 40);
  const d: GrmhdDossier = {
    aStar,
    isco: kerrIsco(aStar),
    ntEff: novikovThorne(aStar),
    state,
    phi,
    bz,
    bp,
    omegaH: horizonOmega(aStar),
    omegaF: fieldOmega(aStar),
    geometry,
    kappa: BZ_KAPPA[geometry],
    winner,
    spinE: spinEnergy(aStar),
    etaBz,
    beta: plasmaBeta(phi),
    magRam,
    rMag: magnetoRadius(phi, aStar),
    fluxAdv: fluxAdvection(state, agn.lambda),
    fluxNiche: fluxTransportOf(state, agn.lambda),
    sigma: magnetization(state, phi),
    fill: madFill(state, magRam),
    flicker: madVar(state, aStar, magRam),
    adaf: isAdaf(state, agn.lambda),
    fr: fanaroffRiley(state, agn.niche),
  };
  grmhdHold = { key, d };
  return d;
}

/** Sérsic n rises with mass. n=4 at the pin, dwarfs ~2, BCGs ~8. Not a light fit. */
export function sersicIndex(params: UniverseParams, ev: Evaluation): number {
  return clamp(4 + 2.6 * Math.log10(dynMassAnalog(params, ev) / FP_M0), 1.6, 8);
}

export type FpMassSample = { mass: number; residual: number; virial: number; upsilon: number };

export function fpMassSequence(params: UniverseParams, ev: Evaluation): FpMassSample[] {
  const m0 = Math.max(dynMassAnalog(params, ev), 1e-3);
  const re0 = effectiveRadius(params, ev);
  const ie0 = Math.max(surfaceIe(params, ev), 1e-6);
  const s0 = Math.max(fpSigma(params, ev), 1);
  const factors = [0.18, 0.4, 0.7, 1, 1.7, 2.8];
  return factors.map((f) => {
    const re = re0 * Math.sqrt(f);
    const sig = s0 * Math.pow(f, 0.25);
    const y = upsilonAtMass(m0 * f);
    const fpPred = FP_K * Math.pow(sig, FP_A) * Math.pow(ie0, FP_B);
    const virialPred = (FP_VIRIAL_K * sig * sig) / (ie0 * y);
    return {
      mass: m0 * f,
      residual: re / Math.max(fpPred, 1e-8),
      virial: re / Math.max(virialPred, 1e-8),
      upsilon: y,
    };
  });
}

export function scalingDossier(params: UniverseParams, ev: Evaluation): ScalingDossier {
  const key = skyKey(params, ev);
  if (scaleHold?.key === key) return scaleHold.d;
  const curve = rotationCurve(params, ev);
  const vFlatKms = curve[curve.length - 1]?.vKms ?? 0;
  const baryonMass = baryonMassAnalog(params, ev);
  const tfRatio =
    baryonMass / (TF_K * Math.pow(Math.max(vFlatKms, 1) / TF_V0, TF_EXP));
  let niche: TfNiche;
  if (tfRatio < 0.62) niche = "below";
  else if (tfRatio > 1.55) niche = "above";
  else niche = "ridge";
  const sigmaKms = sigmaAnalog(params, ev);
  const fjRatio = baryonMass / (FJ_K * Math.pow(Math.max(sigmaKms, 1) / FJ_SIG0, TF_EXP));
  let fjNiche: TfNiche;
  if (fjRatio < 0.86) fjNiche = "below";
  else if (fjRatio > 1.22) fjNiche = "above";
  else fjNiche = "ridge";
  const kind = ev.morphology === "elliptical" ? "fj" : "tf";
  const re = effectiveRadius(params, ev);
  const ie = surfaceIe(params, ev);
  const fpSigmaKms = fpSigma(params, ev);
  const fpPred =
    FP_K *
    Math.pow(Math.max(fpSigmaKms, 1), FP_A) *
    Math.pow(Math.max(ie, 1e-6), FP_B);
  const upsilon = massToLight(params, ev);
  const virialPred =
    (FP_VIRIAL_K * Math.pow(Math.max(fpSigmaKms, 1), 2)) / (Math.max(ie, 1e-6) * upsilon);
  const fpRatio = re / Math.max(fpPred, 1e-8);
  const virialRatio = re / Math.max(virialPred, 1e-8);
  let fpNiche: FpNiche;
  if (fpRatio > 0.8 && fpRatio < 1.28) fpNiche = "tight";
  else if (virialRatio > 0.75 && virialRatio < 1.35) fpNiche = "tilted";
  else fpNiche = "off";
  const xImf = imfHighMass(params, ev);
  const nImf = imfNicheOf(xImf);
  const agn = agnDossier(params, ev);
  const grmhd = grmhdDossier(params, ev);
  const d: ScalingDossier = {
    vFlatKms,
    baryonMass,
    tfRatio,
    niche,
    rar: rarProfile(params, ev),
    sigmaKms,
    fjRatio,
    fjNiche,
    kind,
    re,
    ie,
    fpSigmaKms,
    fpRatio,
    virialRatio,
    fpNiche,
    upsilon,
    dynMass: dynMassAnalog(params, ev),
    mlBranch: mlBranch(dynMassAnalog(params, ev)),
    imfX: xImf,
    imfNiche: nImf,
    upsilonStar: upsilonStar(params, ev),
    imfMean: imfMeanMass(xImf, nImf),
    imfSn: imfSnFrac(xImf, nImf),
    imfCurve: imfCurve(xImf, nImf),
    imfR: imfReturn(xImf, nImf),
    imfY: imfYield(xImf, nImf),
    bhMass: bhMass(params, ev),
    magorrian: magorrianRatio(params, ev),
    rSoi: sphereOfInfluence(params, ev),
    agnNiche: agn.niche,
    agn,
    grmhd,
    sersicN: sersicIndex(params, ev),
    massSeq: fpMassSequence(params, ev),
    massEst: massEstimates(params, ev),
  };
  scaleHold = { key, d };
  return d;
}

export type HaloFactorId = "share" | "rotation" | "lens" | "clustering";

export type HaloDossier = {
  niche: HaloNiche;
  share: number;
  omegaB: number;
  support: number;
  outerKms: number;
  baryonKms: number;
  thetaE: number;
  concentration: number;
  rs: number;
  contraction: number;
  core: number;
  kappa: EinsteinSample[];
  kappaS: number;
  radial: number;
  einastoA: number;
  model: HaloModelId;
  compare: HaloCompareSample[];
  slopeE: number;
  slopeN: number;
  slopeB: number;
  rMax: number;
  coreN: number;
  factors: { id: HaloFactorId; value: number }[];
};

let haloHold: { key: string; d: HaloDossier } | null = null;

export function haloDossier(params: UniverseParams, ev: Evaluation): HaloDossier {
  const key = skyKey(params, ev);
  if (haloHold?.key === key) return haloHold.d;
  const curve = rotationCurve(params, ev);
  const outer = curve[curve.length - 1];
  const share = ev.darkMatterFraction;
  const v = outer?.v ?? 0;
  const vB = outer?.vBaryon ?? 0;
  const support = v / Math.max(vB, 1e-4);
  const thetaE = einsteinRadius(ev, params);
  const concentration = nfwConcentration(params, ev);
  const rs = nfwScale(params, ev);
  const contraction = baryonContraction(params, ev);
  const model = haloModel(params, ev);
  const core =
    model === "corenfw"
      ? coreNfwRadius(params, ev)
      : model === "burkert"
        ? burkertScale(params, ev)
        : nfwCoreRadius(params, ev);
  const alpha = einastoAlpha(params, ev);
  const omegaB = omegaBaryon(params);

  let niche: HaloNiche;
  if (share >= 0.91) niche = "heavy";
  else if (support >= 1.7 && share >= 0.72) niche = "held";
  else if (support >= 1.25) niche = "partial";
  else niche = "keplerian";

  const ks = nfwKappaS(params, ev);
  const d: HaloDossier = {
    niche,
    share,
    omegaB,
    support,
    outerKms: outer?.vKms ?? 0,
    baryonKms: vB * ROTATION_V0,
    thetaE,
    concentration,
    rs,
    contraction,
    core,
    kappa: einsteinProfile(params, ev),
    kappaS: ks,
    radial: nfwRadialX(ks) * rs,
    einastoA: alpha,
    model,
    compare: haloDensityCompare(alpha),
    slopeE: logSlope((x) => einastoRho(x, alpha), 1e-4),
    slopeN: logSlope(nfwRho, 1e-4),
    slopeB: logSlope(burkertRho, 1e-4),
    rMax: burkertRmax(burkertScale(params, ev)),
    coreN: coreNfwIndex(params, ev),
    factors: [
      { id: "share", value: clamp((share - 0.6) / 0.34, 0, 1) },
      { id: "rotation", value: clamp((support - 1) / 2.2, 0, 1) },
      { id: "lens", value: clamp(thetaE / 0.75, 0, 1) },
      { id: "clustering", value: clamp(ev.structure, 0, 1) },
    ],
  };
  haloHold = { key, d };
  return d;
}

export type LensImage = {
  x: number;
  y: number;
  stretch: number;
  parity: 1 | -1;
};

/**
 * Discrete invariants of a circular lens map.
 * Multiplicity and signed parity survive rotation of the source.
 * Not π₁ of the spatial 3-manifold, not CMB topology, not a Betti census.
 */
export type LensMapInvariants = {
  multiplicity: number;
  signed: number;
};

export function lensMapInvariants(images: LensImage[]): LensMapInvariants {
  let signed = 0;
  for (const im of images) signed += im.parity;
  return { multiplicity: images.length, signed };
}

/**
 * SIS homology: β = θ − θE θ̂.
 * Outer image is pushed *out* by θE (arcs). Sources inside ~θE also get a
 * fainter counter-image on the opposite side. Not a ray tracer.
 */
export function lensImages(x: number, y: number, thetaE: number): LensImage[] {
  const te = Math.max(thetaE, 1e-4);
  const b = Math.hypot(x, y);
  if (b < 1e-4) {
    return [{ x: te, y: 0, stretch: 10, parity: 1 }];
  }
  const ux = x / b;
  const uy = y / b;
  const outerR = b + te;
  const distO = Math.abs(outerR - te);
  const stretchO = Math.min(12, 1 + te / Math.max(distO, 0.03));
  const images: LensImage[] = [
    { x: ux * outerR, y: uy * outerR, stretch: stretchO, parity: 1 },
  ];
  if (b < te * 1.2) {
    const innerR = Math.max(0.03, te - b * 0.62);
    const distI = Math.abs(innerR - te);
    const stretchI = Math.min(9, 0.65 + te / Math.max(distI, 0.04));
    images.push({
      x: -ux * innerR,
      y: -uy * innerR,
      stretch: stretchI,
      parity: -1,
    });
  }
  return images;
}

/** Primary (outer) image. Prefer lensImages when drawing a source. */
export function lensDeflect(
  x: number,
  y: number,
  thetaE: number,
): { x: number; y: number; stretch: number } {
  const img = lensImages(x, y, thetaE)[0];
  if (!img) return { x, y, stretch: 1 };
  return { x: img.x, y: img.y, stretch: img.stretch };
}
