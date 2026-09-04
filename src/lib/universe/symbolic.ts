import type { ParamKey, UniverseParams } from "./types";
import { clamp, mulberry32 } from "./rng.ts";
import {
  PARAM_META,
  evaluate,
  nearEternal,
  nearGoldilocks,
  nearSilicon,
  randomParams,
} from "./physics.ts";
import { scoreOf, type ResearchTarget } from "./research.ts";

export const SYM: Record<ParamKey, string> = {
  gravity: "G",
  expansion: "H",
  darkEnergy: "Λ",
  matter: "Ωm",
  complexity: "σ",
  quantumNoise: "δ",
};

export type Expr =
  | { t: "c"; v: number }
  | { t: "v"; k: ParamKey }
  | { t: "b"; op: "+" | "-" | "*" | "/"; a: Expr; b: Expr }
  | { t: "g"; k: ParamKey; mu: number; sig: number }
  | { t: "s"; a: Expr }
  | { t: "pow"; a: Expr; e: number };

export type FittedLaw = {
  method: "dictionary" | "gp";
  formula: string;
  r2Train: number;
  r2Test: number;
  aic: number;
  complexity: number;
  expr: Expr;
  nTrain: number;
  nTest: number;
  target: ResearchTarget;
};

export type DiscoveryResult = {
  seed: number;
  target: ResearchTarget;
  best: FittedLaw;
  dictionary: FittedLaw;
  gp: FittedLaw;
};

const KEYS: ParamKey[] = PARAM_META.map((m) => m.key);
const MAX_DEPTH = 7;

function gauss(x: number, mu: number, sig: number): number {
  const s = Math.max(sig, 0.04);
  const z = (x - mu) / s;
  return Math.exp(-0.5 * z * z);
}

function sigmoid(x: number): number {
  if (x > 20) return 1;
  if (x < -20) return 0;
  return 1 / (1 + Math.exp(-x));
}

export function evalExpr(expr: Expr, p: UniverseParams): number {
  switch (expr.t) {
    case "c":
      return expr.v;
    case "v":
      return p[expr.k];
    case "g":
      return gauss(p[expr.k], expr.mu, expr.sig);
    case "s":
      return sigmoid(evalExpr(expr.a, p));
    case "pow": {
      const base = evalExpr(expr.a, p);
      const abs = Math.abs(base) < 1e-8 ? 1e-8 : Math.abs(base);
      return Math.pow(abs, expr.e);
    }
    case "b": {
      const a = evalExpr(expr.a, p);
      const b = evalExpr(expr.b, p);
      if (expr.op === "+") return a + b;
      if (expr.op === "-") return a - b;
      if (expr.op === "*") return a * b;
      return a / (Math.abs(b) < 1e-8 ? 1e-8 : b);
    }
  }
}

export function complexityOf(expr: Expr): number {
  if (expr.t === "c" || expr.t === "v" || expr.t === "g") return 1;
  if (expr.t === "s" || expr.t === "pow") return 1 + complexityOf(expr.a);
  return 1 + complexityOf(expr.a) + complexityOf(expr.b);
}

export function depthOf(expr: Expr): number {
  if (expr.t === "s" || expr.t === "pow") return 1 + depthOf(expr.a);
  if (expr.t !== "b") return 1;
  return 1 + Math.max(depthOf(expr.a), depthOf(expr.b));
}

function fmtNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const a = Math.abs(n);
  if (a >= 10) return n.toFixed(1);
  if (a >= 1) return n.toFixed(2);
  return n.toFixed(3);
}

export function formatExpr(expr: Expr): string {
  switch (expr.t) {
    case "c":
      return fmtNum(expr.v);
    case "v":
      return SYM[expr.k];
    case "g":
      return `N(${SYM[expr.k]};${fmtNum(expr.mu)},${fmtNum(expr.sig)})`;
    case "s":
      return `sig(${formatExpr(expr.a)})`;
    case "pow":
      return `${wrap(expr.a)}^{${fmtNum(expr.e)}}`;
    case "b": {
      const a = formatExpr(expr.a);
      const b = formatExpr(expr.b);
      if (expr.op === "*") return `${wrap(expr.a)}·${wrap(expr.b)}`;
      return `(${a} ${expr.op} ${b})`;
    }
  }
}

function wrap(expr: Expr): string {
  if (expr.t === "b") return `(${formatExpr(expr)})`;
  return formatExpr(expr);
}

function r2Of(y: number[], yhat: number[]): number {
  const n = y.length;
  if (n < 4) return 0;
  let mean = 0;
  for (const v of y) mean += v;
  mean /= n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const d = y[i]! - mean;
    ssTot += d * d;
    const e = y[i]! - yhat[i]!;
    ssRes += e * e;
  }
  if (ssTot < 1e-12) return 0;
  return 1 - ssRes / ssTot;
}

function mseOf(y: number[], yhat: number[]): number {
  let s = 0;
  for (let i = 0; i < y.length; i++) {
    const e = y[i]! - yhat[i]!;
    s += e * e;
  }
  return s / Math.max(y.length, 1);
}

function aicOf(n: number, mse: number, k: number): number {
  const m = Math.max(mse, 1e-12);
  return n * Math.log(m) + 2 * k;
}

function solveRidge(XtX: number[][], Xty: number[], lambda: number): number[] {
  const p = Xty.length;
  const A = XtX.map((row, i) =>
    row.map((v, j) => (i === j ? v + lambda : v)),
  );
  const b = Xty.slice();
  for (let i = 0; i < p; i++) {
    let piv = i;
    for (let r = i + 1; r < p; r++) {
      if (Math.abs(A[r]![i]!) > Math.abs(A[piv]![i]!)) piv = r;
    }
    const tmpA = A[i]!;
    A[i] = A[piv]!;
    A[piv] = tmpA;
    const tmpB = b[i]!;
    b[i] = b[piv]!;
    b[piv] = tmpB;
    const diag = A[i]![i]!;
    if (Math.abs(diag) < 1e-12) continue;
    for (let r = i + 1; r < p; r++) {
      const f = A[r]![i]! / diag;
      for (let c = i; c < p; c++) A[r]![c]! -= f * A[i]![c]!;
      b[r]! -= f * b[i]!;
    }
  }
  const x = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    let s = b[i]!;
    for (let c = i + 1; c < p; c++) s -= A[i]![c]! * x[c]!;
    const diag = A[i]![i]!;
    x[i] = Math.abs(diag) < 1e-12 ? 0 : s / diag;
  }
  return x;
}

type Sample = { params: UniverseParams; y: number };

function drawSample(rng: () => number, target: ResearchTarget): Sample {
  const roll = rng();
  const params =
    roll < 0.34
      ? randomParams(rng)
      : roll < 0.58
        ? nearGoldilocks(rng)
        : roll < 0.8
          ? nearSilicon(rng)
          : nearEternal(rng);
  return { params, y: scoreOf(evaluate(params), target) };
}

type Basis = { name: string; expr: Expr; fn: (p: UniverseParams) => number };

function gExpr(k: ParamKey, mu: number, sig: number): Expr {
  return { t: "g", k, mu, sig };
}

function mulExprs(terms: Expr[]): Expr {
  return terms.reduce((a, b) => ({ t: "b", op: "*", a, b }));
}

function mulG(terms: { k: ParamKey; mu: number; sig: number }[]): Expr {
  return mulExprs(terms.map((g) => gExpr(g.k, g.mu, g.sig)));
}

/** sig(scale · (x − mu)) — same hinge evaluate() uses for recollapse / runaway. */
function sigLin(k: ParamKey, mu: number, scale: number): Expr {
  return {
    t: "s",
    a: {
      t: "b",
      op: "*",
      a: { t: "b", op: "-", a: { t: "v", k }, b: { t: "c", v: mu } },
      b: { t: "c", v: scale },
    },
  };
}

function oneMinus(expr: Expr, w = 1): Expr {
  return {
    t: "b",
    op: "-",
    a: { t: "c", v: 1 },
    b: w === 1 ? expr : { t: "b", op: "*", a: { t: "c", v: w }, b: expr },
  };
}

function dictionary(): Basis[] {
  const out: Basis[] = [{ name: "1", expr: { t: "c", v: 1 }, fn: () => 1 }];
  const grids: Record<ParamKey, { mu: number; sig: number }[]> = {
    gravity: [
      { mu: 1.0, sig: 0.33 },
      { mu: 1.52, sig: 0.3 },
      { mu: 0.7, sig: 0.4 },
    ],
    expansion: [
      { mu: 0.96, sig: 0.38 },
      { mu: 1.5, sig: 0.35 },
    ],
    darkEnergy: [
      { mu: 0.68, sig: 0.26 },
      { mu: 0.9, sig: 0.22 },
    ],
    matter: [
      { mu: 0.34, sig: 0.32 },
      { mu: 0.52, sig: 0.36 },
    ],
    complexity: [
      { mu: 0.38, sig: 0.26 },
      { mu: 0.15, sig: 0.2 },
    ],
    quantumNoise: [
      { mu: 0.11, sig: 0.1 },
      { mu: 0.21, sig: 0.12 },
    ],
  };
  for (const key of KEYS) {
    for (const g of grids[key]) {
      const expr: Expr = gExpr(key, g.mu, g.sig);
      out.push({
        name: formatExpr(expr),
        expr,
        fn: (p) => gauss(p[key], g.mu, g.sig),
      });
    }
  }

  const recollapse = mulExprs([
    sigLin("matter", 0.85, 4.2),
    sigLin("darkEnergy", 0.32, -6),
    sigLin("expansion", 0.72, -5),
  ]);
  const runaway = mulExprs([
    sigLin("expansion", 1.45, 5),
    sigLin("darkEnergy", 0.78, 6),
  ]);
  const products: Expr[] = [
    mulG([
      { k: "gravity", mu: 1.0, sig: 0.33 },
      { k: "matter", mu: 0.34, sig: 0.32 },
      { k: "expansion", mu: 0.96, sig: 0.38 },
    ]),
    mulG([
      { k: "quantumNoise", mu: 0.11, sig: 0.1 },
      { k: "complexity", mu: 0.38, sig: 0.26 },
      { k: "darkEnergy", mu: 0.68, sig: 0.26 },
    ]),
    mulG([
      { k: "gravity", mu: 1.52, sig: 0.3 },
      { k: "matter", mu: 0.52, sig: 0.36 },
      { k: "quantumNoise", mu: 0.21, sig: 0.12 },
    ]),
    mulG([
      { k: "gravity", mu: 1.0, sig: 0.33 },
      { k: "matter", mu: 0.34, sig: 0.32 },
      { k: "expansion", mu: 0.96, sig: 0.38 },
      { k: "quantumNoise", mu: 0.11, sig: 0.1 },
      { k: "complexity", mu: 0.38, sig: 0.26 },
      { k: "darkEnergy", mu: 0.68, sig: 0.26 },
    ]),
    recollapse,
    runaway,
    oneMinus(recollapse),
    oneMinus(runaway),
    sigLin("gravity", 1.55, -4.2),
    { t: "pow", a: { t: "v", k: "gravity" }, e: -2.15 },
    {
      t: "s",
      a: {
        t: "b",
        op: "*",
        a: {
          t: "b",
          op: "-",
          a: { t: "b", op: "*", a: { t: "c", v: 10 }, b: { t: "pow", a: { t: "v", k: "gravity" }, e: -2.15 } },
          b: { t: "c", v: 4.6 },
        },
        b: { t: "c", v: 0.4 },
      },
    },
  ];
  for (const expr of products) {
    out.push({
      name: formatExpr(expr),
      expr,
      fn: (p) => evalExpr(expr, p),
    });
  }
  return out;
}

function fitOnBasis(
  basis: Basis[],
  train: Sample[],
  lambda: number,
): number[] {
  const p = basis.length;
  const XtX = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty = new Array(p).fill(0);
  for (const s of train) {
    const row = basis.map((b) => b.fn(s.params));
    for (let i = 0; i < p; i++) {
      Xty[i] += row[i]! * s.y;
      for (let j = i; j < p; j++) XtX[i]![j]! += row[i]! * row[j]!;
    }
  }
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < i; j++) XtX[i]![j] = XtX[j]![i]!;
  }
  return solveRidge(XtX, Xty, lambda);
}

function fitDictionary(
  train: Sample[],
  test: Sample[],
  target: ResearchTarget,
): FittedLaw {
  const basis = dictionary();
  const beta = fitOnBasis(basis, train, 0.08);

  const ranked: { basis: Basis; w: number; i: number }[] = [];
  for (let i = 0; i < basis.length; i++) {
    ranked.push({ basis: basis[i]!, w: beta[i]!, i });
  }
  ranked.sort((a, b) => Math.abs(b.w) - Math.abs(a.w));
  const picked: Basis[] = [];
  const seen = new Set<number>();
  for (const row of ranked) {
    if (row.i === 0) {
      picked.push(row.basis);
      seen.add(0);
      continue;
    }
    if (Math.abs(row.w) < 0.04) continue;
    if (picked.length >= 8) continue;
    picked.push(row.basis);
    seen.add(row.i);
  }
  if (!seen.has(0)) picked.unshift(basis[0]!);

  const refit = fitOnBasis(picked, train, 0.04);
  const terms = picked.map((b, i) => ({ basis: b, w: refit[i]! }));
  const expr = termsToExpr(terms);
  const yTr = train.map((s) => s.y);
  const yTe = test.map((s) => s.y);
  const hTr = train.map((s) => clamp(evalExpr(expr, s.params), -0.2, 1.4));
  const hTe = test.map((s) => clamp(evalExpr(expr, s.params), -0.2, 1.4));
  return {
    method: "dictionary",
    formula: formatExpr(expr),
    r2Train: r2Of(yTr, hTr),
    r2Test: r2Of(yTe, hTe),
    aic: aicOf(train.length, mseOf(yTr, hTr), terms.length),
    complexity: complexityOf(expr),
    expr,
    nTrain: train.length,
    nTest: test.length,
    target,
  };
}

function termsToExpr(terms: { basis: Basis; w: number }[]): Expr {
  if (terms.length === 0) return { t: "c", v: 0 };
  let acc: Expr | null = null;
  for (const term of terms) {
    const piece: Expr =
      term.basis.expr.t === "c"
        ? { t: "c", v: term.w }
        : { t: "b", op: "*", a: { t: "c", v: term.w }, b: term.basis.expr };
    acc = acc ? { t: "b", op: "+", a: acc, b: piece } : piece;
  }
  return acc ?? { t: "c", v: 0 };
}

function randLeaf(rng: () => number): Expr {
  if (rng() < 0.28) {
    return { t: "c", v: (rng() - 0.5) * 2 };
  }
  const key = KEYS[Math.floor(rng() * KEYS.length)]!;
  if (rng() < 0.55) {
    const meta = PARAM_META.find((m) => m.key === key)!;
    const mu = meta.min + rng() * (meta.max - meta.min);
    const sig = 0.08 + rng() * 0.45;
    return { t: "g", k: key, mu, sig };
  }
  if (rng() < 0.35) {
    return { t: "pow", a: { t: "v", k: key }, e: rng() < 0.5 ? -2 : 2 };
  }
  return { t: "v", k: key };
}

function randExpr(rng: () => number, depth: number): Expr {
  if (depth <= 1 || rng() < 0.32) return randLeaf(rng);
  if (rng() < 0.18) return { t: "s", a: randExpr(rng, depth - 1) };
  const ops: Array<"+" | "-" | "*" | "/"> = ["+", "*", "*", "-"];
  const op = ops[Math.floor(rng() * ops.length)]!;
  return {
    t: "b",
    op,
    a: randExpr(rng, depth - 1),
    b: randExpr(rng, depth - 1),
  };
}

function clone(expr: Expr): Expr {
  if (expr.t === "b") return { t: "b", op: expr.op, a: clone(expr.a), b: clone(expr.b) };
  if (expr.t === "s") return { t: "s", a: clone(expr.a) };
  if (expr.t === "pow") return { t: "pow", a: clone(expr.a), e: expr.e };
  return { ...expr };
}

function mutate(expr: Expr, rng: () => number): Expr {
  if (rng() < 0.22) return randExpr(rng, 3);
  if (expr.t === "c") return { t: "c", v: expr.v + (rng() - 0.5) * 0.3 };
  if (expr.t === "g") {
    return {
      t: "g",
      k: expr.k,
      mu: expr.mu + (rng() - 0.5) * 0.12,
      sig: clamp(expr.sig + (rng() - 0.5) * 0.08, 0.05, 0.8),
    };
  }
  if (expr.t === "v") return rng() < 0.5 ? expr : { t: "v", k: KEYS[Math.floor(rng() * KEYS.length)]! };
  if (expr.t === "pow") {
    return {
      t: "pow",
      a: rng() < 0.4 ? mutate(expr.a, rng) : expr.a,
      e: expr.e + (rng() - 0.5) * 0.4,
    };
  }
  if (expr.t === "s") return { t: "s", a: mutate(expr.a, rng) };
  if (rng() < 0.5) return { ...expr, a: mutate(expr.a, rng) };
  return { ...expr, b: mutate(expr.b, rng) };
}

function crossover(a: Expr, b: Expr, rng: () => number): Expr {
  if (rng() < 0.5 || a.t !== "b") return clone(rng() < 0.5 ? a : b);
  return {
    t: "b",
    op: a.op,
    a: rng() < 0.5 ? clone(a.a) : clone(b),
    b: rng() < 0.5 ? clone(a.b) : clone(b),
  };
}

function fitness(expr: Expr, train: Sample[]): number {
  if (depthOf(expr) > MAX_DEPTH) return -1e9;
  const y = train.map((s) => s.y);
  const yhat = train.map((s) => clamp(evalExpr(expr, s.params), -0.5, 1.5));
  if (yhat.some((v) => !Number.isFinite(v))) return -1e9;
  const r2 = r2Of(y, yhat);
  return r2 - 0.008 * complexityOf(expr);
}

function fitGp(
  train: Sample[],
  test: Sample[],
  seed: number,
  target: ResearchTarget,
  seedExpr: Expr,
): FittedLaw {
  const rng = mulberry32(seed ^ 0x9e3779b9);
  const popN = 56;
  const gens = 18;
  let pop: Expr[] = [clone(seedExpr)];
  while (pop.length < popN) pop.push(randExpr(rng, 4));

  for (let g = 0; g < gens; g++) {
    const scored = pop
      .map((e) => ({ e, f: fitness(e, train) }))
      .sort((a, b) => b.f - a.f);
    const next: Expr[] = [clone(scored[0]!.e), clone(scored[1]!.e)];
    while (next.length < popN) {
      const pick = () => {
        const a = scored[Math.floor(rng() * 12)]!;
        const b = scored[Math.floor(rng() * 18)]!;
        return a.f >= b.f ? a.e : b.e;
      };
      let child = crossover(pick(), pick(), rng);
      if (rng() < 0.45) child = mutate(child, rng);
      next.push(child);
    }
    pop = next;
  }

  const best = pop
    .map((e) => ({ e, f: fitness(e, train) }))
    .sort((a, b) => b.f - a.f)[0]!.e;
  const yTr = train.map((s) => s.y);
  const yTe = test.map((s) => s.y);
  const hTr = train.map((s) => clamp(evalExpr(best, s.params), -0.2, 1.4));
  const hTe = test.map((s) => clamp(evalExpr(best, s.params), -0.2, 1.4));
  return {
    method: "gp",
    formula: formatExpr(best),
    r2Train: r2Of(yTr, hTr),
    r2Test: r2Of(yTe, hTe),
    aic: aicOf(train.length, mseOf(yTr, hTr), complexityOf(best)),
    complexity: complexityOf(best),
    expr: best,
    nTrain: train.length,
    nTest: test.length,
    target,
  };
}

/**
 * Recover an interpretable expression for a life metric from samples of evaluate().
 * Dictionary = sparse Gaussians + the sigmoids / lifetime evaluate actually uses.
 * GP = genetic programming with an AIC-style complexity penalty.
 */
export function discoverLaw(
  seed: number,
  target: ResearchTarget,
  n = 400,
): DiscoveryResult {
  const rng = mulberry32(seed);
  const all: Sample[] = [];
  for (let i = 0; i < n; i++) all.push(drawSample(rng, target));
  const cut = Math.floor(n * 0.75);
  const train = all.slice(0, cut);
  const test = all.slice(cut);
  const dictionaryFit = fitDictionary(train, test, target);
  const gp = fitGp(train, test, seed, target, dictionaryFit.expr);
  const best =
    gp.r2Test > dictionaryFit.r2Test + 0.015 && gp.r2Test > 0.55
      ? gp
      : dictionaryFit;
  return { seed, target, best, dictionary: dictionaryFit, gp };
}

export function predictLaw(expr: Expr, params: UniverseParams): number {
  return clamp(evalExpr(expr, params), 0, 1);
}
