import { diskDossier, einsteinRadius, grmhdDossier, hernquistScale, imfHighMass, imfNicheOf, NFW_RVIR, plummerScale, sampleMass } from "./observatory.ts";
import { persistH0, persistLong } from "./persist.ts";
import { isOurParams } from "./physics.ts";
import { lerp, mulberry32 } from "./rng.ts";
import type { Evaluation, UniverseParams } from "./types";

export type Star = {
  x: number;
  y: number;
  z: number;
  r: number;
  rgb: [number, number, number];
  a: number;
  phase: number;
  mass: number;
  birthGyr: number;
};

export type BackgroundGalaxy = {
  x: number;
  y: number;
  kind: "spiral" | "elliptical";
  rx: number;
  ry: number;
  rot: number;
  rgb: [number, number, number];
  a: number;
};

export type GalaxyModel = {
  stars: Star[];
  companion: Star[];
  dust: { x: number; y: number; rx: number; ry: number; rot: number; a: number; rgb: [number, number, number] }[];
  clumps: { x: number; y: number; r: number; a: number; rgb: [number, number, number] }[];
  field: Star[];
  background: BackgroundGalaxy[];
  coreScale: number;
  coreRgb: [number, number, number];
  rotation: number;
  haloRadius: number;
  jet: { power: number; flicker: number; fill: number; pa: number; fr: "none" | "fri" | "frii" };
  encounter: { q: number; rTide: number; kind: "minor" | "major" };
  /** Finite H0 bars of the star cloud past 0.18. Not H₁. */
  h0Long: number;
};

export type LookCam = {
  ox: number;
  oy: number;
  oz: number;
  fx: number;
  fy: number;
  fz: number;
  rx: number;
  ry: number;
  rz: number;
  ux: number;
  uy: number;
  uz: number;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * Encounter homology — not GADGET, not a live N-body.
 * q = m2/m1. Jacobi radius at a pericenter of order the primary.
 */
export function encounterOf(
  params: UniverseParams,
  evaluation: Evaluation,
): { q: number; rTide: number; kind: "minor" | "major" } {
  let q: number;
  if (isOurParams(params)) q = 0.85;
  else if (evaluation.morphology === "elliptical") q = 0.72;
  else if (evaluation.morphology === "scattered") q = 0.16;
  else q = 0.34 + evaluation.structure * 0.28;
  q = Math.min(1, Math.max(0.12, q));
  return {
    q,
    rTide: 0.58 * Math.pow(q / 3, 1 / 3),
    kind: q >= 0.4 ? "major" : "minor",
  };
}

export const PIXEL_BUDGET = 2_200_000;

export function canvasDpr(cssW: number, cssH: number, cap: number, device = 1): number {
  const area = Math.max(1, cssW * cssH);
  const fromBudget = Math.sqrt(PIXEL_BUDGET / area);
  return Math.max(0.5, Math.min(cap, Math.max(device, 0.5), fromBudget));
}

export function adaptiveQuality(): { scale: number; dprCap: number } {
  if (typeof navigator === "undefined") return { scale: 1, dprCap: 1.5 };
  const cores = navigator.hardwareConcurrency || 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const area =
    typeof window !== "undefined" ? window.innerWidth * window.innerHeight : 1_000_000;
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  let framed = false;
  try {
    framed = typeof window !== "undefined" && window.self !== window.top;
  } catch {
    framed = true;
  }
  let scale = 1;
  if (mobile) scale *= 0.55;
  if (framed) scale *= 0.72;
  if (cores <= 4) scale *= 0.75;
  if (memory <= 4) scale *= 0.8;
  if (connection?.saveData) scale *= 0.7;
  if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") scale *= 0.65;
  if (area < 420_000) scale *= 0.7;
  if (area < 280_000) scale *= 0.78;
  if (area < 180_000) scale *= 0.72;
  if (area > 1_600_000) scale *= 0.82;
  if (area > 2_400_000) scale *= 0.78;
  if (area > 3_600_000) scale *= 0.75;
  const tight = mobile || framed || area < 280_000;
  let dprCap = tight ? 1.1 : 1.5;
  if (area > 2_000_000) dprCap = Math.min(dprCap, 1.25);
  if (area > 3_200_000) dprCap = Math.min(dprCap, 1.1);
  return {
    scale: Math.max(0.22, Math.min(1, scale)),
    dprCap,
  };
}

function diskZ(rng: () => number, dist: number, thick: number): number {
  return (rng() - 0.5) * thick * (1 - dist * 0.45);
}

function starTint(rng: () => number): [number, number, number] {
  const roll = rng();
  if (roll < 0.18) return [255, 168, 110];
  if (roll < 0.42) return [255, 214, 170];
  if (roll < 0.7) return [236, 240, 255];
  if (roll < 0.88) return [170, 210, 255];
  return [255, 132, 78];
}

/** Camera sitting in the disk. Yaw 0 looks at the bulge. */
export function lookCam(
  yaw: number,
  pitch: number,
  ox = 0.58,
  oy = 0.04,
  oz = 0.012,
): LookCam {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const fx = -cy * cp;
  const fy = -sy * cp;
  const fz = sp;
  let rx = fy;
  let ry = -fx;
  let rz = 0;
  const rlen = Math.hypot(rx, ry);
  if (rlen < 1e-8) {
    rx = 1;
    ry = 0;
  } else {
    rx /= rlen;
    ry /= rlen;
  }
  return {
    ox,
    oy,
    oz,
    fx,
    fy,
    fz,
    rx,
    ry,
    rz,
    ux: ry * fz - rz * fy,
    uy: rz * fx - rx * fz,
    uz: rx * fy - ry * fx,
  };
}

export function projectLook(
  x: number,
  y: number,
  z: number,
  cam: LookCam,
  fov: number,
): { x: number; y: number; depth: number } | null {
  const dx = x - cam.ox;
  const dy = y - cam.oy;
  const dz = z - cam.oz;
  const depth = dx * cam.fx + dy * cam.fy + dz * cam.fz;
  if (depth < 0.05) return null;
  return {
    x: ((dx * cam.rx + dy * cam.ry + dz * cam.rz) / depth) * fov,
    y: (-(dx * cam.ux + dy * cam.uy + dz * cam.uz) / depth) * fov,
    depth,
  };
}

/** Pinhole for the inside sky. Not the face-on disk matrix. */
export const PLANETARIUM_FOV = 1.22;

/**
 * Screen of a world point in the planetarium.
 * After ctx.translate(cx,cy) pass cx=0, cy=0.
 * Not a second projection — projectLook, then scale.
 */
export function planetariumScreen(
  x: number,
  y: number,
  z: number,
  cam: LookCam,
  cx: number,
  cy: number,
  scale: number,
): { x: number; y: number; depth: number } | null {
  const p = projectLook(x, y, z, cam, PLANETARIUM_FOV);
  if (!p) return null;
  return { x: cx + p.x * scale, y: cy + p.y * scale, depth: p.depth };
}

function fillMorphology(
  rng: () => number,
  params: UniverseParams,
  evaluation: Evaluation,
  n: number,
  spread: number,
  scatter: number,
  scale: number,
  birthSpan: number,
): Star[] {
  const stars: Star[] = [];
  const morph = evaluation.morphology;
  const first = evaluation.timeToStarsGyr;
  const imfX = imfHighMass(params, evaluation);
  const imfN = imfNicheOf(imfX);

  const pushStar = (x: number, y: number, z: number, size: number) => {
    const dist = Math.hypot(x, y);
    const r = lerp(0.85, 3.2, rng() * rng()) * size;
    const a = lerp(0.55, 1, rng()) * (1 - dist * 0.1);
    stars.push({
      x,
      y,
      z,
      r,
      rgb: starTint(rng),
      a: clamp01(a),
      phase: rng() * Math.PI * 2,
      mass: sampleMass(rng, imfX, imfN),
      birthGyr: first + rng() * birthSpan,
    });
  };

  if (morph === "scattered") {
    const count = Math.max(50, Math.floor(n * 0.4));
    for (let i = 0; i < count; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = Math.pow(rng(), 0.55) * 1.7 * spread;
      pushStar(
        Math.cos(ang) * rad,
        Math.sin(ang) * rad,
        diskZ(rng, rad, 0.22),
        0.9 * scale,
      );
    }
  } else if (morph === "elliptical") {
    const q = 0.55 + rng() * 0.25;
    for (let i = 0; i < n; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = Math.pow(rng(), 0.72) * 1.2 * spread;
      pushStar(
        Math.cos(ang) * rad,
        Math.sin(ang) * rad * q,
        diskZ(rng, rad, 0.55),
        scale,
      );
    }
  } else if (morph === "irregular") {
    const clumps = 3 + Math.floor(rng() * 4);
    for (let c = 0; c < clumps; c++) {
      const cx = (rng() - 0.5) * 1.7 * spread;
      const cy = (rng() - 0.5) * 1.7 * spread;
      const local = Math.floor(n / clumps);
      for (let i = 0; i < local; i++) {
        const ang = rng() * Math.PI * 2;
        const rad = Math.pow(rng(), 0.5) * (0.28 + rng() * 0.28);
        pushStar(
          cx + Math.cos(ang) * rad,
          cy + Math.sin(ang) * rad,
          diskZ(rng, rad, 0.3),
          scale,
        );
      }
    }
  } else {
    const ours = isOurParams(params);
    const hydro = diskDossier(params, evaluation);
    const arms = ours ? 4 : hydro.niche === "fragmenting" ? 3 + Math.round(params.complexity * 2) : 2 + Math.round(params.complexity * 2);
    const wind = 2.6 + 18 / Math.max(hydro.pitchDeg, 6);
    const scatterHydro =
      hydro.niche === "fragmenting" ? scatter * 1.45 : hydro.niche === "hot" ? scatter * 1.15 : scatter;
    for (let i = 0; i < n; i++) {
      const arm = i % Math.max(arms, 1);
      const t = Math.pow(i / n, 0.7);
      const theta = t * wind + (arm * Math.PI * 2) / Math.max(arms, 1);
      const rad = (0.1 + t * 1.4) * spread;
      const jitter = (rng() - 0.5) * scatterHydro * (0.35 + t);
      const x = Math.cos(theta) * rad + Math.cos(theta + 0.22) * jitter;
      const y = Math.sin(theta) * rad * 0.78 + Math.sin(theta + 0.22) * jitter;
      pushStar(x, y, diskZ(rng, rad, 0.16), scale);
    }
    if (ours) {
      const bar = Math.floor(n * 0.12);
      for (let i = 0; i < bar; i++) {
        const x = (rng() - 0.5) * 0.58;
        const y = (rng() - 0.5) * 0.07;
        pushStar(x, y, diskZ(rng, Math.abs(x), 0.09), 1.08 * scale);
      }
    }
    const bulge = Math.floor(n * 0.22);
    for (let i = 0; i < bulge; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = Math.pow(rng(), 1.45) * 0.3;
      pushStar(
        Math.cos(ang) * rad,
        Math.sin(ang) * rad * 0.68,
        diskZ(rng, rad, 0.22),
        1.15 * scale,
      );
    }
  }
  return stars;
}

export function buildGalaxy(
  params: UniverseParams,
  evaluation: Evaluation,
  seed: number,
  quality = 1,
): GalaxyModel {
  const rng = mulberry32(seed);
  const ours = isOurParams(params);
  const n = Math.max(
    32,
    Math.floor((120 + params.matter * 560) * quality * (ours ? 1.7 : 1)),
  );
  const spread = 0.48 + params.expansion * 0.32;
  const scatter = 0.025 + params.quantumNoise * 0.38;
  const morph = evaluation.morphology;
  const birthSpan = Math.max(evaluation.stellarLifetimeGyr * 0.7, 0.4);
  const encounter = encounterOf(params, evaluation);

  const stars = fillMorphology(
    rng,
    params,
    evaluation,
    n,
    spread,
    scatter,
    1,
    birthSpan,
  );

  const companionN = Math.max(16, Math.floor(n * encounter.q * 0.85 * quality));
  const companion = fillMorphology(
    mulberry32(seed ^ 0x9e3779b9),
    params,
    { ...evaluation, morphology: morph === "elliptical" ? "spiral" : morph },
    companionN,
    spread * 0.62,
    scatter,
    0.85,
    birthSpan,
  );

  const field: Star[] = [];
  const fieldN = Math.max(48, Math.floor((160 + params.matter * 90) * quality));
  for (let i = 0; i < fieldN; i++) {
    const rad = 2.2 + rng() * 1.15;
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const sp = Math.sin(phi);
    field.push({
      x: rad * sp * Math.cos(theta),
      y: rad * sp * Math.sin(theta),
      z: rad * Math.cos(phi),
      r: rng() * 1.05 + 0.28,
      rgb: starTint(rng),
      a: 0.32 + rng() * 0.55,
      phase: rng() * Math.PI * 2,
      mass: 0.4,
      birthGyr: 0,
    });
  }

  const te = einsteinRadius(evaluation, params);
  const bgN = Math.max(18, Math.floor(36 * quality));
  const background: BackgroundGalaxy[] = [];
  for (let i = 0; i < bgN; i++) {
    const ang = rng() * Math.PI * 2;
    const aligned = rng() < 0.42;
    const rad = aligned ? 0.04 + rng() * te * 1.2 : te * 1.15 + rng() * 1.55;
    const spiral = rng() < evaluation.hubbleMix.spiral;
    background.push({
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad * 0.92,
      kind: spiral ? "spiral" : "elliptical",
      rx: 0.028 + rng() * 0.04,
      ry: 0.012 + rng() * 0.02,
      rot: rng() * Math.PI,
      rgb: spiral ? [150, 186, 255] : [255, 196, 140],
      a: 0.48 + rng() * 0.4,
    });
  }

  const nebulaPalette: [number, number, number][] = [
    [255, 120, 170],
    [110, 170, 255],
    [255, 186, 90],
    [160, 110, 255],
    [90, 230, 190],
  ];

  const hydro = diskDossier(params, evaluation);
  const dustCount =
    morph === "spiral"
      ? hydro.niche === "hot"
        ? 4
        : hydro.niche === "fragmenting"
          ? 14
          : 10
      : morph === "irregular"
        ? 6
        : 0;
  const dust = Array.from({ length: dustCount }, () => {
    const ang = rng() * Math.PI * 2;
    const rad = (0.18 + rng() * 0.95) * spread;
    return {
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad * 0.75,
      rx: 0.2 + rng() * 0.4,
      ry: 0.07 + rng() * 0.12,
      rot: ang + Math.PI / 2,
      a: 0.08 + params.matter * 0.08,
      rgb: nebulaPalette[Math.floor(rng() * nebulaPalette.length)],
    };
  });

  const clumpN =
    hydro.niche === "fragmenting"
      ? 8 + Math.floor(params.complexity * 4)
      : hydro.niche === "hot" || hydro.niche === "rigid"
        ? 2
        : morph === "scattered"
          ? 2
          : 4 + Math.floor(params.complexity * 3);
  const clumps = Array.from({ length: clumpN }, () => {
    const ang = rng() * Math.PI * 2;
    const rad = rng() * 0.75 * spread;
    return {
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad * 0.8,
      r: 0.22 + rng() * 0.46,
      a: 0.14 + evaluation.structure * 0.16,
      rgb: nebulaPalette[Math.floor(rng() * nebulaPalette.length)],
    };
  });

  const coreScale =
    morph === "scattered"
      ? 0.16
      : morph === "elliptical"
        ? clamp01(0.16 + hernquistScale(params, evaluation) * 2.4)
        : clamp01(0.2 + plummerScale(params, evaluation) * 5);
  const grmhd = grmhdDossier(params, evaluation);
  const jet = {
    power: grmhd.state === "mad" ? clamp01(0.14 + 0.2 * Math.min(grmhd.etaBz, 2.2)) : 0,
    flicker: grmhd.state === "mad" ? grmhd.flicker : 0,
    fill: grmhd.state === "mad" ? grmhd.fill : 1,
    pa: ((grmhd.aStar * 2.31 + params.quantumNoise * 1.67 + params.complexity) % Math.PI) - Math.PI / 2,
    fr: grmhd.fr,
  };
  const life = evaluation.lifeProb;
  const silicon = evaluation.siliconProb;
  const siliconish = Math.min(1, Math.max(0, (silicon - life + 0.08) / 0.45));
  const coreRgb: [number, number, number] = [
    Math.round(lerp(255, 255, 1 - life * 0.15 + siliconish * 0.05)),
    Math.round(lerp(196, 236, life) * (1 - siliconish * 0.22) + siliconish * 150),
    Math.round(lerp(140, 255, life * 0.7 + 0.2) * (1 - siliconish * 0.55)),
  ];

  return {
    stars,
    companion,
    dust,
    clumps,
    field,
    background,
    coreScale,
    coreRgb,
    rotation: (params.gravity * 0.1) / Math.max(spread, 0.3),
    haloRadius: NFW_RVIR * 0.72,
    jet,
    encounter,
    h0Long: persistLong(
      persistH0(stars.map((s) => [s.x, s.y])),
      0.18,
    ),
  };
}
