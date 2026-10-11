import type {
  CosmicEpoch,
  EnvironmentClass,
  EternalBlocker,
  EternalNiche,
  Fate,
  HaloModelId,
  HaloNiche,
  TfNiche,
  FpNiche,
  MlBranch,
  ImfNiche,
  MassMethodNiche,
  AgnNiche,
  AgnMode,
  AgnDrive,
  GrmhdState,
  BzGeometry,
  FluxTransport,
  FanaroffRiley,
  AcousticNiche,
  DiskNiche,
  Morphology,
  ParamKey,
  SiliconBlocker,
  SiliconNiche,
  SkyMode,
  SolventClass,
  SwarmBlocker,
  SwarmNiche,
} from "./types";
import type { InsightId, ResearchTarget } from "./research";
import type { CivStageId } from "./civilization";
import type { MandateId } from "./mandate";
import type { GradeId, TaxonId } from "./biosphere";
import type { SpectralType } from "./citizen";
import type { SkyClass } from "./zooniverse";
import { mergeCopy } from "./copy-merge.ts";
import type { DeepPartial } from "./copy-merge.ts";
import { APP_VERSION_SHORT } from "./studio.ts";
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
  birthWitness: string;
  birthGood: string;
  tapSky: string;
  scanning: string;
  plot: {
    arrive: string;
    empty: string;
    dice: string;
    foothold: string;
    teeming: string;
    silicon: string;
    tide: string;
    enduring: string;
    hard: string;
    blink: string;
    survey: string;
    home: string;
    cluster: string;
    dwarf: string;
    highway: string;
    belt: string;
    desert: string;
    caughtWow: string;
    caughtThroat: string;
    caughtClassified: string;
    caughtTau: string;
    caughtZone: string;
    caughtWhale: string;
    done: string;
  };
  survey: string;
  ours: string;
  fate: string;
  life: string;
  stats: { stellar: string; first: string; window: string; generations: string };
  chronicle: string;
  chronicleHint: string;
  chronicleError: string;
  chronicleTimeout: string;
  chronicleUnreachable: string;
  writing: string;
  rewrite: string;
  commission: string;
  copyId: string;
  copied: string;
  share: string;
  shared: string;
  log: string;
  logEmpty: string;
  logEmptyStarred: string;
  logEmptyViable: string;
  logEmptyCut: string;
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
  swarm: string;
  swarmTitle: string;
  swarmHint: string;
  swarmNote: Record<SwarmNiche, string>;
  swarmFactors: Record<"host" | "metals" | "reach" | "clock", string>;
  swarmOpen: string;
  swarmWhy: string;
  swarmFacts: [string, string, string];
  swarmThisSky: string;
  swarmHops: string;
  swarmCrossing: string;
  swarmMetal: string;
  swarmHost: string;
  swarmFactorHint: Record<"host" | "metals" | "reach" | "clock", string>;
  swarmBlockers: string;
  swarmBlocker: Record<SwarmBlocker, string>;
  swarmNoVeto: string;
  swarmCaveat: string;
  refine: string;
  more: string;
  closePanel: string;
  foldCorridors: string;
  foldObs: string;
  foldSculpt: string;
  labCue: string;
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
  musicCount: string;
  musicRemove: string;
  tapToHear: string;
  help: string;
  helpTitle: string;
  games: string;
  gamesTitle: string;
  gamesNote: string;
  gamesTiles: string;
  gamesTilesHint: string;
  gamesSnake: string;
  gamesSnakeHint: string;
  gamesBlocks: string;
  gamesBlocksHint: string;
  gamesRun: string;
  gamesRunHint: string;
  gamesJump: string;
  gamesScore: string;
  gamesOver: string;
  gamesAgain: string;
  gamesWon: string;
  gamesTurn: string;
  gamesDrop: string;
  gamesNext: string;
  gamesBest: string;
  gamesLines: string;
  gamesPause: string;
  gamesPlay: string;
  helpIntro: string;
  helpItems: { title: string; body: string }[];
  scripture: {
    title: string;
    kicker: string;
    intro: string;
    open: string;
    line: string;
    source: string;
    hint: string;
  };
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
  presetSwarm: string;
  presetHighway: string;
  presetBelt: string;
  presetCluster: string;
  presetDwarf: string;
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
  studioSupportTitle: string;
  studioSupportBody: string;
  studioFollowCta: string;
  studioPublicCta: string;
  studioLabRepoCta: string;
  studioSourceCta: string;
  studioEnterCta: string;
  studioReserveCta: string;
  studioOrderText: string;
  payWarn: string;
  payAfter: string;
  payCopy: string;
  keep: {
    title: string;
    kicker: string;
    lead: string;
    includedTitle: string;
    included: string;
    notTitle: string;
    notBody: string;
    stepsTitle: string;
    step1: string;
    step2: string;
    step3: string;
    amount: string;
    txLabel: string;
    txPlaceholder: string;
    mintCta: string;
    plateLabel: string;
    receiptHint: string;
    writeCta: string;
    roomTitle: string;
    roomBody: string;
    roomCta: string;
    roomOrderText: string;
    saveCta: string;
    invalidTx: string;
    openCta: string;
    orderText: string;
  };
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
    tide: string;
    fiftyone: string;
    highway: string;
    zone: string;
    ice: string;
    wow: string;
    witness: string;
    throat: string;
  };
  thisIsOurs: string;
  compareTitle: string;
  versusHome: string;
  versusYounger: string;
  versusOlder: string;
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
    baryons: string;
    dmHint: string;
    rotationCurve: string;
    rotationHint: string;
    rotationBaryon: string;
    rotationHalo: string;
    rotationR: string;
    rotationV: string;
    tfTitle: string;
    tfHint: string;
    tfNiche: Record<TfNiche, string>;
    tfRatio: string;
    rarTitle: string;
    fjTitle: string;
    fjHint: string;
    fjSigma: string;
    fjRatio: string;
    fpTitle: string;
    fpHint: string;
    fpNiche: Record<FpNiche, string>;
    fpRe: string;
    fpIe: string;
    fpResidual: string;
    fpMl: string;
    fpMlBranch: Record<MlBranch, string>;
    fpSersic: string;
    fpMass: string;
    imfTitle: string;
    imfHint: string;
    imfNiche: Record<ImfNiche, string>;
    imfSlope: string;
    imfStar: string;
    imfMean: string;
    imfSn: string;
    imfR: string;
    imfY: string;
    massTitle: string;
    massHint: string;
    massNiche: Record<MassMethodNiche, string>;
    massPhot: string;
    massVirial: string;
    massLens: string;
    bhTitle: string;
    bhHint: string;
    bhNiche: Record<AgnNiche, string>;
    bhMagorrian: string;
    bhSoi: string;
    agnMode: Record<AgnMode, string>;
    agnDrive: Record<AgnDrive, string>;
    agnLambda: string;
    agnHeat: string;
    grmhdState: Record<GrmhdState, string>;
    grmhdSpin: string;
    grmhdEff: string;
    grmhdBz: string;
    grmhdBp: string;
    grmhdOmega: string;
    grmhdGeom: Record<BzGeometry, string>;
    grmhdWin: Record<"bz" | "bp" | "none", string>;
    grmhdSpinE: string;
    grmhdEta: string;
    grmhdBeta: string;
    grmhdRam: string;
    fluxAdv: string;
    fluxNiche: Record<FluxTransport, string>;
    madSigma: string;
    madFill: string;
    madFlicker: string;
    madAdaf: string;
    madFr: Record<FanaroffRiley, string>;
    haloTitle: string;
    haloHint: string;
    haloNiche: Record<HaloNiche, string>;
    haloNicheHint: Record<HaloNiche, string>;
    haloFactor: Record<"share" | "rotation" | "lens" | "clustering", string>;
    haloOuter: string;
    haloBaryonV: string;
    haloTheta: string;
    haloC: string;
    haloRs: string;
    haloContract: string;
    haloCore: string;
    haloKappa: string;
    haloKs: string;
    haloEinasto: string;
    haloModel: Record<HaloModelId, string>;
    haloCompare: string;
    haloOffChart: string;
    cmb: string;
    acousticTitle: string;
    acousticHint: string;
    acousticEll: string;
    acousticEll3: string;
    acousticOddEven: string;
    acousticLoad: string;
    twentyOne: string;
    hii: string;
    diskTitle: string;
    diskHint: string;
    diskQ: string;
    diskPitch: string;
    diskShear: string;
    diskKappa: string;
    diskMesh: string;
    diskQ1: string;
    diskPlummer: string;
    diskH0: string;
    diskNiche: Record<DiskNiche, string>;
    diskNicheHint: Record<DiskNiche, string>;
    acousticNiche: Record<AcousticNiche, string>;
    acousticNicheHint: Record<AcousticNiche, string>;
    hrTitle: string;
    hrHint: string;
    hrEmpty: string;
    hrT: string;
    hrL: string;
    censusMs: string;
    censusGiant: string;
    censusRemnant: string;
    worldsTitle: string;
    worldsHint: string;
    worldsEmpty: string;
    worldsHost: string;
    worldsAu: string;
    worldsYr: string;
    worldsDay: string;
    worldsBound: string;
    worldsSwallowed: string;
    worldsPhase: string;
    worldsRing: string;
    worldsMoon: string;
    worldsPull: string;
    worldsHour: string;
    worldsImpacts: string;
    worldsEncounter: Record<"clear" | "crossing" | "impact", string>;
    worldsStage: Record<
      "unborn" | "mainSequence" | "giant" | "supernova" | "whiteDwarf" | "neutronStar" | "blackHole",
      string
    >;
  };
  labPanes: { constants: string; hunt: string; life: string; laws: string; desk: string };
  research: {
    title: string;
    hint: string;
    run: string;
    running: string;
    target: Record<ResearchTarget, string>;
    targetHint: Record<ResearchTarget, string>;
    sample: string;
    viableC: string;
    viableSi: string;
    viableEt: string;
    viableSw: string;
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
    failed: string;
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
    routes: string;
    spend: string;
    quiet: string;
    collapsed: string;
    persists: string;
    ecology: string;
    biosphere: string;
    minds: string;
    stages: Record<CivStageId, string>;
    stageHint: Record<CivStageId, string>;
  };
  mandate: {
    title: string;
    hint: string;
    next: string;
    sealed: string;
    openLabel: string;
    done: string;
    progress: string;
    open: string;
    atlasTick: string;
    atlasHave: string;
    atlasNeed: string;
    chapters: Record<MandateId, { title: string; body: string; hint: string }>;
    flash: Record<MandateId, string>;
    cue: Record<MandateId, string>;
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
    failed: string;
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
    dqComplete: string;
    dqDet: string;
    dqNiche: Record<"thin" | "fair" | "clean", string>;
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
    walker: string;
    walkerMh: string;
    walkerHmc: string;
    map: string;
    mean: string;
    prior: string;
    samples: string;
    loadMap: string;
    axes: string;
    analysis: string;
    analysisHint: string;
    interval: string;
    median: string;
    rhat: string;
    rhatHint: string;
    tau: string;
    corridorMass: string;
    corridorHint: string;
    thisInCloud: string;
    pairing: string;
    marginals: string;
    trace: string;
    chains: string;
    chainsHint: string;
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
  birthWitness: "A new sky. Most corridors stay closed. Survey 64 is the next measurement if this one is empty.",
  birthGood: "And I saw that it was good.",
  tapSky: "The disk flashed. Look. There is nowhere to land.",
  scanning: "Survey of 64 skies. Most stay empty.",
  plot: {
    arrive: "First plate. This sky is not saved until you keep it in the log.",
    empty: "No corridor is open on this sky. The log is waiting until you save it.",
    dice: "Several plates are already in the log. What to do next has not changed.",
    foothold: "Liquid water is allowed. That is not a detection.",
    teeming: "The living fraction is high. This is not a census.",
    silicon: "A hot solvent is allowed. Water is not the only solvent in the model.",
    tide: "A swarm corridor is open. The figure is a period, not a fleet.",
    enduring: "Bound structures can persist. The model does not name them.",
    hard: "This sky ends early. Save it, then draw another.",
    blink: "The disk flashed. There is nowhere to land.",
    survey: "Survey of 64 skies. Most stay empty.",
    home: "This sky matches our parameters. A new birth leaves it.",
    cluster: "Cluster elliptical. Magorrian relation on, radio lobe. Not Virgo.",
    dwarf: "Dwarf irregular. Quiet hole, minor merger. Not a census.",
    highway: "One road, two lanes. No settlement within a Hubble time.",
    belt: "Sparse ice. Only the cold mass is moving.",
    desert: "Desert epoch. Expansion wins before chemistry.",
    caughtWow: "72 seconds on the hydrogen line. No source is identified.",
    caughtThroat: "A throat in the metric. The model does not cross it.",
    caughtClassified: "The plate is withheld. The constants remain.",
    caughtTau: "Twelve light-years. A quiet G star. No signal alphabet is on file.",
    caughtZone: "The law on this plate is the one just set.",
    caughtWhale: "A large body in the last ice. It is not identified.",
    done: "The atlas is sealed. The log remains open.",
  },
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
  chronicleHint: "A short field note from these numbers. Not a trained model.",
  chronicleError: "Chronicle failed. Try again.",
  chronicleTimeout: "The chronicle timed out. The field note stands.",
  chronicleUnreachable: "The chronicle could not be reached. The field note stands.",
  writing: "Writing…",
  rewrite: "Rewrite",
  commission: "Write field note",
  copyId: "Copy ID",
  copied: "Copied",
  share: "Share",
  shared: "Link ready",
  log: "Log",
  logEmpty: "Every universe you birth is kept here.",
  logEmptyStarred: "No starred skies yet.",
  logEmptyViable: "No corridor is open in this log yet.",
  logEmptyCut: "Nothing in the log matches this cut.",
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
    intro: "Install the free lab on this device. A paid Windows or Linux copy is how you take the instrument with you and work offline.",
    here: "This device",
    windowsTitle: "Windows",
    windowsBody:
      "In Edge or Chrome: menu → Install Genesis Engine. The free lab lands in the Start menu. The paid portable copy is Genesis Engine.exe in its own window, no browser. Write to take it. Unsigned — SmartScreen may warn.",
    linuxTitle: "Linux",
    linuxBody:
      "In Chromium, Chrome or Edge: Install app. That is the free lab. The paid Linux copy is a window of its own. Write to take it.",
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
      body: "A random set of constants almost never makes stars. Birth one anyway. If the disk flashes, look. There is nowhere to land. If the sky stays empty, run Survey 64.",
    },
    {
      title: "Six constants",
      body: "Open Lab to read what this sky did. The six sliders sit under Sculpt. Grey marks are our universe, not a goal.",
    },
    {
      title: "Four corridors",
      body: "Carbon needs quiet water. Silicon needs heat. A mind that lasts needs almost no dark energy. A probe that copies itself needs time and metals. An open corridor means it is allowed, not that worlds were counted, and not a score.",
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
      hint: "Fuel for stars and galaxies — baryons plus the halo. Too little and nothing collapses; too much and the universe recollapses. The dark-matter share is this density after a thin baryon loading.",
    },
    complexity: {
      label: "Initial order",
      low: "smooth",
      high: "structured",
      hint: "How organized the primordial overdensities are. Smooth fields stay fog. Also loads the baryons: more order, thicker baryon share, thinner halo.",
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
  musicHint: "Quiet chords follow the sliders. Or add as many files as this device will hold.",
  musicCosmos: "Born with the sky",
  musicOwn: "My tracks",
  musicPick: "Add tracks",
  musicClear: "Clear playlist",
  musicVolume: "Volume",
  musicPlaying: "Playing",
  musicEmpty: "No tracks yet. Add many at once. MP3, AAC, WAV, FLAC, OGG.",
  musicCount: "{n} tracks",
  musicRemove: "Remove",
  tapToHear: "Tap to hear the sky",
  help: "How this works",
  helpTitle: "How to use the laboratory",
  games: "Games",
  gamesTitle: "Games",
  gamesNote: "These are games. They do not change the sky.",
  gamesTiles: "Tiles",
  gamesTilesHint: "Slide. Equals join. 2048 is the mark, not a score of the sky.",
  gamesSnake: "Snake",
  gamesSnakeHint: "Eat, and do not run into yourself.",
  gamesBlocks: "Blocks",
  gamesBlocksHint: "Pieces of four squares fall. This is not a licensed falling-block product.",
  gamesRun: "Run",
  gamesRunHint: "This does not change the sky. Jump the ridges. A mote on the ground scores if you stay down.",
  gamesJump: "Jump",
  gamesScore: "Score",
  gamesOver: "Done",
  gamesAgain: "Again",
  gamesWon: "The mark is there. Keep playing.",
  gamesTurn: "Turn",
  gamesDrop: "Drop",
  gamesNext: "Next",
  gamesBest: "Best",
  gamesLines: "Rows",
  gamesPause: "Pause",
  gamesPlay: "Play",
  helpIntro: "Six sliders set a sky. It either forms stars or it does not. Four corridors say whether that kind of life is allowed. This is not a score, and not a count of worlds.",
  helpItems: [
    {
      title: "Sky",
      body: "Birth builds a sky from the six constants. Most skies stay empty. If the disk flashes, look. There is nowhere to land. Survey 64 searches for a foothold when the sky is empty.",
    },
    {
      title: "Lab · Const",
      body: "Shows the fate of this sky, which corridors are open, and a short note. The six sliders are under Sculpt. Grey marks are our universe.",
    },
    {
      title: "Controls",
      body: "Along the bottom: Sky, Lab, Log. Birth makes a new sky. Survey 64 tries 64 skies when this one is empty. In Lab, Sculpt moves the six sliders. Keys: B birth, S survey, Space look, [ ] time, 1 2 3 switch rooms, Esc closes.",
    },
    {
      title: "Lab · Hunt",
      body: "Hunt throws many random skies. Almost all are empty. You can put one you keep onto the screen.",
    },
    {
      title: "Lab · Life",
      body: "A possible path for a civilization on this sky, then a few questions on spectra and transits. The questions check attention, not the sky.",
    },
    {
      title: "Lab · Laws",
      body: "Fits a formula to this sky, lets you test a guess, and can lay a real star field on the screen.",
    },
    {
      title: "Lab · Desk",
      body: "Runs a chain of nearby skies and exports a file. The disk class is written here too.",
    },
    {
      title: "Log",
      body: "Skies you birth are kept here. A star marks one you want to hold. The log is cleared only from Settings.",
    },
    {
      title: "Nearby",
      body: "Our sky, Planetarium. A quiet G star labelled τ Cet sits by the pale blue pixel. Tap it, or type tau.",
    },
    {
      title: "Music",
      body: "The speaker starts a quiet pad. Settings → Music lets you play a file from this device.",
    },
    {
      title: "The work",
      body: "Dots under the chips are skies worth opening. Tapping one does not award points.",
    },
    {
      title: "Canon",
      body: "A quiet line under the clock follows epoch and fate — Genesis, the Psalms, Job, Isaiah. Tap the citation. Settings can hide it. Witness, not a measurement.",
    },
    {
      title: "Tide",
      body: "The fourth corridor: probes that copy themselves. The number is a time span, not a fleet. Known skies → Tide, or type vnm.",
    },
    {
      title: "Side roads",
      body: "Short keyboard codes, not levels. a51 withholds a sky. r60 is a long road. ice is a cold economy. wow is a 72-second spike. wit means look, don’t land. gt is a throat, not a door. zon changes the law for a few seconds.",
    },
    {
      title: "Games",
      body: "The gamepad beside settings opens tiles, a snake, and falling blocks. They do not change the sky. Pause holds the board. The best mark stays on this device.",
    },
    {
      title: "A copy",
      body: "The lab stays free. A Windows or Linux window is 15 USDT. Open the desk, stamp a plate, write on X. Not a lock on the sky.",
    },
  ],
  scripture: {
    title: "Canon",
    kicker: "Witness",
    intro:
      "Ancient lines beside the instrument. Not a measurement, not a proof of the physics. The sky still answers in constants.",
    open: "Open canon",
    line: "Scripture under the clock",
    source: "Read the passage",
    hint: "The line follows cosmic time and fate. English is KJV; Russian and Belarusian follow the Synodal sense. Links open Bible Gateway.",
  },
  labPaneHint: {
    constants: "What this sky did. The sliders are under Sculpt. Grey marks are our universe.",
    hunt: "Hunt throws random skies. Almost all are empty. Put a find on the screen.",
    life: "A possible path for a mind on this sky. Spectra if you want to look.",
    laws: "A formula is fitted when you open this. Then a guess, then a real star field.",
    desk: "A chain of nearby skies starts here. Then export and the disk class.",
  },
  shortcutsTitle: "Keys",
  shortcutsBody: "B birth · S survey · R refine · E evolve · [ ] time · Space look · tau · 1 sky · 2 lab · 3 log · Esc close",
  astroTitle: "Astrophysics (homology)",
  astroHint:
    "Scaled from the constants. For our sky: Planck H₀, 13.8 Gyr, a Milky-Way disk. The clock's Now is today: a=1, T=2.725 K.",
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
  presetSwarm: "Tide corridor",
  presetHighway: "The long road",
  presetBelt: "Ice belt",
  presetCluster: "Cluster elliptical",
  presetDwarf: "Dwarf irregular",
  replayIntro: "Replay introduction",
  clearLog: "Clear log",
  clearLogConfirm: "Tap again to clear",
  aboutTitle: "About",
  aboutBody: "A cosmological laboratory on this machine. Sculpt the constants, watch a galaxy, hunt four thin corridors where a mind might live.",
  studioHonesty: "The physics is not for sale. Corridors are envelopes, not a census you can buy.",
  studioFreeTitle: "The lab stays free",
  studioFreeBody: "Sculpt, survey, export FITS and VOTable, run MCMC. No ads. No accounts. No subscription. Your journal stays on this device.",
  studioKeepTitle: "Keep a copy",
  studioKeepBody: "Install the free lab here. A Windows or Linux copy is one-time, 15 USDT on BNB Smart Chain, or Bitcoin — a window, no browser, offline, after you stamp a plate and write on X. macOS later. Not a lock on the sky. The build is unsigned; SmartScreen may warn.",
  studioSupportTitle: "A copy you can take",
  studioSupportBody: "One-time, 15 USDT (BEP20) or the same in Bitcoin. Windows and Linux after the plate. macOS later. Classrooms and planetariums write for a license. The lab on the web stays free. No ads. No subscription.",
  studioFollowCta: "Notes from the author on X",
  studioPublicCta: "Open the public lab",
  studioLabRepoCta: "Lab repository (build only)",
  studioSourceCta: "Source. All rights reserved.",
  studioEnterCta: "Enter the laboratory",
  studioReserveCta: "Order a copy · 15 USDT",
  studioOrderText: "Hello. Paid 15 USDT BEP20 (or BTC) for a Genesis Engine desktop copy. Sending the tx.",
  payWarn: "Only BEP20 for USDT, Native Segwit for Bitcoin. Any other network burns the transfer.",
  payAfter: "After you send, stamp a plate, then write on X. That is how the copy finds you.",
  payCopy: "Copy address",
  keep: {
    title: "Keep the instrument",
    kicker: "Desktop copy",
    lead: "The lab stays free. A window on your machine is one-time, 15 USDT.",
    includedTitle: "What you take",
    included:
      "Windows or Linux. Offline. The same laboratory. The build is unsigned; SmartScreen may warn. macOS later.",
    notTitle: "What you do not buy",
    notBody: "Not the physics. Not a census. Not a lock on the web lab. Not a subscription.",
    stepsTitle: "Three steps",
    step1: "Send 15 USDT on BEP20, or the same value in Bitcoin on Native Segwit.",
    step2: "Paste the transaction. This device writes a plate — your copy of the settlement, not a lock.",
    step3: "Write on X with the plate and which window you want — Windows or Linux. The author writes back with the zip. Not a store. Not instant.",
    amount: "one-time",
    txLabel: "Transaction",
    txPlaceholder: "0x… or 64-character txid",
    mintCta: "Make the plate",
    plateLabel: "Plate",
    receiptHint: "Keep this. Send it with the tx. The author writes back on X with the window. The lab on the web stays open without it.",
    writeCta: "Write on X with the plate",
    roomTitle: "A room, a class, a hall",
    roomBody: "Classrooms, planetariums, exhibition: write with the size of the room. That license is separate.",
    roomCta: "Write for a room license",
    roomOrderText: "Hello. Classroom or planetarium license for Genesis Engine. Room size:",
    saveCta: "Save the plate",
    invalidTx: "That does not look like a transaction.",
    openCta: "Keep a copy · 15 USDT",
    orderText:
      "Hello. Paid 15 USDT BEP20 (or BTC) for a Genesis Engine desktop copy. Plate {plate}. Tx {tx}. Need Windows / Linux:",
  },
  sourceCode: "© 2026 Ян Ярошевич. All rights reserved.",
  version: `Version ${APP_VERSION_SHORT}`,
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
    tide: "A self-replicating wave is allowed by the clock. Hart and Tipler, not a franchise. Fermi’s silence is still the data.",
    fiftyone: "The plate is classified. The constants are not.",
    highway: "One road, two lanes, no towns for a Hubble time. Keep the towel.",
    zone: "The only law on this sky is the one just set.",
    ice: "The ice is the only mass that still moves. A belt, not a census — and not a series.",
    wow: "A narrowband spike, seventy-two seconds, at the hydrogen line. Big Ear, 1977. Homology, not a telegram.",
    witness: "The work is to look. Not to land. Not to answer for them.",
    throat: "A traversable throat is allowed by the metric — Morris and Thorne, 1988. Geometry, not a door.",
  },
  thisIsOurs: "These constants match our universe — ΛCDM, as we measure it.",
  compareTitle: "Versus our universe",
  versusHome: "Versus home",
  versusYounger: "Younger than home by",
  versusOlder: "Older than home by",
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
  swarm: "Tide",
  swarmTitle: "Von Neumann envelope",
  swarmHint:
    "Not a television swarm. If a mind can build one self-replicating probe, Hart (1975) and Tipler (1980) argued a galaxy-crossing wave is a clock, not a miracle. Fermi’s silence is the observation. This number is permission, not a detection.",
  swarmNote: {
    silent: "No hop. No metals, no host, or the sky rips first.",
    seed: "A launch is not forbidden. The disk is not eaten. Fermi still holds.",
    bloom: "Replication and crossing times fit the stellar clock. A wave could run.",
    tide: "Peak of the envelope. A self-replicating ecology is allowed — not observed.",
  },
  swarmFactors: {
    host: "Host mind",
    metals: "Metals",
    reach: "Reach",
    clock: "Hop clock",
  },
  swarmOpen: "Open tide dossier",
  swarmWhy: "Why the galaxy is not grey",
  swarmFacts: [
    "Hart 1975: a technological species with modest probes fills the Milky Way in a few million years — far shorter than the stellar clock.",
    "Tipler 1980: a self-replicating spacecraft is a von Neumann machine. If physics allows one, physics allows a tide.",
    "Fermi’s question remains the data: we do not see the tide. The envelope says whether a sky could host one, not that it has.",
  ],
  swarmThisSky: "This sky",
  swarmHops: "Hop analog",
  swarmCrossing: "Crossing analog",
  swarmMetal: "Metal index",
  swarmHost: "Host envelope",
  swarmFactorHint: {
    host: "Someone has to build the first machine. Carbon or silicon both count. No mind, no seed.",
    metals: "Probes eat structure. Generations of stars and a dense disk seed the feedstock.",
    reach: "Slow Hubble flow and a milder Λ keep disks in range. Our H₀ and ΩΛ stretch the hop.",
    clock: "The stellar era has to outlast a crossing. A flash sky never launches.",
  },
  swarmBlockers: "What vetoes this sky",
  swarmBlocker: {
    host: "No mind corridor. Nothing to assemble the first probe.",
    metals: "Too little structure or too few stellar generations. No feedstock.",
    reach: "Expansion or dark energy puts the next disk out of range.",
    clock: "Stars die before a hop completes.",
    fog: "No galaxies. Nowhere to hop.",
    crunch: "Recollapse comes before the wave.",
    rip: "Acceleration shreds the route.",
  },
  swarmNoVeto: "No cosmological veto. What remains is engineering we have not seen — and Fermi’s empty sky.",
  swarmCaveat:
    "A tide is a loophole of clocks and metals. It is not a census of machines, and it is not a show.",
  refine: "Refine sky",
  more: "More skies",
  closePanel: "Close",
  foldCorridors: "Life corridors",
  foldObs: "Observatory",
  foldSculpt: "Sculpt the constants",
  labCue: "Read this sky in Lab.",
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
      lensing: "Background sources shear into arcs around the Einstein radius. A Bartelmann NFW halo homology, not a ray tracer. Multiplicity and parity are the map's discrete invariants — not the topology of space.",
      collision: "Stars beyond the tidal radius become tails. Not GADGET. Mass ratio sets the remnant.",
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
        "Electrons lock to nuclei. The sky is the last-scattering wall. Cells are enlarged so ℓ₁ is visible.",
      darkAges:
        "Neutral hydrogen. The wall has cooled. Same acoustic cells, now absorption. 21 cm is a radio line — not a colour.",
      reionization:
        "The first stars burn H II holes in the fog. Light returns to the cosmos.",
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
    baryons: "Baryons",
    dmHint:
      "Share of the unseen mass. Ordinary matter is a thin coat laid down early. The rest is the halo. Not a particle you can name. In halo mode the arcs sit on the Einstein radius. That is the detection.",
    rotationCurve: "Rotation curve",
    rotationHint:
      "The stars you can see would slow down farther out. A halo keeps the outer disk spinning. Same shape as Rubin's curves, not a fit to the SPARC catalog.",
    rotationBaryon: "Baryons only",
    rotationHalo: "This sky",
    rotationR: "radius →",
    rotationV: "km/s",
    tfTitle: "Tully–Fisher",
    tfHint: "Heavier galaxies spin faster. This sky sits on that ridge. Not the SPARC catalog, and not a MOND fit.",
    tfNiche: {
      below: "Halo-heavy",
      ridge: "Ridge",
      above: "Baryon-rich",
    },
    tfRatio: "M_b / v⁴",
    rarTitle: "g_obs vs g_bar",
    fjTitle: "Faber–Jackson",
    fjHint: "In an elliptical, brighter galaxies have faster-moving stars, if size grows with the square root of mass. Size noise puffs the points. Not SPARC.",
    fjSigma: "σ",
    fjRatio: "L / σ⁴",
    fpTitle: "Fundamental plane",
    fpHint: "Mass per light is high in dwarfs and giants, and low in galaxies like ours. That bend is the whole galaxy, not the stars alone.",
    fpNiche: {
      tight: "On plane",
      tilted: "Tilted",
      off: "Off plane",
    },
    fpRe: "Re",
    fpIe: "Ie",
    fpResidual: "Re / plane",
    fpMl: "Υ",
    fpMlBranch: {
      dwarf: "Dwarf",
      valley: "Valley",
      giant: "Giant",
    },
    fpSersic: "n",
    fpMass: "mass →",
    imfTitle: "IMF",
    imfHint: "The mix of star masses (IMF) sets how much gas comes back, how many metals, and how hard the explosions stir the halo. More heavy stars return gas and stir the dark mass. More light stars lock the mass in. This is not a model of chemistry.",
    imfNiche: {
      top: "Top-heavy",
      chabrier: "Chabrier",
      salpeter: "Salpeter",
      bottom: "Bottom-heavy",
    },
    imfSlope: "x",
    imfStar: "Υ*",
    imfMean: "⟨m⟩",
    imfSn: "m>8",
    imfR: "R",
    imfY: "y",
    massTitle: "Stellar mass",
    massHint: "Light gives a mass only if you assume a usual mix of stars, Chabrier. Motions give the mass inside the radius that holds half the light. The lens gives the mass inside the Einstein radius. Those are three different numbers.",
    massNiche: {
      agree: "Agree",
      imf: "IMF bias",
      halo: "Halo in the well",
      split: "Split",
    },
    massPhot: "M_phot",
    massVirial: "M_vir",
    massLens: "M_lens",
    bhTitle: "SMBH",
    bhHint: "The jet is a funnel thousands of light-years long. The streams and the spin live at the edge of the hole. This is not a HARM run and not an EHT image.",
    bhNiche: {
      quiet: "Quiet",
      maintain: "Radio mode",
      quasar: "Quasar",
      quench: "Quenched",
    },
    bhMagorrian: "M_BH / M_bulge",
    bhSoi: "r_soi / Re",
    agnMode: {
      off: "Off",
      wind: "Wind",
      jet: "Jet",
    },
    agnDrive: {
      none: "—",
      momentum: "Momentum",
      energy: "Energy",
    },
    agnLambda: "λ",
    agnHeat: "heat",
    grmhdState: {
      sane: "SANE",
      mad: "MAD",
      thin: "Thin disk",
    },
    grmhdSpin: "a*",
    grmhdEff: "ε_NT",
    grmhdBz: "P_BZ",
    grmhdBp: "P_BP",
    grmhdOmega: "Ω_F / Ω_H",
    grmhdGeom: {
      monopole: "Monopole",
      parabolic: "Parabolic",
    },
    grmhdWin: {
      bz: "Horizon",
      bp: "Disk wind",
      none: "Silent",
    },
    grmhdSpinE: "E_spin",
    grmhdEta: "η_BZ",
    grmhdBeta: "β",
    grmhdRam: "P_B / P_ram",
    fluxAdv: "t_diff / t_adv",
    fluxNiche: {
      diffuse: "Slips",
      advect: "Dragged in",
      expel: "Expelled",
    },
    madSigma: "σ",
    madFill: "streams r_g",
    madFlicker: "flicker",
    madAdaf: "ADAF",
    madFr: {
      none: "—",
      fri: "FR I",
      frii: "FR II",
    },
    haloTitle: "Halo analysis",
    haloHint:
      "Four shapes for the unseen mass. Einasto is the smooth pile. NFW is the one the lens uses. Burkert is a core drawn from galaxies, not from a simulation. coreNFW is a dwarf whose center was heated. This is not a live swarm of particles.",
    haloNiche: {
      keplerian: "Keplerian",
      partial: "Partial",
      held: "Held",
      heavy: "Heavy",
    },
    haloNicheHint: {
      keplerian: "Outer stars follow the visible mass. The halo is too thin to hold the disk.",
      partial: "Some extra speed at large radius. Not yet a Rubin curve.",
      held: "The outer disk is too fast for baryons. This is the detection.",
      heavy: "Almost all the matter is unseen. The disk sits in a deep well.",
    },
    haloFactor: {
      share: "Dark-matter share",
      rotation: "Outer-disk support",
      lens: "Einstein radius",
      clustering: "Clustering",
    },
    haloOuter: "Outer disk",
    haloBaryonV: "Baryons only",
    haloTheta: "θE",
    haloC: "c",
    haloRs: "rs",
    haloContract: "Contraction",
    haloCore: "rc",
    haloKappa: "⟨κ⟩",
    haloKs: "κs",
    haloEinasto: "α",
    haloModel: {
      einasto: "Einasto",
      nfw: "NFW",
      burkert: "Burkert",
      corenfw: "coreNFW",
      isothermal: "Isothermal",
    },
    haloCompare: "ρ(r)/ρ(rs)",
    haloOffChart: "This sky's law is not on the density plot.",
    cmb: "CMB",
    acousticTitle: "Acoustic peaks",
    acousticHint:
      "Sound in the early fog, frozen when the fog cleared. Odd peaks grow when there is more ordinary matter. The third peak feels the unseen mass. The cells on the wall are drawn larger than the sky. The number under the first peak says which wave it is.",
    acousticEll: "ℓ₁",
    acousticEll3: "ℓ₃",
    acousticOddEven: "Odd / even",
    acousticLoad: "Baryon load",
    twentyOne: "21 cm",
    hii: "H II",
    diskTitle: "Disk hydrodynamics",
    diskHint: "How easily the disk breaks into clumps, from the center out. The core is softened so the middle does not spike. This is not a flowing-gas simulation. The long bars count clumps that stay together past one size. They are not holes in spacetime.",
    diskQ: "Q",
    diskPitch: "Pitch",
    diskShear: "Shear",
    diskKappa: "κ",
    diskMesh: "Mesh",
    diskQ1: "Q = 1",
    diskPlummer: "a",
    diskH0: "H0",
    diskNiche: {
      rigid: "Rigid",
      hot: "Hot",
      marginal: "Marginal",
      fragmenting: "Fragmenting",
    },
    diskNicheHint: {
      rigid: "Little shear. A bulge or elliptical: no density wave.",
      hot: "Q is high. The disk is too warm to ring into arms.",
      marginal: "Q ~ 1–2. Spiral waves live here. Inner stars lap the edge.",
      fragmenting: "Q ≲ 1. Self-gravity wins. The disk breaks into clumps.",
    },
    acousticNiche: {
      silent: "Silent",
      damped: "Damped",
      clear: "Clear",
      loaded: "Loaded",
    },
    acousticNicheHint: {
      silent: "No last-scattering contrast. The wall never rang.",
      damped: "Silk damping washes the ladder. High-ℓ peaks die.",
      clear: "A voiced ladder. First peak near ℓ 220 is our sky's scale.",
      loaded: "Baryons weight the odd compressions. Even peaks sit low.",
    },
    hrTitle: "Stellar population",
    hrHint:
      "Hertzsprung–Russell analog: temperature against luminosity. Massive stars race off the main sequence; remnants collect at the dim end.",
    hrEmpty: "Stars have not ignited yet in this epoch.",
    hrT: "← hotter",
    hrL: "brighter →",
    censusMs: "Main sequence",
    censusGiant: "Giants",
    censusRemnant: "Remnants",
    worldsTitle: "One planetary system",
    worldsHint:
      "Kepler ellipses about one star drawn from this sky's mass function, not a star painted on the disk. A planet's period is √(a³/M★); its mass does not enter. Gravity is Newton's pull at this epoch, G = 4π². An overlap merges the bodies and recircularizes them at the center of mass; crossing ellipses are not a merger until the bodies meet. A moon's period uses the planet's mass, stays inside 0.4 of the Hill sphere at pericenter, and stays outside the star. A ring, only on a bound world of at least 20 Earth masses, sits between 1.4 and 2.4 sketch radii — not a Cassini map. A world whose pericenter lies on or inside the photosphere is swallowed and loses both. The watch is velocity Verlet with a one-hour step, a few days at most, planets only. Moons are not stepped. It does not run to the age of the star. The life corridor does not change.",
    worldsEmpty: "No star in this draw has ignited yet.",
    worldsHost: "Host",
    worldsAu: "AU",
    worldsYr: "yr",
    worldsDay: "d",
    worldsBound: "Bound",
    worldsSwallowed: "Swallowed",
    worldsPhase: "true anomaly",
    worldsRing: "Ring",
    worldsMoon: "Moon",
    worldsPull: "pull",
    worldsHour: "h",
    worldsImpacts: "impacts",
    worldsEncounter: { clear: "Clear", crossing: "Crossing", impact: "Merged" },
    worldsStage: {
      unborn: "Unborn",
      mainSequence: "Main sequence",
      giant: "Giant",
      supernova: "Supernova",
      whiteDwarf: "White dwarf",
      neutronStar: "Neutron star",
      blackHole: "Black hole",
    },
  },
  labPanes: { constants: "Const", hunt: "Hunt", life: "Life", laws: "Laws", desk: "Desk" },
  research: {
    title: "Expedition",
    hint: "The expedition compares this sky with a pile of random ones. That pile is the prior: wild draws plus all four corridors. The theorist looks for a tighter fit. The analyst changes one constant at a time and watches how far the score moves. Not a trained net.",
    run: "Run expedition",
    running: "Counting the prior…",
    target: {
      carbon: "Carbon",
      silicon: "Silicon",
      eternal: "Eternity",
      swarm: "Tide",
      overall: "Either",
      diversity: "Both",
    },
    targetHint: {
      carbon: "Search the quiet water corridor.",
      silicon: "Search the hot, reducing corridor.",
      eternal: "Search the near-zero-Λ Dyson loophole.",
      swarm: "Search the von Neumann corridor — a self-replicating reach, not a fifth chemistry.",
      overall: "Take the better of carbon, silicon, eternity, or the tide.",
      diversity: "Rare skies where both chemistries are open.",
    },
    sample: "Random skies",
    viableC: "Carbon-viable",
    viableSi: "Silicon-viable",
    viableEt: "Dyson-open",
    viableSw: "Tide-open",
    corr: "C–Si correlation",
    percentile: "Where this sky sits among them",
    importance: "Which constant moves the pile",
    importanceHint:
      "Shuffle one constant through the random skies. The score that jumps is the lever.",
    local: "Which constant moves this sky",
    fates: "Which fates came up",
    observer: "Observer",
    theorist: "Theorist",
    apply: "Load this sky",
    empty: "Run the expedition. It throws many random skies, the prior. Most are dead. That is the measurement.",
    failed: "The expedition did not finish. Run it again.",
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
        "This sky sits in the high tail of the random pile for the chosen target. Worth starring.",
      thisSkyLow:
        "This sky is ordinary or worse than most of the random pile. Refine, or hunt.",
      theoristImproved:
        "Theorist climbed past the Observer’s best draw. Hill-climbing found a tighter corridor.",
      darkEnergyDominatesEternal:
        "Dark energy is the hinge of eternity. A de Sitter horizon (ΩΛ ≳ 0) is the Krauss–Starkman veto.",
      eternalRare:
        "Dyson-open draws are scarce. Most random constants light a horizon, crunch, or leave no remnants.",
      tideRare:
        "Tide-open draws are scarce. Most random constants stall the host or stretch disks too far for a self-replicating reach.",
    },
  },
  civ: {
    title: "Intelligence window",
    hint: "Where a path from chemistry to a mind can close on this sky. Not a count of minds.",
    path: "Chemistry path",
    pathLabel: {
      carbon: "Carbon–water",
      silicon: "Silicon (speculative)",
      eternal: "Dyson remnant",
      none: "No foothold",
    },
    intelligence: "Chance of a mind",
    carrying: "How much it could feed",
    ships: "Energy left for a road, not a fleet",
    routes: "Thin diaspora analog: a road, not a fleet",
    spend: "Carrying × stellar generations — energy a mind could spend, not a treasury and not a fleet.",
    quiet: "Nobody is shouting. Fermi’s silence is the datum — not a series.",
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
  mandate: {
    title: "The work",
    hint: "An observatory thesis, not a score. Physics is not for sale.",
    next: "Next",
    sealed: "Sealed",
    openLabel: "Open",
    done: "The atlas is sealed. The sky still turns.",
    progress: "{n} of {m}",
    open: "The work",
    atlasTick: "{fate}. Atlas {n} of {m}.",
    atlasHave: "Logged",
    atlasNeed: "Still to see",
    chapters: {
      witness: {
        title: "First light",
        body: "Witness a sky. Any constants. Most stay empty.",
        hint: "Birth a universe.",
      },
      corridor: {
        title: "A corridor",
        body: "Habitable, teeming, or enduring. A foothold for chemistry.",
        hint: "Survey 64 if the sky is empty.",
      },
      home: {
        title: "Home",
        body: "Stand in ΛCDM. Grey ticks on the levers are our numbers.",
        hint: "Our universe.",
      },
      silicon: {
        title: "Silicon niche",
        body: "Heat and pressure, not water. Speculative, but allowed.",
        hint: "Known skies → Silicon, or Hunt.",
      },
      eternal: {
        title: "Dyson loophole",
        body: "Λ near zero. Remnant minds could slow without bound — Dyson, not rapture.",
        hint: "Known skies → Eternal.",
      },
      tide: {
        title: "Von Neumann tide",
        body: "A self-replicating wave is a clock problem. Hart, Tipler — not a franchise.",
        hint: "Known skies → Tide.",
      },
      diaspora: {
        title: "Thin diaspora",
        body: "Carrying × generations. Energy a mind could spend — not a fleet.",
        hint: "Refine a living sky.",
      },
      atlas: {
        title: "Five fates",
        body: "Void, crunch, rip, flash, fog, sterile, enduring, habitable, teeming. Log five.",
        hint: "Birth until the atlas thickens.",
      },
      chronicle: {
        title: "Field note",
        body: "Commission a chronicle. Numbers, then a sentence.",
        hint: "Lab → Const → Write field note.",
      },
      keep: {
        title: "A keeper",
        body: "Star a sky worth keeping. The log remembers.",
        hint: "The star next to the name.",
      },
      core: {
        title: "Cored halo",
        body: "Two cores, not one. Burkert is an empirical floor. coreNFW is an NFW cusp heated by stars. Not a new particle.",
        hint: "Scatter the disk or raise quantum noise.",
      },
      toomre: {
        title: "Toomre break",
        body: "Q ≲ 1. Self-gravity wins. The disk fragments into clumps.",
        hint: "Colder, heavier spiral. Hunt until the disk tears.",
      },
      peak: {
        title: "Loaded peaks",
        body: "Acoustic odd-even not our 220. Baryons load the CMB, or fog damps it.",
        hint: "Complexity up, or a noisy fog.",
      },
      engine: {
        title: "Central engine",
        body: "Quasar or quench. Magnetic pressure, not a light show.",
        hint: "An elliptical, or a feeding AGN.",
      },
      ring: {
        title: "Lens ring",
        body: "An isothermal halo (SIS) draws an Einstein ring. That is a lens, not a pattern on the disk.",
        hint: "Elliptical sky. Lensing mode is the eyepiece.",
      },
    },
    flash: {
      witness: "First light. The work begins.",
      corridor: "A corridor. Something could live.",
      home: "Home. Grey ticks, our numbers.",
      silicon: "Silicon niche. Heat, not water.",
      eternal: "Dyson loophole. Λ almost gone.",
      tide: "Von Neumann tide. A clock, not a show.",
      diaspora: "Thin diaspora analog. Not a fleet.",
      atlas: "Five fates. The atlas thickens.",
      chronicle: "A field note. The desk remembers.",
      keep: "A keeper. Starred against the void.",
      core: "Cored halo. The cusp gave way.",
      toomre: "Toomre break. The disk tears.",
      peak: "Loaded peaks. Not our ℓ 220.",
      engine: "Central engine. Quasar or quench.",
      ring: "Lens ring. An isothermal halo, not a pattern on the disk.",
    },
    cue: {
      witness: "Birth a universe.",
      corridor: "Survey 64 — hunt a foothold.",
      home: "Our universe — stand in ΛCDM.",
      silicon: "Find a silicon niche. Known skies, or Hunt.",
      eternal: "Find the Dyson loophole. Almost no dark energy.",
      tide: "Find a von Neumann tide. Closer disks, more metals.",
      diaspora: "Refine a living sky until a thin diaspora appears.",
      atlas: "Birth until five fates sit in the log.",
      chronicle: "Lab → Const. Write a field note.",
      keep: "Star a sky worth keeping.",
      core: "Find a cored halo — noisy or scattered.",
      toomre: "Hunt a fragmenting disk. Q ≲ 1.",
      peak: "Load or damp the acoustic peaks.",
      engine: "Find a quasar or a quenched elliptical.",
      ring: "An isothermal halo. Elliptical sky.",
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
    failed: "Report did not save",
  },
  laws: {
    title: "Laws",
    hint: "Three jobs. Fit a formula to this sky. Test whether a threshold matters. Lay a real Pan-STARRS star field on the screen. The formula fits the scoring model. It is not new physics and not a neural net.",
    symbolic: "Recover a formula",
    symbolicHint:
      "A short formula that copies the scoring model: a few bumps, bends, and products. Not new physics. Held-out R² is the score. AIC charges for extra pieces.",
    discover: "Fit a formula",
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
      "Throw many random skies and split them at the threshold you set. One rate if the cut does nothing, two if it does. The Bayes factor says whether the cut earned its keep. The bands hold 95% of the draws.",
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
    catalog: "Pan-STARRS field",
    catalogHint:
      "A real MAST cone from Pan-STARRS DR2. Quality is gri completeness and nDet, not a flag bit. Default is the M31 nucleus.",
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
    dqComplete: "gri",
    dqDet: "⟨nDet⟩",
    dqNiche: {
      thin: "Thin",
      fair: "Fair",
      clean: "Clean",
    },
  },
  desk: {
    title: "Observatory desk",
    hint: "The desk runs a chain of skies near this one and draws the cloud. From here you also export a file (FITS, VOTable or slides) and read the disk class. The posterior is that cloud of accepted variants, not a new sky.",
    mcmc: "The cloud",
    mcmcHint:
      "The walk starts at this sky. A better step is kept. A worse step is sometimes kept, so the cloud is not one point. Colour and height are that score. The up axis is matter density.",
    run: "Run the chain",
    running: "Sampling the model…",
    empty: "Run a walk to see the chain in 3D. Most random constants are dead — the cloud should hug a thin corridor if this sky is informative.",
    accept: "Accept",
    ess: "ESS",
    walker: "Walker",
    walkerMh: "Metropolis",
    walkerHmc: "HMC leapfrog",
    map: "MAP",
    mean: "Mean",
    prior: "Uniform prior",
    samples: "Kept",
    loadMap: "Load MAP sky",
    axes: "X gravity · Y log L · Z matter",
    analysis: "Posterior reading",
    analysisHint:
      "Equal-tail 16–84% on this chain. Split-R̂ from two halves of one walk. Corridor mass is the share with score ≥ 0.18. The likelihood is the scoring model, not nature.",
    interval: "16–84%",
    median: "Median",
    rhat: "Split-R̂",
    rhatHint: "Near 1, the walk mixed. Above ~1.2, the cloud is still sticky.",
    tau: "τ int",
    corridorMass: "Mass in corridor",
    corridorHint: "Share of the chain with score ≥ 0.18. Envelope, not a census.",
    thisInCloud: "This sky in the cloud",
    pairing: "Strongest pairing",
    marginals: "Marginals",
    trace: "log L",
    chains: "Chains",
    chainsHint: "Step on the x-axis. A stuck walk is a flat line. Not emcee.",
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
    needChain: "Run the chain first.",
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


const copyCache = new Map<string, Copy>();
let ruCopy: Copy | null = null;
let ruWait: Promise<Copy> | null = null;
let beCopy: Copy | null = null;
let beWait: Promise<void> | null = null;

/** Russian is a full authored copy. Load it only when the locale is ru or be. */
export function hydrateRu(): Promise<Copy> {
  if (ruCopy) return Promise.resolve(ruCopy);
  if (!ruWait) {
    ruWait = import("./i18n-ru.ts").then(({ ru }) => {
      ruCopy = ru;
      copyCache.delete("ru");
      return ru;
    });
  }
  return ruWait;
}

/** Belarusian is built from Russian. Both stay off the first frame until asked. */
export function hydrateBe(): Promise<void> {
  if (beCopy) return Promise.resolve();
  if (!beWait) {
    beWait = hydrateRu().then((ru) =>
      import("./i18n-be.ts").then(({ makeBe }) => {
        beCopy = makeBe(ru);
        copyCache.delete("be");
      }),
    );
  }
  return beWait;
}

const PACK_LOCALES = [
  "de",
  "nl",
  "fr",
  "es",
  "pt",
  "it",
  "pl",
  "uk",
  "zh",
  "ja",
  "ar",
  "tr",
  "hi",
  "ko",
  "eo",
  "tlh",
  "hv",
] as const;

type LocaleOverlay = {
  pack: DeepPartial<Copy>;
  hud: DeepPartial<Copy>;
  settings: DeepPartial<Copy>;
};

const overlays = new Map<string, LocaleOverlay>();
const packWaits = new Map<string, Promise<void>>();

export function coreLocale(id: string): boolean {
  return id === "en" || id === "ru" || id === "be";
}

/** One authored overlay. Other locales in the same family stay unloaded. */
export function hydratePack(id: string): Promise<void> {
  const locale = canonicalLocale(id);
  if (!(PACK_LOCALES as readonly string[]).includes(locale)) return Promise.resolve();
  if (overlays.has(locale)) return Promise.resolve();
  let wait = packWaits.get(locale);
  if (!wait) {
    wait = import(`./locales/one/${locale}.ts`).then((mod) => {
      overlays.set(locale, { pack: mod.pack, hud: mod.hud, settings: mod.settings });
      copyCache.delete(locale);
    });
    packWaits.set(locale, wait);
  }
  return wait;
}

/** English stays on the first frame. ru, be, and one overlay load on demand. */
export function hydrateLocale(id: string): Promise<void> {
  const locale = canonicalLocale(id);
  if (locale === "en") return Promise.resolve();
  if (locale === "ru") return hydrateRu().then(() => undefined);
  if (locale === "be") return hydrateBe();
  return hydratePack(locale);
}

export async function hydratePacks(): Promise<void> {
  await Promise.all(PACK_LOCALES.map((id) => hydratePack(id)));
}

export function copyFor(locale: string): Copy {
  const id = canonicalLocale(locale);
  const hit = copyCache.get(id);
  if (hit) return hit;
  let out: Copy = en;
  if (id === "ru") {
    if (!ruCopy) throw new Error("ru copy is not loaded");
    out = ruCopy;
  } else if (id === "be") {
    if (!beCopy) throw new Error("be copy is not loaded");
    out = beCopy;
  } else {
    const over = overlays.get(id);
    if (over) {
      out = mergeCopy(en, over.pack);
      out = mergeCopy(out, over.hud);
      out = mergeCopy(out, over.settings);
    }
  }
  copyCache.set(id, out);
  return out;
}

export const COPY: Record<string, Copy> = {
  en,
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
