import type {
  EnvironmentClass,
  EternalBlocker,
  EternalNiche,
  Evaluation,
  Fate,
  HubbleMix,
  Morphology,
  ParamMeta,
  SiliconBlocker,
  SiliconNiche,
  SolventClass,
  SwarmBlocker,
  SwarmNiche,
  UniverseParams,
} from "./types";
import { clamp, lerp, mulberry32 } from "./rng.ts";

/** Normalized to our universe. G = 1, H = 1, ΩΛ ≈ 0.69, Ωm ≈ 0.31. */
export const OUR_UNIVERSE: UniverseParams = {
  gravity: 1.0,
  expansion: 1.0,
  darkEnergy: 0.69,
  matter: 0.31,
  complexity: 0.36,
  quantumNoise: 0.1,
};

export const PARAM_META: ParamMeta[] = [
  {
    key: "gravity",
    label: "Gravity",
    unit: "G₀",
    min: 0.35,
    max: 2.2,
    step: 0.01,
    low: "weak",
    high: "crushing",
    hint: "Sets stellar mass and lifetime. Too strong and stars burn out before chemistry; too weak and fusion never starts.",
  },
  {
    key: "expansion",
    label: "Expansion",
    unit: "H₀",
    min: 0.25,
    max: 1.9,
    step: 0.01,
    low: "stalled",
    high: "runaway",
    hint: "Hubble flow. Fast expansion stretches overdensities apart before galaxies can form.",
  },
  {
    key: "darkEnergy",
    label: "Dark energy",
    unit: "ΩΛ",
    min: 0,
    max: 1,
    step: 0.01,
    low: "absent",
    high: "dominant",
    hint: "Late-time acceleration. A little lets structure freeze in; too much rips the sky apart. Near zero, no de Sitter horizon — Dyson’s loophole for unbounded minds stays open.",
  },
  {
    key: "matter",
    label: "Matter density",
    unit: "Ωm",
    min: 0.05,
    max: 1.8,
    step: 0.01,
    low: "thin",
    high: "dense",
    hint: "Fuel for stars and galaxies — baryons plus the halo. Too little and nothing collapses; too much and the universe recollapses or is black-hole dominated.",
  },
  {
    key: "complexity",
    label: "Initial order",
    unit: "σ",
    min: 0,
    max: 1,
    step: 0.01,
    low: "smooth",
    high: "structured",
    hint: "How organized the primordial overdensities are. Smooth fields stay fog; too much order without noise makes sterile ellipses. Also loads baryons: more order, thinner halo.",
  },
  {
    key: "quantumNoise",
    label: "Quantum noise",
    unit: "δ",
    min: 0,
    max: 0.5,
    step: 0.005,
    low: "silent",
    high: "turbulent",
    hint: "Inflationary seeds. A whisper of noise grows into galaxies. A roar shreds them into irregular clumps.",
  },
];

export const FATE_LABEL: Record<Fate, string> = {
  void: "Empty epoch",
  crunch: "Big Crunch",
  rip: "Runaway void",
  flash: "Stellar flash",
  fog: "Diffuse fog",
  sterile: "Sterile galaxies",
  enduring: "Enduring remnant",
  habitable: "Habitable",
  teeming: "Teeming",
};

export const FATE_COPY: Record<Fate, string> = {
  void: "Hydrogen never gathers. No stars ignite. The cosmos is a cooling fog with nothing to see it.",
  crunch: "Matter wins the tug-of-war. Expansion stalls, reverses, and the universe ends in fire before chemistry has a chance.",
  rip: "Acceleration tears overdensities apart. Galaxies never assemble; spacetime goes dark and lonely.",
  flash: "Stars form, burn at a sprint, and die. There is no Gyr-scale quiet for planets or cells.",
  fog: "Fluctuations are the wrong amplitude. Structure stays a haze — no spirals, no disks, no homes.",
  sterile: "Galaxies exist, but the window for complex chemistry never opens. Beautiful, and empty of minds.",
  enduring:
    "Stars die, but Λ never lights a horizon. Remnants keep a finite energy budget that Dyson showed can buy unbounded subjective time — if particle physics cooperates.",
  habitable: "A narrow anthropic corridor. Stars live long enough, metals accumulate, and liquid-water worlds are not forbidden.",
  teeming: "Several generations of stars, a long quiet era, and a sky dense with stable systems. Life is not a miracle here — it is likely.",
};

function gauss(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function siliconNicheOf(p: number): SiliconNiche {
  if (p >= 0.45) return "favored";
  if (p >= 0.18) return "viable";
  if (p >= 0.05) return "marginal";
  return "impossible";
}

function eternalNicheOf(p: number): EternalNiche {
  if (p >= 0.45) return "dyson";
  if (p >= 0.18) return "open";
  if (p >= 0.05) return "glimpse";
  return "closed";
}

function swarmNicheOf(p: number): SwarmNiche {
  if (p >= 0.45) return "tide";
  if (p >= 0.18) return "bloom";
  if (p >= 0.05) return "seed";
  return "silent";
}

/**
 * Local-density analog. Our universe lands in a group (~0.32).
 * Dense clusters quench spirals into ellipticals — the morphology–density relation.
 */
export function environmentDensity(params: UniverseParams): number {
  return clamp(
    params.matter * 0.6 + params.complexity * 0.4 - params.expansion * 0.15 + 0.14,
    0,
    1,
  );
}

export function environmentClass(env: number): EnvironmentClass {
  if (env < 0.28) return "field";
  if (env < 0.55) return "group";
  return "cluster";
}

/** Dressler 1980 morphology–density: field ≈ 70/15/15, cluster ≈ 25/65/10. */
export function hubbleMix(env: number): HubbleMix {
  const spiral = lerp(0.72, 0.22, env);
  const elliptical = lerp(0.14, 0.68, env);
  const irregular = clamp(1 - spiral - elliptical, 0.05, 0.35);
  const s = spiral + elliptical + irregular;
  return { spiral: spiral / s, elliptical: elliptical / s, irregular: irregular / s };
}

/** Ωb analog. Baryogenesis from initial order, not a share that scales with Ωm.
 *  Our sky pins at 0.049 (Planck baryons). */
export function omegaBaryon(params: UniverseParams): number {
  const load = 0.7 + params.complexity * 0.6;
  return clamp(0.049 * (load / 0.916), 0.012, 0.12);
}

/** Ωc / Ωm analog. Our sky is ~0.84, near Planck. More matter at fixed baryons is more halo. */
export function darkMatterFraction(params: UniverseParams): number {
  const ob = omegaBaryon(params);
  const om = Math.max(params.matter, ob + 1e-4);
  return clamp(1 - ob / om, 0.6, 0.94);
}

/** Time from first stars to a quiet wet-chemistry window. Shared with the epoch strip. */
export const CHEM_DELAY_GYR = 3.8;

export function evaluate(params: UniverseParams): Evaluation {
  const g = params.gravity;
  const h = params.expansion;
  const de = params.darkEnergy;
  const m = params.matter;
  const c = params.complexity;
  const q = params.quantumNoise;

  const dm = darkMatterFraction(params);

  const clustering =
    gauss(g, 1.0, 0.42) * gauss(m, 0.34, 0.32) * gauss(h, 0.96, 0.38) *
    (0.84 + 0.16 * clamp(dm / 0.84, 0.5, 1.2));
  const seeds = gauss(q, 0.11, 0.1) * gauss(c, 0.38, 0.26);
  const deWindow = gauss(de, 0.68, 0.26);
  const structure = clamp(clustering * seeds * deWindow, 0, 1);

  const recollapseRisk = clamp(
    sigmoid((m - 0.85) * 4.2) *
      sigmoid((0.32 - de) * 6) *
      sigmoid(-(1 - m - de) * 4.5),
    0,
    1,
  );
  const runawayRisk = clamp(
    sigmoid((h - 1.45) * 5) * sigmoid((de - 0.78) * 6),
    0,
    1,
  );

  // Homology: nuclear timescale falls steeply with G.
  const stellarLifetimeGyr = 10 / Math.pow(Math.max(g, 0.2), 2.15);
  /** Pop III analog. Ours lands ~0.25 Gyr, not a Hubble time. */
  const timeToStarsGyr =
    (0.0235 * h) / (m * Math.max(c, 0.04) + 0.018) * (0.7 + de);
  const lifeWindowGyr = Math.max(0, stellarLifetimeGyr - timeToStarsGyr - CHEM_DELAY_GYR);
  const generations =
    stellarLifetimeGyr / Math.max(timeToStarsGyr + 2.12, 0.12);

  let life = structure * gauss(g, 1.0, 0.33);
  life *= sigmoid((lifeWindowGyr - 0.8) * 1.15);
  life *= sigmoid((generations - 2.2) * 1.4);
  life *= 1 - 0.85 * recollapseRisk;
  life *= 1 - 0.9 * runawayRisk;
  life = clamp(life * 0.54, 0, 0.97);

  // Silicon biochemistry is speculative. Si–Si bonds are weaker than C–C;
  // silanes hydrolyze in water; SiO2 is a sink in oxygen. The remaining niche
  // is hotter, higher-G, reducing worlds where reactions run on a shorter clock.
  const siStructure = clamp(
    gauss(g, 1.38, 0.5) * gauss(m, 0.52, 0.36) * gauss(h, 0.98, 0.4) * deWindow *
      gauss(q, 0.21, 0.12) * gauss(c, 0.4, 0.28),
    0,
    1,
  );
  let silicon = siStructure * gauss(g, 1.52, 0.3);
  silicon *= 1 - 0.62 * gauss(g, 1.0, 0.22);
  silicon *= sigmoid((stellarLifetimeGyr - 0.35) * 3.2);
  silicon *= 0.55 + 0.45 * gauss(stellarLifetimeGyr, 3.6, 2.4);
  silicon *= 1 - 0.75 * recollapseRisk;
  silicon *= 1 - 0.85 * runawayRisk;
  silicon = clamp(silicon * 0.78, 0, 0.93);

  // Eternal / Dyson corridor. Independent of the carbon deWindow (that
  // Gaussian is a late-time freeze-in for wet chemistry, not remnant
  // formation). Einstein–de Sitter and open Λ=0 skies still make galaxies.
  //
  // Dyson 1979: infinite subjective computation with finite energy iff the
  // universe has no event horizon and cools without bound.
  // Krauss & Starkman 2000: ΩΛ > 0 lights a de Sitter horizon — finite
  // entropy, constant temperature, the loophole closes.
  // Proton decay and Hawking evaporation remain un-vetoed particle-physics
  // questions; the 0.72 prefactor is that honesty, not a census of minds.
  const remnantClustering =
    gauss(g, 0.95, 0.38) * gauss(m, 0.3, 0.36) * gauss(h, 0.88, 0.32);
  const remnantSeeds = gauss(q, 0.11, 0.1) * gauss(c, 0.38, 0.26);
  const remnantStructure = clamp(remnantClustering * remnantSeeds, 0, 1);
  const lambdaOpen = gauss(de, 0.03, 0.11);
  const remnantLongevity = clamp(sigmoid((stellarLifetimeGyr - 4) * 0.45), 0, 1);
  let eternal =
    remnantStructure *
    lambdaOpen *
    (1 - recollapseRisk) *
    (1 - runawayRisk) *
    remnantLongevity *
    gauss(g, 0.92, 0.28);
  eternal = clamp(eternal * 0.72, 0, 0.91);

  // Von Neumann / Tipler envelope (Hart 1975, Tipler 1980): if a mind can
  // build one self-replicating probe, a galaxy-crossing wave is a clock
  // problem, not a miracle. Fermi's silence on our sky is the point of the
  // envelope — permission is not a detection. Expansion and a short stellar
  // clock veto the hop; metals and a host mind open it.
  const hostMind = Math.max(life, silicon * 0.82);
  const metals = clamp(
    structure * sigmoid((generations - 1.35) * 1.55) * gauss(m, 0.48, 0.28),
    0,
    1,
  );
  const reach =
    gauss(h, 0.68, 0.16) * gauss(de, 0.52, 0.18) * (1 - 0.92 * runawayRisk);
  const hopClock =
    sigmoid((stellarLifetimeGyr - 2.4) * 0.65) * sigmoid((lifeWindowGyr - 0.35) * 1.15);
  const hostGate = sigmoid((hostMind - 0.14) * 9);
  let swarm = metals * reach * hopClock * hostGate;
  swarm *= 1 - 0.82 * recollapseRisk;
  swarm *= 0.6 + 0.4 * gauss(g, 1.02, 0.28);
  swarm = clamp(swarm * 1.12, 0, 0.94);

  const noStars = g < 0.48 || m < 0.09;
  const shortLived = g > 1.72 && stellarLifetimeGyr < 3.2;

  let fate: Fate;
  if (noStars && structure < 0.12 && eternal < 0.18) fate = "void";
  else if (recollapseRisk > 0.55 && life < 0.2 && eternal < 0.18) fate = "crunch";
  else if (runawayRisk > 0.55 && life < 0.2 && eternal < 0.18) fate = "rip";
  else if (shortLived && life < 0.18) fate = "flash";
  else if (eternal >= 0.42 && life < 0.22) fate = "enduring";
  else if (structure < 0.1) fate = "fog";
  else if (life >= 0.52) fate = "teeming";
  else if (life >= 0.18) fate = "habitable";
  else fate = "sterile";

  const env = environmentDensity(params);
  const mix = hubbleMix(env);

  let morphology: Morphology;
  if (fate === "void" || m < 0.12 || structure < 0.05) morphology = "scattered";
  else if (q > 0.32 && c < 0.55) morphology = "irregular";
  else if (g > 1.42 && c < 0.42) morphology = "elliptical";
  else if (env > 0.64 && mix.elliptical > mix.spiral) morphology = "elliptical";
  else morphology = "spiral";

  return {
    lifeProb: life,
    siliconProb: silicon,
    siliconNiche: siliconNicheOf(silicon),
    eternalProb: eternal,
    eternalNiche: eternalNicheOf(eternal),
    remnantStructure,
    swarmProb: swarm,
    swarmNiche: swarmNicheOf(swarm),
    fate,
    morphology,
    stellarLifetimeGyr,
    timeToStarsGyr,
    lifeWindowGyr,
    generations,
    structure,
    recollapseRisk,
    runawayRisk,
    environmentDensity: env,
    darkMatterFraction: dm,
    hubbleMix: mix,
  };
}

export type DerivedAstro = {
  hubble: number;
  ageGyr: number;
  galaxyKpc: number;
  sfr: number;
  rhoCrit: number;
  omegaK: number;
};

const MPC_IN_METERS = 3.085677581e22;
const G_SI = 6.6743e-11;

/** Homology Friedmann age, radiation neglected. Ours lands near Planck 13.8 Gyr. */
export function friedmannAgeGyr(params: UniverseParams): number {
  const h0 = 67.4 * Math.max(params.expansion, 0.28);
  const om = Math.max(params.matter, 1e-4);
  const ol = Math.max(params.darkEnergy, 0);
  const ok = 1 - om - ol;
  const e = (a: number) => {
    const x = om / (a * a * a) + ok / (a * a) + ol;
    return Math.sqrt(Math.max(x, 1e-12));
  };
  const f = (a: number) => 1 / (Math.max(a, 1e-6) * e(a));
  const n = 24;
  const aMin = 1e-4;
  let acc = 0;
  let prevA = aMin;
  let prevF = f(aMin);
  for (let i = 1; i <= n; i++) {
    const a = aMin + ((1 - aMin) * i) / n;
    const fi = f(a);
    acc += 0.5 * (prevF + fi) * (a - prevA);
    prevA = a;
    prevF = fi;
  }
  return (977.8 / h0) * acc;
}

/** Homology scalings, not a Boltzmann code. Ours lands near Planck/MW ballparks. */
export function derivedAstro(
  params: UniverseParams,
  ev: Evaluation,
): DerivedAstro {
  const hubble = 67.4 * params.expansion;
  const h0Si = (hubble * 1000) / MPC_IN_METERS;
  return {
    hubble,
    ageGyr: friedmannAgeGyr(params),
    galaxyKpc:
      6 + 22 * ev.structure * Math.sqrt(Math.max(params.matter, 0.05)),
    sfr: ev.structure * params.complexity * Math.max(params.matter, 0.05) * 12,
    rhoCrit: (3 * h0Si * h0Si) / (8 * Math.PI * G_SI),
    omegaK: 1 - params.matter - params.darkEnergy,
  };
}

export type FactorId = "structure" | "time" | "generations" | "stability";
export type SiliconFactorId = "heat" | "pressure" | "solvent" | "timescale";
export type EternalFactorId = "horizon" | "remnants" | "longevity" | "future";
export type SwarmFactorId = "host" | "metals" | "reach" | "clock";

export function lifeFactors(
  ev: Evaluation,
): { id: FactorId; value: number }[] {
  return [
    { id: "structure", value: ev.structure },
    { id: "time", value: clamp(ev.lifeWindowGyr / 6, 0, 1) },
    { id: "generations", value: clamp((ev.generations - 0.8) / 4.5, 0, 1) },
    {
      id: "stability",
      value: clamp(1 - 0.7 * ev.recollapseRisk - 0.7 * ev.runawayRisk, 0, 1),
    },
  ];
}

export function siliconFactors(
  params: UniverseParams,
  ev: Evaluation,
): { id: SiliconFactorId; value: number }[] {
  const g = params.gravity;
  const m = params.matter;
  const q = params.quantumNoise;
  return [
    { id: "heat", value: gauss(g, 1.52, 0.3) },
    { id: "pressure", value: gauss(g * Math.sqrt(Math.max(m, 0.05)), 1.12, 0.4) },
    {
      id: "solvent",
      value: clamp(gauss(q, 0.21, 0.12) * (1 - 0.55 * gauss(g, 1.0, 0.22)), 0, 1),
    },
    {
      id: "timescale",
      value: clamp(
        sigmoid((ev.stellarLifetimeGyr - 0.35) * 3.2) *
          (0.55 + 0.45 * gauss(ev.stellarLifetimeGyr, 3.6, 2.4)),
        0,
        1,
      ),
    },
  ];
}

export function eternalFactors(
  params: UniverseParams,
  ev: Evaluation,
): { id: EternalFactorId; value: number }[] {
  return [
    { id: "horizon", value: gauss(params.darkEnergy, 0.03, 0.11) },
    { id: "remnants", value: ev.remnantStructure },
    {
      id: "longevity",
      value: clamp(sigmoid((ev.stellarLifetimeGyr - 4) * 0.45), 0, 1),
    },
    {
      id: "future",
      value: clamp(1 - ev.recollapseRisk - ev.runawayRisk, 0, 1),
    },
  ];
}

export function swarmFactors(
  params: UniverseParams,
  ev: Evaluation,
): { id: SwarmFactorId; value: number }[] {
  return [
    {
      id: "host",
      value: clamp(sigmoid((Math.max(ev.lifeProb, ev.siliconProb * 0.82) - 0.14) * 9), 0, 1),
    },
    {
      id: "metals",
      value: clamp(
        ev.structure *
          sigmoid((ev.generations - 1.35) * 1.55) *
          gauss(params.matter, 0.48, 0.28),
        0,
        1,
      ),
    },
    {
      id: "reach",
      value: clamp(
        gauss(params.expansion, 0.68, 0.16) *
          gauss(params.darkEnergy, 0.52, 0.18) *
          (1 - 0.92 * ev.runawayRisk),
        0,
        1,
      ),
    },
    {
      id: "clock",
      value: clamp(
        sigmoid((ev.stellarLifetimeGyr - 2.4) * 0.65) *
          sigmoid((ev.lifeWindowGyr - 0.35) * 1.15),
        0,
        1,
      ),
    },
  ];
}

export type SiliconDossier = {
  factors: { id: SiliconFactorId; value: number }[];
  solvent: SolventClass;
  starTempK: number;
  surfaceG: number;
  oxygenSink: number;
  clockGyr: number;
  blockers: SiliconBlocker[];
};

export function siliconDossier(
  params: UniverseParams,
  ev: Evaluation,
): SiliconDossier {
  const factors = siliconFactors(params, ev);
  const byId = Object.fromEntries(factors.map((f) => [f.id, f.value])) as Record<
    SiliconFactorId,
    number
  >;
  const g = params.gravity;
  const m = params.matter;
  const heat = byId.heat;
  const oxygenSink = gauss(g, 1.0, 0.22);

  let solvent: SolventClass;
  if (ev.structure < 0.06 || (heat < 0.12 && oxygenSink < 0.15)) solvent = "none";
  else if (oxygenSink > 0.5 && heat < 0.45) solvent = "water";
  else if (heat > 0.5 && oxygenSink < 0.35) solvent = "molten";
  else solvent = "reducing";

  const blockers: SiliconBlocker[] = [];
  if (byId.heat < 0.35) blockers.push("heat");
  if (byId.pressure < 0.35) blockers.push("pressure");
  if (byId.solvent < 0.35) blockers.push("solvent");
  if (byId.timescale < 0.35) blockers.push("timescale");
  if (ev.structure < 0.12) blockers.push("structure");
  if (ev.recollapseRisk > 0.45) blockers.push("collapse");
  if (ev.runawayRisk > 0.45) blockers.push("rip");

  return {
    factors,
    solvent,
    starTempK: Math.round(5772 * Math.pow(Math.max(g, 0.2), 0.55)),
    surfaceG: Number((g * Math.pow(Math.max(m, 0.05) / 0.31, 0.35)).toFixed(2)),
    oxygenSink,
    clockGyr: ev.stellarLifetimeGyr,
    blockers,
  };
}

export type EternalDossier = {
  factors: { id: EternalFactorId; value: number }[];
  lambda: number;
  horizonOpen: boolean;
  remnantFraction: number;
  clockGyr: number;
  subjective: "finite" | "unbounded";
  blockers: EternalBlocker[];
};

export function eternalDossier(
  params: UniverseParams,
  ev: Evaluation,
): EternalDossier {
  const factors = eternalFactors(params, ev);
  const byId = Object.fromEntries(factors.map((f) => [f.id, f.value])) as Record<
    EternalFactorId,
    number
  >;
  const blockers: EternalBlocker[] = [];
  if (byId.horizon < 0.35) blockers.push("horizon");
  if (byId.remnants < 0.22) blockers.push("remnants");
  if (ev.recollapseRisk > 0.45) blockers.push("crunch");
  if (ev.runawayRisk > 0.45) blockers.push("rip");
  if (ev.stellarLifetimeGyr < 3.2) blockers.push("flash");
  if (params.quantumNoise > 0.32) blockers.push("vacuum");

  const open = ev.eternalNiche === "open" || ev.eternalNiche === "dyson";
  return {
    factors,
    lambda: params.darkEnergy,
    horizonOpen: byId.horizon >= 0.35,
    remnantFraction: ev.remnantStructure,
    clockGyr: ev.stellarLifetimeGyr,
    subjective: open ? "unbounded" : "finite",
    blockers,
  };
}

export type SwarmDossier = {
  factors: { id: SwarmFactorId; value: number }[];
  hops: number;
  crossingMyr: number;
  metalIndex: number;
  host: number;
  blockers: SwarmBlocker[];
};

export function swarmDossier(
  params: UniverseParams,
  ev: Evaluation,
): SwarmDossier {
  const factors = swarmFactors(params, ev);
  const byId = Object.fromEntries(factors.map((f) => [f.id, f.value])) as Record<
    SwarmFactorId,
    number
  >;
  const blockers: SwarmBlocker[] = [];
  if (byId.host < 0.28) blockers.push("host");
  if (byId.metals < 0.32) blockers.push("metals");
  if (byId.reach < 0.32) blockers.push("reach");
  if (byId.clock < 0.32) blockers.push("clock");
  if (ev.structure < 0.12) blockers.push("fog");
  if (ev.recollapseRisk > 0.45) blockers.push("crunch");
  if (ev.runawayRisk > 0.45) blockers.push("rip");

  const crossingMyr = Math.round(lerp(220, 8, byId.reach));
  const hops = Math.max(1, Math.round(lerp(3, 48, ev.swarmProb)));
  return {
    factors,
    hops,
    crossingMyr,
    metalIndex: byId.metals,
    host: Math.max(ev.lifeProb, ev.siliconProb),
    blockers,
  };
}

export function snapParams(params: UniverseParams): UniverseParams {
  const next = { ...params };
  for (const meta of PARAM_META) {
    const digits = meta.step < 0.01 ? 3 : 2;
    const v = next[meta.key];
    next[meta.key] = Number.isFinite(v)
      ? Number(v.toFixed(digits))
      : OUR_UNIVERSE[meta.key];
  }
  return next;
}

export function randomParams(rng: () => number): UniverseParams {
  return snapParams({
    gravity: lerp(0.35, 2.2, rng()),
    expansion: lerp(0.25, 1.9, rng()),
    darkEnergy: rng(),
    matter: lerp(0.05, 1.8, rng()),
    complexity: rng(),
    quantumNoise: rng() * 0.5,
  });
}

function randn(rng: () => number): number {
  const u = Math.max(rng(), 1e-9);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function jitter(
  rng: () => number,
  mu: number,
  sigma: number,
  min: number,
  max: number,
): number {
  return clamp(mu + randn(rng) * sigma, min, max);
}

export function nearGoldilocks(rng: () => number): UniverseParams {
  return snapParams({
    gravity: jitter(rng, 1.0, 0.18, 0.35, 2.2),
    expansion: jitter(rng, 1.0, 0.16, 0.25, 1.9),
    darkEnergy: jitter(rng, 0.69, 0.12, 0, 1),
    matter: jitter(rng, 0.31, 0.12, 0.05, 1.8),
    complexity: jitter(rng, 0.36, 0.14, 0, 1),
    quantumNoise: jitter(rng, 0.1, 0.05, 0, 0.5),
  });
}

export function nearSilicon(rng: () => number): UniverseParams {
  return snapParams({
    gravity: jitter(rng, 1.52, 0.16, 0.9, 2.15),
    expansion: jitter(rng, 0.98, 0.14, 0.25, 1.9),
    darkEnergy: jitter(rng, 0.64, 0.12, 0, 1),
    matter: jitter(rng, 0.55, 0.14, 0.15, 1.5),
    complexity: jitter(rng, 0.4, 0.12, 0, 1),
    quantumNoise: jitter(rng, 0.22, 0.05, 0.04, 0.45),
  });
}

export function nearEternal(rng: () => number): UniverseParams {
  return snapParams({
    gravity: jitter(rng, 0.92, 0.14, 0.55, 1.45),
    expansion: jitter(rng, 0.85, 0.12, 0.5, 1.25),
    darkEnergy: jitter(rng, 0.04, 0.035, 0, 0.2),
    matter: jitter(rng, 0.28, 0.1, 0.12, 0.65),
    complexity: jitter(rng, 0.4, 0.12, 0, 1),
    quantumNoise: jitter(rng, 0.11, 0.04, 0.02, 0.32),
  });
}

export function nearSwarm(rng: () => number): UniverseParams {
  return snapParams({
    gravity: jitter(rng, 1.0, 0.1, 0.75, 1.3),
    expansion: jitter(rng, 0.68, 0.08, 0.42, 1.0),
    darkEnergy: jitter(rng, 0.52, 0.08, 0.2, 0.72),
    matter: jitter(rng, 0.46, 0.1, 0.22, 0.85),
    complexity: jitter(rng, 0.44, 0.1, 0.18, 0.9),
    quantumNoise: jitter(rng, 0.1, 0.03, 0.03, 0.24),
  });
}

function interestingScore(ev: Evaluation): number {
  return Math.max(ev.lifeProb, ev.siliconProb, ev.eternalProb, ev.swarmProb);
}

export function survey(
  count: number,
  seed: number,
  target?: "carbon" | "silicon" | "eternal" | "swarm",
): { params: UniverseParams; evaluation: Evaluation; visualSeed: number }[] {
  const rng = mulberry32(seed);
  const wild = Math.floor(count * 0.28);
  const carbon = Math.floor(count * 0.24);
  const silicon = Math.floor(count * 0.18);
  const swarmN = Math.floor(count * 0.14);
  const out: { params: UniverseParams; evaluation: Evaluation; visualSeed: number }[] =
    [];
  for (let i = 0; i < count; i++) {
    const visualSeed = Math.floor(rng() * 0xffffffff) || 1;
    const params =
      i < wild
        ? randomParams(rng)
        : i < wild + carbon
          ? nearGoldilocks(rng)
          : i < wild + carbon + silicon
            ? nearSilicon(rng)
            : i < wild + carbon + silicon + swarmN
              ? nearSwarm(rng)
            : nearEternal(rng);
    out.push({ params, evaluation: evaluate(params), visualSeed });
  }
  const score = (ev: Evaluation) =>
    target === "silicon"
      ? ev.siliconProb
      : target === "eternal"
        ? ev.eternalProb
        : target === "swarm"
          ? ev.swarmProb
          : target === "carbon"
            ? ev.lifeProb
            : interestingScore(ev);
  out.sort((a, b) => score(b.evaluation) - score(a.evaluation));
  return out;
}

export function refine(
  params: UniverseParams,
  seed: number,
  target: "carbon" | "silicon" | "eternal" | "swarm",
): UniverseParams {
  const rng = mulberry32(seed);
  let best = snapParams(params);
  const scoreOfTarget = (ev: Evaluation) =>
    target === "silicon"
      ? ev.siliconProb
      : target === "eternal"
        ? ev.eternalProb
        : target === "swarm"
          ? ev.swarmProb
          : ev.lifeProb;
  let bestScore = scoreOfTarget(evaluate(best));
  for (let i = 0; i < 28; i++) {
    const candidate = snapParams({
      gravity: clamp(best.gravity + randn(rng) * 0.07, 0.35, 2.2),
      expansion: clamp(best.expansion + randn(rng) * 0.06, 0.25, 1.9),
      darkEnergy: clamp(best.darkEnergy + randn(rng) * 0.05, 0, 1),
      matter: clamp(best.matter + randn(rng) * 0.06, 0.05, 1.8),
      complexity: clamp(best.complexity + randn(rng) * 0.05, 0, 1),
      quantumNoise: clamp(best.quantumNoise + randn(rng) * 0.03, 0, 0.5),
    });
    const ev = evaluate(candidate);
    const score = scoreOfTarget(ev);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

export function isOurParams(params: UniverseParams): boolean {
  return PARAM_META.every(
    (meta) => Math.abs(params[meta.key] - OUR_UNIVERSE[meta.key]) < 1e-6,
  );
}

export function paramDeltas(params: UniverseParams) {
  return PARAM_META.map((meta) => ({
    key: meta.key,
    unit: meta.unit,
    value: params[meta.key],
    ours: OUR_UNIVERSE[meta.key],
    delta: params[meta.key] - OUR_UNIVERSE[meta.key],
  }));
}

export const OUR_SEED = 0x4c91a2e1;

export const SILICON_CORRIDOR: UniverseParams = {
  gravity: 1.52,
  expansion: 0.98,
  darkEnergy: 0.64,
  matter: 0.55,
  complexity: 0.4,
  quantumNoise: 0.22,
};

export const DESERT_EPOCH: UniverseParams = {
  gravity: 0.72,
  expansion: 1.72,
  darkEnergy: 0.88,
  matter: 0.08,
  complexity: 0.12,
  quantumNoise: 0.38,
};

export const SILICON_SEED = 0x51c011c0;
export const DESERT_SEED = 0xde5e4700;
export const ETERNAL_SEED = 0xe7e4a100;
export const SWARM_SEED = 0xa51c01d;
export const CLUSTER_SEED = 0xc15e0001;
export const DWARF_SEED = 0xd4af0001;

/** Cluster elliptical. Magorrian on, MAD / FR I. Not a Virgo census. */
export const CLUSTER_SKY: UniverseParams = {
  ...OUR_UNIVERSE,
  matter: 1.1,
};

/** Dwarf irregular. Minor encounter, quiet hole. Not a Local Group catalog. */
export const DWARF_SKY: UniverseParams = {
  ...OUR_UNIVERSE,
  matter: 0.1,
  complexity: 0.15,
  quantumNoise: 0.45,
};

function sameSky(params: UniverseParams, plate: UniverseParams): boolean {
  return PARAM_META.every(
    (meta) => Math.abs(params[meta.key] - plate[meta.key]) < 1e-6,
  );
}

export function isClusterSky(params: UniverseParams): boolean {
  return sameSky(params, CLUSTER_SKY);
}

export function isDwarfSky(params: UniverseParams): boolean {
  return sameSky(params, DWARF_SKY);
}

/** Open-universe, near-zero Λ. Dyson 1979 loophole; not our sky. */
export const ETERNAL_CORRIDOR: UniverseParams = {
  gravity: 0.92,
  expansion: 0.85,
  darkEnergy: 0.04,
  matter: 0.28,
  complexity: 0.4,
  quantumNoise: 0.11,
};

/** Long clock, metals, reachable disks — von Neumann envelope. Not a detection. */
export const SWARM_CORRIDOR: UniverseParams = {
  gravity: 1.0,
  expansion: 0.68,
  darkEnergy: 0.52,
  matter: 0.46,
  complexity: 0.44,
  quantumNoise: 0.1,
};

/** One road, two lanes, no towns for a Hubble time. Homology, not a franchise. */
export const HIGHWAY_CORRIDOR: UniverseParams = {
  gravity: 0.92,
  expansion: 1.48,
  darkEnergy: 0.4,
  matter: 0.14,
  complexity: 0.32,
  quantumNoise: 0.07,
};

/** Sparse ice. The mass that still moves is cold. Homology, not a series. */
export const BELT_CORRIDOR: UniverseParams = {
  gravity: 0.84,
  expansion: 1.14,
  darkEnergy: 0.5,
  matter: 0.17,
  complexity: 0.52,
  quantumNoise: 0.1,
};

export const HIGHWAY_SEED = 0x46046000;
export const BELT_SEED = 0x1cebe170;

export function isHighwayParams(params: UniverseParams): boolean {
  return PARAM_META.every(
    (meta) => Math.abs(params[meta.key] - HIGHWAY_CORRIDOR[meta.key]) < 1e-6,
  );
}

export function isBeltParams(params: UniverseParams): boolean {
  return PARAM_META.every(
    (meta) => Math.abs(params[meta.key] - BELT_CORRIDOR[meta.key]) < 1e-6,
  );
}

export type KnownPlate =
  | "ours"
  | "cluster"
  | "dwarf"
  | "silicon"
  | "eternal"
  | "swarm"
  | "highway"
  | "belt"
  | "desert";

export function knownPlate(params: UniverseParams): KnownPlate | null {
  if (isOurParams(params)) return "ours";
  if (sameSky(params, CLUSTER_SKY)) return "cluster";
  if (sameSky(params, DWARF_SKY)) return "dwarf";
  if (sameSky(params, SILICON_CORRIDOR)) return "silicon";
  if (sameSky(params, ETERNAL_CORRIDOR)) return "eternal";
  if (sameSky(params, SWARM_CORRIDOR)) return "swarm";
  if (sameSky(params, HIGHWAY_CORRIDOR)) return "highway";
  if (sameSky(params, BELT_CORRIDOR)) return "belt";
  if (sameSky(params, DESERT_EPOCH)) return "desert";
  return null;
}

export const MORPHOLOGY_LABEL: Record<Morphology, string> = {
  scattered: "Field of embers",
  irregular: "Irregular",
  elliptical: "Elliptical",
  spiral: "Spiral",
};
