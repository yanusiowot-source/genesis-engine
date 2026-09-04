import type { CitizenScore } from "./citizen.ts";
import { emptyScore, loadCitizenScore } from "./citizen.ts";
import type { Evaluation, Fate, UniverseParams, UniverseRecord } from "./types.ts";

export type SkyClass = "void" | "sterile" | "habitable" | "silicon" | "eternal" | "unsure";

export const SKY_CLASSES: SkyClass[] = [
  "void",
  "sterile",
  "habitable",
  "silicon",
  "eternal",
  "unsure",
];

export type SkyVote = {
  catalog: string;
  name: string;
  class: SkyClass;
  rating: number;
  gold: SkyClass;
  match: boolean;
  lifeProb: number;
  siliconProb: number;
  eternalProb?: number;
  fate: Fate;
  createdAt: number;
  params: UniverseParams;
};

const BOARD_KEY = "genesis-engine-board-v1";

export function goldClass(ev: Evaluation): SkyClass {
  if (ev.siliconNiche === "viable" || ev.siliconNiche === "favored") return "silicon";
  if (ev.eternalNiche === "open" || ev.eternalNiche === "dyson" || ev.fate === "enduring") {
    return "eternal";
  }
  if (ev.fate === "habitable" || ev.fate === "teeming") return "habitable";
  if (ev.fate === "sterile" || ev.fate === "flash" || ev.fate === "fog") return "sterile";
  return "void";
}

export function loadVotes(): SkyVote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SkyVote[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => v && typeof v.catalog === "string").slice(0, 80);
  } catch {
    return [];
  }
}

export function saveVotes(votes: SkyVote[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(votes.slice(0, 80)));
  } catch {
    /* quota */
  }
}

export function recordVote(record: UniverseRecord, klass: SkyClass, rating: number): SkyVote[] {
  const gold = goldClass(record.evaluation);
  const vote: SkyVote = {
    catalog: record.catalog,
    name: record.name,
    class: klass,
    rating: Math.max(1, Math.min(5, Math.round(rating))),
    gold,
    match: klass === gold,
    lifeProb: record.evaluation.lifeProb,
    siliconProb: record.evaluation.siliconProb,
    eternalProb: record.evaluation.eternalProb,
    fate: record.evaluation.fate,
    createdAt: Date.now(),
    params: record.params,
  };
  const prev = loadVotes().filter((v) => v.catalog !== record.catalog);
  const next = [vote, ...prev].slice(0, 80);
  saveVotes(next);
  return next;
}

export function observerPoints(score: CitizenScore, votes: SkyVote[]): number {
  const eye = score.spectrumOk * 2 + score.transitOk;
  const skies = votes.reduce((s, v) => s + 3 + v.rating + (v.match ? 2 : 0), 0);
  return eye + skies;
}

export function rankedVotes(votes: SkyVote[]): SkyVote[] {
  return votes.slice().sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.match !== a.match) return Number(b.match) - Number(a.match);
    return b.lifeProb + b.siliconProb + (b.eternalProb ?? 0) - (a.lifeProb + a.siliconProb + (a.eternalProb ?? 0));
  });
}

function csvEscape(v: string | number | boolean): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Zooniverse-style classification export (one row per vote). */
export function zooniverseClassificationsCsv(votes: SkyVote[]): string {
  const header = [
    "classification_id",
    "user_name",
    "created_at",
    "subject_ids",
    "workflow_name",
    "gold_standard",
    "annotations",
    "subject_data",
  ];
  const rows = votes.map((v, i) => {
    const annotations = JSON.stringify([{ task: "T0", value: v.class }]);
    const subject = JSON.stringify({
      catalog: v.catalog,
      name: v.name,
      fate: v.fate,
      lifeProb: v.lifeProb,
      siliconProb: v.siliconProb,
      eternalProb: v.eternalProb ?? 0,
      rating: v.rating,
    });
    return [
      i + 1,
      "local-observer",
      new Date(v.createdAt).toISOString(),
      v.catalog,
      "genesis-sky-class",
      v.match,
      annotations,
      subject,
    ]
      .map(csvEscape)
      .join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export function zooniverseSubjectsCsv(votes: SkyVote[]): string {
  const header = [
    "subject_id",
    "catalog",
    "name",
    "gravity",
    "expansion",
    "darkEnergy",
    "matter",
    "complexity",
    "quantumNoise",
    "lifeProb",
    "siliconProb",
    "eternalProb",
    "fate",
    "gold_class",
  ];
  const rows = votes.map((v) =>
    [
      v.catalog,
      v.catalog,
      v.name,
      v.params.gravity,
      v.params.expansion,
      v.params.darkEnergy,
      v.params.matter,
      v.params.complexity,
      v.params.quantumNoise,
      v.lifeProb,
      v.siliconProb,
      v.eternalProb ?? 0,
      v.fate,
      v.gold,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function boardSnapshot(): { votes: SkyVote[]; score: CitizenScore; points: number } {
  const votes = loadVotes();
  const score = typeof window === "undefined" ? emptyScore() : loadCitizenScore();
  return { votes, score, points: observerPoints(score, votes) };
}
