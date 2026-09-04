import type { Evaluation, UniverseParams } from "./types";
import { clamp } from "./rng.ts";
import { evaluate } from "./physics.ts";

export type CivStageId = "chemistry" | "cells" | "complex" | "minds" | "tech";
export type CivPath = "carbon" | "silicon" | "eternal" | "none";

export type CivStage = {
  id: CivStageId;
  pSurvive: number;
  tStartGyr: number;
  tSpanGyr: number;
};

export type CivPoint = {
  t: number;
  biosphere: number;
  minds: number;
};

export type CivModel = {
  path: CivPath;
  stages: CivStage[];
  pIntelligence: number;
  carrying: number;
  ships: number;
  curve: CivPoint[];
  collapsed: boolean;
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function gauss(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

/**
 * Speculative Drake-style overlay. Not a forecast — a bottleneck envelope
 * so the lab can talk about *windows*, not census of minds.
 */
export function intelligenceWindow(
  params: UniverseParams,
  ev: Evaluation = evaluate(params),
): CivModel {
  const host = Math.max(ev.lifeProb, ev.siliconProb, ev.eternalProb);
  let path: CivPath = "none";
  if (ev.eternalProb >= 0.18 && ev.eternalProb >= ev.lifeProb && ev.eternalProb >= ev.siliconProb) {
    path = "eternal";
  } else if (host >= 0.08) {
    path = ev.lifeProb >= ev.siliconProb ? "carbon" : "silicon";
  }

  const window = Math.max(ev.lifeWindowGyr, 0);
  const gens = ev.generations;
  const stable = clamp(1 - 0.7 * ev.recollapseRisk - 0.7 * ev.runawayRisk, 0, 1);
  const heat = gauss(params.gravity, path === "silicon" ? 1.5 : 1.0, 0.32);

  const chemistry =
    path === "none"
      ? clamp(host * 0.4, 0, 0.2)
      : path === "carbon"
        ? clamp(0.15 + ev.lifeProb * 0.85, 0, 0.97)
        : path === "silicon"
          ? clamp(0.2 + ev.siliconProb * 0.75, 0, 0.95)
          : clamp(0.35 + ev.remnantStructure * 0.55, 0, 0.96);

  const cells =
    path === "carbon"
      ? clamp(sigmoid((window - 0.6) * 1.3) * (0.45 + 0.55 * ev.structure), 0, 0.95)
      : path === "silicon"
        ? clamp(sigmoid((ev.stellarLifetimeGyr - 0.4) * 2.2) * heat * 0.7, 0, 0.8)
        : path === "eternal"
          ? clamp(0.28 + 0.55 * ev.eternalProb * stable, 0, 0.88)
          : 0.02;

  const complex =
    path === "carbon"
      ? clamp(sigmoid((gens - 1.8) * 1.1) * (1 - params.quantumNoise * 1.1), 0, 0.9)
      : path === "silicon"
        ? clamp(0.22 * heat * (1 - 0.5 * params.quantumNoise), 0, 0.55)
        : path === "eternal"
          ? clamp(0.3 + 0.4 * params.complexity * (1 - params.quantumNoise), 0, 0.82)
          : 0.01;

  const minds =
    path === "carbon"
      ? clamp(
          0.18 + 0.55 * params.complexity * stable * sigmoid((window - 1.2) * 0.9),
          0,
          0.62,
        )
      : path === "silicon"
        ? clamp(0.08 + 0.28 * params.complexity * heat * stable, 0, 0.38)
        : path === "eternal"
          ? clamp(0.22 + 0.5 * ev.eternalProb * stable, 0, 0.72)
          : 0.005;

  const tech =
    path === "none"
      ? 0.002
      : path === "eternal"
        ? clamp(0.2 + 0.55 * ev.eternalProb * stable, 0, 0.7)
        : clamp(0.12 + 0.4 * params.complexity * stable * (1 - ev.runawayRisk), 0, 0.55);

  const tChem = Math.max(
    ev.timeToStarsGyr + (path === "silicon" ? 0.2 : path === "eternal" ? 0.5 : 0.8),
    0.05,
  );
  const tCells = tChem + (path === "silicon" ? 0.15 : path === "eternal" ? 0.4 : 0.9);
  const tComplex = tCells + (path === "silicon" ? 0.2 : path === "eternal" ? 0.6 : 1.4);
  const tMinds = tComplex + (path === "silicon" ? 0.25 : path === "eternal" ? 0.8 : 1.1);
  const tTech = tMinds + (path === "eternal" ? 1.2 : 0.4);
  const span = Math.max(
    window,
    ev.stellarLifetimeGyr * (path === "eternal" ? 8 : 0.35),
    1.2,
  );

  const stages: CivStage[] = [
    { id: "chemistry", pSurvive: chemistry, tStartGyr: tChem, tSpanGyr: span * 0.15 },
    { id: "cells", pSurvive: cells, tStartGyr: tCells, tSpanGyr: span * 0.2 },
    { id: "complex", pSurvive: complex, tStartGyr: tComplex, tSpanGyr: span * 0.22 },
    { id: "minds", pSurvive: minds, tStartGyr: tMinds, tSpanGyr: span * 0.18 },
    { id: "tech", pSurvive: tech, tStartGyr: tTech, tSpanGyr: span * 0.16 },
  ];

  const pIntelligence = clamp(
    chemistry * cells * complex * minds,
    0,
    path === "eternal" ? 0.62 : 0.55,
  );
  const carrying = clamp(
    (path === "eternal" ? ev.remnantStructure : ev.structure) *
      (0.4 + 0.6 * params.matter) *
      stable,
    0,
    1,
  );

  const curve = lotkaCurve(params, ev, pIntelligence, carrying, path);
  const last = curve[curve.length - 1];
  const peaked = modelPeak(curve);
  const collapsed =
    ev.recollapseRisk > 0.45 ||
    ev.runawayRisk > 0.45 ||
    (path !== "none" &&
      path !== "eternal" &&
      peaked > 0.12 &&
      (last?.minds ?? 0) < 0.03);

  const ships =
    path === "none" || collapsed
      ? 0
      : clamp(
          tech *
            (0.4 + 0.45 * stable) *
            (1 - 0.55 * ev.runawayRisk) *
            (path === "eternal" ? 0.65 : 1),
          0,
          0.52,
        );

  return {
    path,
    stages,
    pIntelligence,
    carrying,
    ships,
    curve,
    collapsed,
  };
}

/**
 * Logistic biosphere vs intelligence. A toy ecology analog — not history.
 * Prey growth from matter/structure; extraction from gravity; decay from expansion.
 * Eternal path: Dyson slowing — minds persist as the heat bath cools.
 */
export function lotkaCurve(
  params: UniverseParams,
  ev: Evaluation,
  pIntelligence: number,
  carrying: number,
  path: CivPath,
): CivPoint[] {
  const steps = 48;
  const dt = 0.12;
  const K = Math.max(carrying, 0.04);
  const structureForGrowth = path === "eternal" ? ev.remnantStructure : ev.structure;
  const alpha = 0.5 + 0.45 * structureForGrowth * params.complexity;
  const beta = 0.12 + 0.28 * clamp(params.gravity - 0.7, 0, 1.3);
  const delta =
    path === "eternal"
      ? 0.32 + 0.55 * pIntelligence
      : 0.16 + 0.7 * pIntelligence * (0.35 + params.complexity);
  const gamma =
    path === "eternal"
      ? 0.018 + 0.12 * ev.runawayRisk + 0.12 * ev.recollapseRisk
      : 0.07 +
        0.55 * ev.runawayRisk +
        0.4 * ev.recollapseRisk +
        0.15 * clamp(params.expansion - 1.1, 0, 1);

  let prey = path === "none" ? 0.02 : 0.22 + 0.35 * K;
  let pred =
    path === "none"
      ? 0
      : path === "eternal"
        ? 0.18 * Math.max(pIntelligence, 0.06)
        : 0.04 * Math.max(pIntelligence, 0.02);
  const out: CivPoint[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    out.push({
      t,
      biosphere: clamp(prey, 0, 1.4),
      minds: clamp(pred, 0, 1.2),
    });
    const dPrey = (alpha * prey * (1 - prey / K) - beta * prey * pred) * dt;
    const dPred = (delta * prey * pred - gamma * pred) * dt;
    prey = Math.max(0, prey + dPrey);
    pred = Math.max(0, pred + dPred);
    if (!Number.isFinite(prey) || !Number.isFinite(pred)) {
      prey = 0;
      pred = 0;
    }
  }
  return out;
}

function modelPeak(curve: CivPoint[]): number {
  let peak = 0;
  for (const p of curve) if (p.minds > peak) peak = p.minds;
  return peak;
}

export function stageReached(model: CivModel): CivStageId | "none" {
  const thresh = 0.18;
  let last: CivStageId | "none" = "none";
  for (const s of model.stages) {
    if (s.pSurvive < thresh) break;
    last = s.id;
  }
  return last;
}

export function sparkPath(
  values: number[],
  w: number,
  h: number,
  pad = 2,
): string {
  if (values.length < 2) return "";
  const min = 0;
  const max = Math.max(1, ...values);
  return values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
