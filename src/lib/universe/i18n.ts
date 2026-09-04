import type {
  CosmicEpoch,
  EnvironmentClass,
  EternalBlocker,
  EternalNiche,
  Fate,
  Morphology,
  ParamKey,
  SiliconBlocker,
  SiliconNiche,
  SkyMode,
  SolventClass,
} from "./types";
import type { InsightId, ResearchTarget } from "./research";
import type { CivStageId } from "./civilization";
import type { GradeId, TaxonId } from "./biosphere";
import type { SpectralType } from "./citizen";
import type { SkyClass } from "./zooniverse";
import { makeBe } from "./i18n-be.ts";
import { mergeCopy } from "./copy-merge.ts";
import { PACKS } from "./locales/packs.ts";
import { HUD } from "./locales/hud-packs.ts";
import { SETTINGS } from "./locales/settings-packs.ts";
import {
  AUTHORED,
  autonym,
  bcp47,
  canonicalLocale,
  hasPack,
  isKnownLocale,
} from "./languages-core.ts";

export type Locale = string;

export type Copy = {
  kicker: string;
  appName: string;
  birth: string;
  survey: string;
  ours: string;
  fate: string;
  life: string;
  stats: { stellar: string; first: string; window: string; generations: string };
  chronicle: string;
  chronicleHint: string;
  chronicleError: string;
  writing: string;
  rewrite: string;
  commission: string;
  copyId: string;
  copied: string;
  share: string;
  shared: string;
  log: string;
  logEmpty: string;
  english: string;
  russian: string;
  belarusian: string;
  switchToRu: string;
  switchToEn: string;
  switchToBe: string;
  install: string;
  installTitle: string;
  installBodyIos: string;
  installBodyOther: string;
  installStepShare: string;
  installStepHome: string;
  installCta: string;
  installDismiss: string;
  platforms: {
    title: string;
    intro: string;
    here: string;
    windowsTitle: string;
    windowsBody: string;
    linuxTitle: string;
    linuxBody: string;
    androidTitle: string;
    androidBody: string;
    iosTitle: string;
    iosBody: string;
    macBody: string;
    desktopHere: string;
    pwaHere: string;
  };
  skip: string;
  continue: string;
  enter: string;
  factorsTitle: string;
  epochTitle: string;
  epochOrigin: string;
  epochStars: string;
  epochLife: string;
  epochEnd: string;
  tabs: { sky: string; lab: string; log: string };
  onboarding: { title: string; body: string }[];
  fateLabel: Record<Fate, string>;
  fateCopy: Record<Fate, string>;
  morphology: Record<Morphology, string>;
  params: Record<ParamKey, { label: string; low: string; high: string; hint: string }>;
  factors: Record<"structure" | "time" | "generations" | "stability", string>;
  carbon: string;
  silicon: string;
  siliconTitle: string;
  siliconHint: string;
  siliconNote: Record<SiliconNiche, string>;
  siliconFactors: Record<"heat" | "pressure" | "solvent" | "timescale", string>;
  siliconOpen: string;
  siliconWhy: string;
  siliconFacts: [string, string, string];
  siliconThisSky: string;
  siliconStarT: string;
  siliconSurfaceG: string;
  siliconOxygen: string;
  siliconClock: string;
  siliconSolvent: string;
  solventLabel: Record<SolventClass, string>;
  siliconFactorHint: Record<"heat" | "pressure" | "solvent" | "timescale", string>;
  siliconBlockers: string;
  siliconBlocker: Record<SiliconBlocker, string>;
  siliconNoVeto: string;
  siliconVsCarbon: string;
  eternal: string;
  eternalTitle: string;
  eternalHint: string;
  eternalNote: Record<EternalNiche, string>;
  eternalFactors: Record<"horizon" | "remnants" | "longevity" | "future", string>;
  eternalOpen: string;
  eternalWhy: string;
  eternalFacts: [string, string, string];
  eternalThisSky: string;
  eternalLambda: string;
  eternalRemnants: string;
  eternalClock: string;
  eternalSubjective: string;
  subjectiveLabel: Record<"finite" | "unbounded", string>;
  eternalFactorHint: Record<"horizon" | "remnants" | "longevity" | "future", string>;
  eternalBlockers: string;
  eternalBlocker: Record<EternalBlocker, string>;
  eternalNoVeto: string;
  eternalVsLife: string;
  eternalCaveat: string;
  refine: string;
  more: string;
  closePanel: string;
  foldCorridors: string;
  foldObs: string;
  skies: string;
  appearance: string;
  contrast: string;
  textSize: string;
  textSizeSm: string;
  textSizeMd: string;
  textSizeLg: string;
  settings: string;
  settingsTitle: string;
  language: string;
  languageSearch: string;
  languageAuthored: string;
  languageCatalog: string;
  languageFallback: string;
  languageLoading: string;
  haptics: string;
  soundscape: string;
  soundOn: string;
  soundOff: string;
  musicTitle: string;
  musicHint: string;
  musicCosmos: string;
  musicOwn: string;
  musicPick: string;
  musicClear: string;
  musicVolume: string;
  musicPlaying: string;
  musicEmpty: string;
  tapToHear: string;
  help: string;
  helpTitle: string;
  helpIntro: string;
  helpItems: { title: string; body: string }[];
  labPaneHint: Record<"constants" | "hunt" | "life" | "laws" | "desk", string>;
  shortcutsTitle: string;
  shortcutsBody: string;
  astroTitle: string;
  astroHint: string;
  astroHubble: string;
  astroAge: string;
  astroGalaxy: string;
  astroSfr: string;
  astroRho: string;
  astroCurvature: string;
  astroFlat: string;
  presetSilicon: string;
  presetDesert: string;
  presetEternal: string;
  replayIntro: string;
  clearLog: string;
  clearLogConfirm: string;
  aboutTitle: string;
  aboutBody: string;
  studioHonesty: string;
  studioFreeTitle: string;
  studioFreeBody: string;
  studioKeepTitle: string;
  studioKeepBody: string;
  studioFollowCta: string;
  sourceCode: string;
  version: string;
  eggs: {
    answer: string;
    whale: string;
    panic: string;
    towel: string;
    sand: string;
    god: string;
    andromeda: string;
    nothing: string;
    overcooked: string;
    light: string;
    voyager: string;
    thought: string;
    dot: string;
    tau: string;
  };
  thisIsOurs: string;
  compareTitle: string;
  oursBadge: string;
  star: string;
  unstar: string;
  remove: string;
  filterAll: string;
  filterViable: string;
  filterStarred: string;
  obs: {
    modesLabel: string;
    modes: Record<SkyMode, string>;
    modeHint: Record<SkyMode, string>;
    evolve: string;
    evolving: string;
    now: string;
    collide: string;
    clock: string;
    epochs: Record<CosmicEpoch, string>;
    jumps: Record<"inflation" | "reionization" | "stellar" | "heatDeath", string>;
    epochHint: Record<CosmicEpoch, string>;
    hubbleTitle: string;
    hubbleHint: string;
    hubbleField: string;
    thisType: string;
    env: string;
    envLabel: Record<EnvironmentClass, string>;
    dm: string;
    cmb: string;
    hrTitle: string;
    hrHint: string;
    hrEmpty: string;
    hrT: string;
    hrL: string;
    censusMs: string;
    censusGiant: string;
    censusRemnant: string;
  };
  labPanes: { constants: string; hunt: string; life: string; laws: string; desk: string };
  research: {
    title: string;
    hint: string;
    run: string;
    target: Record<ResearchTarget, string>;
    targetHint: Record<ResearchTarget, string>;
    sample: string;
    viableC: string;
    viableSi: string;
    viableEt: string;
    corr: string;
    percentile: string;
    importance: string;
    importanceHint: string;
    local: string;
    fates: string;
    observer: string;
    theorist: string;
    apply: string;
    empty: string;
    insightsTitle: string;
    insights: Record<InsightId, string>;
  };
  civ: {
    title: string;
    hint: string;
    path: string;
    pathLabel: Record<"carbon" | "silicon" | "eternal" | "none", string>;
    intelligence: string;
    carrying: string;
    ships: string;
    collapsed: string;
    persists: string;
    ecology: string;
    biosphere: string;
    minds: string;
    stages: Record<CivStageId, string>;
    stageHint: Record<CivStageId, string>;
  };
  bio: {
    title: string;
    hint: string;
    world: string;
    galaxy: string;
    galaxyHint: string;
    development: string;
    taxaTitle: string;
    sortBiomass: string;
    sortSpecies: string;
    empty: string;
    siliconNote: string;
    eternalNote: string;
    earthNote: string;
    closed: string;
    open: string;
    taxa: Record<TaxonId, string>;
    grades: Record<GradeId, string>;
  };
  citizen: {
    title: string;
    hint: string;
    spectrum: string;
    spectrumAsk: string;
    transit: string;
    transitAsk: string;
    hasTransit: string;
    noTransit: string;
    next: string;
    correct: string;
    wrong: string;
    score: string;
    types: Record<SpectralType, string>;
  };
  report: {
    download: string;
    downloaded: string;
  };
  laws: {
    title: string;
    hint: string;
    symbolic: string;
    symbolicHint: string;
    discover: string;
    discovering: string;
    empty: string;
    r2Train: string;
    r2Test: string;
    aic: string;
    complexity: string;
    method: string;
    methodDict: string;
    methodGp: string;
    thisSky: string;
    thisSkyLaw: string;
    thisSkyTrue: string;
    residual: string;
    bayes: string;
    bayesHint: string;
    test: string;
    testing: string;
    param: string;
    dirLt: string;
    dirGt: string;
    threshold: string;
    pCond: string;
    pNot: string;
    delta: string;
    bf: string;
    logBf: string;
    ci: string;
    nCond: string;
    nNot: string;
    pGreater: string;
    support: Record<"strong" | "moderate" | "weak" | "none", string>;
    catalog: string;
    catalogHint: string;
    ra: string;
    dec: string;
    radius: string;
    load: string;
    loading: string;
    cached: string;
    stars: string;
    mag: string;
    detections: string;
    showSky: string;
    hideSky: string;
    cutout: string;
    cutoutHint: string;
    emptyCatalog: string;
    m31: string;
    plate: string;
    plateHint: string;
  };
  desk: {
    title: string;
    hint: string;
    mcmc: string;
    mcmcHint: string;
    run: string;
    running: string;
    empty: string;
    accept: string;
    ess: string;
    map: string;
    mean: string;
    prior: string;
    samples: string;
    loadMap: string;
    axes: string;
    exportTitle: string;
    fitsGalaxy: string;
    fitsMcmc: string;
    fitsCatalog: string;
    votable: string;
    votableMcmc: string;
    votableCatalog: string;
    markdown: string;
    docx: string;
    pptx: string;
    saved: string;
    needCatalog: string;
    needChain: string;
    citizen: string;
    citizenHint: string;
    classify: string;
    rating: string;
    submit: string;
    gold: string;
    match: string;
    miss: string;
    board: string;
    points: string;
    emptyBoard: string;
    zooniverse: string;
    subjects: string;
    local: string;
    classLabel: Record<SkyClass, string>;
  };
};

const en: Copy = {
  kicker: "Cosmological laboratory",
  appName: "Genesis Engine",
  birth: "Birth a universe",
  survey: "Survey 64",
  ours: "Our universe",
  fate: "Fate",
  life: "Intelligent life",
  stats: {
    stellar: "Stellar life",
    first: "First stars",
    window: "Life window",
    generations: "Generations",
  },
  chronicle: "Chronicle",
  chronicleHint: "A short field note from Grok, using these numbers.",
  chronicleError: "Chronicle failed. Try again.",
  writing: "Writing…",
  rewrite: "Rewrite",
  commission: "Commission chronicle",
  copyId: "Copy ID",
  copied: "Copied",
  share: "Share",
  shared: "Link ready",
  log: "Log",
  logEmpty: "Every universe you birth is kept here.",
  english: "English",
  russian: "Русский",
  belarusian: "Беларуская",
  switchToRu: "Switch chronicle and interface to Russian",
  switchToEn: "Switch chronicle and interface to English",
  switchToBe: "Switch chronicle and interface to Belarusian",
  install: "Install",
  installTitle: "Put it on this machine",
  installBodyIos:
    "Open the Share sheet, then choose Add to Home Screen. Genesis Engine opens as its own app, without the browser chrome.",
  installStepShare: "Tap Share in Safari",
  installStepHome: "Choose Add to Home Screen",
  installBodyOther:
    "Install Genesis Engine on this computer or phone. It opens full-screen and keeps your log on the device.",
  installCta: "Install this app",
  installDismiss: "Not now",
  platforms: {
    title: "On your computer or phone",
    intro: "Same laboratory on this computer or phone.",
    here: "This device",
    windowsTitle: "Windows",
    windowsBody:
      "In Edge or Chrome: menu → Install Genesis Engine. It lands in the Start menu like a program. A portable .exe is the same app in its own window, no browser chrome.",
    linuxTitle: "Linux",
    linuxBody:
      "In Chromium, Chrome or Edge: Install app. Or run the Linux desktop build — a window, not a tab.",
    androidTitle: "Android",
    androidBody:
      "Chrome → Add to Home screen. Later the same interface wraps in Android Studio via Capacitor (app.genesisengine.lab).",
    iosTitle: "iPhone / iPad",
    iosBody:
      "Safari only: Share → Add to Home Screen. Same Capacitor project opens it in Xcode when you want a store build.",
    macBody:
      "On a Mac: Safari or Chrome → Add to Dock / Install. Same universe, same log on this Mac.",
    desktopHere: "You are already inside the desktop app. This window is Genesis Engine — not a browser tab.",
    pwaHere: "Already installed on this device. Open it from the home screen or the Start menu.",
  },
  skip: "Skip",
  continue: "Continue",
  enter: "Begin",
  factorsTitle: "Why this probability",
  epochTitle: "Stellar ages",
  epochOrigin: "Origin",
  epochStars: "First stars",
  epochLife: "Life window",
  epochEnd: "Stellar end",
  tabs: { sky: "Sky", lab: "Lab", log: "Log" },
  onboarding: [
    {
      title: "Most skies stay empty",
      body: "Random constants almost never make stars. Tap «Birth a universe» to try yours.",
    },
    {
      title: "Six constants",
      body: "Open Lab, then Const. Grey ticks mark our universe. Drag a slider — the galaxy follows.",
    },
    {
      title: "Sky, Lab, Log",
      body: "Sky is the picture. Lab has the sliders, life corridors, and laws. Log keeps every sky you birth.",
    },
    {
      title: "Three corridors",
      body: "Carbon needs quiet water. Silicon, if it lives, wants heat. Eternal thought needs almost no dark energy.",
    },
  ],
  fateLabel: {
    void: "The void",
    crunch: "The crunch",
    rip: "Torn apart",
    flash: "Burnout",
    fog: "The fog",
    sterile: "Silent galaxies",
    enduring: "Enduring",
    habitable: "A foothold",
    teeming: "Alive",
  },
  fateCopy: {
    void: "Nothing ever catches fire. A cooling fog, and no one left to name it.",
    crunch: "Matter wins the tug. The sky falls inward and burns before anything can live.",
    rip: "The expansion never lets go. Galaxies never form. The night stays empty.",
    flash: "Stars are born in a hurry and die in one. No quiet centuries for a world to cool.",
    fog: "The first ripples were the wrong size. The sky never sharpens into galaxies.",
    sterile: "Beautiful disks. Empty of chemistry. A museum with no visitors.",
    enduring:
      "Stars go out. No horizon. Remnants can think without bound — Dyson 1979, if particle physics agrees.",
    habitable: "A thin chance. Stars last. Metals seed. Water worlds are not forbidden.",
    teeming: "Generations of stars, long nights, crowded quiet. Here, life is the default.",
  },
  morphology: {
    scattered: "Field of embers",
    irregular: "Irregular",
    elliptical: "Elliptical",
    spiral: "Spiral",
  },
  params: {
    gravity: {
      label: "Gravity",
      low: "weak",
      high: "crushing",
      hint: "Sets stellar mass and lifetime. Too strong and stars burn out before chemistry; too weak and fusion never starts.",
    },
    expansion: {
      label: "Expansion",
      low: "stalled",
      high: "runaway",
      hint: "Hubble flow. Fast expansion stretches overdensities apart before galaxies can form.",
    },
    darkEnergy: {
      label: "Dark energy",
      low: "absent",
      high: "dominant",
      hint: "Late-time acceleration. A little lets structure freeze in; too much rips the sky apart. Near zero, no de Sitter horizon — Dyson’s loophole for unbounded minds stays open.",
    },
    matter: {
      label: "Matter density",
      low: "thin",
      high: "dense",
      hint: "Fuel for stars and galaxies. Too little and nothing collapses; too much and the universe recollapses.",
    },
    complexity: {
      label: "Initial order",
      low: "smooth",
      high: "structured",
      hint: "How organized the primordial overdensities are. Smooth fields stay fog.",
    },
    quantumNoise: {
      label: "Quantum noise",
      low: "silent",
      high: "turbulent",
      hint: "Inflationary seeds. A whisper of noise grows into galaxies. A roar shreds them into clumps.",
    },
  },
  factors: {
    structure: "Structure",
    time: "Time",
    generations: "Generations",
    stability: "Stability",
  },
  settings: "Settings",
  settingsTitle: "Settings",
  language: "Language",
  languageSearch: "Search 7,000 languages",
  languageAuthored: "Authored interface",
  languageCatalog: "ISO 639-3 living and constructed",
  languageFallback:
    "No authored interface yet. Labels stay English. The chronicle will try this language.",
  languageLoading: "Loading the catalog…",
  haptics: "Haptics",
  soundscape: "Sky music",
  soundOn: "Sky music on",
  soundOff: "Sky music off",
  musicTitle: "Music",
  musicHint: "Quiet chords follow the sliders. Or pick a file from this device.",
  musicCosmos: "Born with the sky",
  musicOwn: "My track",
  musicPick: "Choose a file",
  musicClear: "Remove track",
  musicVolume: "Volume",
  musicPlaying: "Playing",
  musicEmpty: "No file yet. MP3, AAC, WAV, FLAC, OGG.",
  tapToHear: "Tap to hear the sky",
  help: "How this works",
  helpTitle: "How to use the laboratory",
  helpIntro: "Three rooms: Sky, Lab, Log. Six constants. Three corridors where a mind might live.",
  helpItems: [
    {
      title: "Sky",
      body: "«Birth a universe» draws new constants. «Survey 64» tries many skies. «Refine» climbs from this one. The clock walks cosmic time.",
    },
    {
      title: "Lab · Const",
      body: "Six sliders. Grey ticks are ΛCDM — our universe. Carbon, silicon and eternity update as you drag.",
    },
    {
      title: "Lab · Hunt",
      body: "Search hundreds of random skies. Load a find onto the picture.",
    },
    {
      title: "Lab · Life",
      body: "A civilization path for this sky, then a short quiz on spectra and transits.",
    },
    {
      title: "Lab · Laws",
      body: "Fit a formula, test a cut, pull a real star plate onto the sky.",
    },
    {
      title: "Lab · Desk",
      body: "Walk the posterior cloud. Export FITS, VOTable or slides. Classify the disk.",
    },
    {
      title: "Log",
      body: "Every born sky lives here. Star the keepers. Clear only from Settings.",
    },
    {
      title: "Music",
      body: "The speaker starts a quiet pad. Settings → Music lets you play a file from this device.",
    },
  ],
  labPaneHint: {
    constants: "Six levers. Grey ticks are our universe.",
    hunt: "Three searchers across random skies. Load a find.",
    life: "Biosphere, biomass, and whether a mind could arise.",
    laws: "A formula, a test, a real star catalog.",
    desk: "Posterior cloud, export, classify.",
  },
  shortcutsTitle: "Keys",
  shortcutsBody: "B birth · S survey · R refine · E evolve · 1 sky · 2 lab · 3 log · Esc close",
  astroTitle: "Astrophysics (homology)",
  astroHint:
    "Scaled from the constants, not a Boltzmann solver. For our universe the numbers sit near Planck H₀, 13.8 Gyr, and a Milky-Way-sized disk.",
  astroHubble: "Hubble analog",
  astroAge: "Age analog",
  astroGalaxy: "Disk radius",
  astroSfr: "Star formation",
  astroRho: "Critical density",
  astroCurvature: "Curvature analog Ωk",
  astroFlat: "flat",
  presetSilicon: "Silicon corridor",
  presetDesert: "Desert epoch",
  presetEternal: "Dyson corridor",
  replayIntro: "Replay introduction",
  clearLog: "Clear log",
  clearLogConfirm: "Tap again to clear",
  aboutTitle: "About",
  aboutBody: "A cosmological laboratory on this machine. Sculpt the constants, watch a galaxy, hunt three thin corridors where a mind might live.",
  studioHonesty: "The physics is not for sale. Corridors are envelopes, not a census you can buy.",
  studioFreeTitle: "The lab stays free",
  studioFreeBody: "Sculpt, survey, export FITS and VOTable, run MCMC. No ads. No accounts. No subscription. Your journal stays on this device.",
  studioKeepTitle: "Keep a copy",
  studioKeepBody: "Install the app here. A paid desktop copy for Windows, macOS and Linux is next — not a lock on the sky, a way to take the instrument with you and work offline.",
  studioFollowCta: "Notes from the author on X",
  sourceCode: "© 2026 Ян Ярошевич. All rights reserved.",
  version: "Version 1.24",
  eggs: {
    answer: "The catalog of this sky contains 42.",
    whale: "A whale is drifting in the last ice. Jump the clock to End to see it.",
    panic: "Don’t Panic.",
    towel: "A towel is the most useful thing in the universe. It is not in the model.",
    sand: "On a wet world, silicon chemistry turns to sand.",
    god: "Unbounded thought is allowed here. Becoming a god is not.",
    andromeda: "Two galaxies collide. For our sky, Andromeda is still billions of years away.",
    nothing: "Every lever is on the floor. Nothing can form.",
    overcooked: "Every lever is at the ceiling. That is not how you cook a universe.",
    light: "Let there be light. Then the clock ends.",
    voyager: "You spun a full turn. A golden record, if anyone is still listening.",
    thought: "Deep Thought. The answer was 42. This is that sky.",
    dot: "A pale blue pixel. That’s us — if these constants are our universe.",
    tau: "Tau Ceti is twelve light-years out — a quiet G star with dusty worlds. Nobody has answered. Vysotsky’s song is a homology, not a census: if anyone lives there, they may not share our alphabet, our humour, or our way of becoming more.",
  },
  thisIsOurs: "These constants match our universe — ΛCDM, as we measure it.",
  compareTitle: "Versus our universe",
  oursBadge: "ΛCDM",
  star: "Star this sky",
  unstar: "Remove star",
  remove: "Remove from log",
  filterAll: "All",
  filterViable: "Viable",
  filterStarred: "Starred",
  carbon: "Carbon",
  silicon: "Silicon",
  siliconTitle: "Silicon biochemistry",
  siliconHint:
    "Speculative astrobiology, not a neural net. Silicon chains hate water and oxygen; they need heat, pressure, and a reducing solvent. Our universe scores near zero here — that is expected.",
  siliconNote: {
    impossible: "No foothold. Too cold, too wet, or nowhere to stand.",
    marginal: "A thin window. Chemistry might start. Minds are still a stretch.",
    viable: "Heat and pressure prefer silicon here. Intelligence is not forbidden.",
    favored: "Hostile to cells as we know them. Kind to something hotter.",
  },
  siliconFactors: {
    heat: "Heat",
    pressure: "Pressure",
    solvent: "Reducing solvent",
    timescale: "Reaction clock",
  },
  siliconOpen: "Open silicon dossier",
  siliconWhy: "Why silicon is hard",
  siliconFacts: [
    "Si–Si bonds are weaker than C–C (~226 vs ~346 kJ/mol). Chains fall apart unless the world is hot enough for continuous repair.",
    "Silanes hydrolyze in water. On a wet oxygen world, silicon locks as SiO₂ — sand, quartz, glass. That is a thermodynamic grave.",
    "Silicon atoms are larger and barely form double bonds. If information-rich chemistry exists, it wants a reducing, high-pressure solvent — not oceans.",
  ],
  siliconThisSky: "This sky",
  siliconStarT: "Stellar T analog",
  siliconSurfaceG: "Surface g analog",
  siliconOxygen: "Oxygen sink",
  siliconClock: "Reaction clock",
  siliconSolvent: "Likely solvent",
  solventLabel: {
    none: "No medium",
    water: "Water — hostile to silanes",
    reducing: "Reducing fluid",
    molten: "Molten silicates / hot acid",
  },
  siliconFactorHint: {
    heat: "Higher G makes hotter, shorter-lived stars. Silicon needs that heat; carbon burns out in it.",
    pressure: "Surface gravity and density decide whether an exotic solvent stays condensed.",
    solvent: "Distance from the quiet water corridor. Oxygen-rich G ≈ 1 worlds poison silanes.",
    timescale: "Hot chemistry is fast. A few Gyr can suffice; a stellar flash cannot.",
  },
  siliconBlockers: "What vetoes this sky",
  siliconBlocker: {
    heat: "Too cool — Si–Si repair cannot keep up.",
    pressure: "Too little pressure for a dense, reducing solvent.",
    solvent: "The solvent is water-like, or the reducing seeds are wrong.",
    timescale: "Stars die before even fast chemistry can organize.",
    structure: "No galaxies, no surfaces, nowhere to put a chemistry.",
    collapse: "Recollapse comes before a biochemistry can settle.",
    rip: "Acceleration tears overdensities apart.",
  },
  siliconNoVeto: "No hard veto. What remains is chemistry we have not seen — this number is an envelope, not a census of minds.",
  siliconVsCarbon: "Versus carbon on this sky",
  eternal: "Eternity",
  eternalTitle: "Dyson’s loophole",
  eternalHint:
    "Not magic immortality. Freeman Dyson (1979) showed a civilization with finite energy can think infinitely long if the universe has no event horizon and cools without bound. Krauss & Starkman (2000) closed that door wherever ΩΛ is positive — including here.",
  eternalNote: {
    closed: "A de Sitter horizon, a crunch, or missing remnants shut the infinite future. Subjective time is finite.",
    glimpse: "Remnants could compute for a long while. A horizon or a recollapse still cuts the series short.",
    open: "Λ is near zero and the future is not recollapsing. Dyson’s loophole is not forbidden. Proton decay is still an open question.",
    dyson: "Peak of the envelope: long-lived remnants, no horizon, no crunch. Unbounded subjective time is allowed — not proven.",
  },
  eternalFactors: {
    horizon: "Horizon",
    remnants: "Remnants",
    longevity: "Longevity",
    future: "Future",
  },
  eternalOpen: "Open eternity dossier",
  eternalWhy: "Why ‘forever’ is hard",
  eternalFacts: [
    "Dyson 1979: in an open, Λ=0 universe that cools forever, a finite energy budget can buy infinite subjective computation by thinking ever more slowly.",
    "Krauss & Starkman 2000: a positive cosmological constant lights a de Sitter horizon. Finite entropy, constant temperature — the loophole closes. Our ΩΛ ≈ 0.69 is a veto.",
    "Even with Λ=0, proton decay (if it exists) and Hawking evaporation of black holes would still end baryonic and black-hole computers. This score is an envelope, not a promise of gods.",
  ],
  eternalThisSky: "This sky",
  eternalLambda: "ΩΛ analog",
  eternalRemnants: "Remnant structure",
  eternalClock: "Stellar clock",
  eternalSubjective: "Subjective time",
  subjectiveLabel: {
    finite: "Finite — a horizon or a crunch",
    unbounded: "Unbounded — if particle physics cooperates",
  },
  eternalFactorHint: {
    horizon: "Gauss around ΩΛ ≈ 0. A de Sitter horizon is a hard no for infinite thought.",
    remnants: "Galaxies had to form so white dwarfs, neutron stars and black holes remain.",
    longevity: "Stars must live long enough to leave a dense remnant population.",
    future: "No Big Crunch, no Big Rip. The series of moments has to actually continue.",
  },
  eternalBlockers: "What vetoes this sky",
  eternalBlocker: {
    horizon: "de Sitter horizon — Krauss–Starkman. Positive Λ forbids infinite computation.",
    crunch: "Recollapse. The future ends in fire, not in a cooling bath.",
    rip: "Runaway expansion shreds remnants before they can think slowly.",
    remnants: "Too little structure. No stars, no white dwarfs, no computers.",
    flash: "Stars burn out too fast to seed a remnant era.",
    vacuum: "A noisy vacuum is a stand-in for faster decay and instability.",
  },
  eternalNoVeto:
    "No cosmological veto. What remains is particle physics we have not settled — proton decay, Hawking radiation. This number is an envelope, not immortality.",
  eternalVsLife: "Versus carbon and silicon",
  eternalCaveat:
    "Allowed is not inevitable. A mind that lives forever is a loophole in cosmology, still hostage to unknown particle physics.",
  refine: "Refine sky",
  more: "More skies",
  closePanel: "Close",
  foldCorridors: "Life corridors",
  foldObs: "Observatory",
  skies: "Known skies",
  appearance: "Appearance",
  contrast: "High contrast",
  textSize: "Text size",
  textSizeSm: "Small",
  textSizeMd: "Default",
  textSizeLg: "Large",
  obs: {
    modesLabel: "Sky mode",
    modes: {
      galaxy: "Galaxy",
      planetarium: "Inside",
      lensing: "Halo",
      collision: "Collide",
    },
    modeHint: {
      galaxy: "Look at the whole disk from outside.",
      planetarium: "Stand on a world inside the disk and drag the sky.",
      lensing: "Background galaxies warp around the unseen dark-matter halo.",
      collision: "Two galaxies fall together. Tidal tails, then one remnant.",
    },
    evolve: "Play cosmic time",
    evolving: "Pause cosmic time",
    now: "now",
    collide: "Collide galaxies",
    clock: "Cosmic time",
    epochs: {
      inflation: "Spark",
      recombination: "First glow",
      darkAges: "Dark ages",
      reionization: "Dawn",
      stellar: "Stars",
      degeneracy: "Fading",
      blackHoles: "Black holes",
      heatDeath: "Last heat",
    },
    jumps: {
      inflation: "Spark",
      reionization: "Dawn",
      stellar: "Stars",
      heatDeath: "End",
    },
    epochHint: {
      inflation:
        "A burst of expansion. The sky is a hot fog; no atoms, no galaxies, no night.",
      recombination:
        "Electrons lock to nuclei. The universe becomes transparent — the last scattering surface.",
      darkAges:
        "Neutral hydrogen, no stars. Structure is still a whisper in the dark.",
      reionization:
        "The first stars burn holes in the fog. Light returns to the cosmos.",
      stellar:
        "Galaxies assembled. Stars live, die, and seed metals. This is the era that can host chemistry.",
      degeneracy:
        "The last bright stars swell and fade. White dwarfs and cooling remnants inherit the sky.",
      blackHoles:
        "Starlight is gone. Only accretion glows and Hawking-quiet holes remain.",
      heatDeath:
        "Expansion wins. Photons redshift into nothing. No structure left to name.",
    },
    hubbleTitle: "Hubble types",
    hubbleHint:
      "Field galaxies are mostly spirals (~60%). Dense clusters quench disks into ellipticals. This mix follows that morphology–density relation.",
    hubbleField: "Expected mix in this environment",
    thisType: "This galaxy",
    env: "Environment",
    envLabel: { field: "Field", group: "Group", cluster: "Cluster" },
    dm: "Dark matter share",
    cmb: "CMB",
    hrTitle: "Stellar population",
    hrHint:
      "Hertzsprung–Russell analog: temperature against luminosity. Massive stars race off the main sequence; remnants collect at the dim end.",
    hrEmpty: "Stars have not ignited yet in this epoch.",
    hrT: "← hotter",
    hrL: "brighter →",
    censusMs: "Main sequence",
    censusGiant: "Giants",
    censusRemnant: "Remnants",
  },
  labPanes: { constants: "Const", hunt: "Hunt", life: "Life", laws: "Laws", desk: "Desk" },
  research: {
    title: "Expedition",
    hint: "Three agents on the closed-form physics — not a trained net. Observer draws a mixed prior (wild draws plus all three corridors). Theorist hill-climbs. Analyst permutes each constant and measures how hard the score moves.",
    run: "Run expedition",
    target: {
      carbon: "Carbon",
      silicon: "Silicon",
      eternal: "Eternity",
      overall: "Either",
      diversity: "Both",
    },
    targetHint: {
      carbon: "Search the quiet water corridor.",
      silicon: "Search the hot, reducing corridor.",
      eternal: "Search the near-zero-Λ Dyson loophole.",
      overall: "Take the better of carbon, silicon, or eternity.",
      diversity: "Rare skies where both chemistries are open.",
    },
    sample: "Prior",
    viableC: "Carbon-viable",
    viableSi: "Silicon-viable",
    viableEt: "Dyson-open",
    corr: "C–Si correlation",
    percentile: "This sky in the prior",
    importance: "What the prior cares about",
    importanceHint:
      "Permutation importance of the scoring model itself. Shuffle one constant across the sample; the score that jumps is the one that mattered.",
    local: "What this sky cares about",
    fates: "Fate mix in the prior",
    observer: "Observer",
    theorist: "Theorist",
    apply: "Load this sky",
    empty: "Run an expedition to map the prior. Most draws will be dead. That is the measurement.",
    insightsTitle: "Analyst",
    insights: {
      rareViable:
        "Habitable draws are a minority of the prior. Most random constants never open a chemistry.",
      gravityDominatesCarbon:
        "Gravity is the strongest lever on carbon. Stellar lifetime falls steeply with G.",
      gravityDominatesSilicon:
        "Gravity is the strongest lever on silicon. The corridor wants heat without a stellar flash.",
      disjointCorridors:
        "Carbon and silicon anti-correlate in this sample. The two chemistries barely share a sky.",
      expansionKills:
        "Expansion is a veto. Fast Hubble flow tears overdensities apart before galaxies assemble.",
      noiseSeeds:
        "Quantum noise is doing real work. Too little and the field stays fog; too much and disks shred.",
      matterCrunch:
        "Matter density is a hinge: too thin and nothing collapses; too thick and the cosmos recollapses.",
      thisSkyHigh:
        "This sky sits in the high tail of the prior for the chosen target. Worth starring.",
      thisSkyLow:
        "This sky is ordinary or worse than the prior. Refine, or hunt.",
      theoristImproved:
        "Theorist climbed past the Observer’s best draw. Hill-climbing found a tighter corridor.",
      darkEnergyDominatesEternal:
        "Dark energy is the hinge of eternity. A de Sitter horizon (ΩΛ ≳ 0) is the Krauss–Starkman veto.",
      eternalRare:
        "Dyson-open draws are scarce. Most random constants light a horizon, crunch, or leave no remnants.",
    },
  },
  civ: {
    title: "Intelligence window",
    hint: "A Drake-style bottleneck on this sky — not a census of minds.",
    path: "Chemistry path",
    pathLabel: {
      carbon: "Carbon–water",
      silicon: "Silicon (speculative)",
      eternal: "Dyson remnant",
      none: "No foothold",
    },
    intelligence: "P(intelligence)",
    carrying: "Carrying analog",
    ships: "Diaspora analog",
    collapsed: "The ecology analog collapses — recollapse, runaway, or extraction outruns growth.",
    persists:
      "Heat death does not close this window. If Λ stays near zero, remnant minds can slow without bound — Dyson, not rapture.",
    ecology: "Biosphere / minds analog",
    biosphere: "Biosphere",
    minds: "Minds",
    stages: {
      chemistry: "Chemistry",
      cells: "Cells",
      complex: "Complex life",
      minds: "Minds",
      tech: "Technology",
    },
    stageHint: {
      chemistry: "Whether a solvent and a backbone can exist at all.",
      cells: "Whether the window is long enough for a metabolism to lock in.",
      complex: "Whether generations of stars seed metals without shredding disks.",
      minds: "Whether stability and order leave room for information-rich systems.",
      tech: "Whether a mind, if it appears, has energy and time to build.",
    },
  },
  bio: {
    title: "Biosphere analog",
    hint: "Living mass on a typical habitable world, calibrated to Earth (Bar-On et al. 2018: ~550 Gt C). Homology from the constants, not a census of this galaxy.",
    world: "World analog",
    galaxy: "Disk envelope",
    galaxyHint: "Disk total = world analog × expected biospheres. Order of magnitude only — η_life is unknown.",
    development: "Potential development",
    taxaTitle: "By group",
    sortBiomass: "Biomass",
    sortSpecies: "Species",
    empty: "No chemistry. No biomass.",
    siliconNote: "Speculative Si-chain mass, not Earth taxa. Water worlds turn this to sand.",
    eternalNote: "No wet biosphere. Remnant minds are computation, not tissue.",
    earthNote: "Shares follow Earth’s living carbon: plants dominate mass; animals are a thin film.",
    closed: "closed",
    open: "open",
    taxa: {
      plants: "Plants",
      bacteria: "Bacteria",
      fungi: "Fungi",
      archaea: "Archaea",
      protists: "Protists",
      animals: "Animals",
      viruses: "Viruses",
      lattices: "Chemosynthetic lattices",
      chains: "Si-chain microbes",
      assemblers: "Assemblers",
    },
    grades: {
      prokaryotes: "Prokaryotes",
      photosynthesis: "Primary producers",
      eukaryotes: "Eukaryotes",
      multicellular: "Multicellular",
      animals: "Animals",
      minds: "Minds",
    },
  },
  citizen: {
    title: "Train your eye",
    hint: "Puzzles from this sky’s stars. Read a spectrum. Catch a transit.",
    spectrum: "Spectral class",
    spectrumAsk: "Which MK class is this continuum?",
    transit: "Transit hunt",
    transitAsk: "Is there a planetary transit in this light curve?",
    hasTransit: "Transit",
    noTransit: "No transit",
    next: "Next",
    correct: "Correct",
    wrong: "Not this class",
    score: "Eye",
    types: {
      O: "O · hot blue",
      B: "B · blue-white",
      A: "A · white",
      F: "F · yellow-white",
      G: "G · Sun-like",
      K: "K · orange",
      M: "M · cool red",
    },
  },
  report: {
    download: "Download field report",
    downloaded: "Report saved",
  },
  laws: {
    title: "Laws",
    hint: "Fit a formula, test a cut, load a real Pan-STARRS plate. Interpretable math on the scoring model — not a neural net.",
    symbolic: "Recover a formula",
    symbolicHint:
      "Fit a sparse sum of Gaussians N(x; μ, σ), sigmoids, and a few products that match the clustering term in the scoring model. Genetic programming may compress it. Held-out R² is the score; AIC penalizes clutter.",
    discover: "Discover law",
    discovering: "Fitting the model…",
    empty: "Discover a law to see an expression for this target. The formula is a fit to the scoring model, not new physics.",
    r2Train: "R² train",
    r2Test: "R² held-out",
    aic: "AIC",
    complexity: "Nodes",
    method: "Method",
    methodDict: "Dictionary + ridge",
    methodGp: "Genetic program",
    thisSky: "This sky",
    thisSkyLaw: "Law",
    thisSkyTrue: "model",
    residual:
      "Residual is mostly the lifetime and recollapse sigmoids, which are not linear in the six raw knobs. The formula is a recovery of the scoring model, not a claim about nature.",
    bayes: "Test a hypothesis",
    bayesHint:
      "Draw a mixed prior. Split on your threshold. M0: one viable-rate. M1: two rates. The Bayes factor is the evidence that the split matters. 95% intervals are Beta quantiles.",
    test: "Run test",
    testing: "Drawing the prior…",
    param: "Constant",
    dirLt: "below",
    dirGt: "above",
    threshold: "Threshold",
    pCond: "P(life | condition)",
    pNot: "P(life | not)",
    delta: "Δ",
    bf: "BF₁₀",
    logBf: "ln BF₁₀",
    ci: "95% CI",
    nCond: "In condition",
    nNot: "Outside",
    pGreater: "P(p₁ > p₀)",
    support: {
      strong: "Strong evidence the split matters",
      moderate: "Moderate evidence",
      weak: "Weak evidence",
      none: "No support for a split",
    },
    catalog: "Pan-STARRS plate",
    catalogHint:
      "A real MAST cone from Pan-STARRS DR2. Plotted in RA/Dec — a separate layer, not mixed into the simulated disk. Default is the M31 nucleus.",
    ra: "RA °",
    dec: "Dec °",
    radius: "Radius °",
    load: "Load cone",
    loading: "Querying MAST…",
    cached: "Cached",
    stars: "Objects",
    mag: "r mag",
    detections: "nDet",
    showSky: "Show on sky",
    hideSky: "Hide plate",
    cutout: "PS1 color stack",
    cutoutHint: "A real PS1 JPEG of this cone, fetched server-side. Not the simulated galaxy.",
    emptyCatalog: "Load a cone to see real stars. Nothing here is invented.",
    m31: "M31 nucleus",
    plate: "Pan-STARRS DR2",
    plateHint: "Real catalog, not this simulated sky.",
  },
  desk: {
    title: "Observatory desk",
    hint: "Walk the posterior, export FITS or slides, classify the disk.",
    mcmc: "Posterior walk",
    mcmcHint:
      "Start at this sky. Propose a reflecting Gaussian step. Accept with min(1, L′/L). Uniform prior, so the prior ratio is 1. Colour is log-likelihood; height is the same. Z is matter density.",
    run: "Walk the posterior",
    running: "Sampling the model…",
    empty: "Run a walk to see the chain in 3D. Most random constants are dead — the cloud should hug a thin corridor if this sky is informative.",
    accept: "Accept",
    ess: "ESS",
    map: "MAP",
    mean: "Mean",
    prior: "Uniform prior",
    samples: "Kept",
    loadMap: "Load MAP sky",
    axes: "X gravity · Y log L · Z matter",
    exportTitle: "Publish",
    fitsGalaxy: "FITS disk",
    fitsMcmc: "FITS chain",
    fitsCatalog: "FITS plate",
    votable: "VOTable sky",
    votableMcmc: "VOTable chain",
    votableCatalog: "VOTable plate",
    markdown: "Markdown",
    docx: "Word",
    pptx: "Slides",
    saved: "Saved",
    needCatalog: "Load a Pan-STARRS cone in Laws first.",
    needChain: "Walk the posterior first.",
    citizen: "Classify this sky",
    citizenHint:
      "A mini Zooniverse on this device. Look at the disk, pick a class, rate how interesting it is. Gold is the model’s own label — shown after you commit. Export matches the Zooniverse classification CSV.",
    classify: "Class",
    rating: "Interest",
    submit: "Commit classification",
    gold: "Gold",
    match: "Match",
    miss: "Disagree",
    board: "Local board",
    points: "Points",
    emptyBoard: "No classifications yet. Commit one to start the board.",
    zooniverse: "Zooniverse CSV",
    subjects: "Subjects CSV",
    local: "On this device — not a global ranking.",
    classLabel: {
      void: "Empty",
      sterile: "Sterile",
      habitable: "Habitable",
      silicon: "Silicon",
      eternal: "Eternal",
      unsure: "Unsure",
    },
  },
};

const ru: Copy = {
  kicker: "Космологическая лаборатория",
  appName: "Genesis Engine",
  birth: "Родить вселенную",
  survey: "Обзор 64",
  ours: "Наша вселенная",
  fate: "Судьба",
  life: "Разумная жизнь",
  stats: {
    stellar: "Жизнь звёзд",
    first: "Первые звёзды",
    window: "Окно жизни",
    generations: "Поколения",
  },
  chronicle: "Хроника",
  chronicleHint: "Короткая полевая заметка от Grok по этим числам.",
  chronicleError: "Не удалось написать хронику. Попробуйте ещё раз.",
  writing: "Пишет…",
  rewrite: "Переписать",
  commission: "Заказать хронику",
  copyId: "Копировать ID",
  copied: "Скопировано",
  share: "Поделиться",
  shared: "Ссылка готова",
  log: "Журнал",
  logEmpty: "Здесь собираются рождённые небеса.",
  english: "English",
  russian: "Русский",
  switchToRu: "Переключить интерфейс на русский",
  switchToEn: "Переключить интерфейс на английский",
  switchToBe: "Переключить интерфейс на беларускую",
  belarusian: "Беларуская",
  install: "Установить",
  installTitle: "На этот компьютер или телефон",
  installBodyIos:
    "Откройте «Поделиться» и выберите «На экран “Домой”». Genesis Engine откроется как отдельное приложение, без браузера.",
  installStepShare: "Нажмите «Поделиться» в Safari",
  installStepHome: "Выберите «На экран “Домой”»",
  installBodyOther:
    "Установите Genesis Engine на этот компьютер или телефон. Оно откроется на весь экран и сохранит журнал здесь.",
  installCta: "Установить приложение",
  installDismiss: "Не сейчас",
  platforms: {
    title: "На компьютере и телефоне",
    intro: "Та же лаборатория на этом компьютере или телефоне.",
    here: "Это устройство",
    windowsTitle: "Windows",
    windowsBody:
      "В Edge или Chrome: меню → «Установить Genesis Engine». Появится в меню «Пуск», как программа. Портативный .exe — то же окно без браузера.",
    linuxTitle: "Linux",
    linuxBody:
      "В Chromium, Chrome или Edge: «Установить приложение». Или запустите Linux-сборку — отдельное окно, не вкладка.",
    androidTitle: "Android",
    androidBody:
      "Chrome → «На экран “Домой”». Позже тот же интерфейс собирается в Android Studio через Capacitor (app.genesisengine.lab).",
    iosTitle: "iPhone / iPad",
    iosBody:
      "Только Safari: «Поделиться» → «На экран “Домой”». Тот же проект Capacitor открывается в Xcode, когда нужен билд для магазина.",
    macBody:
      "На Mac: Safari или Chrome → «Добавить в Dock» / «Установить». Та же вселенная, журнал остаётся на этом Mac.",
    desktopHere: "Вы уже в приложении для компьютера. Это окно Genesis Engine, не вкладка браузера.",
    pwaHere: "Уже установлено на этом устройстве. Открывайте с домашнего экрана или из меню «Пуск».",
  },
  skip: "Пропустить",
  continue: "Далее",
  enter: "Начать",
  factorsTitle: "Откуда эта вероятность",
  epochTitle: "Звёздные эпохи",
  epochOrigin: "Начало",
  epochStars: "Первые звёзды",
  epochLife: "Окно жизни",
  epochEnd: "Конец звёзд",
  tabs: { sky: "Небо", lab: "Лаб", log: "Журнал" },
  onboarding: [
    {
      title: "Большинство небес пусты",
      body: "Случайные константы почти никогда не дают звёзд. Нажмите «Родить вселенную», чтобы проверить своё небо.",
    },
    {
      title: "Шесть констант",
      body: "Откройте Лаб, затем Конст. Серые метки — наша вселенная. Тяните ползунок — галактика следует.",
    },
    {
      title: "Небо, Лаб, Журнал",
      body: "Небо — картина. В Лаб — ползунки, коридоры жизни и законы. Журнал хранит каждое рождённое небо.",
    },
    {
      title: "Три коридора",
      body: "Углероду нужна тихая вода. Кремнию, если он живёт, — жар. Вечная мысль — почти без тёмной энергии.",
    },
  ],
  fateLabel: {
    void: "Пустота",
    crunch: "Сжатие",
    rip: "Разрыв",
    flash: "Выгорание",
    fog: "Туман",
    sterile: "Немые галактики",
    enduring: "Длящийся",
    habitable: "Плацдарм",
    teeming: "Живая",
  },
  fateCopy: {
    void: "Ничто не загорается. Остывающий туман — и некому его назвать.",
    crunch: "Материя побеждает. Небо падает внутрь и сгорает раньше жизни.",
    rip: "Расширение не отпускает. Галактики не складываются. Ночь остаётся пустой.",
    flash: "Звёзды рождаются в спешке и гаснут сразу. Нет тихих веков, чтобы остыл мир.",
    fog: "Первые ряби были не того размера. Небо так и не стало галактиками.",
    sterile: "Красивые диски. Пусто от химии. Музей без посетителей.",
    enduring:
      "Звёзды гаснут. Горизонта нет. Остатки могут думать без границы — Дайсон 1979, если позволит физика частиц.",
    habitable: "Тонкий шанс. Звёзды живут. Металлы сеются. Водные миры не запрещены.",
    teeming: "Поколения звёзд, долгие ночи, густая тишина. Здесь жизнь — по умолчанию.",
  },
  morphology: {
    scattered: "Поле углей",
    irregular: "Неправильная",
    elliptical: "Эллиптическая",
    spiral: "Спираль",
  },
  params: {
    gravity: {
      label: "Гравитация",
      low: "слабая",
      high: "давящая",
      hint: "Задаёт массу и жизнь звёзд. Слишком сильная — звёзды сгорают до химии; слишком слабая — нет синтеза.",
    },
    expansion: {
      label: "Расширение",
      low: "стоит",
      high: "разгон",
      hint: "Поток Хаббла. Быстрое расширение разрывает сгустки до того, как соберутся галактики.",
    },
    darkEnergy: {
      label: "Тёмная энергия",
      low: "нет",
      high: "господствует",
      hint: "Позднее ускорение. Чуть-чуть — структура застывает; слишком много — космос рвётся. Почти ноль — нет горизонта де Ситтера, лазейка Дайсона для неограниченных умов остаётся открытой.",
    },
    matter: {
      label: "Плотность материи",
      low: "редкая",
      high: "густая",
      hint: "Топливо звёзд и галактик. Слишком мало — нечему схлопнуться; слишком много — всё падает обратно.",
    },
    complexity: {
      label: "Начальный порядок",
      low: "гладко",
      high: "структура",
      hint: "Насколько организованы первичные сгустки. Гладкое поле остаётся туманом.",
    },
    quantumNoise: {
      label: "Квантовый шум",
      low: "тихо",
      high: "буря",
      hint: "Семена инфляции. Шёпот вырастает в галактики. Рёв рвёт их на комья.",
    },
  },
  factors: {
    structure: "Структура",
    time: "Время",
    generations: "Поколения",
    stability: "Устойчивость",
  },
  settings: "Настройки",
  settingsTitle: "Настройки",
  language: "Язык",
  languageSearch: "Искать среди 7000 языков",
  languageAuthored: "Написанный интерфейс",
  languageCatalog: "ISO 639-3, живые и искусственные",
  languageFallback:
    "Написанного интерфейса ещё нет. Подписи остаются по-английски. Хроника попробует этот язык.",
  languageLoading: "Загрузка каталога…",
  haptics: "Вибрация",
  soundscape: "Музыка неба",
  soundOn: "Музыка неба включена",
  soundOff: "Музыка неба выключена",
  musicTitle: "Музыка",
  musicHint:
    "Тихие аккорды следуют за ползунками. Или выберите файл с этого устройства.",
  musicCosmos: "Рождена с небом",
  musicOwn: "Мой трек",
  musicPick: "Выбрать файл",
  musicClear: "Убрать трек",
  musicVolume: "Громкость",
  musicPlaying: "Играет",
  musicEmpty: "Файла пока нет. MP3, AAC, WAV, FLAC, OGG.",
  tapToHear: "Нажмите, чтобы услышать небо",
  help: "Как это устроено",
  helpTitle: "Как пользоваться лабораторией",
  helpIntro: "Три комнаты: Небо, Лаб, Журнал. Шесть констант. Три коридора, где ум может жить.",
  helpItems: [
    {
      title: "Небо",
      body: "«Родить вселенную» бросает новые константы. «Обзор 64» пробует много небес. «Уточнить» поднимается отсюда. Часы ведут космическое время.",
    },
    {
      title: "Лаб · Конст",
      body: "Шесть ползунков. Серые метки — ΛCDM, наша вселенная. Оценки углерода, кремния и вечности обновляются сразу.",
    },
    {
      title: "Лаб · Поиск",
      body: "Экспедиция ищет среди сотен небес. «Применить» загружает находку на картинку.",
    },
    {
      title: "Лаб · Жизнь",
      body: "Путь цивилизации для этого неба и короткая викторина по спектрам и транзитам.",
    },
    {
      title: "Лаб · Законы",
      body: "Подобрать формулу, проверить гипотезу, наложить реальную пластинку Pan-STARRS.",
    },
    {
      title: "Лаб · Стол",
      body: "Запустить MCMC, выгрузить FITS / VOTable / слайды, классифицировать диск.",
    },
    {
      title: "Журнал",
      body: "Каждое рождённое небо живёт здесь. Отмечайте хранителей. Очистка только из настроек.",
    },
    {
      title: "Музыка",
      body: "Динамик включает тихую подушку. Настройки → Музыка — файл с этого устройства.",
    },
  ],
  labPaneHint: {
    constants: "Шесть рычагов. Серые метки — наша вселенная.",
    hunt: "Три искателя через случайные небеса. Загрузите находку.",
    life: "Биосфера, биомасса и возникнет ли здесь разум.",
    laws: "Формула, проверка, настоящий каталог звёзд.",
    desk: "Постериор, экспорт, классификация.",
  },
  shortcutsTitle: "Клавиши",
  shortcutsBody: "B родить · S обзор · R уточнить · E эволюция · 1 небо · 2 лаб · 3 журнал · Esc закрыть",
  astroTitle: "Астрофизика (гомология)",
  astroHint:
    "Масштаб от констант, не код Больцмана. Для нашей вселенной числа близки к Planck H₀, 13.8 млрд лет и диску размера Млечного Пути.",
  astroHubble: "Аналог Хаббла",
  astroAge: "Аналог возраста",
  astroGalaxy: "Радиус диска",
  astroSfr: "Звездообразование",
  astroRho: "Критическая плотность",
  astroCurvature: "Аналог кривизны Ωk",
  astroFlat: "плоская",
  presetSilicon: "Кремниевый коридор",
  presetDesert: "Пустынная эпоха",
  presetEternal: "Коридор Дайсона",
  replayIntro: "Показать введение снова",
  clearLog: "Очистить журнал",
  clearLogConfirm: "Нажмите ещё раз",
  aboutTitle: "О приложении",
  aboutBody: "Космологическая лаборатория на этой машине. Лепите константы, смотрите галактику, ищите три узких коридора, где ум может жить.",
  studioHonesty: "Физику не продаём. Коридоры — оболочки, не перепись, которую можно купить.",
  studioFreeTitle: "Лаборатория остаётся свободной",
  studioFreeBody: "Лепите, делайте обзор, выгружайте FITS и VOTable, гоняйте MCMC. Без рекламы. Без учётных записей. Без подписки. Журнал остаётся на этом устройстве.",
  studioKeepTitle: "Оставить у себя",
  studioKeepBody: "Установите приложение сюда. Платная настольная копия для Windows, macOS и Linux — следующий шаг: не замок на небе, а способ забрать инструмент с собой и работать без сети.",
  studioFollowCta: "Заметки автора в X",
  sourceCode: "© 2026 Ян Ярошевич. Все права защищены.",
  version: "Версия 1.24",
  eggs: {
    answer: "В каталоге этого неба есть 42.",
    whale: "В последнем льду плывёт кит. Переведите часы на «Конец», чтобы увидеть.",
    panic: "Не паникуйте.",
    towel: "Полотенце — самая полезная вещь во вселенной. В модели его нет.",
    sand: "На мокром мире кремниевая химия превращается в песок.",
    god: "Неограниченная мысль здесь разрешена. Стать богом — нет.",
    andromeda: "Две галактики сталкиваются. Для нашего неба Андромеда ещё через миллиарды лет.",
    nothing: "Все рычаги на полу. Ничего не может сформироваться.",
    overcooked: "Все рычаги на потолке. Так вселенную не готовят.",
    light: "Да будет свет. Потом часы заканчиваются.",
    voyager: "Полный оборот неба. Золотая пластинка, если кто-то ещё слушает.",
    thought: "Deep Thought. Ответ был 42. Это то небо.",
    dot: "Бледная голубая точка. Это мы — если константы наши.",
    tau: "Тау Кита — двенадцать световых лет, тихая G-звезда с пыльными мирами. Никто не ответил. Песня Высоцкого — гомология, не перепись: если там есть разум, алфавит, юмор и способ продолжаться могут быть не нашими.",
  },
  thisIsOurs: "Эти константы совпадают с нашей вселенной — ΛCDM, как мы её измеряем.",
  compareTitle: "Против нашей вселенной",
  oursBadge: "ΛCDM",
  star: "Отметить это небо",
  unstar: "Снять отметку",
  remove: "Убрать из журнала",
  filterAll: "Все",
  filterViable: "Живые",
  filterStarred: "Избранные",
  carbon: "Углерод",
  silicon: "Кремний",
  siliconTitle: "Кремниевая биохимия",
  siliconHint:
    "Спекулятивная астробиология, не нейросеть. Кремниевые цепи не любят воду и кислород: им нужны жар, давление и восстановительный растворитель. Наша вселенная здесь почти ноль — так и должно быть.",
  siliconNote: {
    impossible: "Не за что зацепиться. Слишком холодно, слишком мокро, или некуда встать.",
    marginal: "Тонкое окно. Химия могла бы начаться. До разума ещё далеко.",
    viable: "Жар и давление здесь на стороне кремния. Разум не запрещён.",
    favored: "Враждебно клеткам, как мы их знаем. Добро к чему-то более горячему.",
  },
  siliconFactors: {
    heat: "Жар",
    pressure: "Давление",
    solvent: "Растворитель",
    timescale: "Часы реакций",
  },
  siliconOpen: "Открыть досье по кремнию",
  siliconWhy: "Почему кремнию трудно",
  siliconFacts: [
    "Связи Si–Si слабее C–C (~226 против ~346 кДж/моль). Цепи распадаются, если мир недостаточно горяч для постоянной починки.",
    "Силаны гидролизуются в воде. На влажном кислородном мире кремний запирается в SiO₂ — песок, кварц, стекло. Это термодинамическая могила.",
    "Атом кремния крупнее и почти не даёт двойных связей. Если информационная химия и возможна, ей нужен восстановительный, плотный растворитель — не океаны.",
  ],
  siliconThisSky: "Это небо",
  siliconStarT: "Аналог T звезды",
  siliconSurfaceG: "Аналог g на поверхности",
  siliconOxygen: "Кислородная ловушка",
  siliconClock: "Часы реакций",
  siliconSolvent: "Вероятный растворитель",
  solventLabel: {
    none: "Нет среды",
    water: "Вода — враждебна силанам",
    reducing: "Восстановительная жидкость",
    molten: "Расплав силикатов / горячая кислота",
  },
  siliconFactorHint: {
    heat: "Большая G даёт более горячие и короткие звёзды. Кремнию нужен этот жар; углерод в нём сгорает.",
    pressure: "Сила тяжести и плотность решают, останется ли экзотический растворитель конденсированным.",
    solvent: "Удаление от тихого водного коридора. Миры с G ≈ 1 и кислородом отравляют силаны.",
    timescale: "Горячая химия быстрая. Нескольких миллиардов лет может хватить; звёздной вспышки — нет.",
  },
  siliconBlockers: "Что запрещает это небо",
  siliconBlocker: {
    heat: "Слишком холодно — починка Si–Si не успевает.",
    pressure: "Слишком мало давления для плотного восстановительного растворителя.",
    solvent: "Растворитель водяной, или не те восстановительные семена.",
    timescale: "Звёзды гаснут раньше, чем быстрая химия успеет организоваться.",
    structure: "Нет галактик, нет поверхностей, негде разместить химию.",
    collapse: "Сжатие приходит раньше, чем биохимия успеет устояться.",
    rip: "Ускорение разрывает сгустки.",
  },
  siliconNoVeto: "Жёсткого вето нет. Остаётся химия, которой мы не видели — это число огибающая, а не перепись умов.",
  siliconVsCarbon: "Против углерода на этом небе",
  eternal: "Вечность",
  eternalTitle: "Лазейка Дайсона",
  eternalHint:
    "Не магическое бессмертие. Фримен Дайсон (1979) показал: цивилизация с конечной энергией может думать бесконечно долго, если у вселенной нет горизонта событий и она безгранично стынет. Краусс и Старкман (2000) закрыли эту дверь везде, где ΩΛ положительна — в том числе у нас.",
  eternalNote: {
    closed: "Горизонт де Ситтера, сжатие или отсутствие остатков закрывают бесконечное будущее. Субъективное время конечно.",
    glimpse: "Остатки могли бы считать долго. Горизонт или сжатие всё равно обрывают ряд.",
    open: "Λ почти ноль, будущее не схлопывается. Лазейка Дайсона не запрещена. Распад протона — открытый вопрос.",
    dyson: "Пик огибающей: долгоживущие остатки, нет горизонта, нет сжатия. Неограниченное субъективное время дозволено — не доказано.",
  },
  eternalFactors: {
    horizon: "Горизонт",
    remnants: "Остатки",
    longevity: "Долголетие",
    future: "Будущее",
  },
  eternalOpen: "Открыть досье вечности",
  eternalWhy: "Почему «навсегда» трудно",
  eternalFacts: [
    "Дайсон 1979: в открытой вселенной с Λ=0, которая стынет вечно, конечный запас энергии покупает бесконечное субъективное вычисление — если думать всё медленнее.",
    "Краусс и Старкман 2000: положительная космологическая постоянная зажигает горизонт де Ситтера. Конечная энтропия, постоянная температура — лазейка закрыта. Наша ΩΛ ≈ 0.69 — вето.",
    "Даже при Λ=0 распад протона (если он есть) и испарение Хокинга всё равно остановили бы барионные и чёрнодырные компьютеры. Это число — огибающая, не обещание богов.",
  ],
  eternalThisSky: "Это небо",
  eternalLambda: "Аналог ΩΛ",
  eternalRemnants: "Структура остатков",
  eternalClock: "Звёздные часы",
  eternalSubjective: "Субъективное время",
  subjectiveLabel: {
    finite: "Конечно — горизонт или сжатие",
    unbounded: "Неограничено — если позволит физика частиц",
  },
  eternalFactorHint: {
    horizon: "Гауссов пик вокруг ΩΛ ≈ 0. Горизонт де Ситтера — жёсткое нет для бесконечной мысли.",
    remnants: "Галактики должны были сложиться, чтобы остались белые карлики, нейтронные звёзды и чёрные дыры.",
    longevity: "Звёзды должны жить достаточно долго, чтобы населить эру остатков.",
    future: "Ни Большого сжатия, ни разрыва. Ряд мгновений должен реально продолжаться.",
  },
  eternalBlockers: "Что закрывает это небо",
  eternalBlocker: {
    horizon: "Горизонт де Ситтера — Краусс–Старкман. Положительная Λ запрещает бесконечное вычисление.",
    crunch: "Сжатие. Будущее кончается огнём, а не остывающей ванной.",
    rip: "Разгон рвёт остатки раньше, чем они успеют думать медленно.",
    remnants: "Слишком мало структуры. Нет звёзд, нет белых карликов, нет компьютеров.",
    flash: "Звёзды выгорают слишком быстро, чтобы посеять эру остатков.",
    vacuum: "Шумный вакуум — аналог более быстрого распада и нестабильности.",
  },
  eternalNoVeto:
    "Космологического вето нет. Остаётся физика частиц, которую мы не закрыли — распад протона, излучение Хокинга. Это число — огибающая, не бессмертие.",
  eternalVsLife: "Против углерода и кремния",
  eternalCaveat:
    "Дозволено — не значит неизбежно. Вечный ум — лазейка космологии, всё ещё заложница неизвестной физики частиц.",
  refine: "Уточнить небо",
  more: "Другие небеса",
  closePanel: "Закрыть",
  foldCorridors: "Коридоры жизни",
  foldObs: "Обсерватория",
  skies: "Известные небеса",
  appearance: "Оформление",
  contrast: "Высокий контраст",
  textSize: "Размер текста",
  textSizeSm: "Мелкий",
  textSizeMd: "Обычный",
  textSizeLg: "Крупный",
  obs: {
    modesLabel: "Режим неба",
    modes: {
      galaxy: "Галактика",
      planetarium: "Изнутри",
      lensing: "Гало",
      collision: "Слияние",
    },
    modeHint: {
      galaxy: "Диск целиком, снаружи.",
      planetarium: "Стоите на мире внутри диска — тяните небо.",
      lensing: "Фоновые галактики искривляются вокруг невидимого гало тёмной материи.",
      collision: "Две галактики падают друг на друга. Приливные хвосты, затем один остаток.",
    },
    evolve: "Запустить космическое время",
    evolving: "Пауза космического времени",
    now: "сейчас",
    collide: "Столкнуть галактики",
    clock: "Космическое время",
    epochs: {
      inflation: "Искра",
      recombination: "Первое свечение",
      darkAges: "Тёмные века",
      reionization: "Рассвет",
      stellar: "Звёзды",
      degeneracy: "Угасание",
      blackHoles: "Чёрные дыры",
      heatDeath: "Последнее тепло",
    },
    jumps: {
      inflation: "Искра",
      reionization: "Рассвет",
      stellar: "Звёзды",
      heatDeath: "Конец",
    },
    epochHint: {
      inflation:
        "Всплеск расширения. Небо — горячий туман: нет атомов, галактик, ночи.",
      recombination:
        "Электроны садятся на ядра. Вселенная становится прозрачной — поверхность последнего рассеяния.",
      darkAges:
        "Нейтральный водород, звёзд нет. Структура ещё только шёпот в темноте.",
      reionization:
        "Первые звёзды прожигают дыры в тумане. Свет возвращается в космос.",
      stellar:
        "Галактики собрались. Звёзды живут, умирают и сеют металлы. Это эра, где возможна химия.",
      degeneracy:
        "Последние яркие звёзды раздуваются и гаснут. Небо наследуют белые карлики и остывающие остатки.",
      blackHoles:
        "Звёздного света нет. Остались свечения аккреции и тихие дыры Хокинга.",
      heatDeath:
        "Расширение побеждает. Фотоны краснеют в ничто. Называть больше нечего.",
    },
    hubbleTitle: "Типы Хаббла",
    hubbleHint:
      "В поле почти 60% спиралей. В плотных скоплениях диски гаснут и становятся эллиптическими. Эта смесь следует соотношению морфология–плотность.",
    hubbleField: "Ожидаемая смесь в этой среде",
    thisType: "Эта галактика",
    env: "Среда",
    envLabel: { field: "Поле", group: "Группа", cluster: "Скопление" },
    dm: "Доля тёмной материи",
    cmb: "CMB",
    hrTitle: "Звёздное население",
    hrHint:
      "Аналог диаграммы Герцшпрунга–Рассела: температура против светимости. Массивные звёзды быстро сходят с главной последовательности; остатки копятся внизу.",
    hrEmpty: "В этой эпохе звёзды ещё не зажглись.",
    hrT: "← горячее",
    hrL: "ярче →",
    censusMs: "Главная посл.",
    censusGiant: "Гиганты",
    censusRemnant: "Остатки",
  },
  labPanes: { constants: "Конст", hunt: "Поиск", life: "Жизнь", laws: "Законы", desk: "Стол" },
  research: {
    title: "Экспедиция",
    hint: "Три агента на замкнутой физике — не обученная сеть. Наблюдатель берёт смешанный приор (дикие броски и все три коридора). Теоретик поднимается в гору. Аналитик перемешивает каждую константу и смотрит, насколько прыгает оценка.",
    run: "Запустить экспедицию",
    target: {
      carbon: "Углерод",
      silicon: "Кремний",
      eternal: "Вечность",
      overall: "Любая",
      diversity: "Обе",
    },
    targetHint: {
      carbon: "Искать тихий водный коридор.",
      silicon: "Искать горячий восстановительный коридор.",
      eternal: "Искать лазейку Дайсона при Λ ≈ 0.",
      overall: "Брать лучшее из углерода, кремния или вечности.",
      diversity: "Редкие небеса, где открыты оба химических окна.",
    },
    sample: "Приор",
    viableC: "Углеродно живые",
    viableSi: "Кремниево живые",
    viableEt: "Открытые Дайсону",
    corr: "Корреляция C–Si",
    percentile: "Это небо в приоре",
    importance: "Что важно приору",
    importanceHint:
      "Важность перестановки самой модели оценки. Перемешайте одну константу по выборке — оценка, которая прыгает, и есть рычаг.",
    local: "Что важно этому небу",
    fates: "Смесь судеб в приоре",
    observer: "Наблюдатель",
    theorist: "Теоретик",
    apply: "Загрузить это небо",
    empty: "Запустите экспедицию, чтобы картировать приор. Большинство бросков будут мёртвыми. Это и есть измерение.",
    insightsTitle: "Аналитик",
    insights: {
      rareViable:
        "Обитаемые броски — меньшинство приора. Большинство случайных констант не открывают химию.",
      gravityDominatesCarbon:
        "Гравитация — главный рычаг углерода. Время жизни звёзд круто падает с G.",
      gravityDominatesSilicon:
        "Гравитация — главный рычаг кремния. Коридору нужен жар без звёздной вспышки.",
      disjointCorridors:
        "Углерод и кремний антикоррелируют. Две химии почти не делят одно небо.",
      expansionKills:
        "Расширение — вето. Быстрый поток Хаббла рвёт сгустки до сборки галактик.",
      noiseSeeds:
        "Квантовый шум работает. Слишком мало — поле остаётся туманом; слишком много — диски рвутся.",
      matterCrunch:
        "Плотность материи — шарнир: слишком тонко — нечему схлопнуться; слишком густо — космос падает обратно.",
      thisSkyHigh:
        "Это небо в высоком хвосте приора для выбранной цели. Стоит отметить.",
      thisSkyLow:
        "Это небо обычное или хуже приора. Уточните или ищите.",
      theoristImproved:
        "Теоретик обошёл лучший бросок Наблюдателя. Подъём нашёл более узкий коридор.",
      darkEnergyDominatesEternal:
        "Тёмная энергия — шарнир вечности. Горизонт де Ситтера (ΩΛ ≳ 0) — вето Краусса–Старкмана.",
      eternalRare:
        "Открытые Дайсону броски редки. Большинство случайных констант зажигают горизонт, сжимаются или не оставляют остатков.",
    },
  },
  civ: {
    title: "Окно разума",
    hint: "Бутылочные горлышки в духе Дрейка на этом небе — не перепись умов.",
    path: "Химический путь",
    pathLabel: {
      carbon: "Углерод–вода",
      silicon: "Кремний (спекуляция)",
      eternal: "Остаток Дайсона",
      none: "Нет опоры",
    },
    intelligence: "P(разум)",
    carrying: "Аналог ёмкости",
    ships: "Аналог диаспоры",
    collapsed: "Экологический аналог схлопывается — сжатие, разгон или изъятие обгоняет рост.",
    persists:
      "Тепловая смерть не закрывает это окно. Если Λ остаётся почти нулём, умы остатков могут замедляться без границы — Дайсон, не раж.",
    ecology: "Аналог биосферы / умов",
    biosphere: "Биосфера",
    minds: "Умы",
    stages: {
      chemistry: "Химия",
      cells: "Клетки",
      complex: "Сложная жизнь",
      minds: "Умы",
      tech: "Техника",
    },
    stageHint: {
      chemistry: "Могут ли существовать растворитель и каркас.",
      cells: "Хватает ли окна, чтобы закрепился метаболизм.",
      complex: "Сеют ли поколения звёзд металлы, не разрывая диски.",
      minds: "Оставляют ли устойчивость и порядок место для информационных систем.",
      tech: "Есть ли у ума, если он появится, энергия и время строить.",
    },
  },
  bio: {
    title: "Аналог биосферы",
    hint: "Живая масса типичного обитаемого мира, калибровка по Земле (Bar-On et al. 2018: ~550 Гт C). Гомология от констант, не перепись этой галактики.",
    world: "Мир-аналог",
    galaxy: "Огибающая диска",
    galaxyHint: "Итог по диску = мир-аналог × ожидаемые биосферы. Только порядок величины — η_life неизвестна.",
    development: "Потенциальное развитие",
    taxaTitle: "По группам",
    sortBiomass: "Биомасса",
    sortSpecies: "Виды",
    empty: "Нет химии. Нет биомассы.",
    siliconNote: "Спекулятивная масса Si-цепей, не земные таксоны. На водном мире это становится песком.",
    eternalNote: "Нет влажной биосферы. Умы остатков — вычисление, не ткань.",
    earthNote: "Доли как у живого углерода Земли: растения держат массу, животные — тонкая плёнка.",
    closed: "закрыто",
    open: "открыто",
    taxa: {
      plants: "Растения",
      bacteria: "Бактерии",
      fungi: "Грибы",
      archaea: "Археи",
      protists: "Протисты",
      animals: "Животные",
      viruses: "Вирусы",
      lattices: "Хемосинтетические решётки",
      chains: "Si-микробы",
      assemblers: "Сборщики",
    },
    grades: {
      prokaryotes: "Прокариоты",
      photosynthesis: "Продуценты",
      eukaryotes: "Эукариоты",
      multicellular: "Многоклеточные",
      animals: "Животные",
      minds: "Разум",
    },
  },
  citizen: {
    title: "Тренировка глаза",
    hint: "Задачи из звёзд этого неба. Прочитайте спектр. Поймайте транзит.",
    spectrum: "Спектральный класс",
    spectrumAsk: "Какой класс MK у этого континуума?",
    transit: "Поиск транзита",
    transitAsk: "Есть ли планетный транзит на этой кривой блеска?",
    hasTransit: "Транзит",
    noTransit: "Нет транзита",
    next: "Дальше",
    correct: "Верно",
    wrong: "Не этот класс",
    score: "Глаз",
    types: {
      O: "O · горячий синий",
      B: "B · голубо-белый",
      A: "A · белый",
      F: "F · жёлто-белый",
      G: "G · как Солнце",
      K: "K · оранжевый",
      M: "M · холодный красный",
    },
  },
  report: {
    download: "Скачать полевой отчёт",
    downloaded: "Отчёт сохранён",
  },
  laws: {
    title: "Законы",
    hint: "Подобрать формулу, проверить разрез, загрузить настоящую пластинку Pan-STARRS. Интерпретируемая математика модели оценки — не нейросеть.",
    symbolic: "Восстановить формулу",
    symbolicHint:
      "Разреженная сумма гауссиан N(x; μ, σ), сигмоид и нескольких произведений, как в члене скучивания модели оценки. Генетическое программирование может сжать её. Оценка — R² на отложенной выборке; AIC штрафует сложность.",
    discover: "Найти закон",
    discovering: "Подгонка модели…",
    empty: "Найдите закон, чтобы увидеть выражение для этой цели. Формула — подгонка модели оценки, не новая физика.",
    r2Train: "R² обучение",
    r2Test: "R² отложено",
    aic: "AIC",
    complexity: "Узлы",
    method: "Метод",
    methodDict: "Словарь + ridge",
    methodGp: "Генетическая программа",
    thisSky: "Это небо",
    thisSkyLaw: "Закон",
    thisSkyTrue: "модель",
    residual:
      "Остаток — в основном сигмоиды времени жизни и сжатия, нелинейные по шести ручкам. Формула восстанавливает модель оценки, а не природу.",
    bayes: "Проверить гипотезу",
    bayesHint:
      "Смешанный приор. Разрез по порогу. M0: одна доля обитаемых. M1: две доли. Байесовский фактор — свидетельство, что разрез важен. 95% интервалы — квантили бета-распределения.",
    test: "Запустить тест",
    testing: "Броски приора…",
    param: "Константа",
    dirLt: "ниже",
    dirGt: "выше",
    threshold: "Порог",
    pCond: "P(жизнь | условие)",
    pNot: "P(жизнь | нет)",
    delta: "Δ",
    bf: "BF₁₀",
    logBf: "ln BF₁₀",
    ci: "95% ДИ",
    nCond: "В условии",
    nNot: "Вне",
    pGreater: "P(p₁ > p₀)",
    support: {
      strong: "Сильное свидетельство, что разрез важен",
      moderate: "Умеренное свидетельство",
      weak: "Слабое свидетельство",
      none: "Нет поддержки разреза",
    },
    catalog: "Пластинка Pan-STARRS",
    catalogHint:
      "Настоящий конус MAST, Pan-STARRS DR2. В координатах RA/Dec — отдельный слой, не смешанный с моделируемым диском. По умолчанию ядро M31.",
    ra: "RA °",
    dec: "Dec °",
    radius: "Радиус °",
    load: "Загрузить конус",
    loading: "Запрос к MAST…",
    cached: "Из кэша",
    stars: "Объекты",
    mag: "r маг",
    detections: "nDet",
    showSky: "Показать на небе",
    hideSky: "Скрыть пластинку",
    cutout: "Цветной стек PS1",
    cutoutHint: "Настоящий JPEG PS1 этого конуса, с сервера. Не моделируемая галактика.",
    emptyCatalog: "Загрузите конус, чтобы увидеть настоящие звёзды. Здесь ничего не выдумано.",
    m31: "Ядро M31",
    plate: "Pan-STARRS DR2",
    plateHint: "Настоящий каталог, не это моделируемое небо.",
  },
  desk: {
    title: "Стол обсерватории",
    hint: "Пройти постериор, выгрузить FITS или слайды, классифицировать диск.",
    mcmc: "Прогулка по постериру",
    mcmcHint:
      "Старт — это небо. Предложение — отражающий гауссов шаг. Принятие min(1, L′/L). Равномерный приор, отношение приоров = 1. Цвет — log-правдоподобие; высота — то же. Z — плотность материи.",
    run: "Пройти постериор",
    running: "Выборка модели…",
    empty: "Запустите цепь, чтобы увидеть облако в 3D. Большинство случайных констант мертвы — если это небо информативно, облако должно прижаться к узкому коридору.",
    accept: "Принято",
    ess: "ESS",
    map: "MAP",
    mean: "Среднее",
    prior: "Равномерный приор",
    samples: "Оставлено",
    loadMap: "Загрузить MAP-небо",
    axes: "X гравитация · Y log L · Z материя",
    exportTitle: "Публикация",
    fitsGalaxy: "FITS диск",
    fitsMcmc: "FITS цепь",
    fitsCatalog: "FITS пластинка",
    votable: "VOTable небо",
    votableMcmc: "VOTable цепь",
    votableCatalog: "VOTable пластинка",
    markdown: "Markdown",
    docx: "Word",
    pptx: "Слайды",
    saved: "Сохранено",
    needCatalog: "Сначала загрузите конус Pan-STARRS в «Законах».",
    needChain: "Сначала пройдите постериор.",
    citizen: "Классифицировать это небо",
    citizenHint:
      "Мини-Zooniverse на этом устройстве. Смотрите на диск, выберите класс, оцените интерес. Золото — метка модели, показывается после записи. Экспорт совпадает с CSV классификаций Zooniverse.",
    classify: "Класс",
    rating: "Интерес",
    submit: "Записать класс",
    gold: "Золото",
    match: "Совпало",
    miss: "Расхождение",
    board: "Локальная таблица",
    points: "Очки",
    emptyBoard: "Классификаций ещё нет. Запишите одну, чтобы открыть таблицу.",
    zooniverse: "CSV Zooniverse",
    subjects: "CSV субъектов",
    local: "На этом устройстве — не глобальный рейтинг.",
    classLabel: {
      void: "Пусто",
      sterile: "Стерильно",
      habitable: "Обитаемо",
      silicon: "Кремний",
      eternal: "Вечный",
      unsure: "Неясно",
    },
  },
};

const be = makeBe(ru);

const copyCache = new Map<string, Copy>();

export function copyFor(locale: string): Copy {
  const id = canonicalLocale(locale);
  const hit = copyCache.get(id);
  if (hit) return hit;
  let out: Copy = en;
  if (id === "ru") out = ru;
  else if (id === "be") out = be;
  else {
    const overlay = PACKS[id];
    if (overlay) out = mergeCopy(en, overlay);
  }
  const hud = HUD[id];
  if (hud) out = mergeCopy(out, hud);
  const extra = SETTINGS[id];
  if (extra) out = mergeCopy(out, extra);
  copyCache.set(id, out);
  return out;
}

export const COPY: Record<string, Copy> = {
  en,
  ru,
  be,
};

export function nextLocale(locale: Locale): Locale {
  const i = AUTHORED.indexOf(locale as (typeof AUTHORED)[number]);
  const idx = i < 0 ? 0 : i;
  return AUTHORED[(idx + 1) % AUTHORED.length];
}

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem("genesis-engine-locale");
    if (saved && isKnownLocale(saved)) return canonicalLocale(saved);
  } catch {
    /* ignore */
  }
  const lang = navigator.language.toLowerCase();
  const id = canonicalLocale(lang);
  if (hasPack(id) || isKnownLocale(id)) return id;
  return "en";
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem("genesis-engine-locale", canonicalLocale(locale));
  } catch {
    /* ignore */
  }
}

export { autonym, bcp47, hasPack, canonicalLocale };
