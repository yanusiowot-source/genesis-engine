import {
  Aperture,
  Atom,
  ChevronDown,
  CircleHelp,
  Download,
  FileDown,
  ScanSearch,
  ScrollText,
  Settings,
  Share2,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, lazy, Suspense, type ReactNode } from "react";
import { GalaxyCanvas } from "@/components/galaxy-canvas";
import { CosmicClock } from "@/components/cosmic-clock";
import { MoreMenu } from "@/components/more-menu";
import { Onboarding } from "@/components/onboarding";
import { SkyModes } from "@/components/sky-modes";
import { TabBar, type AppTab } from "@/components/tab-bar";
import { Button } from "@/components/ui/button";

const AcousticPanel = lazy(() =>
  import("@/components/acoustic-panel").then((m) => ({ default: m.AcousticPanel })),
);
const AstroPanel = lazy(() =>
  import("@/components/astro-panel").then((m) => ({ default: m.AstroPanel })),
);
const BiospherePanel = lazy(() =>
  import("@/components/biosphere-panel").then((m) => ({ default: m.BiospherePanel })),
);
const CatalogOverlay = lazy(() =>
  import("@/components/catalog-overlay").then((m) => ({ default: m.CatalogOverlay })),
);
const CitizenPanel = lazy(() =>
  import("@/components/citizen-panel").then((m) => ({ default: m.CitizenPanel })),
);
const CivPanel = lazy(() =>
  import("@/components/civ-panel").then((m) => ({ default: m.CivPanel })),
);
const CompareOurs = lazy(() =>
  import("@/components/compare-ours").then((m) => ({ default: m.CompareOurs })),
);
const DeskPanel = lazy(() =>
  import("@/components/desk-panel").then((m) => ({ default: m.DeskPanel })),
);
const DiskPanel = lazy(() =>
  import("@/components/disk-panel").then((m) => ({ default: m.DiskPanel })),
);
const EpochTimeline = lazy(() =>
  import("@/components/epoch-timeline").then((m) => ({ default: m.EpochTimeline })),
);
const EternalDossier = lazy(() =>
  import("@/components/eternal-dossier").then((m) => ({ default: m.EternalDossier })),
);
const EternalPanel = lazy(() =>
  import("@/components/eternal-panel").then((m) => ({ default: m.EternalPanel })),
);
const HaloPanel = lazy(() =>
  import("@/components/halo-panel").then((m) => ({ default: m.HaloPanel })),
);
const HelpSheet = lazy(() =>
  import("@/components/help-sheet").then((m) => ({ default: m.HelpSheet })),
);
const HrDiagram = lazy(() =>
  import("@/components/hr-diagram").then((m) => ({ default: m.HrDiagram })),
);
const HubblePanel = lazy(() =>
  import("@/components/hubble-panel").then((m) => ({ default: m.HubblePanel })),
);
const InstallSheet = lazy(() =>
  import("@/components/install-sheet").then((m) => ({ default: m.InstallSheet })),
);
const KeepSheet = lazy(() =>
  import("@/components/keep-sheet").then((m) => ({ default: m.KeepSheet })),
);
const LawsPanel = lazy(() =>
  import("@/components/laws-panel").then((m) => ({ default: m.LawsPanel })),
);
const LifeFactors = lazy(() =>
  import("@/components/life-factors").then((m) => ({ default: m.LifeFactors })),
);
const LogList = lazy(() =>
  import("@/components/log-list").then((m) => ({ default: m.LogList })),
);
const MandateSheet = lazy(() =>
  import("@/components/mandate-sheet").then((m) => ({ default: m.MandateSheet })),
);
const ParamSliders = lazy(() =>
  import("@/components/param-sliders").then((m) => ({ default: m.ParamSliders })),
);
const ResearchPanel = lazy(() =>
  import("@/components/research-panel").then((m) => ({ default: m.ResearchPanel })),
);
const SettingsSheet = lazy(() =>
  import("@/components/settings-sheet").then((m) => ({ default: m.SettingsSheet })),
);
const LabPanes = lazy(() =>
  import("@/components/lab-panes").then((m) => ({ default: m.LabPanes })),
);
const ScriptureSheet = lazy(() =>
  import("@/components/scripture-sheet").then((m) => ({ default: m.ScriptureSheet })),
);
const ScriptureLine = lazy(() =>
  import("@/components/scripture-line").then((m) => ({ default: m.ScriptureLine })),
);
const SiliconDossier = lazy(() =>
  import("@/components/silicon-dossier").then((m) => ({ default: m.SiliconDossier })),
);
const SiliconPanel = lazy(() =>
  import("@/components/silicon-panel").then((m) => ({ default: m.SiliconPanel })),
);
const SwarmDossier = lazy(() =>
  import("@/components/swarm-dossier").then((m) => ({ default: m.SwarmDossier })),
);
const SwarmPanel = lazy(() =>
  import("@/components/swarm-panel").then((m) => ({ default: m.SwarmPanel })),
);
import {
  loadArchive,
  kvGet,
  kvSet,
  removeFromArchive,
  saveArchive,
  toggleStar,
  upsertArchive,
  makeRecord,
} from "@/lib/universe/archive";
import {
  DEFAULT_MUSIC_VOLUME,
  loadMusicSource,
  loadMusicVolume,
  loadOwnTrackName,
  loadSoundPref,
  nudgeSoundscape,
  persistMusicSource,
  persistMusicVolume,
  primeAudio,
  restoreOwnTrack,
  retuneSoundscape,
  addOwnTracks,
  playOwnTrack,
  removeOwnTrack,
  getOwnPlaylist,
  getOwnTrackName,
  getPlayIndex,
  clearOwnTrack,
  setSoundscape,
  unlockAndStart,
  subscribeAudioStatus,
  releaseAudio,
  pingEgg,
  pingSignal,
  pingBirth,
  pingImpact,
  pingContact,
  type MusicSource,
  type PlaylistEntry,
} from "@/lib/universe/audio-gate";
import { formatGyr, formatHudPct, formatPct } from "@/lib/universe/format";
import {
  haptic,
  loadHapticPref,
  setHapticEnabled,
} from "@/lib/universe/haptic";
import { autonym, bcp47, copyFor, detectLocale, hydrateLocale, persistLocale, type Locale } from "@/lib/universe/i18n";

import { detectPlatform, type PlatformInfo } from "@/lib/universe/platform";
import {
  applyPrefs,
  loadContrast,
  loadScripture,
  loadTypeScale,
  persistContrast,
  persistScripture,
  persistTypeScale,
  type TypeScale,
} from "@/lib/universe/prefs";
import { intelligenceWindow } from "@/lib/universe/civilization";
import {
  ATLAS_N,
  MANDATE_COUNT,
  MANDATE_IDS,
  MANDATE_KEY,
  bootstrapLab,
  emptyMandate,
  formatAtlasTick,
  hydrateMandate,
  isIdleHome,
  loadMandate,
  mergeMandate,
  nextOpen,
  observe,
  parseMandate,
  persistMandate,
  sealedCount,
  type MandateAct,
  type MandateProgress,
} from "@/lib/universe/mandate";
import {
  DESERT_EPOCH,
  DESERT_SEED,
  ETERNAL_CORRIDOR,
  ETERNAL_SEED,
  HIGHWAY_CORRIDOR,
  HIGHWAY_SEED,
  BELT_CORRIDOR,
  BELT_SEED,
  CLUSTER_SKY,
  CLUSTER_SEED,
  DWARF_SKY,
  DWARF_SEED,
  OUR_SEED,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  SILICON_SEED,
  SWARM_CORRIDOR,
  SWARM_SEED,
  isOurParams,
  randomParams,
  refine,
  siliconDossier,
  survey,
} from "@/lib/universe/physics";
import {
  type ExpeditionResult,
  type ResearchTarget,
} from "@/lib/universe/research";
import { isAboutHash, isHostedLab, isKeepHash } from "@/lib/universe/studio";
import type { DiscoveryResult } from "@/lib/universe/symbolic";
import type { BayesResult } from "@/lib/universe/bayes";
import type { CatalogResult, CutoutResult } from "@/lib/universe/mast";
import type { McmcResult } from "@/lib/universe/mcmc";
import type { SkyVote } from "@/lib/universe/zooniverse";
import {
  clamp,
  isAnswerCatalog,
  mulberry32,
  randomSeed,
} from "@/lib/universe/rng";
import { ANSWER_SEED, isEggPrefix, noteEggKey, sliderEgg } from "@/lib/universe/eggs";
import { pickEncounter, type EncounterKind, type SkyEncounter } from "@/lib/universe/encounters";
import { pickDispatch, voiceFor, type PlotId } from "@/lib/universe/plot";
import { registerGenesisWorker } from "@/lib/universe/service-worker";
import { bootNfwWasm } from "@/lib/universe/nfw-wasm";
import { decodeUniverse, encodeUniverse, shareUrl } from "@/lib/universe/share";
import { compareToOurs, formatCompareLine, plateTitle } from "@/lib/universe/compare";
import type { Fate, LabPane, ParamKey, SkyMode, UniverseParams, UniverseRecord } from "@/lib/universe/types";
import { cn } from "@/lib/utils";
import { nowMarker, epochShown, haloDossier, acousticDossier, diskDossier, NOW_T } from "@/lib/universe/observatory";

const ONBOARD_KEY = "genesis-engine-onboarded-v5";

function Fold({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="lab-fold group rounded-[var(--radius-md)] bg-bg/50">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm font-medium text-fg">
        <span>{title}</span>
        <ChevronDown className="size-4 shrink-0 text-fg-subtle transition-transform duration-[var(--motion-quick)] ease-[var(--ease-out)] group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-6 border-t border-border px-3 py-4">{children}</div>
    </details>
  );
}

const HUD_MARK = { carbon: "C", silicon: "Si", eternal: "∞", swarm: "T" } as const;

function corridorReadout(compact: boolean, mark: string, name: string, p: number) {
  return compact ? `${mark} ${formatHudPct(p)}` : `${name} ${formatPct(p)}`;
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

export function UniverseApp() {
  const fromLinkRef = useRef(false);
  const [current, setCurrent] = useState<UniverseRecord>(() =>
    makeRecord(OUR_UNIVERSE, OUR_SEED),
  );
  const [archive, setArchive] = useState<UniverseRecord[]>([]);
  const [locale, setLocale] = useState<Locale>("en");
  const [packTick, setPackTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [egg, setEgg] = useState<string | null>(null);
  const [birthFlash, setBirthFlash] = useState(false);
  const [surveyNudge, setSurveyNudge] = useState(false);
  const [oursNudge, setOursNudge] = useState(false);
  const [labNudge, setLabNudge] = useState(false);
  const [huntNudge, setHuntNudge] = useState(false);
  const [whaleOn, setWhaleOn] = useState(false);
  const [tauOn, setTauOn] = useState(false);
  const [classifiedOn, setClassifiedOn] = useState(false);
  const [zoneOn, setZoneOn] = useState(false);
  const [wowOn, setWowOn] = useState(false);
  const [witnessOn, setWitnessOn] = useState(false);
  const [throatOn, setThroatOn] = useState(false);
  const [impactFate, setImpactFate] = useState<Fate>("void");
  const [impactKey, setImpactKey] = useState(0);
  const [impactPower, setImpactPower] = useState(0);
  const [encounter, setEncounter] = useState<SkyEncounter | null>(null);
  const encounterLive = useRef<SkyEncounter | null>(null);
  encounterLive.current = encounter;
  const [scanning, setScanning] = useState(false);
  const [dispatchId, setDispatchId] = useState<PlotId>("home");
  const [caughtKind, setCaughtKind] = useState<EncounterKind | null>(null);
  const kickerTaps = useRef(0);
  const titleTaps = useRef(0);
  const fateTaps = useRef(0);
  const siliconTaps = useRef(0);
  const eternalTaps = useRef(0);
  const swarmTaps = useRef(0);
  const eggTimer = useRef(0);
  const tauTimer = useRef(0);
  const classifiedTimer = useRef(0);
  const zoneTimer = useRef(0);
  const wowTimer = useRef(0);
  const witnessTimer = useRef(0);
  const throatTimer = useRef(0);
  const whaleTimer = useRef(0);
  const eggWait = useRef(0);
  const birthFlashTimer = useRef(0);
  const onboardBirthTimer = useRef(0);
  const copyTimer = useRef(0);
  const shareTimer = useRef(0);
  const reportTimer = useRef(0);
  const surveyNudgeTimer = useRef(0);
  const oursNudgeTimer = useRef(0);
  const labNudgeTimer = useRef(0);
  const huntNudgeTimer = useRef(0);
  const huntTimer = useRef(0);
  const huntGen = useRef(0);
  const encounterTimer = useRef(0);
  const encounterGone = useRef(0);
  const scanTimer = useRef(0);
  const scanGen = useRef(0);
  const sculptTimer = useRef(0);
  const sculptRef = useRef<UniverseRecord | null>(null);
  const keyBuf = useRef("");
  const collisionHinted = useRef(false);
  const dotHinted = useRef(false);
  const tauHinted = useRef(false);
  const labHinted = useRef(false);
  const huntHinted = useRef(false);
  const huntAuto = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [onboard, setOnboard] = useState(true);
  const [tab, setTab] = useState<AppTab>("sky");
  const tabRef = useRef<AppTab>("sky");
  tabRef.current = tab;
  const [compact, setCompact] = useState(false);
  const [labPane, setLabPane] = useState<LabPane>("constants");
  const [researchTarget, setResearchTarget] = useState<ResearchTarget>("carbon");
  const [expedition, setExpedition] = useState<ExpeditionResult | null>(null);
  const [hunting, setHunting] = useState(false);
  const [lawResult, setLawResult] = useState<DiscoveryResult | null>(null);
  const [bayesResult, setBayesResult] = useState<BayesResult | null>(null);
  const [mcmcResult, setMcmcResult] = useState<McmcResult | null>(null);
  const [votes, setVotes] = useState<SkyVote[]>([]);
  const [catalog, setCatalog] = useState<CatalogResult | null>(null);
  const [cutout, setCutout] = useState<CutoutResult | null>(null);
  const [catalogOverlay, setCatalogOverlay] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const draftFor = useRef("");
  const [mode, setMode] = useState<SkyMode>("galaxy");
  const timeRef = useRef(0.55);
  const [cosmicTime, setCosmicTimeState] = useState(0.55);
  const setCosmicTime = useCallback((t: number | ((prev: number) => number)) => {
    setCosmicTimeState((prev) => {
      const next = typeof t === "function" ? t(prev) : t;
      timeRef.current = next;
      return next;
    });
  }, []);
  const [evolving, setEvolving] = useState(false);
  const [evolveUntil, setEvolveUntil] = useState(1);
  const toggleEvolve = useCallback(() => {
    setEvolving((on) => {
      if (on) {
        setCosmicTime(timeRef.current);
        return false;
      }
      setEvolveUntil(1);
      setCosmicTime((t) => (t >= 0.98 ? 0 : t));
      return true;
    });
  }, [setCosmicTime]);
  const [collisionKey, setCollisionKey] = useState(0);
  const [installOpen, setInstallOpen] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutIntent, setAboutIntent] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);
  const [keepIntent, setKeepIntent] = useState(false);
  const [siliconOpen, setSiliconOpen] = useState(false);
  const [eternalOpen, setEternalOpen] = useState(false);
  const [swarmOpen, setSwarmOpen] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [audioLive, setAudioLive] = useState(false);
  const [wakeKey, setWakeKey] = useState(0);
  const [musicSource, setMusicSource] = useState<MusicSource>("cosmos");
  const [musicVolume, setMusicVolume] = useState(DEFAULT_MUSIC_VOLUME);
  const [ownTrackName, setOwnTrackName] = useState("");
  const [ownTracks, setOwnTracks] = useState<PlaylistEntry[]>([]);
  const [playIndex, setPlayIndex] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const [scriptureOpen, setScriptureOpen] = useState(false);
  const [scriptureOn, setScriptureOn] = useState(true);
  const [scriptureReady, setScriptureReady] = useState(false);
  const pickPassageRef = useRef<
    ((typeof import("@/lib/universe/scripture"))["pickPassage"]) | null
  >(null);
  const [mandateOpen, setMandateOpen] = useState(false);
  const [mandate, setMandate] = useState<MandateProgress>(emptyMandate);
  const mandateRef = useRef<MandateProgress>(emptyMandate());
  const mandateReady = useRef(false);
  const [contrast, setContrast] = useState(false);
  const [typeScale, setTypeScale] = useState<TypeScale>("md");
  const [standalone, setStandalone] = useState(false);
  const [platform, setPlatform] = useState<PlatformInfo>({
    kind: "other",
    electron: false,
    capacitor: false,
    standalone: false,
    native: false,
  });
  const installPrompt = useRef<InstallPromptEvent | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);
  const soundOnRef = useRef(false);
  const paramsRef = useRef(current.params);
  const copy = useMemo(() => copyFor(locale), [locale, packTick]);
  soundOnRef.current = soundOn;
  paramsRef.current = current.params;

  const flashEgg = useCallback((text: string, ms = 5200) => {
    haptic(14);
    try {
      pingEgg();
    } catch {
      /* audio graph must never swallow the line */
    }
    setEgg(text);
    window.clearTimeout(eggTimer.current);
    eggTimer.current = window.setTimeout(() => setEgg(null), ms);
  }, []);

  const flashMandate = useCallback((line: string) => {
    flashEgg(line, 4000);
  }, [flashEgg]);

  const applyMandate = useCallback(
    (
      record: UniverseRecord,
      event: "see" | "birth" | "chronicle" | "star",
      opts?: { flash?: boolean },
    ) => {
      const civNow = intelligenceWindow(record.params, record.evaluation);
      const { progress: next, sealed, addedFate } = observe(mandateRef.current, { record, civ: civNow, event });
      if (next !== mandateRef.current) {
        mandateRef.current = next;
        setMandate(next);
        persistMandate(next);
        void kvSet(MANDATE_KEY, next);
      }
      if (opts?.flash !== false && mandateReady.current && sealed[0]) {
        flashMandate(copy.mandate.flash[sealed[0]]);
      }
      return { sealed, addedFate, progress: mandateRef.current };
    },
    [copy.mandate.flash, flashMandate],
  );

  const armTau = useCallback(() => {
    tauHinted.current = true;
    setTab("sky");
    setMode("planetarium");
    setTauOn(true);
    haptic(14);
    try {
      pingSignal();
    } catch {
      /* a missed chirp is not a missed joke */
    }
    setEgg(copy.eggs.tau);
    window.clearTimeout(eggTimer.current);
    eggTimer.current = window.setTimeout(() => setEgg(null), 9000);
    window.clearTimeout(tauTimer.current);
    tauTimer.current = window.setTimeout(() => setTauOn(false), 11000);
  }, [copy.eggs.tau]);

  const armClassified = useCallback(() => {
    setTab("sky");
    setMode("planetarium");
    setClassifiedOn(true);
    flashEgg(copy.eggs.fiftyone, 8000);
    window.clearTimeout(classifiedTimer.current);
    classifiedTimer.current = window.setTimeout(() => setClassifiedOn(false), 14000);
  }, [copy.eggs.fiftyone, flashEgg]);

  const armZone = useCallback(() => {
    setTab("sky");
    setZoneOn(true);
    flashEgg(copy.eggs.zone, 7000);
    window.clearTimeout(zoneTimer.current);
    zoneTimer.current = window.setTimeout(() => setZoneOn(false), 8000);
  }, [copy.eggs.zone, flashEgg]);

  const armWow = useCallback(() => {
    setTab("sky");
    setWowOn(true);
    flashEgg(copy.eggs.wow, 8000);
    window.clearTimeout(wowTimer.current);
    wowTimer.current = window.setTimeout(() => setWowOn(false), 10000);
  }, [copy.eggs.wow, flashEgg]);

  const armWitness = useCallback(() => {
    setTab("sky");
    setWitnessOn(true);
    flashEgg(copy.eggs.witness, 8000);
    window.clearTimeout(witnessTimer.current);
    witnessTimer.current = window.setTimeout(() => setWitnessOn(false), 9000);
  }, [copy.eggs.witness, flashEgg]);

  const armThroat = useCallback(() => {
    setTab("sky");
    setThroatOn(true);
    flashEgg(copy.eggs.throat, 8000);
    window.clearTimeout(throatTimer.current);
    throatTimer.current = window.setTimeout(() => setThroatOn(false), 11000);
  }, [copy.eggs.throat, flashEgg]);

  const catchEncounter = useCallback(
    (kind: EncounterKind) => {
      setEncounter(null);
      window.clearTimeout(encounterGone.current);
      try {
        pingContact();
      } catch {
        /* never block the catch */
      }
      haptic(18);
      setCaughtKind(kind);
      setDispatchId(
        pickDispatch({
          births: mandateRef.current.births,
          fate: current.evaluation.fate,
          next: nextOpen(mandateRef.current),
          ours: isOurParams(current.params),
          caught: kind,
        }),
      );
      const el = document.activeElement;
      if (el instanceof HTMLElement) el.blur();
      if (kind === "wow") armWow();
      else if (kind === "throat") armThroat();
      else if (kind === "classified") armClassified();
      else if (kind === "tau") armTau();
      else if (kind === "zone") armZone();
      else if (kind === "whale") {
        setCosmicTime(0.97);
        setEvolving(false);
        setWhaleOn(true);
        flashEgg(copy.eggs.whale, 8000);
        window.clearTimeout(whaleTimer.current);
        whaleTimer.current = window.setTimeout(() => setWhaleOn(false), 24000);
      }
    },
    [armClassified, armTau, armThroat, armWow, armZone, copy.eggs.whale, current, flashEgg, setCosmicTime],
  );

  const revealHomeSky = useCallback(() => {
    if (!dotHinted.current) {
      dotHinted.current = true;
      flashEgg(copy.eggs.dot);
    }
    if (tauHinted.current) return;
    tauHinted.current = true;
    setTauOn(true);
    window.clearTimeout(tauTimer.current);
    tauTimer.current = window.setTimeout(() => setTauOn(false), 9000);
  }, [copy.eggs.dot, flashEgg]);

  const armLabNudge = useCallback(() => {
    if (labHinted.current) return;
    if (tabRef.current === "lab") {
      labHinted.current = true;
      return;
    }
    labHinted.current = true;
    setLabNudge(true);
    window.clearTimeout(labNudgeTimer.current);
    labNudgeTimer.current = window.setTimeout(() => setLabNudge(false), 7200);
  }, []);

  useEffect(() => {
    document.documentElement.lang = bcp47(locale);
  }, [locale]);

  useEffect(() => {
    void registerGenesisWorker();
    void bootNfwWasm();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(eggTimer.current);
      window.clearTimeout(tauTimer.current);
      window.clearTimeout(classifiedTimer.current);
      window.clearTimeout(zoneTimer.current);
      window.clearTimeout(wowTimer.current);
      window.clearTimeout(witnessTimer.current);
      window.clearTimeout(throatTimer.current);
      window.clearTimeout(whaleTimer.current);
      window.clearTimeout(eggWait.current);
      window.clearTimeout(birthFlashTimer.current);
      window.clearTimeout(onboardBirthTimer.current);
      window.clearTimeout(copyTimer.current);
      window.clearTimeout(shareTimer.current);
      window.clearTimeout(reportTimer.current);
      window.clearTimeout(surveyNudgeTimer.current);
      window.clearTimeout(oursNudgeTimer.current);
      window.clearTimeout(labNudgeTimer.current);
      window.clearTimeout(huntNudgeTimer.current);
      window.clearTimeout(huntTimer.current);
      window.clearTimeout(encounterTimer.current);
      window.clearTimeout(encounterGone.current);
      window.clearTimeout(scanTimer.current);
      window.clearTimeout(sculptTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    const next = detectLocale();
    if (next === "en") setLocale(next);
    else void hydrateLocale(next).then(() => setLocale(next));
    setHapticsOn(loadHapticPref());
    setSoundOn(loadSoundPref());
    setMusicSource(loadMusicSource());
    setMusicVolume(loadMusicVolume());
    setOwnTrackName(loadOwnTrackName());
    const contrastPref = loadContrast();
    const typePref = loadTypeScale();
    setContrast(contrastPref);
    setTypeScale(typePref);
    applyPrefs(contrastPref, typePref);
    setScriptureOn(loadScripture());
    if (!fromLinkRef.current) {
      const decoded = decodeUniverse(window.location.search);
      if (decoded) {
        fromLinkRef.current = true;
        const rec = makeRecord(decoded.params, decoded.visualSeed);
        setCurrent(rec);
        setCosmicTime(nowMarker(rec.params, rec.evaluation));
      }
    }
    try {
      setOnboard(localStorage.getItem(ONBOARD_KEY) !== "1");
    } catch {
      setOnboard(true);
    }
    const loadedWork = loadMandate();
    mandateRef.current = loadedWork;
    setMandate(loadedWork);
    if (isKeepHash()) {
      setKeepIntent(true);
    } else if (isAboutHash()) {
      setAboutIntent(true);
    }
  }, []);

  useEffect(() => {
    if (locale === "en") return;
    let dead = false;
    void hydrateLocale(locale).then(() => {
      if (!dead) setPackTick((n) => n + 1);
    });
    return () => {
      dead = true;
    };
  }, [locale]);

  useEffect(() => {
    const applyHash = () => {
      if (isKeepHash()) {
        setHelpOpen(false);
        setInstallOpen(false);
        setSiliconOpen(false);
        setEternalOpen(false);
        setSwarmOpen(false);
        setMandateOpen(false);
        setSettingsOpen(false);
        setAboutIntent(false);
        setKeepIntent(true);
        try {
          if (localStorage.getItem(ONBOARD_KEY) === "1") setKeepOpen(true);
        } catch {
          /* primer first */
        }
        return;
      }
      if (!isAboutHash()) return;
      setHelpOpen(false);
      setInstallOpen(false);
      setSiliconOpen(false);
      setEternalOpen(false);
      setMandateOpen(false);
      setKeepOpen(false);
      setAboutIntent(true);
      try {
        if (localStorage.getItem(ONBOARD_KEY) === "1") setSettingsOpen(true);
      } catch {
        /* primer first */
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);

  useEffect(() => {
    void restoreOwnTrack().then((name) => {
      if (name) setOwnTrackName(name);
      setOwnTracks(getOwnPlaylist());
      setPlayIndex(getPlayIndex());
    });
    const decoded = decodeUniverse(window.location.search);
    if (decoded) {
      fromLinkRef.current = true;
      primeAudio(decoded.params);
    } else {
      primeAudio(OUR_UNIVERSE);
    }
    void loadArchive()
      .then((loaded) => {
        setArchive((prev) => {
          if (prev.length > 0) {
            if (loaded.length === 0) return prev;
            let next = loaded;
            for (const row of prev) next = upsertArchive(next, row);
            return next;
          }
          if (loaded.length === 0) return [makeRecord(OUR_UNIVERSE, OUR_SEED)];
          return loaded;
        });
      })
      .catch(() => {
        setArchive((prev) =>
          prev.length > 0 ? prev : [makeRecord(OUR_UNIVERSE, OUR_SEED)],
        );
      })
      .finally(() => setHydrated(true));
    const host = detectPlatform();
    setPlatform(host);
    setStandalone(host.standalone);

    const onGesture = () => {
      if (soundOnRef.current) unlockAndStart(paramsRef.current);
      else unlockAndStart();
    };
    const gestureOpts: AddEventListenerOptions = { capture: true };
    window.addEventListener("pointerdown", onGesture, gestureOpts);
    window.addEventListener("keydown", onGesture, gestureOpts);
    window.addEventListener("touchend", onGesture, gestureOpts);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      installPrompt.current = event as InstallPromptEvent;
      setInstallReady(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("pointerdown", onGesture, gestureOpts);
      window.removeEventListener("keydown", onGesture, gestureOpts);
      window.removeEventListener("touchend", onGesture, gestureOpts);
      releaseAudio();
    };
  }, []);

  useEffect(() => {
    if (hydrated) void saveArchive(archive);
  }, [archive, hydrated]);

  useEffect(() => {
    if (!hydrated || mandateReady.current) return;
    let cancelled = false;
    void Promise.all([hydrateMandate(), kvGet<unknown>(MANDATE_KEY)]).then(([loaded, remote]) => {
      if (cancelled) return;
      const fromKv = remote != null ? parseMandate(remote) : emptyMandate();
      const civNow = intelligenceWindow(current.params, current.evaluation);
      const merged = bootstrapLab(
        mergeMandate(mergeMandate(loaded, fromKv), mandateRef.current),
        archive,
        current,
        civNow,
        { fromLink: fromLinkRef.current },
      );
      mandateRef.current = merged;
      setMandate(merged);
      persistMandate(merged);
      void kvSet(MANDATE_KEY, merged);
      mandateReady.current = true;
    });
    return () => {
      cancelled = true;
    };
    // Bootstrap once from the first hydrated archive. Later skies go through applyMandate.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !mandateReady.current) return;
    if (
      !fromLinkRef.current &&
      isIdleHome(current) &&
      mandateRef.current.births === 0 &&
      sealedCount(mandateRef.current) === 0
    ) {
      return;
    }
    applyMandate(current, "see");
  }, [applyMandate, current, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const qs = encodeUniverse(current.params, current.visualSeed);
    const next = `${window.location.pathname}?${qs}${window.location.hash}`;
    const now = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (now !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [current.params, current.visualSeed, hydrated]);

  const remember = useCallback((record: UniverseRecord) => {
    setArchive((prev) => upsertArchive(prev, record));
  }, []);

  const keepSculpt = useCallback(
    (record: UniverseRecord) => {
      sculptRef.current = record;
      window.clearTimeout(sculptTimer.current);
      sculptTimer.current = window.setTimeout(() => {
        const rec = sculptRef.current;
        if (rec) remember(rec);
      }, 560);
    },
    [remember],
  );

  const hushBeats = useCallback(() => {
    scanGen.current += 1;
    window.clearTimeout(encounterTimer.current);
    window.clearTimeout(encounterGone.current);
    window.clearTimeout(scanTimer.current);
    setScanning(false);
    setEncounter(null);
    setCaughtKind(null);
    const el = document.activeElement;
    if (el instanceof HTMLElement) el.blur();
  }, []);

  const seatNow = useCallback(
    (record: UniverseRecord) => {
      setEvolving(false);
      setCosmicTime(nowMarker(record.params, record.evaluation));
    },
    [setCosmicTime],
  );

  const birthThought = useCallback(() => {
    haptic(12);
    hushBeats();
    const record = makeRecord(OUR_UNIVERSE, ANSWER_SEED);
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    setMode("galaxy");
    seatNow(record);
    setDispatchId("home");
    nudgeSoundscape(record.params);
    flashEgg(copy.eggs.thought);
  }, [copy.eggs.thought, flashEgg, hushBeats, remember, seatNow]);

  const witnessBirth = useCallback(
    (record: UniverseRecord) => {
      const fate = record.evaluation.fate;
      const good = fate === "habitable" || fate === "teeming" || fate === "enduring";
      const hard = fate === "crunch" || fate === "rip" || fate === "flash";
      const { sealed, addedFate, progress } = applyMandate(record, "birth", { flash: false });
      const atlasLine =
        addedFate && !progress.sealed.atlas
          ? formatAtlasTick(
              copy.mandate.atlasTick,
              copy.fateLabel[addedFate],
              progress.fates.length,
            )
          : null;
      setCaughtKind(null);
      setDispatchId(voiceFor(record, progress));
      setImpactFate(fate);
      setImpactKey((k) => k + 1);
      setImpactPower(good ? 0.4 : hard ? 0.36 : 0.2);
      haptic(good ? 16 : 10);
      const reduced =
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setMode("galaxy");
      if (!reduced) {
        setEvolveUntil(NOW_T);
        setCosmicTime(0.03);
        setEvolving(true);
      } else {
        seatNow(record);
      }
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
      try {
        pingImpact(good ? "life" : hard ? "end" : "void");
      } catch {
        try {
          pingBirth();
        } catch {
          /* a missed chord is not a missed sky */
        }
      }
      setBirthFlash(true);
      window.clearTimeout(birthFlashTimer.current);
      window.clearTimeout(surveyNudgeTimer.current);
      window.clearTimeout(oursNudgeTimer.current);
      window.clearTimeout(labNudgeTimer.current);
      window.clearTimeout(encounterTimer.current);
      window.clearTimeout(encounterGone.current);
      window.clearTimeout(scanTimer.current);
      setScanning(false);
      setEncounter(null);
      birthFlashTimer.current = window.setTimeout(() => setBirthFlash(false), 520);
      if (sealed[0]) flashEgg(copy.mandate.flash[sealed[0]], 4000);
      else if (atlasLine) flashEgg(atlasLine, 4000);
      const found =
        record.evaluation.lifeProb >= 0.18 ||
        record.evaluation.siliconProb >= 0.18 ||
        record.evaluation.eternalProb >= 0.18 ||
        (record.evaluation.swarmProb ?? 0) >= 0.18;
      const bait = found ? null : pickEncounter(record.visualSeed, record.evaluation);
      if (bait) {
        encounterTimer.current = window.setTimeout(() => {
          setEncounter(bait);
          setDispatchId("blink");
          try {
            pingSignal();
          } catch {
            /* a missed chirp is not a missed blink */
          }
          encounterGone.current = window.setTimeout(() => {
            setEncounter(null);
            setDispatchId(voiceFor(record, mandateRef.current));
          }, 11000);
        }, reduced ? 500 : 2200);
      }
      if (good) {
        setSurveyNudge(false);
        if (isOurParams(record.params)) setOursNudge(false);
        else setOursNudge(true);
        window.clearTimeout(oursNudgeTimer.current);
        oursNudgeTimer.current = window.setTimeout(() => {
          setOursNudge(false);
          armLabNudge();
        }, 6400);
      } else {
        setOursNudge(false);
        setSurveyNudge(true);
        surveyNudgeTimer.current = window.setTimeout(() => setSurveyNudge(false), 5200);
      }
    },
    [copy, applyMandate, armLabNudge, flashEgg, seatNow, setCosmicTime],
  );

  const setParams = useCallback((key: ParamKey, value: number) => {
    let next: UniverseRecord | null = null;
    let fateMoved = false;
    setCurrent((prev) => {
      const params = { ...prev.params, [key]: value };
      const built = makeRecord(params, prev.visualSeed);
      const same = built.id === prev.id;
      fateMoved =
        built.evaluation.fate !== prev.evaluation.fate ||
        isOurParams(built.params) !== isOurParams(prev.params);
      next = same
        ? { ...built, starred: prev.starred, chronicle: prev.chronicle }
        : { ...built, chronicle: undefined };
      return next;
    });
    setError(null);
    if (next && fateMoved && !encounterLive.current && !caughtKind && !scanning) {
      setDispatchId(voiceFor(next, mandateRef.current));
    }
    if (next) keepSculpt(next);
  }, [caughtKind, keepSculpt, scanning]);

  const birth = useCallback(() => {
    haptic(12);
    hushBeats();
    const seed = randomSeed();
    const record = makeRecord(randomParams(mulberry32(seed)), seed);
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    nudgeSoundscape(record.params);
    witnessBirth(record);
  }, [hushBeats, remember, witnessBirth]);

  const resetOurs = useCallback(() => {
    haptic(8);
    hushBeats();
    const record = makeRecord(OUR_UNIVERSE, OUR_SEED);
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    setMode("galaxy");
    setOursNudge(false);
    setSurveyNudge(false);
    setCaughtKind(null);
    setDispatchId("home");
    seatNow(record);
    nudgeSoundscape(record.params);
    if (mode === "planetarium") revealHomeSky();
  }, [hushBeats, remember, seatNow, mode, revealHomeSky]);

  const applyPreset = useCallback(
    (params: UniverseParams, seed: number) => {
      haptic(8);
      hushBeats();
      const record = makeRecord(params, seed);
      setCurrent(record);
      remember(record);
      setError(null);
      setTab("sky");
      setMode("galaxy");
      setCaughtKind(null);
      seatNow(record);
      nudgeSoundscape(record.params);
      const { progress } = applyMandate(record, "see");
      setDispatchId(voiceFor(record, progress));
    },
    [applyMandate, hushBeats, remember, seatNow],
  );

  const runSurvey = useCallback(() => {
    haptic(16);
    setDispatchId("survey");
    setTab("sky");
    setMode("galaxy");
    setSurveyNudge(false);
    window.clearTimeout(scanTimer.current);
    const gen = ++scanGen.current;
    setScanning(true);
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scanTimer.current = window.setTimeout(() => {
      if (gen !== scanGen.current) return;
      setScanning(false);
      const seed = randomSeed();
      const results = survey(64, seed);
      const winner = results[0];
      if (!winner) return;
      if (gen !== scanGen.current) return;
      const record = makeRecord(winner.params, winner.visualSeed);
      setCurrent(record);
      setArchive((prev) => {
        let next = prev;
        for (const r of results) {
          if (
            r.evaluation.lifeProb < 0.18 &&
            r.evaluation.siliconProb < 0.18 &&
            r.evaluation.eternalProb < 0.18 &&
            (r.evaluation.swarmProb ?? 0) < 0.18
          )
            continue;
          next = upsertArchive(next, makeRecord(r.params, r.visualSeed));
        }
        return upsertArchive(next, record);
      });
      setError(null);
      nudgeSoundscape(record.params);
      witnessBirth(record);
    }, reduced ? 240 : 1400);
  }, [witnessBirth]);

  const runRefine = useCallback(() => {
    haptic(12);
    const { lifeProb, siliconProb, eternalProb, swarmProb } = current.evaluation;
    const target =
      swarmProb >= lifeProb && swarmProb >= siliconProb && swarmProb >= eternalProb && swarmProb >= 0.18
        ? "swarm"
        : eternalProb > lifeProb && eternalProb > siliconProb
          ? "eternal"
          : siliconProb > lifeProb
            ? "silicon"
            : "carbon";
    const seed = randomSeed();
    const params = refine(current.params, seed, target);
    const record = makeRecord(params, seed);
    hushBeats();
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    seatNow(record);
    nudgeSoundscape(record.params);
    const { progress } = applyMandate(record, "see");
    setDispatchId(voiceFor(record, progress));
  }, [applyMandate, current.evaluation, current.params, hushBeats, remember, seatNow]);

  const launchExpedition = useCallback((opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      haptic(16);
      setTab("lab");
      setLabPane("hunt");
    }
    const seed = randomSeed();
    const target = researchTarget;
    const params = current.params;
    const gen = ++huntGen.current;
    setHunting(true);
    window.clearTimeout(huntTimer.current);
    huntTimer.current = window.setTimeout(() => {
      void import("@/lib/universe/law-client")
        .then(({ runExpeditionAsync }) => runExpeditionAsync(seed, target, params))
        .then((result) => {
          if (gen !== huntGen.current) return;
          setExpedition(result);
          if (!silent && result.best[0] && result.best[0].score >= 0.18) {
            setArchive((prev) => {
              let next = prev;
              for (const row of result.best) {
                next = upsertArchive(next, makeRecord(row.params, row.visualSeed));
              }
              return next;
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (gen === huntGen.current) setHunting(false);
        });
    }, 0);
  }, [current.params, researchTarget]);

  const applyFind = useCallback(
    (params: UniverseParams, visualSeed: number) => {
      haptic(12);
      hushBeats();
      const record = makeRecord(params, visualSeed);
      setCurrent(record);
      remember(record);
      setError(null);
      setTab("sky");
      setHuntNudge(false);
      huntHinted.current = true;
      nudgeSoundscape(record.params);
      witnessBirth(record);
    },
    [hushBeats, remember, witnessBirth],
  );

  const saveReport = useCallback(() => {
    haptic(8);
    void import("@/lib/universe/report")
      .then(({ buildFieldReport, downloadText, reportFilename }) => {
        const text = buildFieldReport({
          record: current,
          locale,
          copy,
          silicon: siliconDossier(current.params, current.evaluation),
          civ: intelligenceWindow(current.params, current.evaluation),
          expedition,
          law: lawResult,
          bayes: bayesResult,
          mcmc: mcmcResult,
        });
        downloadText(reportFilename(current), text);
        setReportFailed(false);
        setReportSaved(true);
        window.clearTimeout(reportTimer.current);
        reportTimer.current = window.setTimeout(() => setReportSaved(false), 1400);
      })
      .catch(() => {
        setReportSaved(false);
        setReportFailed(true);
        window.clearTimeout(reportTimer.current);
        reportTimer.current = window.setTimeout(() => setReportFailed(false), 2200);
      });
  }, [copy, current, expedition, lawResult, bayesResult, mcmcResult, locale]);

  const versusLine = useMemo(
    () => formatCompareLine(compareToOurs(current.params), copy),
    [copy, current.params],
  );
  const skyLabel = plateTitle(current.params, copy, current.name);
  const workNext = nextOpen(mandate);
  const workCount = sealedCount(mandate);
  const nudgeBirth = workNext === "atlas" || workNext === "witness";
  const nudgeSurvey = !nudgeBirth && (surveyNudge || workNext === "corridor");
  const nudgeSkies = !nudgeBirth && !nudgeSurvey && (workNext === "silicon" || workNext === "eternal" || workNext === "tide");

  const noteText = current.chronicle ?? draftNote ?? "";
  useEffect(() => {
    if (current.chronicle) return;
    if (tab !== "lab" || labPane !== "constants") return;
    const shot = current;
    if (draftFor.current !== shot.id) setDraftNote(null);
    let dead = false;
    void import("@/lib/universe/field-note").then(({ fieldNote }) => {
      if (dead) return;
      draftFor.current = shot.id;
      setDraftNote(
        fieldNote({
          name: skyLabel,
          catalog: shot.catalog,
          params: shot.params,
          evaluation: shot.evaluation,
          locale,
          salt: shot.visualSeed,
          versus: versusLine,
        }),
      );
    });
    return () => {
      dead = true;
    };
  }, [tab, labPane, current, locale, skyLabel, versusLine]);

  const commission = useCallback(async () => {
    if (busy) return;
    setError(null);
    setTab("lab");
    let fieldNote: (typeof import("@/lib/universe/field-note"))["fieldNote"];
    try {
      ({ fieldNote } = await import("@/lib/universe/field-note"));
    } catch {
      return;
    }
    const snapshotId = current.id;
    const local = fieldNote({
      name: skyLabel,
      catalog: current.catalog,
      params: current.params,
      evaluation: current.evaluation,
      locale,
      salt: (Date.now() ^ current.visualSeed) >>> 0,
      versus: versusLine,
    });
    setCurrent((prev) => {
      if (prev.id !== snapshotId) return prev;
      const next = { ...prev, chronicle: local, locale };
      remember(next);
      return next;
    });
    applyMandate({ ...current, chronicle: local, locale }, "chronicle");
    if (isHostedLab()) return;
    setBusy(true);
    try {
      const { chronicleUniverse } = await import("@/lib/universe/chronicle");
      const result = await chronicleUniverse({
        data: {
          name: skyLabel,
          catalog: current.catalog,
          locale,
          params: current.params,
          evaluation: current.evaluation,
        },
      });
      if (!result.ok) return;
      setCurrent((prev) => {
        if (prev.id !== snapshotId) return prev;
        const next = { ...prev, chronicle: result.text, locale };
        remember(next);
        return next;
      });
    } catch {
      /* the field note already stands */
    } finally {
      setBusy(false);
    }
  }, [busy, current, locale, remember, versusLine, applyMandate]);

  const copyId = useCallback(async () => {
    const text = current.catalog;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1200);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) {
        setCopied(true);
        window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(false), 1200);
      }
    } catch {
      setCopied(false);
    }
  }, [current.catalog]);

  const share = useCallback(async () => {
    const url = shareUrl(current.params, current.visualSeed);
    const payload = {
      title: `${skyLabel} · ${copy.appName}`,
      text: `${current.catalog} · ${copy.fateLabel[current.evaluation.fate]}\n${copy.plot[dispatchId]}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.clearTimeout(shareTimer.current);
      shareTimer.current = window.setTimeout(() => setShared(false), 1400);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.clearTimeout(shareTimer.current);
        shareTimer.current = window.setTimeout(() => setShared(false), 1400);
      } catch {
        setShared(false);
      }
    }
  }, [copy, current, dispatchId, skyLabel]);

  const restore = useCallback((record: UniverseRecord) => {
    haptic(8);
    hushBeats();
    setCurrent(record);
    setError(null);
    setTab("sky");
    setMode("galaxy");
    seatNow(record);
    nudgeSoundscape(record.params);
    const { progress } = applyMandate(record, "see");
    setDispatchId(voiceFor(record, progress));
  }, [applyMandate, hushBeats, seatNow]);

  const starCurrent = useCallback(() => {
    haptic(10);
    const next = { ...current, starred: !current.starred };
    setCurrent(next);
    setArchive((list) => upsertArchive(list, next));
    if (next.starred) applyMandate(next, "star");
  }, [current, applyMandate]);

  const starById = useCallback((id: string) => {
    haptic(8);
    const row = archive.find((r) => r.id === id);
    setArchive((prev) => toggleStar(prev, id));
    setCurrent((prev) => (prev.id === id ? { ...prev, starred: !prev.starred } : prev));
    if (row && !row.starred) applyMandate({ ...row, starred: true }, "star");
  }, [applyMandate, archive]);

  const runWorkAct = useCallback(
    (act: MandateAct) => {
      setMandateOpen(false);
      if (act === "birth") birth();
      else if (act === "survey") runSurvey();
      else if (act === "ours") resetOurs();
      else if (act === "silicon") applyPreset(SILICON_CORRIDOR, SILICON_SEED);
      else if (act === "eternal") applyPreset(ETERNAL_CORRIDOR, ETERNAL_SEED);
      else if (act === "tide") applyPreset(SWARM_CORRIDOR, SWARM_SEED);
      else if (act === "desert") applyPreset(DESERT_EPOCH, DESERT_SEED);
      else if (act === "refine") runRefine();
      else if (act === "chronicle") {
        setTab("lab");
        setLabPane("constants");
        void commission();
      } else if (act === "star" && !current.starred) starCurrent();
    },
    [
      applyPreset,
      birth,
      commission,
      current.starred,
      resetOurs,
      runRefine,
      runSurvey,
      starCurrent,
    ],
  );

  const removeById = useCallback((id: string) => {
    haptic(8);
    setArchive((prev) => removeFromArchive(prev, id));
  }, []);

  const finishOnboard = useCallback((born = false) => {
    try {
      localStorage.setItem(ONBOARD_KEY, "1");
    } catch {
      /* ignore */
    }
    setOnboard(false);
    setSoundOn(true);
    soundOnRef.current = true;
    unlockAndStart(current.params);
    void setSoundscape(true, current.params);
    if (keepIntent) {
      setKeepOpen(true);
    } else if (aboutIntent) {
      setSettingsOpen(true);
    }
    if (born && !fromLinkRef.current) {
      window.clearTimeout(onboardBirthTimer.current);
      onboardBirthTimer.current = window.setTimeout(() => birth(), 220);
    } else if (!born && !aboutIntent && !keepIntent) {
      window.clearTimeout(labNudgeTimer.current);
      labNudgeTimer.current = window.setTimeout(() => armLabNudge(), 4200);
    }
  }, [aboutIntent, keepIntent, birth, current.params, armLabNudge]);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const order = ["en", "ru", "be"] as const;
      const i = order.indexOf(prev as (typeof order)[number]);
      const next = order[i < 0 ? 0 : (i + 1) % order.length];
      persistLocale(next);
      if (next === "en") return next;
      void hydrateLocale(next).then(() => setLocale(next));
      return prev;
    });
  }, []);

  const setLocaleExplicit = useCallback((next: Locale) => {
    persistLocale(next);
    if (next === "en") {
      setLocale(next);
      return;
    }
    void hydrateLocale(next).then(() => setLocale(next));
  }, []);

  const runInstall = useCallback(async () => {
    const prompt = installPrompt.current;
    if (!prompt) return;
    await prompt.prompt();
    installPrompt.current = null;
    setInstallReady(false);
    setInstallOpen(false);
    setSettingsOpen(false);
  }, []);

  const overlayOpen =
    onboard || installOpen || settingsOpen || siliconOpen || eternalOpen || swarmOpen || helpOpen || mandateOpen || scriptureOpen || keepOpen;
  const panelOpen = tab === "lab" || tab === "log";

  useEffect(() => {
    const prev = document.title;
    document.title = onboard ? copy.appName : `${skyLabel} · ${copy.appName}`;
    return () => {
      document.title = prev;
    };
  }, [skyLabel, copy.appName, onboard]);

  useEffect(() => {
    if (!panelOpen) return;
    asideRef.current?.scrollTo({ top: 0 });
  }, [tab, panelOpen]);

  const showOverlay = (which: "help" | "silicon" | "eternal" | "swarm" | "settings" | "install" | "keep") => {
    setHelpOpen(which === "help");
    setSiliconOpen(which === "silicon");
    setEternalOpen(which === "eternal");
    setSwarmOpen(which === "swarm");
    setSettingsOpen(which === "settings");
    setInstallOpen(which === "install");
    setKeepOpen(which === "keep");
    setMandateOpen(false);
    setScriptureOpen(false);
    if (which === "keep") {
      const next = `${window.location.pathname}${window.location.search}#keep`;
      if (window.location.hash !== "#keep") window.history.replaceState(null, "", next);
    } else if (isKeepHash()) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  };

  const openCanon = () => {
    setHelpOpen(false);
    setSiliconOpen(false);
    setEternalOpen(false);
    setSwarmOpen(false);
    setSettingsOpen(false);
    setInstallOpen(false);
    setKeepOpen(false);
    setMandateOpen(false);
    setScriptureOpen(true);
  };

  useEffect(() => {
    if (!settingsOpen) return;
    void import("@/lib/universe/languages").then((m) => m.loadCatalog());
  }, [settingsOpen]);

  useEffect(() => {
    asideRef.current?.scrollTo({ top: 0 });
  }, [labPane, tab]);

  useEffect(() => {
    if (tab !== "lab") return;
    labHinted.current = true;
    setLabNudge(false);
  }, [tab]);

  useEffect(() => {
    if (tab !== "log") return;
    const rec = sculptRef.current;
    if (!rec) return;
    window.clearTimeout(sculptTimer.current);
    remember(rec);
    sculptRef.current = null;
  }, [tab, remember]);

  useEffect(() => {
    if (labPane === "hunt") huntHinted.current = true;
    if (tab !== "lab" || labPane !== "constants") {
      setHuntNudge(false);
      window.clearTimeout(huntNudgeTimer.current);
      return;
    }
    if (huntHinted.current) return;
    huntNudgeTimer.current = window.setTimeout(() => {
      if (tabRef.current !== "lab" || huntHinted.current) return;
      huntHinted.current = true;
      setHuntNudge(true);
      huntNudgeTimer.current = window.setTimeout(() => setHuntNudge(false), 6400);
    }, 4800);
    return () => window.clearTimeout(huntNudgeTimer.current);
  }, [tab, labPane]);

  useEffect(() => {
    if (tab !== "lab" || labPane !== "hunt") return;
    if (expedition || hunting || huntAuto.current) return;
    huntAuto.current = true;
    launchExpedition({ silent: true });
  }, [tab, labPane, expedition, hunting, launchExpedition]);

  useEffect(() => {
    if (!hydrated || overlayOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") {
        setTab("sky");
        return;
      }
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === " " || event.key === "Enter") {
        if (tabRef.current !== "sky") return;
        const bait = encounterLive.current;
        if (bait) {
          event.preventDefault();
          catchEncounter(bait.kind);
        }
        return;
      }
      if (event.key === "[" || event.key === "]") {
        if (tabRef.current !== "sky") return;
        event.preventDefault();
        const dir = event.key === "]" ? 1 : -1;
        setEvolving(false);
        setCosmicTime(clamp(timeRef.current + dir * 0.045, 0, 1));
        return;
      }
      const key = event.key.toLowerCase();
      window.clearTimeout(eggWait.current);
      const seq = noteEggKey(keyBuf.current, event.key);
      keyBuf.current = seq.buf;
      if (seq.hit) {
        if (seq.hit === "thought" || seq.hit === "answer") birthThought();
        else if (seq.hit === "tau") armTau();
        else if (seq.hit === "tide") {
          applyPreset(SWARM_CORRIDOR, SWARM_SEED);
          flashEgg(copy.eggs.tide);
        } else if (seq.hit === "fiftyone") armClassified();
        else if (seq.hit === "highway") {
          applyPreset(HIGHWAY_CORRIDOR, HIGHWAY_SEED);
          flashEgg(copy.eggs.highway);
        } else if (seq.hit === "ice") {
          applyPreset(BELT_CORRIDOR, BELT_SEED);
          flashEgg(copy.eggs.ice);
        } else if (seq.hit === "zone") armZone();
        else if (seq.hit === "wow") armWow();
        else if (seq.hit === "witness") armWitness();
        else if (seq.hit === "throat") armThroat();
        else flashEgg(copy.eggs[seq.hit]);
        if (seq.hit === "whale") {
          setWhaleOn(true);
          window.clearTimeout(whaleTimer.current);
          whaleTimer.current = window.setTimeout(() => setWhaleOn(false), 24000);
        }
        return;
      }
      const runShortcut = () => {
        if (key === "b") birth();
        else if (key === "s") runSurvey();
        else if (key === "r") runRefine();
        else if (key === "o") resetOurs();
        else if (key === "h") {
          setTab("lab");
          setLabPane("hunt");
          launchExpedition();
        } else if (key === "l") {
          setTab("lab");
          setLabPane("laws");
        } else if (key === "d") {
          setTab("lab");
          setLabPane("desk");
        } else if (key === "e") {
          toggleEvolve();
        } else if (key === "1") setTab("sky");
        else if (key === "2") setTab("lab");
        else if (key === "3") setTab("log");
      };
      if (seq.buf && isEggPrefix(seq.buf)) {
        eggWait.current = window.setTimeout(() => {
          if (keyBuf.current === seq.buf) {
            keyBuf.current = "";
            runShortcut();
          }
        }, 560);
        return;
      }
      runShortcut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    birth,
    birthThought,
    applyPreset,
    armClassified,
    armZone,
    armWow,
    armWitness,
    armThroat,
    copy.eggs,
    flashEgg,
    armTau,
    hydrated,
    launchExpedition,
    overlayOpen,
    resetOurs,
    runRefine,
    runSurvey,
    toggleEvolve,
    catchEncounter,
    setCosmicTime,
  ]);

  useEffect(() => {
    if (!hydrated || !soundOn) return;
    retuneSoundscape(current.params);
  }, [current.params, hydrated, soundOn]);

  useEffect(() => {
    return subscribeAudioStatus((s) => {
      setAudioLive(s.live);
    });
  }, []);

  useEffect(() => {
    if (!audioLive) return;
    setWakeKey((k) => k + 1);
  }, [audioLive]);

  useEffect(() => {
    if (!evolving) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) return;
    setCosmicTime((t) => (t >= 0.98 ? 0 : Math.min(1, t + 0.14)));
    setEvolving(false);
  }, [evolving, setCosmicTime]);

  const ev = current.evaluation;
  const lifeTone =
    ev.lifeProb >= 0.52 ? "text-life" : ev.lifeProb >= 0.18 ? "text-fg" : "text-sterile";
  const siliconTone =
    ev.siliconProb >= 0.45
      ? "text-silicon"
      : ev.siliconProb >= 0.18
        ? "text-fg"
        : "text-fg-subtle";
  const eternalTone =
    ev.eternalProb >= 0.45
      ? "text-eternal"
      : ev.eternalProb >= 0.18
        ? "text-fg"
        : "text-fg-subtle";
  const swarmTone =
    ev.swarmProb >= 0.45
      ? "text-cyan"
      : ev.swarmProb >= 0.18
        ? "text-fg"
        : "text-fg-subtle";
  const ours = isOurParams(current.params);
  const slideEgg = sliderEgg(current.params);
  const [liveTime, setLiveTime] = useState(cosmicTime);
  useEffect(() => {
    if (!evolving) {
      setLiveTime(cosmicTime);
      return;
    }
    const id = window.setInterval(() => setLiveTime(timeRef.current), 200);
    return () => window.clearInterval(id);
  }, [evolving, cosmicTime]);
  useEffect(() => {
    if (!scriptureOn) return;
    const wide = window.matchMedia("(min-width: 640px)");
    let dead = false;
    const load = () => {
      if (!wide.matches) return;
      if (pickPassageRef.current) {
        setScriptureReady(true);
        return;
      }
      void import("@/lib/universe/scripture").then(({ pickPassage }) => {
        if (dead) return;
        pickPassageRef.current = pickPassage;
        setScriptureReady(true);
      });
    };
    load();
    wide.addEventListener("change", load);
    return () => {
      dead = true;
      wide.removeEventListener("change", load);
    };
  }, [scriptureOn]);
  const passage = useMemo(() => {
    if (!scriptureOn || !scriptureReady || !pickPassageRef.current) return null;
    return pickPassageRef.current({ epoch: epochShown(liveTime), fate: ev.fate, ours });
  }, [ev.fate, liveTime, ours, scriptureOn, scriptureReady]);
  const halo = useMemo(() => haloDossier(current.params, ev), [current.params, ev]);
  const acoustic = useMemo(() => acousticDossier(current.params, ev), [current.params, ev]);
  const disk = useMemo(() => diskDossier(current.params, ev), [current.params, ev]);
  const liveEpoch = epochShown(liveTime);

  const stats = useMemo(
    () => [
      { k: copy.stats.stellar, v: formatGyr(ev.stellarLifetimeGyr) },
      { k: copy.stats.first, v: formatGyr(ev.timeToStarsGyr) },
      { k: copy.stats.window, v: formatGyr(ev.lifeWindowGyr) },
      { k: copy.stats.generations, v: ev.generations.toFixed(1) },
    ],
    [copy, ev],
  );

  const lab = tab !== "lab" ? null : (
    <>
      {labPane === "hunt" ? (
        <ResearchPanel
          copy={copy}
          target={researchTarget}
          result={expedition}
          hunting={hunting}
          onTarget={setResearchTarget}
          onRun={() => launchExpedition()}
          onApply={applyFind}
        />
      ) : labPane === "life" ? (
        <>
          {ev.lifeProb < 0.08 && ev.siliconProb < 0.08 && ev.eternalProb < 0.08 ? (
            <p className="text-pretty text-sm leading-relaxed text-fg-muted">{copy.birthWitness}</p>
          ) : null}
          <CivPanel copy={copy} params={current.params} evaluation={ev} />
          <div className="h-px bg-border" />
          <BiospherePanel copy={copy} params={current.params} evaluation={ev} />
          <div className="h-px bg-border" />
          {hydrated ? (
            <Fold title={copy.citizen.title}>
              <CitizenPanel
                copy={copy}
                params={current.params}
                visualSeed={current.visualSeed}
              />
            </Fold>
          ) : null}
        </>
      ) : labPane === "laws" ? (
        <LawsPanel
          copy={copy}
          params={current.params}
          target={researchTarget}
          law={lawResult}
          bayes={bayesResult}
          catalog={catalog}
          cutout={cutout}
          overlay={catalogOverlay}
          onTarget={setResearchTarget}
          onLaw={setLawResult}
          onBayes={setBayesResult}
          onCatalog={(result, plate) => {
            setCatalog(result);
            setCutout(plate);
          }}
          onToggleOverlay={() => {
            setCatalogOverlay((on) => {
              const next = !on;
              if (next) setTab("sky");
              return next;
            });
          }}
        />
      ) : labPane === "desk" ? (
        <DeskPanel
          copy={copy}
          locale={locale}
          record={current}
          target={researchTarget}
          result={mcmcResult}
          catalog={catalog}
          expedition={expedition}
          law={lawResult}
          bayes={bayesResult}
          votes={votes}
          onVotes={setVotes}
          onResult={setMcmcResult}
          onApply={applyFind}
        />
      ) : (
        <>
          <div>
            <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
              {copy.fate}
            </p>
            <p className="mt-1 font-display text-2xl tracking-[-0.02em]">
              {copy.fateLabel[ev.fate]}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.carbon}
              </p>
              <p className={cn("mt-1 font-mono text-xl tabular-nums sm:text-2xl", lifeTone)}>
                {formatPct(ev.lifeProb)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.silicon}
              </p>
              <p className={cn("mt-1 font-mono text-xl tabular-nums sm:text-2xl", siliconTone)}>
                {formatPct(ev.siliconProb)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.eternal}
              </p>
              <p className={cn("mt-1 font-mono text-xl tabular-nums sm:text-2xl", eternalTone)}>
                {formatPct(ev.eternalProb)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.swarm}
              </p>
              <p className={cn("mt-1 font-mono text-xl tabular-nums sm:text-2xl", swarmTone)}>
                {formatPct(ev.swarmProb)}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {stats.map((s) => (
              <div key={s.k} className="min-w-0">
                <dt className="text-[0.6875rem] tracking-wide text-fg-subtle uppercase">{s.k}</dt>
                <dd className="mt-0.5 font-mono text-sm tabular-nums text-fg">{s.v}</dd>
              </div>
            ))}
          </dl>

          <CompareOurs copy={copy} params={current.params} />

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.chronicle}
              </p>
              <span className="font-mono text-[0.6875rem] text-fg-subtle uppercase">
                {autonym(locale)}
              </span>
            </div>
            {busy ? (
              <p className="chronicle-write mt-2 text-pretty text-sm leading-relaxed text-fg-muted">
                {copy.writing}
              </p>
            ) : (
              <p className="mt-2 text-pretty text-sm leading-relaxed whitespace-pre-wrap text-fg-muted">
                {noteText}
              </p>
            )}
            <p className="mt-2 text-pretty text-xs leading-relaxed text-fg-subtle">
              {copy.chronicleHint}
            </p>
            {error ? <p className="text-sm text-sterile">{error}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void commission()} disabled={busy}>
                <ScrollText />
                {busy ? copy.writing : current.chronicle ? copy.rewrite : copy.commission}
              </Button>
              <Button variant="outline" onClick={() => void copyId()}>
                {copied ? copy.copied : copy.copyId}
              </Button>
              <Button variant="outline" onClick={saveReport}>
                <FileDown />
                {reportFailed ? copy.report.failed : reportSaved ? copy.report.downloaded : copy.report.download}
              </Button>
            </div>
          </div>

          <Fold title={copy.foldSculpt}>
            {hydrated ? (
              <ParamSliders copy={copy} params={current.params} onChange={setParams} />
            ) : null}
          </Fold>

          <Fold title={copy.foldCorridors}>
            <LifeFactors copy={copy} evaluation={ev} />
            <SiliconPanel
              copy={copy}
              params={current.params}
              evaluation={ev}
              onOpen={() => {
                haptic(8);
                showOverlay("silicon");
              }}
            />
            <EternalPanel
              copy={copy}
              params={current.params}
              evaluation={ev}
              onOpen={() => {
                haptic(8);
                showOverlay("eternal");
              }}
            />
            <SwarmPanel
              copy={copy}
              params={current.params}
              evaluation={ev}
              onOpen={() => {
                haptic(8);
                showOverlay("swarm");
              }}
            />
          </Fold>

          <Fold title={copy.foldObs}>
            <AstroPanel copy={copy} params={current.params} evaluation={ev} cosmicTime={liveTime} />
            <HubblePanel copy={copy} params={current.params} evaluation={ev} />
            <HaloPanel copy={copy} params={current.params} evaluation={ev} />
            <DiskPanel copy={copy} params={current.params} evaluation={ev} visualSeed={current.visualSeed} />
            <AcousticPanel copy={copy} params={current.params} evaluation={ev} />
            {hydrated ? (
              <HrDiagram
                copy={copy}
                params={current.params}
                evaluation={ev}
                cosmicTime={cosmicTime}
                visualSeed={current.visualSeed}
              />
            ) : null}
            <EpochTimeline copy={copy} evaluation={ev} />
          </Fold>
        </>
      )}
    </>
  );

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg" data-hydrated={hydrated ? "1" : "0"} data-primer={onboard ? "1" : "0"} data-work-count={workCount} data-lab-nudge={labNudge ? "1" : "0"} data-hunt-nudge={huntNudge ? "1" : "0"} data-compact={compact ? "1" : "0"} data-encounter={encounter?.kind ?? ""} data-dispatch={dispatchId} data-scanning={scanning ? "1" : "0"}>
      <div
        className="relative flex min-h-0 flex-1 flex-col"
        inert={overlayOpen ? true : undefined}
      >
        <GalaxyCanvas
          params={current.params}
          evaluation={ev}
          visualSeed={current.visualSeed}
          cosmicTime={cosmicTime}
          timeRef={timeRef}
          evolving={evolving}
          evolveUntil={evolveUntil}
          onEvolveEnd={() => {
            setEvolving(false);
            setCosmicTime(timeRef.current);
          }}
          mode={mode}
          collisionKey={collisionKey}
          eggs={{
            whale: whaleOn || isAnswerCatalog(current.catalog),
            tau: tauOn,
            classified: classifiedOn,
            zone: zoneOn,
            wow: wowOn,
            witness: witnessOn,
            throat: throatOn,
          }}
          encounter={encounter}
          onEncounter={catchEncounter}
          impactKey={impactKey}
          impactPower={impactPower}
          onVoyager={() => flashEgg(copy.eggs.voyager)}
          onTau={armTau}
          className="absolute inset-0 z-0 h-full w-full"
          relaxed={tab !== "sky" || (overlayOpen && !onboard)}
          paused={(overlayOpen && !onboard) || (panelOpen && compact)}
          scanning={scanning}
          wakeKey={wakeKey}
          ariaLabel={`${copy.appName} · ${copy.tabs.sky}`}
        />
        {birthFlash ? (
          <div aria-hidden className="birth-flash pointer-events-none absolute inset-0 z-[3]" data-fate={impactFate} />
        ) : null}
        {hydrated && catalogOverlay && catalog && catalog.ok ? (
          <Suspense fallback={null}>
            <CatalogOverlay
              copy={copy}
              catalog={catalog}
              onClose={() => setCatalogOverlay(false)}
            />
          </Suspense>
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 sky-glow"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg via-bg/70 to-transparent lg:h-52"
        />

        <header className={cn("relative z-10 flex shrink-0 items-start justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pointer-events-auto sm:px-8", onboard && "hidden")}>
          <div className="min-w-0 flex-1 pr-2">
            <button
              type="button"
              className="bg-transparent p-0 text-left font-mono text-[0.6875rem] tracking-[0.22em] text-fg-subtle uppercase"
              onClick={() => {
                kickerTaps.current += 1;
                if (kickerTaps.current < 7) return;
                kickerTaps.current = 0;
                setWhaleOn(true);
                window.clearTimeout(whaleTimer.current);
                whaleTimer.current = window.setTimeout(() => setWhaleOn(false), 24000);
                flashEgg(copy.eggs.whale);
              }}
            >
              {copy.kicker}
            </button>
            <h1 className="mt-1">
              <button
                type="button"
                className="w-fit max-w-full truncate bg-transparent p-0 text-left font-display text-lg leading-none tracking-[-0.03em] text-fg sm:text-xl"
                onClick={() => {
                  titleTaps.current += 1;
                  if (titleTaps.current < 3) return;
                  titleTaps.current = 0;
                  birthThought();
                }}
              >
                {copy.appName}
              </button>
            </h1>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-11",
                soundOn ? "text-accent" : "text-fg-muted",
              )}
              aria-label={
                soundOn && !audioLive ? copy.tapToHear : soundOn ? copy.soundOn : copy.soundOff
              }
              aria-pressed={soundOn && audioLive}
              onPointerDown={(event) => {
                if (soundOn && !audioLive) {
                  event.preventDefault();
                  unlockAndStart(current.params);
                  void setSoundscape(true, current.params);
                }
              }}
              onClick={() => {
                if (soundOn && !audioLive) {
                  unlockAndStart(current.params);
                  void setSoundscape(true, current.params);
                  return;
                }
                const next = !soundOn;
                setSoundOn(next);
                soundOnRef.current = next;
                if (next) unlockAndStart(current.params);
                void setSoundscape(next, current.params);
              }}
            >
              <span className="relative inline-flex size-4">
                <Volume2
                  className={cn(
                    "absolute inset-0 size-4 transition-[opacity,transform,filter] duration-[var(--motion-fast)] ease-[var(--ease-in-out)]",
                    soundOn ? "scale-100 opacity-100 blur-0" : "scale-[0.25] opacity-0 blur-[4px]",
                  )}
                />
                <VolumeX
                  className={cn(
                    "size-4 transition-[opacity,transform,filter] duration-[var(--motion-fast)] ease-[var(--ease-in-out)]",
                    soundOn ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0",
                  )}
                />
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={copy.help}
              onClick={() => showOverlay("help")}
            >
              <CircleHelp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden size-11 sm:inline-flex"
              aria-label={copy.share}
              onClick={() => void share()}
            >
              <Share2 />
            </Button>
            {hydrated && !standalone ? (
              <Button
                variant="ghost"
                size="icon"
                className="hidden size-11 lg:inline-flex"
                aria-label={copy.install}
                onClick={() => showOverlay("install")}
              >
                <Download />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={copy.settings}
              onClick={() => showOverlay("settings")}
            >
              <Settings />
            </Button>
          </div>
        </header>
        <div className={cn("relative z-10 shrink-0 px-5 pt-2 pointer-events-auto sm:px-8", onboard && "hidden")}>
          <SkyModes
            copy={copy}
            mode={mode}
            collapseLabel
            onChange={(next) => {
              setMode(next);
              if (next === "collision") {
                setCollisionKey((k) => k + 1);
                if (!collisionHinted.current) {
                  collisionHinted.current = true;
                  flashEgg(copy.eggs.andromeda);
                }
              }
              if (next === "planetarium" && ours) revealHomeSky();
            }}
          />
        </div>

        <div className={cn("relative z-10 mt-auto flex min-h-0 flex-col px-5 pb-3 pointer-events-auto sm:px-8 lg:pb-6", onboard && "hidden")}>
          <div className="min-h-0 flex-1 overflow-hidden">
          {hydrated ? (
            <CosmicClock
              copy={copy}
              params={current.params}
              evaluation={ev}
              value={cosmicTime}
              evolving={evolving}
              liveRef={timeRef}
              onChange={(t) => {
                setEvolving(false);
                setCosmicTime(t);
              }}
              onToggleEvolve={toggleEvolve}
              onEggLight={() => flashEgg(copy.eggs.light)}
            />
          ) : (
            <div className="h-14" />
          )}
          <p className="mt-1.5 font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase" data-hud-catalog>
            {current.catalog}
            <span className="mx-2 text-fg-subtle/50">/</span>
            {copy.morphology[ev.morphology]}
            {ev.morphology === "spiral" || ev.morphology === "irregular" ? (
              <>
                <span className="mx-2 text-fg-subtle/50">·</span>
                {copy.obs.diskQ} {disk.Q.toFixed(1)}
              </>
            ) : null}
          </p>
          {hydrated && scriptureOn && tab === "sky" && passage ? (
            <div className="hidden sm:block">
              <Suspense fallback={null}>
                <ScriptureLine
                  copy={copy}
                  locale={locale}
                  passage={passage}
                  onOpen={openCanon}
                />
              </Suspense>
            </div>
          ) : null}
          {isAnswerCatalog(current.catalog) ? (
            <p className="mt-1 max-w-md text-pretty text-xs leading-relaxed text-accent line-clamp-1">{copy.eggs.answer}</p>
          ) : null}
          {slideEgg ? (
            <p className="mt-1 max-w-md text-pretty text-xs leading-relaxed text-fg-muted line-clamp-1">{copy.eggs[slideEgg]}</p>
          ) : null}
          {egg ? (
            <p className="mt-1 max-w-md text-pretty text-xs leading-relaxed text-cyan line-clamp-1" role="status">
              {egg}
            </p>
          ) : null}
          <div className="mt-1.5 hud-chips" aria-live="polite">
            <button
              type="button"
              onClick={() => {
                fateTaps.current += 1;
                if (fateTaps.current >= 5) {
                  fateTaps.current = 0;
                  flashEgg(copy.eggs.panic);
                }
              }}
              className={cn(
                "hud-chip rounded-full px-2 py-1 font-mono text-[0.6875rem] tracking-wide uppercase sm:px-2.5",
                ev.fate === "teeming" || ev.fate === "habitable"
                  ? "bg-life/20 text-life"
                  : ev.fate === "enduring"
                    ? "bg-eternal/20 text-eternal"
                  : ev.fate === "sterile" || ev.fate === "rip" || ev.fate === "flash"
                    ? "bg-sterile/15 text-sterile"
                    : ev.fate === "crunch"
                      ? "bg-silicon/20 text-silicon"
                      : "bg-nebula/20 text-cyan",
              )}
            >
              {copy.fateLabel[ev.fate]}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic(8);
                setTab("lab");
                setLabPane("life");
              }}
              aria-label={copy.factorsTitle}
              title={`${copy.carbon} ${formatPct(ev.lifeProb)}`}
              className={cn(
                "hud-chip rounded-full bg-bg-elevated/80 px-2 py-1 font-mono text-[0.6875rem] tabular-nums sm:px-2.5",
                lifeTone,
              )}
            >
              {corridorReadout(compact, HUD_MARK.carbon, copy.carbon, ev.lifeProb)}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic(8);
                siliconTaps.current += 1;
                if (siliconTaps.current >= 3) {
                  siliconTaps.current = 0;
                  flashEgg(copy.eggs.sand);
                }
                showOverlay("silicon");
              }}
              aria-label={copy.siliconOpen}
              title={`${copy.silicon} ${formatPct(ev.siliconProb)}`}
              className={cn(
                "hud-chip rounded-full bg-bg-elevated/80 px-2 py-1 font-mono text-[0.6875rem] tabular-nums sm:px-2.5",
                siliconTone,
              )}
            >
              {corridorReadout(compact, HUD_MARK.silicon, copy.silicon, ev.siliconProb)}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic(8);
                eternalTaps.current += 1;
                if (eternalTaps.current >= 3) {
                  eternalTaps.current = 0;
                  flashEgg(copy.eggs.god);
                }
                showOverlay("eternal");
              }}
              aria-label={copy.eternalOpen}
              title={`${copy.eternal} ${formatPct(ev.eternalProb)}`}
              className={cn(
                "hud-chip rounded-full bg-bg-elevated/80 px-2 py-1 font-mono text-[0.6875rem] tabular-nums sm:px-2.5",
                eternalTone,
              )}
            >
              {corridorReadout(compact, HUD_MARK.eternal, copy.eternal, ev.eternalProb)}
            </button>
            <button
              type="button"
              onClick={() => {
                haptic(8);
                swarmTaps.current += 1;
                if (swarmTaps.current >= 3) {
                  swarmTaps.current = 0;
                  flashEgg(copy.eggs.tide);
                }
                showOverlay("swarm");
              }}
              aria-label={copy.swarmOpen}
              title={`${copy.swarm} ${formatPct(ev.swarmProb)}`}
              className={cn(
                "hud-chip rounded-full bg-bg-elevated/80 px-2 py-1 font-mono text-[0.6875rem] tabular-nums sm:px-2.5",
                swarmTone,
              )}
            >
              {corridorReadout(compact, HUD_MARK.swarm, copy.swarm, ev.swarmProb)}
            </button>
            {ours && !compact ? (
              <button
                type="button"
                onClick={() => flashEgg(copy.eggs.dot)}
                className="hud-chip rounded-full px-2.5 py-1 font-mono text-[0.6875rem] tracking-wide text-fg-muted uppercase"
              >
                {copy.oursBadge}
              </button>
            ) : null}
          </div>
          <div className="mt-1 flex max-w-md items-center gap-2">
            <button
              type="button"
              onClick={() => {
                haptic(8);
                setHelpOpen(false);
                setInstallOpen(false);
                setSiliconOpen(false);
                setEternalOpen(false);
                setSwarmOpen(false);
                setSettingsOpen(false);
                setScriptureOpen(false);
                setMandateOpen(true);
              }}
              aria-label={copy.mandate.open}
              data-work={workNext ?? "done"}
              data-work-count={workCount}
              title={workNext ? copy.mandate.cue[workNext] : copy.mandate.done}
              className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-sm)] bg-transparent p-0 text-left"
              data-hud-mandate
            >
              <span className="flex shrink-0 items-center gap-1" aria-hidden>
                {MANDATE_IDS.map((id) => (
                  <i
                    key={id}
                    className={cn(
                      "mandate-dot",
                      mandate.sealed[id] && "is-sealed",
                      workNext === id && "is-next",
                    )}
                  />
                ))}
              </span>
              <span
                key={current.id}
                className="hud-swap min-w-0 truncate font-display text-base tracking-[-0.02em] text-fg sm:text-lg"
              >
                {skyLabel}
              </span>
              {ours && compact ? (
                <span className="shrink-0 font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle uppercase">
                  {copy.oursBadge}
                </span>
              ) : null}
              <span className="hidden min-w-0 truncate font-mono text-[0.6875rem] tracking-[0.14em] text-fg-subtle uppercase sm:inline" data-hud-mandate-label>
                {workNext === "atlas"
                  ? `${workCount}/${MANDATE_COUNT} · ${copy.mandate.chapters.atlas.title} ${mandate.fates.length}/${ATLAS_N}`
                  : workNext
                    ? `${workCount}/${MANDATE_COUNT} · ${copy.mandate.chapters[workNext].title}`
                    : copy.mandate.done}
              </span>
            </button>
            <div className="flex shrink-0 items-center">
              <Button
                variant="ghost"
                size="icon"
                className="size-11 sm:hidden"
                aria-label={copy.share}
                onClick={() => void share()}
              >
                <Share2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label={current.starred ? copy.unstar : copy.star}
                onClick={starCurrent}
              >
                <Star className="size-4" fill={current.starred ? "currentColor" : "none"} />
              </Button>
            </div>
          </div>
          {encounter ? (
            <p
              role="status"
              className="hud-swap mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-accent line-clamp-2"
              data-tap-sky
              data-dispatch="blink"
              key="blink"
            >
              {copy.plot.blink}
            </p>
          ) : mode === "lensing" ? (
            <p
              role="status"
              className="hud-swap mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-fg line-clamp-2"
              data-dispatch="halo"
              key="halo"
            >
              {copy.obs.haloNiche[halo.niche]}
              <span className="text-fg-subtle"> · </span>
              {Math.round(halo.outerKms)} {copy.obs.rotationV}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.haloTheta} {halo.thetaE.toFixed(2)}
              <span className="text-fg-subtle"> · </span>
              {formatPct(halo.share)}
            </p>
          ) : liveEpoch === "recombination" ? (
            <p
              role="status"
              className="hud-swap mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-fg line-clamp-2"
              data-dispatch="acoustic"
              key="acoustic"
            >
              {copy.obs.acousticNiche[acoustic.niche]}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.acousticEll} {Math.round(acoustic.ell1)}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.acousticOddEven} {acoustic.oddEven.toFixed(2)}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.acousticLoad} ×{acoustic.baryonLoad.toFixed(2)}
            </p>
          ) : liveEpoch === "darkAges" ? (
            <p
              role="status"
              className="hud-swap mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-fg line-clamp-2"
              data-dispatch="twentyone"
              key="twentyone"
            >
              {copy.obs.epochs.darkAges}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.twentyOne}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.acousticEll} {Math.round(acoustic.ell1)}
            </p>
          ) : liveEpoch === "reionization" ? (
            <p
              role="status"
              className="hud-swap mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-fg line-clamp-2"
              data-dispatch="hii"
              key="hii"
            >
              {copy.obs.epochs.reionization}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.hii}
              <span className="text-fg-subtle"> · </span>
              {copy.obs.acousticEll} {Math.round(acoustic.ell1)}
            </p>
          ) : (
            <p
              role="status"
              className="hud-swap mt-1.5 max-w-md text-pretty text-sm leading-relaxed text-fg line-clamp-2"
              data-dispatch={dispatchId}
              key={dispatchId}
            >
              {copy.plot[dispatchId]}
            </p>
          )}
          {shared ? (
            <p className="mt-1.5 font-mono text-xs text-life">{copy.shared}</p>
          ) : null}
          </div>
          <div className="mt-2 flex shrink-0 flex-nowrap items-center gap-2 pt-1">
            <Button
              onClick={birth}
              className={cn(
                "min-w-0 flex-1 sm:flex-none",
                nudgeBirth && "nudge-ring",
              )}
            >
              <Aperture />
              <span className="truncate">{copy.birth}</span>
            </Button>
            {!ours ? (
              <Button
                variant="outline"
                onClick={resetOurs}
                data-nudge={oursNudge ? "ours" : undefined}
                className="min-w-0 max-w-[42%] shrink sm:max-w-none"
              >
                <span className="truncate">{copy.ours}</span>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              className={cn("shrink-0 sm:hidden", nudgeSurvey && "nudge-ring")}
              data-nudge={nudgeSurvey ? "survey" : undefined}
              aria-label={copy.survey}
              onClick={runSurvey}
            >
              <ScanSearch />
            </Button>
            <Button
              variant="outline"
              className={cn("hidden sm:inline-flex", nudgeSurvey && "nudge-ring")}
              data-nudge={nudgeSurvey ? "survey" : undefined}
              onClick={runSurvey}
            >
              <ScanSearch />
              <span className="truncate">{copy.survey}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 sm:hidden"
              aria-label={copy.refine}
              onClick={runRefine}
            >
              <Atom />
            </Button>
            <Button variant="outline" className="hidden sm:inline-flex" onClick={runRefine}>
              <Atom />
              <span className="truncate">{copy.refine}</span>
            </Button>
            <MoreMenu
              compact
              copy={copy}
              nudge={nudgeSkies}
              onOurs={resetOurs}
              onSilicon={() => applyPreset(SILICON_CORRIDOR, SILICON_SEED)}
              onEternal={() => applyPreset(ETERNAL_CORRIDOR, ETERNAL_SEED)}
              onSwarm={() => applyPreset(SWARM_CORRIDOR, SWARM_SEED)}
              onHighway={() => applyPreset(HIGHWAY_CORRIDOR, HIGHWAY_SEED)}
              onBelt={() => applyPreset(BELT_CORRIDOR, BELT_SEED)}
              onCluster={() => applyPreset(CLUSTER_SKY, CLUSTER_SEED)}
              onDwarf={() => applyPreset(DWARF_SKY, DWARF_SEED)}
              onDesert={() => applyPreset(DESERT_EPOCH, DESERT_SEED)}
            />
          </div>
        </div>
      </div>

      {panelOpen ? (
        <button
          type="button"
          aria-label={copy.closePanel}
          data-open="true"
          className="scrim-fade fixed inset-x-0 top-0 z-30 bg-bg/70 lg:bg-bg/50 bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
          onClick={() => setTab("sky")}
          inert={overlayOpen ? true : undefined}
        />
      ) : null}

      <aside
        ref={asideRef}
        data-open={panelOpen ? "true" : "false"}
        className={cn(
          "panel-slide fixed top-0 right-0 z-40 flex min-h-0 flex-col overflow-y-auto overscroll-contain",
          "border-l border-border bg-bg-elevated px-5",
          "w-full sm:w-[min(28rem,90vw)]",
          "bottom-[calc(3.5rem+env(safe-area-inset-bottom))] pb-[max(1.5rem,env(safe-area-inset-bottom))]",
          !panelOpen && "pointer-events-none",
        )}
        aria-hidden={!panelOpen}
        inert={overlayOpen || !panelOpen ? true : undefined}
      >
        <div className="sticky top-0 z-10 -mx-5 mb-5 border-b border-border bg-bg-elevated px-5 pt-6 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-[-0.02em] text-fg">
              {tab === "log" ? copy.log : copy.tabs.lab}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label={copy.closePanel}
              onClick={() => setTab("sky")}
            >
              <X />
            </Button>
          </div>
          {tab === "lab" ? (
            <div className="mt-3">
              <Suspense fallback={null}>
                <LabPanes
                  copy={copy}
                  pane={labPane}
                  nudge={huntNudge ? "hunt" : null}
                  onChange={setLabPane}
                />
              </Suspense>
              <p className="mt-2 text-pretty text-xs leading-relaxed text-fg-subtle">
                {copy.labPaneHint[labPane]}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-col gap-6">
          {tab === "log" ? (
            <Suspense fallback={<p className="text-sm text-fg-muted">{copy.writing}</p>}>
            <LogList
              copy={copy}
              locale={locale}
              archive={archive}
              currentId={current.id}
              workLabel={`${copy.mandate.title} · ${copy.mandate.progress.replace("{n}", String(workCount)).replace("{m}", String(MANDATE_COUNT))}`}
              onOpenWork={() => {
                setTab("sky");
                setMandateOpen(true);
              }}
              onRestore={restore}
              onStar={starById}
              onRemove={removeById}
            />
            </Suspense>
          ) : tab === "lab" ? (
            <Suspense fallback={<p className="text-sm text-fg-muted">{copy.writing}</p>}>
              {lab}
            </Suspense>
          ) : null}
        </div>
      </aside>

      <div inert={overlayOpen ? true : undefined} className={cn(onboard && "hidden")}>
        <TabBar
          copy={copy}
          tab={tab}
          nudge={null}
          onChange={(next) => {
            setTab(next);
            if (next === "lab") {
              setLabNudge(false);
              labHinted.current = true;
            }
          }}
        />
      </div>

      {onboard && !settingsOpen && !helpOpen && !installOpen && !keepOpen && !siliconOpen && !eternalOpen && !swarmOpen && !scriptureOpen ? (
        <Onboarding copy={copy} locale={locale} onLocale={toggleLocale} onDone={finishOnboard} />
      ) : null}
      <Suspense fallback={null}>
      {installOpen ? (
        <InstallSheet
          copy={copy}
          platform={platform}
          canNativeInstall={installReady}
          onInstall={() => void runInstall()}
          onKeep={() => showOverlay("keep")}
          onClose={() => setInstallOpen(false)}
        />
      ) : null}
      {settingsOpen ? (
        <SettingsSheet
          copy={copy}
          locale={locale}
          haptics={hapticsOn}
          sound={soundOn}
          contrast={contrast}
          scripture={scriptureOn}
          typeScale={typeScale}
          standalone={standalone}
          musicSource={musicSource}
          musicVolume={musicVolume}
          ownTrackName={ownTrackName}
          ownTracks={ownTracks}
          playIndex={playIndex}
          onLocale={setLocaleExplicit}
          onHaptics={(on) => {
            setHapticEnabled(on);
            setHapticsOn(on);
            if (on) haptic(12);
          }}
          onSound={(on) => {
            setSoundOn(on);
            soundOnRef.current = on;
            if (on) unlockAndStart(current.params);
            void setSoundscape(on, current.params);
          }}
          onContrast={(on) => {
            persistContrast(on);
            setContrast(on);
            applyPrefs(on, typeScale);
          }}
          onScripture={(on) => {
            persistScripture(on);
            setScriptureOn(on);
          }}
          onTypeScale={(scale) => {
            persistTypeScale(scale);
            setTypeScale(scale);
            applyPrefs(contrast, scale);
          }}
          onMusicSource={(next) => {
            persistMusicSource(next);
            setMusicSource(next);
            void setSoundscape(soundOn, current.params);
          }}
          onMusicVolume={(value) => {
            persistMusicVolume(value);
            setMusicVolume(value);
          }}
          onPickTracks={(files) => {
            void addOwnTracks(files).then(() => {
              setOwnTracks(getOwnPlaylist());
              setPlayIndex(getPlayIndex());
              setOwnTrackName(getOwnTrackName());
              setMusicSource("own");
              setSoundOn(true);
              void setSoundscape(true, current.params);
            });
          }}
          onPlayTrack={(id) => {
            void playOwnTrack(id).then(() => {
              setPlayIndex(getPlayIndex());
              setOwnTrackName(getOwnTrackName());
              setMusicSource("own");
              setSoundOn(true);
              void setSoundscape(true, current.params);
            });
          }}
          onRemoveTrack={(id) => {
            void removeOwnTrack(id).then(() => {
              setOwnTracks(getOwnPlaylist());
              setPlayIndex(getPlayIndex());
              setOwnTrackName(getOwnTrackName());
              if (!getOwnPlaylist().length) setMusicSource("cosmos");
              void setSoundscape(soundOn, current.params);
            });
          }}
          onClearTrack={() => {
            void clearOwnTrack().then(() => {
              setOwnTrackName("");
              setOwnTracks([]);
              setPlayIndex(0);
              setMusicSource("cosmos");
              void setSoundscape(soundOn, current.params);
            });
          }}
          onInstall={() => showOverlay("install")}
          onReplay={() => {
            setSettingsOpen(false);
            setAboutIntent(false);
            if (isAboutHash()) {
              const url = `${window.location.pathname}${window.location.search}`;
              window.history.replaceState(null, "", url);
            }
            setOnboard(true);
          }}
          onClearLog={() => {
            setArchive([]);
            setSettingsOpen(false);
          }}
          onOurs={() => {
            setSettingsOpen(false);
            resetOurs();
          }}
          onSilicon={() => {
            setSettingsOpen(false);
            applyPreset(SILICON_CORRIDOR, SILICON_SEED);
          }}
          onEternal={() => {
            setSettingsOpen(false);
            applyPreset(ETERNAL_CORRIDOR, ETERNAL_SEED);
          }}
          onSwarm={() => {
            setSettingsOpen(false);
            applyPreset(SWARM_CORRIDOR, SWARM_SEED);
          }}
          onHighway={() => {
            setSettingsOpen(false);
            applyPreset(HIGHWAY_CORRIDOR, HIGHWAY_SEED);
          }}
          onBelt={() => {
            setSettingsOpen(false);
            applyPreset(BELT_CORRIDOR, BELT_SEED);
          }}
          onCluster={() => {
            setSettingsOpen(false);
            applyPreset(CLUSTER_SKY, CLUSTER_SEED);
          }}
          onDwarf={() => {
            setSettingsOpen(false);
            applyPreset(DWARF_SKY, DWARF_SEED);
          }}
          onDesert={() => {
            setSettingsOpen(false);
            applyPreset(DESERT_EPOCH, DESERT_SEED);
          }}
          onHelp={() => showOverlay("help")}
          onCanon={openCanon}
          onKeep={() => showOverlay("keep")}
          onClose={() => {
            setSettingsOpen(false);
            setAboutIntent(false);
            if (isAboutHash()) {
              const next = `${window.location.pathname}${window.location.search}`;
              window.history.replaceState(null, "", next);
            }
          }}
          openAbout={aboutIntent}
        />
      ) : null}
      {keepOpen ? (
        <KeepSheet
          copy={copy}
          onClose={() => {
            setKeepOpen(false);
            setKeepIntent(false);
            if (isKeepHash()) {
              window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}`,
              );
            }
          }}
        />
      ) : null}
      {helpOpen ? <HelpSheet copy={copy} onKeep={() => showOverlay("keep")} onClose={() => setHelpOpen(false)} /> : null}
      {scriptureOpen && passage ? (
        <ScriptureSheet
          copy={copy}
          locale={locale}
          currentId={passage.id}
          onClose={() => setScriptureOpen(false)}
        />
      ) : null}
      {mandateOpen ? (
        <MandateSheet
          copy={copy}
          progress={mandate}
          onClose={() => setMandateOpen(false)}
          onAct={runWorkAct}
        />
      ) : null}
      {siliconOpen ? (
        <SiliconDossier
          copy={copy}
          params={current.params}
          evaluation={ev}
          onClose={() => setSiliconOpen(false)}
        />
      ) : null}
      {eternalOpen ? (
        <EternalDossier
          copy={copy}
          params={current.params}
          evaluation={ev}
          onClose={() => setEternalOpen(false)}
        />
      ) : null}
      {swarmOpen ? (
        <SwarmDossier
          copy={copy}
          params={current.params}
          evaluation={ev}
          onClose={() => setSwarmOpen(false)}
        />
      ) : null}
      </Suspense>
    </div>
  );
}
