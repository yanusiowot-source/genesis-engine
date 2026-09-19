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

/**
 * Von Neumann / Tipler machine ecology — not a franchise, not a census.
 * silent — no metals, no time, or the sky rips before a hop
 * seed   — a launch is not forbidden; the galaxy is not eaten
 * bloom  — replication and crossing times fit the stellar clock
 * tide   — the envelope peaks: a self-replicating wave could run
 */
export type SwarmNiche = "silent" | "seed" | "bloom" | "tide";

/**
 * Dark-matter homology — not a WIMP census.
 * keplerian — outer disk follows visible mass
 * partial  — some extra speed, not yet a Rubin curve
 * held     — outer disk too fast for baryons (the detection)
 * heavy    — almost all the matter is unseen
 */
export type HaloNiche = "keplerian" | "partial" | "held" | "heavy";

/**
 * 3D dark-matter halo. Lensing stays NFW (Bartelmann).
 * einasto     — CDM default; finite at r=0
 * nfw         — cusp r⁻¹
 * burkert     — empirical core
 * corenfw     — Read 2016; NFW heated by dwarfs
 * isothermal  — flat outer disk
 */
export type HaloModelId = "einasto" | "nfw" | "burkert" | "corenfw" | "isothermal";

/**
 * Baryonic Tully–Fisher homology — not SPARC, not MOND.
 * below — too little baryon for the flat speed (halo-heavy)
 * ridge — sits on M_b ∝ v⁴
 * above — baryon-rich for the speed
 */
export type TfNiche = "below" | "ridge" | "above";

/**
 * Fundamental plane homology — not a photometric catalog.
 * tight  — sits on the observed Re–σ–I plane
 * tilted — virial (M/L) offset, still near the plane
 * off    — off both
 */
export type FpNiche = "tight" | "tilted" | "off";

/**
 * Dynamical M/L vs mass — not a stellar-population fit.
 * dwarf  — below M*, DM-heavy, Υ rises toward low mass
 * valley — near L*, minimum Υ
 * giant  — above M*, IMF + halo, Υ rises toward high mass
 */
export type MlBranch = "dwarf" | "valley" | "giant";

/**
 * High-mass IMF slope homology — not a star-by-star census.
 * top      — top-heavy; bursts, metal-poor, dwarfs
 * chabrier — MW disk
 * salpeter — single-slope 2.35
 * bottom   — bottom-heavy; massive ellipticals (Cappellari)
 */
export type ImfNiche = "top" | "chabrier" | "salpeter" | "bottom";

/**
 * Stellar-mass methods — not a catalog.
 * agree — photometry, virial and lens sit together
 * imf   — Chabrier light under-masses; kinematics and lens agree
 * halo  — extra mass in the well, IMF not the whole story
 * split — the three methods disagree
 */
export type MassMethodNiche = "agree" | "imf" | "halo" | "split";

/**
 * SMBH homology — not an event horizon.
 * quiet    — Magorrian too small to matter
 * maintain — radio-mode; heats without blowing the galaxy
 * quasar   — high return + a hole; a luminous episode
 * quench   — elliptical, Magorrian on, star formation buried
 */
export type AgnNiche = "quiet" | "maintain" | "quasar" | "quench";

/**
 * How the hole talks to the gas — not a GRMHD run.
 * off      — no coupling
 * wind     — radiatively efficient outflow (quasar mode)
 * jet      — radio/maintenance; bubbles in the hot halo
 */
export type AgnMode = "off" | "wind" | "jet";

/**
 * Conserved quantity in the flow.
 * none     — nothing launched
 * momentum — King; optically thick, L/c
 * energy   — Silk–Rees; PdV bubbles
 */
export type AgnDrive = "none" | "momentum" | "energy";

/**
 * GRMHD accretion state — not HARM, not EHT.
 * sane — weak flux, Standard And Normal Evolution
 * mad  — magnetically arrested; BZ jet
 * thin — radiatively efficient Novikov–Thorne disk
 */
export type GrmhdState = "sane" | "mad" | "thin";

/**
 * BZ field geometry — not a force-free grid.
 * monopole  — split-monopole; κ ≈ 0.053
 * parabolic — jet-like; κ ≈ 0.044
 */
export type BzGeometry = "monopole" | "parabolic";

/**
 * Large-scale poloidal flux — not an induction dump.
 * diffuse — thin disk; Lubow slip, field does not reach the hole
 * advect  — frozen-in inflow wins
 * expel   — MAD pile-up; buoyancy and the jet carry the excess out
 */
export type FluxTransport = "diffuse" | "advect" | "expel";

/**
 * kpc radio morphology — not a VLA map.
 * none — no jet
 * fri  — edge-darkened; radio mode
 * frii — edge-brightened hotspots
 */
export type FanaroffRiley = "none" | "fri" | "frii";

/**
 * CMB acoustic-peak homology — not CAMB, not Planck.
 * silent — no last-scattering contrast
 * damped — Silk-heavy; the ladder is washed
 * clear  — a voiced ladder near our sky
 * loaded — baryon-loaded odd peaks
 */
export type AcousticNiche = "silent" | "damped" | "clear" | "loaded";

/**
 * Disk hydrodynamics homology — Toomre Q, not Athena.
 * rigid       — little shear; a bulge or elliptical, not a wave
 * hot         — Q high; the disk is too warm to ring
 * marginal    — Q ~ 1–2; spiral waves live here
 * fragmenting — Q ≲ 1; the disk breaks into clumps
 */
export type DiskNiche = "rigid" | "hot" | "marginal" | "fragmenting";


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

export type SwarmBlocker =
  | "host"
  | "metals"
  | "reach"
  | "clock"
  | "fog"
  | "crunch"
  | "rip";

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
  swarmProb: number;
  swarmNiche: SwarmNiche;
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
