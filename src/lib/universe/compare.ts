import { formatGyr } from "./format.ts";
import type { ParamKey, UniverseParams } from "./types.ts";
import {
  OUR_UNIVERSE,
  friedmannAgeGyr,
  knownPlate,
  isOurParams,
  paramDeltas,
} from "./physics.ts";

export type CompareKnob = {
  key: ParamKey;
  delta: number;
  unit: string;
};

export type CompareReading = {
  ours: boolean;
  ageDeltaGyr: number;
  knobs: CompareKnob[];
};

const AGE_FLOOR_GYR = 0.15;
const KNOB_FLOOR = 0.005;

export function compareToOurs(params: UniverseParams): CompareReading {
  const ours = isOurParams(params);
  const ageDeltaGyr = friedmannAgeGyr(params) - friedmannAgeGyr(OUR_UNIVERSE);
  const knobs = paramDeltas(params)
    .filter((row) => Math.abs(row.delta) >= KNOB_FLOOR)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 2)
    .map((row) => ({ key: row.key, delta: row.delta, unit: row.unit }));
  return { ours, ageDeltaGyr, knobs };
}

export function formatDelta(delta: number): string {
  const digits = Math.abs(delta) < 0.01 && delta !== 0 ? 3 : 2;
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${Math.abs(delta).toFixed(digits)}`;
}

/** Localized name for a known plate. Random births keep their catalog name. */
export function plateTitle(
  params: UniverseParams,
  copy: {
    presetCluster: string;
    presetDwarf: string;
    presetSilicon: string;
    presetEternal: string;
    presetSwarm: string;
    presetHighway: string;
    presetBelt: string;
    presetDesert: string;
  },
  fallback: string,
): string {
  switch (knownPlate(params)) {
    case "cluster":
      return copy.presetCluster;
    case "dwarf":
      return copy.presetDwarf;
    case "silicon":
      return copy.presetSilicon;
    case "eternal":
      return copy.presetEternal;
    case "swarm":
      return copy.presetSwarm;
    case "highway":
      return copy.presetHighway;
    case "belt":
      return copy.presetBelt;
    case "desert":
      return copy.presetDesert;
    default:
      return fallback;
  }
}

export type CompareCopy = {
  versusHome: string;
  versusYounger: string;
  versusOlder: string;
  params: Record<ParamKey, { label: string }>;
};

function agePhrase(reading: CompareReading, copy: CompareCopy): string {
  const ageAbs = Math.abs(reading.ageDeltaGyr);
  if (ageAbs < AGE_FLOOR_GYR) return "";
  return `${reading.ageDeltaGyr < 0 ? copy.versusYounger : copy.versusOlder} ${formatGyr(ageAbs)}`;
}

export function formatCompareFlash(reading: CompareReading, copy: CompareCopy): string | null {
  if (reading.ours) return null;
  return agePhrase(reading, copy) || copy.versusHome;
}

export function formatCompareLine(reading: CompareReading, copy: CompareCopy): string | null {
  if (reading.ours) return null;
  const knobs = reading.knobs
    .map((k) => `${copy.params[k.key].label} ${formatDelta(k.delta)} ${k.unit}`)
    .join(" · ");
  const age = agePhrase(reading, copy);
  if (age && knobs) return `${age}. ${knobs}.`;
  if (age) return `${age}.`;
  if (knobs) return `${copy.versusHome}: ${knobs}.`;
  return copy.versusHome;
}
