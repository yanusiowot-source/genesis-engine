import type { EncounterKind } from "./encounters.ts";
import type { MandateId } from "./mandate.ts";
import type { KnownPlate } from "./physics.ts";
import type { Fate } from "./types.ts";

/** Field dispatch — the plot is watching, not a title card. */
export type PlotId =
  | "arrive"
  | "empty"
  | "dice"
  | "foothold"
  | "teeming"
  | "silicon"
  | "tide"
  | "enduring"
  | "hard"
  | "blink"
  | "survey"
  | "home"
  | "cluster"
  | "dwarf"
  | "highway"
  | "belt"
  | "desert"
  | "caughtWow"
  | "caughtThroat"
  | "caughtClassified"
  | "caughtTau"
  | "caughtZone"
  | "caughtWhale"
  | "done";

export type PlotInput = {
  births: number;
  fate: Fate;
  next: MandateId | null;
  ours?: boolean;
  plate?: KnownPlate | null;
  silicon?: number;
  eternal?: number;
  swarm?: number;
  scanning?: boolean;
  encounter?: EncounterKind | null;
  caught?: EncounterKind | null;
};

const CAUGHT: Record<EncounterKind, PlotId> = {
  wow: "caughtWow",
  throat: "caughtThroat",
  classified: "caughtClassified",
  tau: "caughtTau",
  zone: "caughtZone",
  whale: "caughtWhale",
};

const PLATE_VOICE: Partial<Record<KnownPlate, PlotId>> = {
  ours: "home",
  cluster: "cluster",
  dwarf: "dwarf",
  silicon: "silicon",
  eternal: "enduring",
  swarm: "tide",
  highway: "highway",
  belt: "belt",
  desert: "desert",
};

export function pickDispatch(input: PlotInput): PlotId {
  if (input.scanning) return "survey";
  if (input.encounter) return "blink";
  if (input.caught) return CAUGHT[input.caught];
  if (!input.next) return "done";
  if (input.ours) return "home";
  if (input.plate) {
    const fromPlate = PLATE_VOICE[input.plate];
    if (fromPlate) return fromPlate;
  }
  if (input.fate === "teeming") return "teeming";
  if (input.fate === "enduring") return "enduring";
  if (input.fate === "habitable") return "foothold";
  if ((input.swarm ?? 0) >= 0.18) return "tide";
  if ((input.silicon ?? 0) >= 0.18) return "silicon";
  if ((input.eternal ?? 0) >= 0.18) return "enduring";
  if (input.fate === "crunch" || input.fate === "rip" || input.fate === "flash") return "hard";
  if (input.births <= 1) return "arrive";
  if (input.births >= 5) return "dice";
  return "empty";
}