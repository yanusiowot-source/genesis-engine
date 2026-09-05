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

export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const t = Math.max(0, Math.min(1, q)) * (s.length - 1);
  const lo = Math.floor(t);
  const hi = Math.ceil(t);
  if (lo === hi) return s[lo]!;
  return s[lo]! * (1 - (t - lo)) + s[hi]! * (t - lo);
}

/** Split-R̂ from two halves of one chain. Near 1 means the walk mixed. */
export function splitRhat(xs: number[]): number {
  const n = xs.length;
  if (n < 16) return 1;
  const m = Math.floor(n / 2);
  const a = xs.slice(0, m);
  const b = xs.slice(n - m);
  const mean = (arr: number[]) => arr.reduce((s, x) => s + x, 0) / arr.length;
  const ma = mean(a);
  const mb = mean(b);
  const grand = (ma + mb) / 2;
  const varSample = (arr: number[], mu: number) => {
    let v = 0;
    for (const x of arr) v += (x - mu) ** 2;
    return v / Math.max(arr.length - 1, 1);
  };
  const W = (varSample(a, ma) + varSample(b, mb)) / 2;
  if (W < 1e-18) return 1;
  const B = m * ((ma - grand) ** 2 + (mb - grand) ** 2);
  const varHat = ((m - 1) / m) * W + B / m;
  return Math.sqrt(Math.max(varHat / W, 1));
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 8) return 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i]!;
    sy += ys[i]!;
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den < 1e-18 ? 0 : num / den;
}

const MARGINAL_BINS = 24;

export type Marginal = {
  key: ParamKey;
  bins: number[];
  q16: number;
  q50: number;
  q84: number;
  mean: number;
  map: number;
  ess: number;
  here?: number;
  hereValue?: number;
};

export type PosteriorAnalysis = {
  marginals: Marginal[];
  rhat: number;
  tau: number;
  viableCarbon: number;
  viableSilicon: number;
  viableEternal: number;
  pairing: { a: ParamKey; b: ParamKey; r: number } | null;
  logL: number[];
};

/**
 * Reading of a finished chain. Quantiles, split-R̂, corridor mass —
 * all on evaluate()'s score. Not a claim about nature.
 */
export function analyzePosterior(
  result: McmcResult,
  here?: UniverseParams,
): PosteriorAnalysis {
  const n = result.samples.length || 1;
  const rhats: number[] = [];
  const marginals: Marginal[] = KEYS.map((key) => {
    const meta = metaOf(key);
    const xs = result.samples.map((s) => s.params[key]);
    rhats.push(splitRhat(xs));
    const span = meta.max - meta.min || 1;
    const bins = new Array<number>(MARGINAL_BINS).fill(0);
    for (const x of xs) {
      let i = Math.floor(((x - meta.min) / span) * MARGINAL_BINS);
      if (i < 0) i = 0;
      if (i >= MARGINAL_BINS) i = MARGINAL_BINS - 1;
      bins[i] += 1;
    }
    const peak = Math.max(...bins, 1);
    let pct: number | undefined;
    let hereValue: number | undefined;
    if (here) {
      const v = here[key];
      hereValue = v;
      let below = 0;
      for (const x of xs) if (x <= v) below += 1;
      pct = below / n;
    }
    return {
      key,
      bins: bins.map((c) => c / peak),
      q16: quantile(xs, 0.16),
      q50: quantile(xs, 0.5),
      q84: quantile(xs, 0.84),
      mean: result.mean[key],
      map: result.map.params[key],
      ess: essOf(xs),
      here: pct,
      hereValue,
    };
  });

  let viableCarbon = 0;
  let viableSilicon = 0;
  let viableEternal = 0;
  for (const s of result.samples) {
    const ev = evaluate(s.params);
    if (ev.lifeProb >= 0.18) viableCarbon += 1;
    if (ev.siliconProb >= 0.18) viableSilicon += 1;
    if (ev.eternalProb >= 0.18) viableEternal += 1;
  }

  let pairing: PosteriorAnalysis["pairing"] = null;
  for (let i = 0; i < KEYS.length; i++) {
    for (let j = i + 1; j < KEYS.length; j++) {
      const a = KEYS[i]!;
      const b = KEYS[j]!;
      const r = pearson(
        result.samples.map((s) => s.params[a]),
        result.samples.map((s) => s.params[b]),
      );
      if (!pairing || Math.abs(r) > Math.abs(pairing.r)) pairing = { a, b, r };
    }
  }
  if (pairing && Math.abs(pairing.r) < 0.18) pairing = null;

  const step = Math.max(1, Math.floor(result.samples.length / 80));
  const logL: number[] = [];
  for (let i = 0; i < result.samples.length; i += step) {
    logL.push(result.samples[i]!.logL);
  }

  return {
    marginals,
    rhat: Math.max(1, ...rhats),
    tau: n / Math.max(result.ess, 1),
    viableCarbon: viableCarbon / n,
    viableSilicon: viableSilicon / n,
    viableEternal: viableEternal / n,
    pairing,
    logL,
  };
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
