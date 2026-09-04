import type { Evaluation, Fate, ParamKey, UniverseParams } from "./types";
import { clamp, mulberry32 } from "./rng.ts";
import {
  PARAM_META,
  evaluate,
  nearEternal,
  nearGoldilocks,
  nearSilicon,
  randomParams,
  refine,
  snapParams,
} from "./physics.ts";

export type ResearchTarget = "carbon" | "silicon" | "eternal" | "overall" | "diversity";

export type InsightId =
  | "rareViable"
  | "gravityDominatesCarbon"
  | "gravityDominatesSilicon"
  | "disjointCorridors"
  | "expansionKills"
  | "noiseSeeds"
  | "matterCrunch"
  | "thisSkyHigh"
  | "thisSkyLow"
  | "theoristImproved"
  | "darkEnergyDominatesEternal"
  | "eternalRare";

export type SampleRow = {
  params: UniverseParams;
  evaluation: Evaluation;
  visualSeed: number;
  score: number;
};

export type ImportanceRow = { key: ParamKey; value: number };

export type FateBin = { fate: Fate; n: number };

export type ExpeditionResult = {
  seed: number;
  target: ResearchTarget;
  sampleN: number;
  viableCarbon: number;
  viableSilicon: number;
  viableEternal: number;
  meanCarbon: number;
  meanSilicon: number;
  meanEternal: number;
  corr: number;
  importance: ImportanceRow[];
  localSensitivity: ImportanceRow[];
  fateHist: FateBin[];
  observer: SampleRow[];
  theorist: SampleRow[];
  best: SampleRow[];
  insights: InsightId[];
  thisPercentile: number;
};

const FATE_ORDER: Fate[] = [
  "void",
  "crunch",
  "rip",
  "flash",
  "fog",
  "sterile",
  "enduring",
  "habitable",
  "teeming",
];

export const RESEARCH_TARGETS: ResearchTarget[] = [
  "carbon",
  "silicon",
  "eternal",
  "overall",
  "diversity",
];

export function scoreOf(ev: Evaluation, target: ResearchTarget): number {
  const a = ev.lifeProb;
  const b = ev.siliconProb;
  const e = ev.eternalProb;
  if (target === "carbon") return a;
  if (target === "silicon") return b;
  if (target === "eternal") return e;
  if (target === "overall") return Math.max(a, b, e);
  return (2 * a * b) / (a + b + 1e-9);
}

function fisherYates<T>(items: T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 4) return 0;
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
  if (den < 1e-12) return 0;
  return clamp(num / den, -1, 1);
}

export function permutationImportance(
  rows: UniverseParams[],
  target: ResearchTarget,
  rng: () => number,
): ImportanceRow[] {
  const y = rows.map((p) => scoreOf(evaluate(p), target));
  const effects: number[] = [];
  for (const meta of PARAM_META) {
    const shuffledVals = fisherYates(
      rows.map((p) => p[meta.key]),
      rng,
    );
    let mae = 0;
    for (let i = 0; i < rows.length; i++) {
      const mutated = { ...rows[i]!, [meta.key]: shuffledVals[i]! };
      mae += Math.abs(y[i]! - scoreOf(evaluate(mutated), target));
    }
    effects.push(mae / Math.max(rows.length, 1));
  }
  const sum = effects.reduce((a, b) => a + b, 0) || 1;
  return PARAM_META.map((meta, i) => ({
    key: meta.key,
    value: effects[i]! / sum,
  })).sort((a, b) => b.value - a.value);
}

export function localSensitivity(
  params: UniverseParams,
  target: ResearchTarget,
): ImportanceRow[] {
  const rows = PARAM_META.map((meta) => {
    const step = (meta.max - meta.min) * 0.08;
    const hi = snapParams({
      ...params,
      [meta.key]: clamp(params[meta.key] + step, meta.min, meta.max),
    });
    const lo = snapParams({
      ...params,
      [meta.key]: clamp(params[meta.key] - step, meta.min, meta.max),
    });
    const d = Math.abs(
      scoreOf(evaluate(hi), target) - scoreOf(evaluate(lo), target),
    );
    return { key: meta.key, value: d };
  });
  const sum = rows.reduce((a, r) => a + r.value, 0) || 1;
  return rows
    .map((r) => ({ ...r, value: r.value / sum }))
    .sort((a, b) => b.value - a.value);
}

function toRow(
  params: UniverseParams,
  visualSeed: number,
  target: ResearchTarget,
): SampleRow {
  const evaluation = evaluate(params);
  return {
    params,
    evaluation,
    visualSeed,
    score: scoreOf(evaluation, target),
  };
}

function uniqueBest(rows: SampleRow[], n: number): SampleRow[] {
  const seen = new Set<string>();
  const out: SampleRow[] = [];
  const sorted = rows.slice().sort((a, b) => b.score - a.score);
  for (const row of sorted) {
    const key = [
      row.params.gravity,
      row.params.expansion,
      row.params.darkEnergy,
      row.params.matter,
      row.params.complexity,
      row.params.quantumNoise,
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= n) break;
  }
  return out;
}

function percentileRank(value: number, sample: number[]): number {
  if (sample.length === 0) return 0;
  let below = 0;
  for (const v of sample) if (v <= value) below += 1;
  return below / sample.length;
}

function climbTargetOf(
  target: ResearchTarget,
  start: UniverseParams,
): "carbon" | "silicon" | "eternal" {
  if (target === "silicon") return "silicon";
  if (target === "eternal") return "eternal";
  if (target === "overall") {
    const ev = evaluate(start);
    if (ev.eternalProb >= ev.lifeProb && ev.eternalProb >= ev.siliconProb) return "eternal";
    if (ev.siliconProb > ev.lifeProb) return "silicon";
    return "carbon";
  }
  return "carbon";
}

function pickInsights(args: {
  target: ResearchTarget;
  sampleN: number;
  viableCarbon: number;
  viableEternal: number;
  corr: number;
  importance: ImportanceRow[];
  thisPercentile: number;
  observerBest: number;
  theoristBest: number;
}): InsightId[] {
  const out: InsightId[] = [];
  const viableFrac = args.viableCarbon / Math.max(args.sampleN, 1);
  if (viableFrac < 0.22) out.push("rareViable");
  const eternalFrac = args.viableEternal / Math.max(args.sampleN, 1);
  if (args.target === "eternal" && eternalFrac < 0.16) out.push("eternalRare");
  const top = args.importance[0]?.key;
  if (top === "gravity" && args.target === "carbon") {
    out.push("gravityDominatesCarbon");
  }
  if (top === "gravity" && args.target === "silicon") {
    out.push("gravityDominatesSilicon");
  }
  if (top === "darkEnergy" && args.target === "eternal") {
    out.push("darkEnergyDominatesEternal");
  }
  if (args.corr < -0.12) out.push("disjointCorridors");
  if (args.importance.some((r) => r.key === "expansion" && r.value > 0.18)) {
    out.push("expansionKills");
  }
  if (args.importance.some((r) => r.key === "quantumNoise" && r.value > 0.14)) {
    out.push("noiseSeeds");
  }
  if (args.importance.some((r) => r.key === "matter" && r.value > 0.18)) {
    out.push("matterCrunch");
  }
  if (args.thisPercentile >= 0.8) out.push("thisSkyHigh");
  else if (args.thisPercentile <= 0.35) out.push("thisSkyLow");
  if (args.theoristBest > args.observerBest * 1.04) out.push("theoristImproved");
  return out.slice(0, 5);
}

const OBSERVER_N = 280;
const THEORIST_STARTS = 8;
const KEEP = 4;

/**
 * Observer (uniform prior) + Theorist (hill-climb) + Analyst
 * (permutation importance of the closed-form evaluate, not a trained net).
 */
export function runExpedition(
  seed: number,
  target: ResearchTarget,
  current: UniverseParams,
): ExpeditionResult {
  const rng = mulberry32(seed);

  const observer: SampleRow[] = [];
  for (let i = 0; i < OBSERVER_N; i++) {
    const visualSeed = Math.floor(rng() * 0xffffffff) || 1;
    const roll = rng();
    const params =
      roll < 0.38
        ? randomParams(rng)
        : roll < 0.6
          ? nearGoldilocks(rng)
          : roll < 0.8
            ? nearSilicon(rng)
            : nearEternal(rng);
    observer.push(toRow(params, visualSeed, target));
  }

  const theorist: SampleRow[] = [];
  for (let i = 0; i < THEORIST_STARTS; i++) {
    const start =
      i === 0 ? current : observer[Math.floor(rng() * observer.length)]!.params;
    const climbed =
      target === "diversity"
        ? refine(
            refine(start, Math.floor(rng() * 0xffffffff) || 1, "carbon"),
            Math.floor(rng() * 0xffffffff) || 1,
            "silicon",
          )
        : refine(start, Math.floor(rng() * 0xffffffff) || 1, climbTargetOf(target, start));
    const visualSeed = Math.floor(rng() * 0xffffffff) || 1;
    theorist.push(toRow(climbed, visualSeed, target));
  }

  const all = observer.concat(theorist);
  const carbon = all.map((r) => r.evaluation.lifeProb);
  const silicon = all.map((r) => r.evaluation.siliconProb);
  const eternal = all.map((r) => r.evaluation.eternalProb);
  const viableCarbon = all.filter((r) => r.evaluation.lifeProb >= 0.18).length;
  const viableSilicon = all.filter((r) => r.evaluation.siliconProb >= 0.18)
    .length;
  const viableEternal = all.filter((r) => r.evaluation.eternalProb >= 0.18)
    .length;
  const meanCarbon = carbon.reduce((a, b) => a + b, 0) / all.length;
  const meanSilicon = silicon.reduce((a, b) => a + b, 0) / all.length;
  const meanEternal = eternal.reduce((a, b) => a + b, 0) / all.length;

  const fateMap = new Map<Fate, number>();
  for (const f of FATE_ORDER) fateMap.set(f, 0);
  for (const row of observer) {
    fateMap.set(row.evaluation.fate, (fateMap.get(row.evaluation.fate) ?? 0) + 1);
  }
  const fateHist: FateBin[] = FATE_ORDER.map((fate) => ({
    fate,
    n: fateMap.get(fate) ?? 0,
  }));

  const importance = permutationImportance(
    observer.map((r) => r.params),
    target,
    rng,
  );
  const local = localSensitivity(current, target);
  const thisScore = scoreOf(evaluate(current), target);
  const thisPercentile = percentileRank(
    thisScore,
    observer.map((r) => r.score),
  );

  const observerBest = uniqueBest(observer, KEEP);
  const theoristBest = uniqueBest(theorist, KEEP);
  const best = uniqueBest(all, KEEP);

  const insights = pickInsights({
    target,
    sampleN: observer.length,
    viableCarbon: observer.filter((r) => r.evaluation.lifeProb >= 0.18).length,
    viableEternal: observer.filter((r) => r.evaluation.eternalProb >= 0.18).length,
    corr: pearson(carbon, silicon),
    importance,
    thisPercentile,
    observerBest: observerBest[0]?.score ?? 0,
    theoristBest: theoristBest[0]?.score ?? 0,
  });

  return {
    seed,
    target,
    sampleN: observer.length,
    viableCarbon,
    viableSilicon,
    viableEternal,
    meanCarbon,
    meanSilicon,
    meanEternal,
    corr: pearson(carbon, silicon),
    importance,
    localSensitivity: local,
    fateHist,
    observer: observerBest,
    theorist: theoristBest,
    best,
    insights,
    thisPercentile,
  };
}
