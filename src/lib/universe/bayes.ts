import type { ParamKey, UniverseParams } from "./types";
import { mulberry32 } from "./rng.ts";
import {
  evaluate,
  nearGoldilocks,
  nearSilicon,
  randomParams,
} from "./physics.ts";
import { scoreOf, type ResearchTarget } from "./research.ts";

export type HypothesisDir = "lt" | "gt";

export type Hypothesis = {
  key: ParamKey;
  dir: HypothesisDir;
  threshold: number;
  target: ResearchTarget;
  viableAt: number;
};

export type BayesResult = {
  hypothesis: Hypothesis;
  n: number;
  nCond: number;
  kCond: number;
  nNot: number;
  kNot: number;
  pCond: number;
  pNot: number;
  pCondLo: number;
  pCondHi: number;
  pNotLo: number;
  pNotHi: number;
  delta: number;
  pGreater: number;
  logBf10: number;
  bf10: number;
  prior: number;
};

function lgamma(z: number): number {
  if (z <= 0) return Number.POSITIVE_INFINITY;
  const g = 7;
  const c = [
    "0.99999999999980993",
    "676.5203681218851",
    "-1259.1392167224028",
    "771.32342877765313",
    "-176.61502916214059",
    "12.507343278686905",
    "-0.13857109526572012",
    "9.984369654078596e-6",
    "1.5056327351493116e-7",
  ].map(Number);
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  }
  const x = z - 1;
  let a = c[0]!;
  for (let i = 1; i < g + 2; i++) a += c[i]! / (x + i);
  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function logBeta(a: number, b: number): number {
  return lgamma(a) + lgamma(b) - lgamma(a + b);
}

/** Inverse of regularized incomplete beta via bisection — for equal-tail CI. */
function betaQuantile(p: number, a: number, b: number): number {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i++) {
    const mid = 0.5 * (lo + hi);
    if (betaCdf(mid, a, b) < p) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return regularizedBeta(x, a, b);
}

function regularizedBeta(x: number, a: number, b: number): number {
  const bt =
    Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta(a, b));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

function betacf(x: number, a: number, b: number): number {
  const maxIt = 120;
  const eps = 3e-8;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIt; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
}

function randn(rng: () => number): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Marsaglia for Gamma(a,1), then Beta via two gammas. */
function randGamma(rng: () => number, a: number): number {
  if (a < 1) {
    return randGamma(rng, a + 1) * Math.pow(rng(), 1 / a);
  }
  const d = a - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const x = randn(rng);
    let v = 1 + c * x;
    if (v <= 0) continue;
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function randBeta(rng: () => number, a: number, b: number): number {
  const x = randGamma(rng, a);
  const y = randGamma(rng, b);
  return x / (x + y);
}

function matches(params: UniverseParams, h: Hypothesis): boolean {
  const v = params[h.key];
  return h.dir === "lt" ? v < h.threshold : v > h.threshold;
}

function drawParams(rng: () => number): UniverseParams {
  const roll = rng();
  if (roll < 0.4) return randomParams(rng);
  if (roll < 0.75) return nearGoldilocks(rng);
  return nearSilicon(rng);
}

function viable(params: UniverseParams, h: Hypothesis): boolean {
  return scoreOf(evaluate(params), h.target) >= h.viableAt;
}

/**
 * Conjugate Beta-Binomial test of a threshold hypothesis.
 * M0: one shared viable-rate. M1: two independent rates (condition vs not).
 */
export function testHypothesis(seed: number, hypothesis: Hypothesis, n = 360): BayesResult {
  const rng = mulberry32(seed);
  let nCond = 0;
  let kCond = 0;
  let nNot = 0;
  let kNot = 0;
  for (let i = 0; i < n; i++) {
    const p = drawParams(rng);
    const on = matches(p, hypothesis);
    const ok = viable(p, hypothesis);
    if (on) {
      nCond += 1;
      if (ok) kCond += 1;
    } else {
      nNot += 1;
      if (ok) kNot += 1;
    }
  }

  const a1 = 1 + kCond;
  const b1 = 1 + nCond - kCond;
  const a0 = 1 + kNot;
  const b0 = 1 + nNot - kNot;
  const pCond = a1 / (a1 + b1);
  const pNot = a0 / (a0 + b0);

  const logM1 = -logBeta(1, 1) + logBeta(a1, b1) - logBeta(1, 1) + logBeta(a0, b0);
  const logM0 =
    -logBeta(1, 1) + logBeta(1 + kCond + kNot, 1 + nCond + nNot - kCond - kNot);
  const logBf10 = logM1 - logM0;
  const bf10 = Math.exp(clampLog(logBf10));

  const mc = mulberry32(seed ^ 0x51ed);
  let greater = 0;
  const draws = 4000;
  for (let i = 0; i < draws; i++) {
    const p1 = randBeta(mc, a1, b1);
    const p0 = randBeta(mc, a0, b0);
    if (p1 > p0) greater += 1;
  }

  return {
    hypothesis,
    n,
    nCond,
    kCond,
    nNot,
    kNot,
    pCond,
    pNot,
    pCondLo: betaQuantile(0.025, a1, b1),
    pCondHi: betaQuantile(0.975, a1, b1),
    pNotLo: betaQuantile(0.025, a0, b0),
    pNotHi: betaQuantile(0.975, a0, b0),
    delta: pCond - pNot,
    pGreater: greater / draws,
    logBf10,
    bf10,
    prior: 0.5,
  };
}

function clampLog(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 40 : -40;
  return Math.max(-40, Math.min(40, x));
}

export function defaultHypothesis(): Hypothesis {
  return {
    key: "quantumNoise",
    dir: "lt",
    threshold: 0.2,
    target: "carbon",
    viableAt: 0.18,
  };
}

export function bfLabel(bf: number): "strong" | "moderate" | "weak" | "none" {
  if (bf >= 10) return "strong";
  if (bf >= 3) return "moderate";
  if (bf >= 1.5) return "weak";
  return "none";
}

export function formatBf(bf: number): string {
  if (!Number.isFinite(bf) || bf > 1e12) return "≫ 10³";
  if (bf >= 1000) return `10^{${Math.log10(bf).toFixed(1)}}`;
  if (bf >= 10) return bf.toFixed(1);
  return bf.toFixed(2);
}
