import type { UniverseParams } from "./types";
import { clamp, lerp, mulberry32 } from "./rng.ts";
import { teffToRgb } from "./observatory.ts";

export type SpectralType = "O" | "B" | "A" | "F" | "G" | "K" | "M";
export type CitizenKind = "spectrum" | "transit";

export const SPECTRAL_TYPES: SpectralType[] = ["O", "B", "A", "F", "G", "K", "M"];

export type SpectrumTask = {
  kind: "spectrum";
  seed: number;
  type: SpectralType;
  teff: number;
  bins: number[];
  rgb: [number, number, number];
};

export type TransitTask = {
  kind: "transit";
  seed: number;
  hasTransit: boolean;
  depth: number;
  mid: number;
  width: number;
  samples: number[];
};

export type CitizenScore = {
  spectrumTried: number;
  spectrumOk: number;
  transitTried: number;
  transitOk: number;
};

const SCORE_KEY = "genesis-engine-citizen-v1";

const TYPE_TEFF: Record<SpectralType, [number, number]> = {
  O: [30000, 42000],
  B: [10000, 28000],
  A: [7600, 9800],
  F: [6000, 7400],
  G: [5200, 5900],
  K: [3700, 5100],
  M: [2600, 3600],
};

export function typeFromTeff(teff: number): SpectralType {
  if (teff >= 30000) return "O";
  if (teff >= 10000) return "B";
  if (teff >= 7500) return "A";
  if (teff >= 6000) return "F";
  if (teff >= 5200) return "G";
  if (teff >= 3700) return "K";
  return "M";
}

/** Planck function in relative units, λ in nm. */
function blackbody(lambdaNm: number, teff: number): number {
  const x = 1.4388e7 / (lambdaNm * Math.max(teff, 800));
  if (x > 20) return 0;
  const denom = Math.exp(x) - 1;
  if (denom <= 0) return 0;
  return 1 / (Math.pow(lambdaNm, 5) * denom);
}

function lineDip(lambda: number, center: number, width: number, depth: number): number {
  const z = (lambda - center) / width;
  return 1 - depth * Math.exp(-0.5 * z * z);
}

export function makeSpectrumTask(seed: number, params: UniverseParams): SpectrumTask {
  const rng = mulberry32(seed);
  const type = SPECTRAL_TYPES[Math.floor(rng() * SPECTRAL_TYPES.length)]!;
  const [lo, hi] = TYPE_TEFF[type];
  const teff = lerp(lo, hi, rng());
  const bins: number[] = [];
  const n = 28;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const lambda = 390 + (i / (n - 1)) * 360;
    let flux = blackbody(lambda, teff);
    if (type === "O" || type === "B") {
      flux *= lineDip(lambda, 447, 6, 0.18);
      flux *= lineDip(lambda, 587, 5, 0.12);
    }
    if (type === "A" || type === "F") {
      flux *= lineDip(lambda, 434, 5, 0.35);
      flux *= lineDip(lambda, 486, 6, 0.42);
      flux *= lineDip(lambda, 656, 7, 0.38);
    }
    if (type === "G" || type === "K") {
      flux *= lineDip(lambda, 517, 8, 0.22);
      flux *= lineDip(lambda, 589, 5, 0.18);
      flux *= lineDip(lambda, 656, 6, 0.16);
    }
    if (type === "M") {
      flux *= lineDip(lambda, 495, 18, 0.28);
      flux *= lineDip(lambda, 620, 22, 0.32);
      flux *= lineDip(lambda, 710, 16, 0.24);
    }
    flux *= 0.92 + rng() * (0.06 + params.quantumNoise * 0.08);
    bins.push(flux);
    if (flux > peak) peak = flux;
  }
  const norm = bins.map((v) => (peak > 0 ? v / peak : 0));
  return {
    kind: "spectrum",
    seed,
    type,
    teff: Math.round(teff),
    bins: norm,
    rgb: teffToRgb(teff),
  };
}

export function makeTransitTask(seed: number, params: UniverseParams): TransitTask {
  const rng = mulberry32(seed);
  const n = 72;
  const hasTransit = rng() > 0.38;
  const depth = hasTransit ? lerp(0.006, 0.035, rng()) * (0.7 + 0.5 * params.matter) : 0;
  const width = Math.round(lerp(5, 12, rng()));
  const mid = Math.round(lerp(18, n - 18, rng()));
  const noise = 0.0018 + params.quantumNoise * 0.004;
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    let flux = 1;
    if (hasTransit) {
      const d = Math.abs(i - mid);
      if (d < width / 2) flux -= depth;
      else if (d < width / 2 + 2) flux -= depth * (1 - (d - width / 2) / 2);
    }
    flux += (rng() - 0.5) * 2 * noise;
    samples.push(clamp(flux, 0.92, 1.04));
  }
  return { kind: "transit", seed, hasTransit, depth, mid, width, samples };
}

export function emptyScore(): CitizenScore {
  return { spectrumTried: 0, spectrumOk: 0, transitTried: 0, transitOk: 0 };
}

export function loadCitizenScore(): CitizenScore {
  if (typeof window === "undefined") return emptyScore();
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    if (!raw) return emptyScore();
    const parsed = JSON.parse(raw) as Partial<CitizenScore>;
    return {
      spectrumTried: Number(parsed.spectrumTried) || 0,
      spectrumOk: Number(parsed.spectrumOk) || 0,
      transitTried: Number(parsed.transitTried) || 0,
      transitOk: Number(parsed.transitOk) || 0,
    };
  } catch {
    return emptyScore();
  }
}

export function saveCitizenScore(score: CitizenScore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SCORE_KEY, JSON.stringify(score));
  } catch {
    /* quota */
  }
}

export function gradeSpectrum(
  score: CitizenScore,
  task: SpectrumTask,
  guess: SpectralType,
): { ok: boolean; next: CitizenScore } {
  const ok = guess === task.type;
  const next = {
    ...score,
    spectrumTried: score.spectrumTried + 1,
    spectrumOk: score.spectrumOk + (ok ? 1 : 0),
  };
  saveCitizenScore(next);
  return { ok, next };
}

export function gradeTransit(
  score: CitizenScore,
  task: TransitTask,
  guess: boolean,
): { ok: boolean; next: CitizenScore } {
  const ok = guess === task.hasTransit;
  const next = {
    ...score,
    transitTried: score.transitTried + 1,
    transitOk: score.transitOk + (ok ? 1 : 0),
  };
  saveCitizenScore(next);
  return { ok, next };
}

export function binColor(index: number, n: number): string {
  const t = n <= 1 ? 0 : index / (n - 1);
  const hue = lerp(265, 8, t);
  return `hsl(${hue} 42% 58%)`;
}
