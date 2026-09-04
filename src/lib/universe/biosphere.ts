import type { Evaluation, UniverseParams } from "./types";
import { intelligenceWindow, type CivPath } from "./civilization.ts";
import { OUR_UNIVERSE, evaluate } from "./physics.ts";
import { clamp } from "./rng.ts";

/** Bar-On, Phillips & Milo 2018 — living biomass on Earth, Gt C. */
const EARTH_GTC = {
  plants: 450,
  bacteria: 70,
  fungi: 12,
  archaea: 7,
  protists: 4,
  animals: 2,
  viruses: 0.2,
} as const;

const EARTH_TOTAL = 450 + 70 + 12 + 7 + 4 + 2 + 0.2;

/** Order-of-magnitude richness envelopes (estimated, not a census). */
const EARTH_SPECIES = {
  plants: 4.0e5,
  bacteria: 1.0e6,
  fungi: 2.2e6,
  archaea: 4.0e4,
  protists: 3.0e5,
  animals: 7.5e6,
  viruses: 5.0e5,
} as const;

export type TaxonId =
  | "plants"
  | "bacteria"
  | "fungi"
  | "archaea"
  | "protists"
  | "animals"
  | "viruses"
  | "lattices"
  | "chains"
  | "assemblers";

export type GradeId =
  | "prokaryotes"
  | "photosynthesis"
  | "eukaryotes"
  | "multicellular"
  | "animals"
  | "minds";

export type TaxonSort = "biomass" | "species";

export type TaxonRow = {
  id: TaxonId;
  biomassGtC: number;
  species: number;
  open: boolean;
  share: number;
};

export type GradeRow = {
  id: GradeId;
  open: boolean;
  tOpenGyr: number;
  species: number;
};

export type BiosphereModel = {
  path: CivPath;
  worldGtC: number;
  galaxyWorlds: number;
  galaxyGtC: number;
  taxa: TaxonRow[];
  grades: GradeRow[];
  note: "empty" | "carbon" | "silicon" | "eternal";
};

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function carbonScale(params: UniverseParams, ev: Evaluation, cal: Evaluation): number {
  const p = ev.lifeProb / Math.max(cal.lifeProb, 0.05);
  const w =
    sigmoid((ev.lifeWindowGyr - 0.8) * 1.15) /
    Math.max(sigmoid((cal.lifeWindowGyr - 0.8) * 1.15), 1e-3);
  const g = clamp(ev.generations / Math.max(cal.generations, 0.5), 0, 2.2);
  const s = 0.45 + 0.55 * (ev.structure / Math.max(cal.structure, 0.05));
  const noise = 1 - 0.55 * clamp(params.quantumNoise - 0.1, 0, 0.8);
  const risk = clamp(1 - 0.7 * ev.recollapseRisk - 0.75 * ev.runawayRisk, 0, 1);
  return clamp(p * w * (0.55 + 0.45 * g) * s * noise * risk, 0, 2.4);
}

function siliconScale(params: UniverseParams, ev: Evaluation): number {
  const heat = Math.exp(-0.5 * ((params.gravity - 1.5) / 0.32) ** 2);
  const risk = clamp(1 - 0.6 * ev.recollapseRisk - 0.7 * ev.runawayRisk, 0, 1);
  return clamp(ev.siliconProb * (0.35 + 0.65 * heat) * risk * (0.5 + 0.5 * ev.structure), 0, 1.2);
}

function richnessMul(params: UniverseParams, ev: Evaluation, cal: Evaluation): number {
  const w = Math.pow(Math.max(ev.lifeWindowGyr, 0.05) / Math.max(cal.lifeWindowGyr, 1), 0.55);
  const c = 0.4 + 0.6 * (params.complexity / 0.36);
  const noise = 1 - 0.5 * clamp(params.quantumNoise - 0.1, 0, 0.85);
  return clamp(w * c * noise, 0.02, 3.2);
}

/**
 * World-analog biomass and a time-gated development ladder.
 * Calibrated to Earth (Bar-On et al. 2018) at ΛCDM. Homology, not a census.
 */
export function biosphereOf(
  params: UniverseParams,
  ev: Evaluation = evaluate(params),
): BiosphereModel {
  const cal = evaluate(OUR_UNIVERSE);
  const civ = intelligenceWindow(params, ev);
  const path = civ.path;
  const t0 = ev.timeToStarsGyr;

  const grades: GradeRow[] = [];
  const push = (id: GradeId, open: boolean, delay: number, species: number) => {
    grades.push({
      id,
      open,
      tOpenGyr: t0 + delay,
      species: open ? species : 0,
    });
  };

  if (path === "none") {
    return {
      path,
      worldGtC: 0,
      galaxyWorlds: 0,
      galaxyGtC: 0,
      taxa: [],
      grades: [
        { id: "prokaryotes", open: false, tOpenGyr: t0 + 0.4, species: 0 },
        { id: "photosynthesis", open: false, tOpenGyr: t0 + 1.1, species: 0 },
        { id: "eukaryotes", open: false, tOpenGyr: t0 + 2.4, species: 0 },
        { id: "multicellular", open: false, tOpenGyr: t0 + 3.4, species: 0 },
        { id: "animals", open: false, tOpenGyr: t0 + 3.9, species: 0 },
        { id: "minds", open: false, tOpenGyr: t0 + 4.5, species: 0 },
      ],
      note: "empty",
    };
  }

  if (path === "eternal") {
    const minds = civ.pIntelligence > 0.04;
    push("prokaryotes", false, 0.4, 0);
    push("photosynthesis", false, 1.1, 0);
    push("eukaryotes", false, 2.4, 0);
    push("multicellular", false, 3.4, 0);
    push("animals", false, 3.9, 0);
    push("minds", minds, 5.5, minds ? 1 : 0);
    return {
      path,
      worldGtC: 0,
      galaxyWorlds: 0,
      galaxyGtC: 0,
      taxa: [],
      grades,
      note: "eternal",
    };
  }

  if (path === "silicon") {
    const scale = siliconScale(params, ev);
    const hotClock = ev.stellarLifetimeGyr;
    const prok = ev.siliconProb > 0.1 && hotClock > 0.6;
    const photo = ev.siliconProb > 0.18 && hotClock > 1.0;
    const complex = ev.siliconProb > 0.35 && params.complexity > 0.22 && hotClock > 1.5;
    const minds = civ.pIntelligence > 0.04;
    const rich = richnessMul(params, ev, cal);
    const world = 80 * scale;
    const rows: { id: TaxonId; frac: number; species: number; open: boolean }[] = [
      { id: "lattices", frac: photo ? 0.58 : 0, species: photo ? 2.4e4 * rich : 0, open: photo },
      { id: "chains", frac: prok ? (photo ? 0.32 : 0.88) : 0, species: prok ? 4.5e5 * rich : 0, open: prok },
      { id: "assemblers", frac: complex ? 0.1 : 0, species: complex ? 8e3 * rich : 0, open: complex },
    ];
    const fracSum = rows.reduce((s, r) => s + r.frac, 0) || 1;
    const taxa = rows.map((r) => ({
      id: r.id,
      biomassGtC: world * (r.frac / fracSum),
      species: r.species,
      open: r.open,
      share: r.frac / fracSum,
    }));
    push("prokaryotes", prok, 0.25, prok ? 4.5e5 * rich : 0);
    push("photosynthesis", photo, 0.55, photo ? 2.4e4 * rich : 0);
    push("eukaryotes", false, 1.8, 0);
    push("multicellular", complex, 1.1, complex ? 8e3 * rich : 0);
    push("animals", false, 2.2, 0);
    push("minds", minds, 2.6, minds ? 1 : 0);
    const worlds = galaxyWorlds(ev, ev.siliconProb);
    return {
      path,
      worldGtC: taxa.reduce((s, t) => s + t.biomassGtC, 0),
      galaxyWorlds: worlds,
      galaxyGtC: taxa.reduce((s, t) => s + t.biomassGtC, 0) * worlds,
      taxa: sortTaxa(taxa, "biomass"),
      grades,
      note: "silicon",
    };
  }

  const scale = carbonScale(params, ev, cal);
  const w = ev.lifeWindowGyr;
  const rich = richnessMul(params, ev, cal);
  const prok = ev.lifeProb > 0.08 && w > 0.25;
  const photo = w >= 1.0 && ev.generations > 0.8 && prok;
  const euk = w >= 1.8 && params.complexity > 0.12 && photo;
  const multi = w >= 2.4 && ev.generations > 1.4 && euk;
  const animals = w >= 3.0 && ev.generations > 1.8 && params.quantumNoise < 0.36 && multi;
  const minds = civ.pIntelligence > 0.04 && animals;

  const weight = {
    plants: photo ? EARTH_GTC.plants : 0,
    bacteria: prok ? EARTH_GTC.bacteria * (photo ? 1 : 2.4) : 0,
    fungi: euk ? EARTH_GTC.fungi : 0,
    archaea: prok ? EARTH_GTC.archaea * (photo ? 1 : 1.8) : 0,
    protists: euk ? EARTH_GTC.protists : 0,
    animals: animals ? EARTH_GTC.animals : 0,
    viruses: prok ? EARTH_GTC.viruses : 0,
  };
  const wSum = Object.values(weight).reduce((s, n) => s + n, 0);
  const world = (wSum > 0 ? wSum : EARTH_TOTAL) * scale;
  const ids = Object.keys(weight) as (keyof typeof weight)[];
  const taxa: TaxonRow[] = ids.map((id) => {
    const open = weight[id] > 0;
    const share = wSum > 0 ? weight[id] / wSum : 0;
    const sp0 = EARTH_SPECIES[id];
    return {
      id,
      biomassGtC: world * share,
      species: open ? sp0 * rich : 0,
      open,
      share,
    };
  });

  push("prokaryotes", prok, 0.4, prok ? (EARTH_SPECIES.bacteria + EARTH_SPECIES.archaea) * rich : 0);
  push("photosynthesis", photo, 1.1, photo ? EARTH_SPECIES.plants * rich : 0);
  push("eukaryotes", euk, 2.4, euk ? (EARTH_SPECIES.protists + EARTH_SPECIES.fungi) * rich : 0);
  push("multicellular", multi, 3.4, multi ? EARTH_SPECIES.plants * 0.4 * rich : 0);
  push("animals", animals, 3.9, animals ? EARTH_SPECIES.animals * rich : 0);
  push("minds", minds, 4.5, minds ? 1 : 0);

  const worlds = galaxyWorlds(ev, ev.lifeProb);
  return {
    path,
    worldGtC: world,
    galaxyWorlds: worlds,
    galaxyGtC: world * worlds,
    taxa: sortTaxa(taxa, "biomass"),
    grades,
    note: "carbon",
  };
}

function galaxyWorlds(ev: Evaluation, host: number): number {
  const n = ev.structure * host * 1e8 * clamp(ev.generations / 3, 0.05, 4);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function sortTaxa(rows: TaxonRow[], by: TaxonSort): TaxonRow[] {
  return [...rows].sort((a, b) => {
    const d = by === "species" ? b.species - a.species : b.biomassGtC - a.biomassGtC;
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });
}
