import { sampleMass } from "./observatory.ts";
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

export function adaptiveQuality(): { scale: number; dprCap: number } {
  if (typeof navigator === "undefined") return { scale: 1, dprCap: 2 };
  const cores = navigator.hardwareConcurrency || 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  let scale = 1;
  if (mobile) scale *= 0.55;
  if (cores <= 4) scale *= 0.75;
  if (memory <= 4) scale *= 0.8;
  return { scale: Math.max(0.28, Math.min(1, scale)), dprCap: mobile ? 1.25 : 2 };
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
      mass: sampleMass(rng),
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
    const arms = ours ? 4 : 2 + Math.round(params.complexity * 3);
    const pitch = 0.2 + (1.15 - params.gravity) * 0.12;
    for (let i = 0; i < n; i++) {
      const arm = i % arms;
      const t = Math.pow(i / n, 0.7);
      const theta = t * 5.1 + (arm * Math.PI * 2) / arms;
      const rad = (0.1 + t * 1.4) * spread;
      const jitter = (rng() - 0.5) * scatter * (0.35 + t);
      const x = Math.cos(theta) * rad + Math.cos(theta + pitch) * jitter;
      const y = Math.sin(theta) * rad * 0.78 + Math.sin(theta + pitch) * jitter;
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
  const n = Math.max(36, Math.floor((140 + params.matter * 680) * quality));
  const spread = 0.48 + params.expansion * 0.32;
  const scatter = 0.025 + params.quantumNoise * 0.38;
  const morph = evaluation.morphology;
  const birthSpan = Math.max(evaluation.stellarLifetimeGyr * 0.7, 0.4);

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

  const companionN = Math.max(24, Math.floor(n * 0.38 * quality));
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

  const bgN = Math.max(10, Math.floor(16 * quality));
  const background: BackgroundGalaxy[] = [];
  for (let i = 0; i < bgN; i++) {
    const ang = rng() * Math.PI * 2;
    const rad = 1.35 + rng() * 1.15;
    const spiral = rng() < evaluation.hubbleMix.spiral;
    background.push({
      x: Math.cos(ang) * rad,
      y: Math.sin(ang) * rad * 0.82,
      kind: spiral ? "spiral" : "elliptical",
      rx: 0.035 + rng() * 0.05,
      ry: 0.018 + rng() * 0.028,
      rot: rng() * Math.PI,
      rgb: spiral ? [150, 186, 255] : [255, 196, 140],
      a: 0.42 + rng() * 0.4,
    });
  }

  const nebulaPalette: [number, number, number][] = [
    [255, 120, 170],
    [110, 170, 255],
    [255, 186, 90],
    [160, 110, 255],
    [90, 230, 190],
  ];

  const dustCount = morph === "spiral" ? 10 : morph === "irregular" ? 6 : 0;
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

  const clumpN = morph === "scattered" ? 2 : 4 + Math.floor(params.complexity * 3);
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

  const coreScale = morph === "elliptical" ? 0.62 : morph === "scattered" ? 0.18 : 0.4;
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
    haloRadius: 0.55 + evaluation.darkMatterFraction * 0.45,
  };
}
