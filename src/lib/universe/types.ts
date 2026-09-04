export type UniverseParams = {
  gravity: number;
  expansion: number;
  darkEnergy: number;
  matter: number;
  complexity: number;
  quantumNoise: number;
};

export type Fate =
  | "void"
  | "crunch"
  | "rip"
  | "flash"
  | "fog"
  | "sterile"
  | "enduring"
  | "habitable"
  | "teeming";

export type Morphology = "scattered" | "irregular" | "elliptical" | "spiral";

export type HubbleMix = {
  spiral: number;
  elliptical: number;
  irregular: number;
};

export type EnvironmentClass = "field" | "group" | "cluster";

export type SiliconNiche = "impossible" | "marginal" | "viable" | "favored";

/**
 * Dyson 1979 vs Krauss–Starkman 2000.
 * closed  — de Sitter horizon (or no remnants) forbids infinite subjective time
 * glimpse — finite remnant computation, horizon still bites
 * open    — Λ near zero, crunch/rip absent; the loophole is not forbidden
 * dyson   — peak of the envelope; still not a proof of immortality
 */
export type EternalNiche = "closed" | "glimpse" | "open" | "dyson";

export type SolventClass = "none" | "water" | "reducing" | "molten";

export type SiliconBlocker =
  | "heat"
  | "pressure"
  | "solvent"
  | "timescale"
  | "structure"
  | "collapse"
  | "rip";

export type EternalBlocker =
  | "horizon"
  | "crunch"
  | "rip"
  | "remnants"
  | "flash"
  | "vacuum";

export type LabPane = "constants" | "hunt" | "life" | "laws" | "desk";

export type SkyMode = "galaxy" | "planetarium" | "lensing" | "collision";

export type CosmicEpoch =
  | "inflation"
  | "recombination"
  | "darkAges"
  | "reionization"
  | "stellar"
  | "degeneracy"
  | "blackHoles"
  | "heatDeath";

export type StellarStage =
  | "unborn"
  | "mainSequence"
  | "giant"
  | "supernova"
  | "whiteDwarf"
  | "neutronStar"
  | "blackHole";

export type Evaluation = {
  lifeProb: number;
  siliconProb: number;
  siliconNiche: SiliconNiche;
  eternalProb: number;
  eternalNiche: EternalNiche;
  remnantStructure: number;
  fate: Fate;
  morphology: Morphology;
  stellarLifetimeGyr: number;
  timeToStarsGyr: number;
  lifeWindowGyr: number;
  generations: number;
  structure: number;
  recollapseRisk: number;
  runawayRisk: number;
  environmentDensity: number;
  darkMatterFraction: number;
  hubbleMix: HubbleMix;
};

export type ParamKey = keyof UniverseParams;

export type UniverseRecord = {
  id: string;
  catalog: string;
  name: string;
  visualSeed: number;
  params: UniverseParams;
  evaluation: Evaluation;
  createdAt: number;
  chronicle?: string;
  locale?: string;
  starred?: boolean;
};

export type ParamMeta = {
  key: ParamKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  low: string;
  high: string;
  hint: string;
};
