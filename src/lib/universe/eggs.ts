import { PARAM_META } from "./physics.ts";
import { catalogId, hashParams } from "./rng.ts";
import type { UniverseParams } from "./types";

/** OUR_UNIVERSE + this seed → catalog GE-34298F. Visual only. */
export const ANSWER_SEED = 40;

export type EggKind =
  | "answer"
  | "whale"
  | "panic"
  | "towel"
  | "sand"
  | "god"
  | "andromeda"
  | "nothing"
  | "overcooked"
  | "light"
  | "voyager"
  | "thought"
  | "dot";

export type EggFlags = {
  whale: boolean;
};

export function sliderEgg(params: UniverseParams): "nothing" | "overcooked" | null {
  let lo = 0;
  let hi = 0;
  for (const meta of PARAM_META) {
    const span = meta.max - meta.min;
    if (span <= 0) continue;
    const t = (params[meta.key] - meta.min) / span;
    if (t <= 0.08) lo += 1;
    if (t >= 0.92) hi += 1;
  }
  const n = PARAM_META.length;
  if (lo === n) return "nothing";
  if (hi === n) return "overcooked";
  return null;
}

/**
 * Key sequences. Regular shortcuts still fire unless the caller
 * swallows the last key of a completed code.
 *
 * 042 — the answer (loads Deep Thought / catalog 42)
 * twl — towel (letters that don't steal birth/survey/evolve)
 * ↑↑↓↓←→←→ — don't panic
 */
export function noteEggKey(
  buf: string,
  key: string,
): { buf: string; hit: EggKind | null } {
  const lower = key.toLowerCase();
  const arrows: Record<string, string> = {
    arrowup: "u",
    arrowdown: "d",
    arrowleft: "l",
    arrowright: "r",
  };
  const ch = arrows[lower] ?? (lower.length === 1 ? lower : "");
  if (!ch) return { buf, hit: null };
  const next = (buf + ch).slice(-16);
  if (next.endsWith("042")) return { buf: "", hit: "answer" };
  if (next.endsWith("twl")) return { buf: "", hit: "towel" };
  if (next.endsWith("uuddlrlr")) return { buf: "", hit: "panic" };
  return { buf: next, hit: null };
}

export function answerCatalogForOurs(): string {
  return catalogId(hashParams(
    {
      gravity: 1,
      expansion: 1,
      darkEnergy: 0.69,
      matter: 0.31,
      complexity: 0.36,
      quantumNoise: 0.1,
    },
    ANSWER_SEED,
  ));
}
