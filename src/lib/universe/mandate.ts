import { intelligenceWindow, type CivModel } from "./civilization.ts";
import {
  acousticDossier,
  agnNicheOf,
  diskDossier,
  haloModel,
} from "./observatory.ts";
import { OUR_SEED, isOurParams } from "./physics.ts";
import type { Fate, UniverseRecord } from "./types.ts";

/**
 * Observatory thesis — not a score, not XP, not a shop.
 * Skies to witness. Physics stays honest.
 */
export const MANDATE_IDS = [
  "witness",
  "corridor",
  "home",
  "silicon",
  "eternal",
  "tide",
  "diaspora",
  "atlas",
  "chronicle",
  "keep",
  "core",
  "toomre",
  "peak",
  "engine",
  "ring",
] as const;

export type MandateId = (typeof MANDATE_IDS)[number];

export const MANDATE_COUNT = MANDATE_IDS.length;
export const ATLAS_N = 5;
const SHIPS_FLOOR = 0.05;
export const MANDATE_KEY = "genesis-engine-mandate-v1";

export type MandateEvent = "see" | "birth" | "chronicle" | "star";

export type MandateAct =
  | "birth"
  | "survey"
  | "ours"
  | "silicon"
  | "eternal"
  | "tide"
  | "desert"
  | "refine"
  | "chronicle"
  | "star";

export type MandateProgress = {
  v: 1;
  sealed: Partial<Record<MandateId, number>>;
  fates: Fate[];
  births: number;
};

export type ObserveCtx = {
  record: UniverseRecord;
  civ: CivModel;
  event: MandateEvent;
};

const CORRIDOR_FATES: ReadonlySet<Fate> = new Set(["habitable", "teeming", "enduring"]);

export const FATE_ORDER: Fate[] = [
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

export function missingFates(progress: MandateProgress): Fate[] {
  return FATE_ORDER.filter((f) => !progress.fates.includes(f));
}

export function formatAtlasTick(template: string, fate: string, n: number): string {
  return template
    .replace("{fate}", fate)
    .replace("{n}", String(n))
    .replace("{m}", String(ATLAS_N));
}

export function emptyMandate(): MandateProgress {
  return { v: 1, sealed: {}, fates: [], births: 0 };
}

export function parseMandate(raw: unknown): MandateProgress {
  const empty = emptyMandate();
  if (!raw || typeof raw !== "object") return empty;
  const row = raw as Partial<MandateProgress>;
  const sealed: Partial<Record<MandateId, number>> = {};
  if (row.sealed && typeof row.sealed === "object") {
    for (const id of MANDATE_IDS) {
      const at = row.sealed[id];
      if (typeof at === "number" && Number.isFinite(at) && at > 0) sealed[id] = at;
    }
  }
  const fates: Fate[] = [];
  if (Array.isArray(row.fates)) {
    for (const f of row.fates) {
      if (typeof f === "string" && !fates.includes(f as Fate)) fates.push(f as Fate);
    }
  }
  const births = typeof row.births === "number" && row.births > 0 ? Math.floor(row.births) : 0;
  return { v: 1, sealed, fates, births };
}

export function sealedCount(progress: MandateProgress): number {
  let n = 0;
  for (const id of MANDATE_IDS) if (progress.sealed[id]) n += 1;
  return n;
}

export function isComplete(progress: MandateProgress): boolean {
  return sealedCount(progress) >= MANDATE_COUNT;
}

export function nextOpen(progress: MandateProgress): MandateId | null {
  for (const id of MANDATE_IDS) if (!progress.sealed[id]) return id;
  return null;
}

export function actOf(id: MandateId): MandateAct {
  switch (id) {
    case "witness":
    case "atlas":
      return "birth";
    case "corridor":
      return "survey";
    case "home":
      return "ours";
    case "silicon":
      return "silicon";
    case "eternal":
      return "eternal";
    case "tide":
      return "tide";
    case "diaspora":
      return "refine";
    case "chronicle":
      return "chronicle";
    case "keep":
      return "star";
    case "core":
    case "toomre":
    case "peak":
    case "engine":
    case "ring":
      return "survey";
  }
}

/** Factory ΛCDM the lab seeds on an empty desk — not a sky the observer chose. */
export function isIdleHome(record: UniverseRecord): boolean {
  return (
    isOurParams(record.params) &&
    record.visualSeed === OUR_SEED &&
    !record.starred &&
    !record.chronicle
  );
}

function qualifies(id: MandateId, ctx: ObserveCtx, fates: Fate[]): boolean {
  const ev = ctx.record.evaluation;
  switch (id) {
    case "witness":
      return true;
    case "corridor":
      return CORRIDOR_FATES.has(ev.fate);
    case "home":
      return isOurParams(ctx.record.params);
    case "silicon":
      return ev.siliconNiche === "viable" || ev.siliconNiche === "favored";
    case "eternal":
      return ev.eternalNiche === "glimpse" || ev.eternalNiche === "open" || ev.eternalNiche === "dyson";
    case "tide":
      return ev.swarmNiche === "bloom" || ev.swarmNiche === "tide";
    case "diaspora":
      return ctx.civ.ships >= SHIPS_FLOOR && !ctx.civ.collapsed;
    case "atlas":
      return fates.length >= ATLAS_N;
    case "chronicle":
      return ctx.event === "chronicle" || Boolean(ctx.record.chronicle);
    case "keep":
      return ctx.event === "star" || Boolean(ctx.record.starred);
    case "core": {
      const h = haloModel(ctx.record.params, ev);
      return h === "burkert" || h === "corenfw";
    }
    case "toomre":
      return diskDossier(ctx.record.params, ev).niche === "fragmenting";
    case "peak": {
      const n = acousticDossier(ctx.record.params, ev).niche;
      return n === "loaded" || n === "damped";
    }
    case "engine": {
      const a = agnNicheOf(ctx.record.params, ev);
      return a === "quasar" || a === "quench";
    }
    case "ring":
      return haloModel(ctx.record.params, ev) === "isothermal";
  }
}

function sameProgress(a: MandateProgress, b: MandateProgress): boolean {
  if (a.births !== b.births || a.fates.length !== b.fates.length) return false;
  for (let i = 0; i < a.fates.length; i++) if (a.fates[i] !== b.fates[i]) return false;
  for (const id of MANDATE_IDS) if (a.sealed[id] !== b.sealed[id]) return false;
  return true;
}

export function observe(
  progress: MandateProgress,
  ctx: ObserveCtx,
): { progress: MandateProgress; sealed: MandateId[]; addedFate: Fate | null } {
  const sealed: MandateId[] = [];
  const next: MandateProgress = {
    v: 1,
    sealed: { ...progress.sealed },
    fates: progress.fates.slice(),
    births: progress.births + (ctx.event === "birth" ? 1 : 0),
  };
  const fate = ctx.record.evaluation.fate;
  const addedFate = next.fates.includes(fate) ? null : fate;
  if (addedFate) next.fates.push(addedFate);

  const now = Date.now();
  for (const id of MANDATE_IDS) {
    if (next.sealed[id]) continue;
    if (!qualifies(id, ctx, next.fates)) continue;
    next.sealed[id] = now;
    sealed.push(id);
  }

  if (sameProgress(progress, next)) return { progress, sealed, addedFate: null };
  return { progress: next, sealed, addedFate };
}

export function mergeMandate(a: MandateProgress, b: MandateProgress): MandateProgress {
  const sealed: Partial<Record<MandateId, number>> = { ...a.sealed };
  for (const id of MANDATE_IDS) {
    const left = a.sealed[id];
    const right = b.sealed[id];
    if (left && right) sealed[id] = Math.min(left, right);
    else sealed[id] = left ?? right;
  }
  const fates: Fate[] = a.fates.slice();
  for (const f of b.fates) if (!fates.includes(f)) fates.push(f);
  return {
    v: 1,
    sealed,
    fates,
    births: Math.max(a.births, b.births),
  };
}

export function bootstrap(
  progress: MandateProgress,
  archive: UniverseRecord[],
  current: UniverseRecord | null,
  civ: CivModel,
): MandateProgress {
  let next = progress;
  const seen = new Set<string>();
  const rows = current ? [current, ...archive] : archive;
  for (const record of rows) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    const model = current && record.id === current.id ? civ : intelligenceWindow(record.params, record.evaluation);
    let event: MandateEvent = "see";
    if (record.starred) event = "star";
    else if (record.chronicle) event = "chronicle";
    next = observe(next, { record, civ: model, event }).progress;
  }
  return next;
}

/**
 * First desk: the seeded ΛCDM is furniture, not a witnessed sky.
 * A shared link, a starred home, or any other record still counts.
 */
export function bootstrapLab(
  progress: MandateProgress,
  archive: UniverseRecord[],
  current: UniverseRecord,
  civ: CivModel,
  opts?: { fromLink?: boolean },
): MandateProgress {
  const idleDesk =
    !opts?.fromLink &&
    sealedCount(progress) === 0 &&
    progress.births === 0 &&
    isIdleHome(current) &&
    archive.every((row) => isIdleHome(row));
  if (idleDesk) return progress;
  const currentForBoot = opts?.fromLink || !isIdleHome(current) ? current : null;
  return bootstrap(
    progress,
    archive.filter((row) => !isIdleHome(row)),
    currentForBoot,
    civ,
  );
}

export function loadMandate(): MandateProgress {
  if (typeof window === "undefined") return emptyMandate();
  try {
    const raw = localStorage.getItem(MANDATE_KEY);
    if (!raw) return emptyMandate();
    return parseMandate(JSON.parse(raw));
  } catch {
    return emptyMandate();
  }
}

export function persistMandate(progress: MandateProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MANDATE_KEY, JSON.stringify(progress));
  } catch {
    /* quota */
  }
}

export async function hydrateMandate(): Promise<MandateProgress> {
  return loadMandate();
}
