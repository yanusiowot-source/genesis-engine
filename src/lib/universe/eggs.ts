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
  | "dot"
  | "tau"
  | "tide"
  | "fiftyone"
  | "highway"
  | "zone"
  | "ice"
  | "wow"
  | "witness"
  | "throat";

export type EggFlags = {
  whale: boolean;
  tau: boolean;
  classified: boolean;
  zone: boolean;
  wow: boolean;
  witness: boolean;
  throat: boolean;
};

export const QUIET_EGGS: EggFlags = {
  whale: false,
  tau: false,
  classified: false,
  zone: false,
  wow: false,
  witness: false,
  throat: false,
};

/** Incomplete buffers that should hold shortcuts until the code finishes or times out. */
export const EGG_CODES = [
  "042",
  "twl",
  "tau",
  "тау",
  "кита",
  "uuddlrlr",
  "vnm",
  "a51",
  "r60",
  "zon",
  "ice",
  "wow",
  "wit",
  "gt",
] as const;

export function isEggPrefix(buf: string): boolean {
  if (!buf) return false;
  return EGG_CODES.some((code) => code.startsWith(buf) && code.length > buf.length);
}

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
 * swallows the last key of a completed code — and holds a prefix
 * (r60, zon, twl) so Refine / Ours / Laws do not steal the joke.
 *
 * 042 — the answer (loads Deep Thought / catalog 42)
 * twl — towel
 * tau / тау / кита — Tau Ceti (Vysotsky homology; not a detection)
 * vnm — von Neumann tide
 * a51 — the plate is classified
 * r60 — the long road
 * zon — submitted for your approval
 * ice — a thin ice economy, not a series
 * wow — Big Ear 1977, a spike, not a telegram
 * wit — look, don't land
 * gt — a traversable throat (Morris–Thorne), not a franchise door
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
  if (next.endsWith("tau") || next.endsWith("тау") || next.endsWith("кита")) return { buf: "", hit: "tau" };
  if (next.endsWith("uuddlrlr")) return { buf: "", hit: "panic" };
  if (next.endsWith("vnm")) return { buf: "", hit: "tide" };
  if (next.endsWith("a51")) return { buf: "", hit: "fiftyone" };
  if (next.endsWith("r60")) return { buf: "", hit: "highway" };
  if (next.endsWith("zon")) return { buf: "", hit: "zone" };
  if (next.endsWith("ice")) return { buf: "", hit: "ice" };
  if (next.endsWith("wow")) return { buf: "", hit: "wow" };
  if (next.endsWith("wit")) return { buf: "", hit: "witness" };
  if (next.endsWith("gt")) return { buf: "", hit: "throat" };
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
