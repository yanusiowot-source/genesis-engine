import { mulberry32 } from "./rng.ts";
import type { Evaluation } from "./types";

export type EncounterKind = "wow" | "throat" | "classified" | "tau" | "zone" | "whale";

export type SkyEncounter = {
  kind: EncounterKind;
  nx: number;
  ny: number;
};

/**
 * A blink in the disk after a birth. Most empty skies still throw one —
 * silence is the other joke. Deterministic on visual seed.
 */
export function pickEncounter(seed: number, ev: Evaluation): SkyEncounter | null {
  const rng = mulberry32((seed ^ 0x51a10e) >>> 0);
  const alive =
    ev.fate === "habitable" ||
    ev.fate === "teeming" ||
    ev.fate === "enduring" ||
    ev.lifeProb >= 0.18;
  // A look is owed. Empty is the log after, not the absence of a blink.
  const kinds: EncounterKind[] = [];
  if (alive) kinds.push("tau", "wow", "wow");
  if ((ev.eternalProb ?? 0) > 0.35 || ev.fate === "enduring") kinds.push("whale");
  if ((ev.swarmProb ?? 0) > 0.2) kinds.push("throat");
  kinds.push("wow", "throat", "classified", "zone");
  const kind = kinds[Math.floor(rng() * kinds.length)] ?? "wow";
  const side = rng() < 0.5 ? -1 : 1;
  return {
    kind,
    nx: side * (0.16 + rng() * 0.24),
    ny: -0.06 + (rng() - 0.5) * 0.26,
  };
}
