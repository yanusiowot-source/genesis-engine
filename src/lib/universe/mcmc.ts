import { mulberry32 } from "./rng.ts";
import { PARAM_META, evaluate, snapParams } from "./physics.ts";
import { scoreOf, type ResearchTarget } from "./research.ts";
import type { ParamKey, UniverseParams } from "./types.ts";

export type McmcSample = {
  params: UniverseParams;
  logL: number;
  score: number;
};

export type McmcResult = {
  seed: number;
  target: ResearchTarget;
  nSteps: number;
  burnIn: number;
  thin: number;
  acceptRate: number;
  samples: McmcSample[];
  mean: UniverseParams;
  map: McmcSample;
  ess: number;
  logLMin: number;
  logLMax: number;
  prior: "uniform";
};

const KEYS: ParamKey[] = PARAM_META.map((m) => m.key);

function metaOf(key: ParamKey) {
  return PARAM_META.find((m) => m.key === key)!;
}

function reflect(v: number, lo: number, hi: number): number {
  const span = hi - lo;
  if (span <= 0) return lo;
  let x = v;
  for (let i = 0; i < 8; i++) {
    if (x < lo) x = lo + (lo - x);
    else if (x > hi) x = hi - (x - hi);
    else return x;
  }
  return Math.min(hi, Math.max(lo, x));
}

function randn(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function logLike(params: UniverseParams, target: ResearchTarget): { logL: number; score: number } {
  const score = scoreOf(evaluate(snapParams(params)), target);
  return { score, logL: Math.log(score + 1e-8) };
}

function copyParams(p: UniverseParams): UniverseParams {
  return {
    gravity: p.gravity,
    expansion: p.expansion,
    darkEnergy: p.darkEnergy,
    matter: p.matter,
    complexity: p.complexity,
    quantumNoise: p.quantumNoise,
  };
}

function meanParams(samples: McmcSample[]): UniverseParams {
  const acc = copyParams({
    gravity: 0,
    expansion: 0,
    darkEnergy: 0,
    matter: 0,
    complexity: 0,
    quantumNoise: 0,
  });
  const n = samples.length || 1;
  for (const s of samples) {
    for (const k of KEYS) acc[k] += s.params[k];
  }
  for (const k of KEYS) acc[k] /= n;
  return acc;
}

/** Integrated autocorrelation time on a 1-D chain; ESS = n / τ. */
export function essOf(xs: number[]): number {
  const n = xs.length;
  if (n < 8) return n;
  let mean = 0;
  for (const x of xs) mean += x;
  mean /= n;
  let var0 = 0;
  for (const x of xs) var0 += (x - mean) ** 2;
  var0 /= n;
  if (var0 < 1e-18) return n;
  let tau = 1;
  const cap = Math.min(Math.floor(n / 3), 160);
  for (let lag = 1; lag < cap; lag++) {
    let c = 0;
    const m = n - lag;
    for (let i = 0; i < m; i++) c += (xs[i]! - mean) * (xs[i + lag]! - mean);
    const rho = c / (m * var0);
    if (rho < 0.05) break;
    tau += 2 * rho;
  }
  return n / Math.max(tau, 1);
}

/**
 * Metropolis–Hastings with a uniform prior on the six knobs.
 * Likelihood is evaluate()'s score for the chosen target — closed form, no net.
 * Proposal is a reflecting Gaussian walk; scale adapts only during burn-in.
 */
export function runMcmc(
  seed: number,
  start: UniverseParams,
  target: ResearchTarget,
  nSteps = 3200,
  burnIn = 640,
  thin = 4,
): McmcResult {
  const rng = mulberry32(seed);
  const scale0: Record<ParamKey, number> = {
    gravity: 0.06,
    expansion: 0.05,
    darkEnergy: 0.04,
    matter: 0.05,
    complexity: 0.05,
    quantumNoise: 0.02,
  };
  let scale = 1;
  let current = copyParams(start);
  let cur = logLike(current, target);
  let accepted = 0;
  let recent = 0;
  const samples: McmcSample[] = [];
  let map: McmcSample = { params: copyParams(current), logL: cur.logL, score: cur.score };
  let logLMin = cur.logL;
  let logLMax = cur.logL;

  for (let i = 0; i < nSteps; i++) {
    const prop = copyParams(current);
    for (const k of KEYS) {
      const m = metaOf(k);
      prop[k] = reflect(prop[k] + randn(rng) * scale0[k] * scale, m.min, m.max);
    }
    const next = logLike(prop, target);
    const logA = next.logL - cur.logL;
    if (logA >= 0 || Math.log(rng()) < logA) {
      current = prop;
      cur = next;
      accepted += 1;
      recent += 1;
      if (cur.logL > map.logL) {
        map = { params: copyParams(current), logL: cur.logL, score: cur.score };
      }
    }
    if (i < burnIn && (i + 1) % 80 === 0) {
      const rate = recent / 80;
      if (rate > 0.45) scale *= 1.12;
      else if (rate < 0.18) scale *= 0.82;
      scale = Math.min(2.4, Math.max(0.35, scale));
      recent = 0;
    }
    if (i >= burnIn && (i - burnIn) % thin === 0) {
      const row: McmcSample = {
        params: copyParams(current),
        logL: cur.logL,
        score: cur.score,
      };
      samples.push(row);
      if (row.logL < logLMin) logLMin = row.logL;
      if (row.logL > logLMax) logLMax = row.logL;
    }
  }

  return {
    seed,
    target,
    nSteps,
    burnIn,
    thin,
    acceptRate: accepted / nSteps,
    samples,
    mean: meanParams(samples),
    map,
    ess: essOf(samples.map((s) => s.score)),
    logLMin,
    logLMax,
    prior: "uniform",
  };
}
