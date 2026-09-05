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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AstroPanel } from "@/components/astro-panel";
import { CatalogOverlay } from "@/components/catalog-overlay";
import { CitizenPanel } from "@/components/citizen-panel";
import { CivPanel } from "@/components/civ-panel";
import { BiospherePanel } from "@/components/biosphere-panel";
import { CompareOurs } from "@/components/compare-ours";
import { CosmicClock } from "@/components/cosmic-clock";
import { DeskPanel } from "@/components/desk-panel";
import { EpochTimeline } from "@/components/epoch-timeline";
import { GalaxyCanvas } from "@/components/galaxy-canvas";
import { HrDiagram } from "@/components/hr-diagram";
import { HelpSheet } from "@/components/help-sheet";
import { HubblePanel } from "@/components/hubble-panel";
import { InstallSheet } from "@/components/install-sheet";
import { LabPanes } from "@/components/lab-panes";
import { LawsPanel } from "@/components/laws-panel";
import { LifeFactors } from "@/components/life-factors";
import { LogList } from "@/components/log-list";
import { MoreMenu } from "@/components/more-menu";
import { Onboarding } from "@/components/onboarding";
import { ParamSliders } from "@/components/param-sliders";
import { ResearchPanel } from "@/components/research-panel";
import { SettingsSheet } from "@/components/settings-sheet";
import { EternalDossier } from "@/components/eternal-dossier";
import { EternalPanel } from "@/components/eternal-panel";
import { SiliconDossier } from "@/components/silicon-dossier";
import { SiliconPanel } from "@/components/silicon-panel";
import { SkyModes } from "@/components/sky-modes";
import { TabBar, type AppTab } from "@/components/tab-bar";
import { Button } from "@/components/ui/button";
import {
  loadArchive,
  removeFromArchive,
  saveArchive,
  toggleStar,
  upsertArchive,
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
  type MusicSource,
  type PlaylistEntry,
} from "@/lib/universe/audio";
import { chronicleUniverse } from "@/lib/universe/chronicle";
import { fieldNote } from "@/lib/universe/field-note";
import { formatGyr, formatPct } from "@/lib/universe/format";
import {
  haptic,
  loadHapticPref,
  setHapticEnabled,
} from "@/lib/universe/haptic";
import { autonym, bcp47, copyFor, detectLocale, persistLocale, type Locale } from "@/lib/universe/i18n";
import { loadCatalog } from "@/lib/universe/languages";
import { detectPlatform, type PlatformInfo } from "@/lib/universe/platform";
import {
  applyPrefs,
  loadContrast,
  loadTypeScale,
  persistContrast,
  persistTypeScale,
  type TypeScale,
} from "@/lib/universe/prefs";
import { intelligenceWindow, formatDiasporaLine } from "@/lib/universe/civilization";
import {
  DESERT_EPOCH,
  DESERT_SEED,
  ETERNAL_CORRIDOR,
  ETERNAL_SEED,
  OUR_SEED,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  SILICON_SEED,
  evaluate,
  isOurParams,
  randomParams,
  refine,
  siliconDossier,
  snapParams,
  survey,
} from "@/lib/universe/physics";
import {
  type ExpeditionResult,
  type ResearchTarget,
} from "@/lib/universe/research";
import { runExpeditionAsync } from "@/lib/universe/law-client";
import { buildFieldReport, downloadText, reportFilename } from "@/lib/universe/report";
import { isAboutHash, isHostedLab } from "@/lib/universe/studio";
import type { DiscoveryResult } from "@/lib/universe/symbolic";
import type { BayesResult } from "@/lib/universe/bayes";
import type { CatalogResult, CutoutResult } from "@/lib/universe/mast";
import type { McmcResult } from "@/lib/universe/mcmc";
import { loadVotes, type SkyVote } from "@/lib/universe/zooniverse";
import {
  catalogId,
  hashParams,
  isAnswerCatalog,
  mulberry32,
  nameUniverse,
  randomSeed,
} from "@/lib/universe/rng";
import { ANSWER_SEED, noteEggKey, sliderEgg } from "@/lib/universe/eggs";
import { decodeUniverse, encodeUniverse, shareUrl } from "@/lib/universe/share";
import { compareToOurs, formatCompareFlash, formatCompareLine } from "@/lib/universe/compare";
import type { LabPane, ParamKey, SkyMode, UniverseParams, UniverseRecord } from "@/lib/universe/types";
import { cn } from "@/lib/utils";
import { nowMarker } from "@/lib/universe/observatory";

const ONBOARD_KEY = "genesis-engine-onboarded-v5";

function makeRecord(params: UniverseParams, visualSeed: number): UniverseRecord {
  const snapped = snapParams(params);
  const evaluation = evaluate(snapped);
  const id = hashParams(snapped, visualSeed);
  const rng = mulberry32(visualSeed);
  return {
    id,
    catalog: catalogId(id),
    name: nameUniverse(rng, id),
    visualSeed,
    params: snapped,
    evaluation,
    createdAt: Date.now(),
  };
}

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [egg, setEgg] = useState<string | null>(null);
  const [birthFlash, setBirthFlash] = useState(false);
  const [creationLine, setCreationLine] = useState<string | null>(null);
  const [birthFate, setBirthFate] = useState<string | null>(null);
  const [surveyNudge, setSurveyNudge] = useState(false);
  const [insideNudge, setInsideNudge] = useState(false);
  const [oursNudge, setOursNudge] = useState(false);
  const [whaleOn, setWhaleOn] = useState(false);
  const [tauOn, setTauOn] = useState(false);
  const kickerTaps = useRef(0);
  const titleTaps = useRef(0);
  const fateTaps = useRef(0);
  const siliconTaps = useRef(0);
  const eternalTaps = useRef(0);
  const eggTimer = useRef(0);
  const tauTimer = useRef(0);
  const birthFlashTimer = useRef(0);
  const creationTimer = useRef(0);
  const onboardBirthTimer = useRef(0);
  const copyTimer = useRef(0);
  const shareTimer = useRef(0);
  const reportTimer = useRef(0);
  const surveyNudgeTimer = useRef(0);
  const insideNudgeTimer = useRef(0);
  const oursNudgeTimer = useRef(0);
  const keyBuf = useRef("");
  const collisionHinted = useRef(false);
  const dotHinted = useRef(false);
  const tauHinted = useRef(false);
  const huntAuto = useRef(false);
  const huntTimer = useRef(0);
  const huntGen = useRef(0);
  const [hydrated, setHydrated] = useState(false);
  const [onboard, setOnboard] = useState(true);
  const [tab, setTab] = useState<AppTab>("sky");
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
  const toggleEvolve = useCallback(() => {
    setEvolving((on) => {
      if (on) {
        setCosmicTime(timeRef.current);
        return false;
      }
      setCosmicTime((t) => (t >= 0.98 ? 0 : t));
      return true;
    });
  }, [setCosmicTime]);
  const [collisionKey, setCollisionKey] = useState(0);
  const [installOpen, setInstallOpen] = useState(false);
  const [installReady, setInstallReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aboutIntent, setAboutIntent] = useState(false);
  const [siliconOpen, setSiliconOpen] = useState(false);
  const [eternalOpen, setEternalOpen] = useState(false);
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
  const copy = useMemo(() => copyFor(locale), [locale]);
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

  useEffect(() => {
    document.documentElement.lang = bcp47(locale);
  }, [locale]);

  useEffect(() => {
    return () => {
      window.clearTimeout(eggTimer.current);
      window.clearTimeout(tauTimer.current);
      window.clearTimeout(birthFlashTimer.current);
      window.clearTimeout(creationTimer.current);
      window.clearTimeout(onboardBirthTimer.current);
      window.clearTimeout(copyTimer.current);
      window.clearTimeout(shareTimer.current);
      window.clearTimeout(reportTimer.current);
      window.clearTimeout(surveyNudgeTimer.current);
      window.clearTimeout(insideNudgeTimer.current);
      window.clearTimeout(oursNudgeTimer.current);
      window.clearTimeout(huntTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
    const next = detectLocale();
    setLocale(next);
    document.documentElement.lang = bcp47(next);
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
    if (!fromLinkRef.current) {
      const decoded = decodeUniverse(window.location.search);
      if (decoded) {
        fromLinkRef.current = true;
        setCurrent(makeRecord(decoded.params, decoded.visualSeed));
      }
    }
    try {
      setOnboard(localStorage.getItem(ONBOARD_KEY) !== "1");
    } catch {
      setOnboard(true);
    }
    if (isAboutHash()) {
      setAboutIntent(true);
    }
  }, []);

  useEffect(() => {
    const applyHash = () => {
      if (!isAboutHash()) return;
      setHelpOpen(false);
      setInstallOpen(false);
      setSiliconOpen(false);
      setEternalOpen(false);
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
    setVotes(loadVotes());

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

  const birthThought = useCallback(() => {
    haptic(12);
    const record = makeRecord(OUR_UNIVERSE, ANSWER_SEED);
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    nudgeSoundscape(record.params);
    flashEgg(copy.eggs.thought);
  }, [copy.eggs.thought, flashEgg, remember]);

  const witnessBirth = useCallback(
    (record: UniverseRecord) => {
      const fate = record.evaluation.fate;
      const good = fate === "habitable" || fate === "teeming" || fate === "enduring";
      const versusFlash = formatCompareFlash(compareToOurs(record.params), copy);
      const line = good ? copy.birthGood : (versusFlash ?? copy.birthWitness);
      setCreationLine(line);
      setBirthFate(copy.fateLabel[fate]);
      try {
        pingBirth();
      } catch {
        /* a missed chord is not a missed sky */
      }
      setBirthFlash(true);
      window.clearTimeout(birthFlashTimer.current);
      window.clearTimeout(creationTimer.current);
      window.clearTimeout(surveyNudgeTimer.current);
      window.clearTimeout(insideNudgeTimer.current);
      window.clearTimeout(oursNudgeTimer.current);
      birthFlashTimer.current = window.setTimeout(() => setBirthFlash(false), 1100);
      creationTimer.current = window.setTimeout(() => {
        setCreationLine(null);
        setBirthFate(null);
      }, good ? 6400 : 4200);
      if (good) {
        setSurveyNudge(false);
        if (isOurParams(record.params)) {
          setOursNudge(false);
          setInsideNudge(true);
          insideNudgeTimer.current = window.setTimeout(() => setInsideNudge(false), 6400);
        } else {
          setInsideNudge(false);
          setOursNudge(true);
          oursNudgeTimer.current = window.setTimeout(() => setOursNudge(false), 6400);
        }
      } else {
        setInsideNudge(false);
        setOursNudge(false);
        setSurveyNudge(true);
        surveyNudgeTimer.current = window.setTimeout(() => setSurveyNudge(false), 5200);
      }
    },
    [copy],
  );

  const setParams = useCallback((key: ParamKey, value: number) => {
    setCurrent((prev) => {
      const params = { ...prev.params, [key]: value };
      return { ...makeRecord(params, prev.visualSeed), chronicle: undefined };
    });
    setError(null);
  }, []);

  const birth = useCallback(() => {
    haptic(12);
    const seed = randomSeed();
    const record = makeRecord(randomParams(mulberry32(seed)), seed);
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    nudgeSoundscape(record.params);
    witnessBirth(record);
  }, [remember, witnessBirth]);

  const resetOurs = useCallback(() => {
    haptic(8);
    const record = makeRecord(OUR_UNIVERSE, OUR_SEED);
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    setOursNudge(false);
    setSurveyNudge(false);
    nudgeSoundscape(record.params);
    witnessBirth(record);
    if (mode === "planetarium") revealHomeSky();
  }, [remember, witnessBirth, mode, revealHomeSky]);

  const applyPreset = useCallback(
    (params: UniverseParams, seed: number) => {
      haptic(8);
      const record = makeRecord(params, seed);
      setCurrent(record);
      remember(record);
      setError(null);
      setTab("sky");
      nudgeSoundscape(record.params);
    },
    [remember],
  );

  const runSurvey = useCallback(() => {
    haptic(16);
    const seed = randomSeed();
    const results = survey(64, seed);
    const winner = results[0];
    if (!winner) return;
    const record = makeRecord(winner.params, winner.visualSeed);
    setCurrent(record);
    setArchive((prev) => {
      let next = prev;
      for (const r of results) {
        if (
          r.evaluation.lifeProb < 0.18 &&
          r.evaluation.siliconProb < 0.18 &&
          r.evaluation.eternalProb < 0.18
        )
          continue;
        next = upsertArchive(next, makeRecord(r.params, r.visualSeed));
      }
      return upsertArchive(next, record);
    });
    setError(null);
    setTab("sky");
    setSurveyNudge(false);
    nudgeSoundscape(record.params);
    witnessBirth(record);
  }, [witnessBirth]);

  const runRefine = useCallback(() => {
    haptic(12);
    const { lifeProb, siliconProb, eternalProb } = current.evaluation;
    const target =
      eternalProb > lifeProb && eternalProb > siliconProb
        ? "eternal"
        : siliconProb > lifeProb
          ? "silicon"
          : "carbon";
    const seed = randomSeed();
    const params = refine(current.params, seed, target);
    const record = makeRecord(params, seed);
    setCurrent(record);
    remember(record);
    setError(null);
    setTab("sky");
    nudgeSoundscape(record.params);
  }, [current.evaluation.lifeProb, current.evaluation.siliconProb, current.evaluation.eternalProb, current.params, remember]);

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
      void runExpeditionAsync(seed, target, params)
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
        .finally(() => {
          if (gen === huntGen.current) setHunting(false);
        });
    }, 0);
  }, [current.params, researchTarget]);

  const applyFind = useCallback(
    (params: UniverseParams, visualSeed: number) => {
      haptic(8);
      const record = makeRecord(params, visualSeed);
      setCurrent(record);
      remember(record);
      setError(null);
      setTab("sky");
      nudgeSoundscape(record.params);
    },
    [remember],
  );

  const saveReport = useCallback(() => {
    haptic(8);
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
    setReportSaved(true);
    window.clearTimeout(reportTimer.current);
    reportTimer.current = window.setTimeout(() => setReportSaved(false), 1400);
  }, [copy, current, expedition, lawResult, bayesResult, mcmcResult, locale]);

  const versusLine = useMemo(
    () => formatCompareLine(compareToOurs(current.params), copy),
    [copy, current.params],
  );
  const diasporaLine = useMemo(
    () => formatDiasporaLine(intelligenceWindow(current.params, current.evaluation), copy.civ),
    [copy, current.params, current.evaluation],
  );

  const noteText = current.chronicle ?? fieldNote({
    name: current.name,
    catalog: current.catalog,
    params: current.params,
    evaluation: current.evaluation,
    locale,
    salt: current.visualSeed,
    versus: versusLine,
  });

  const commission = useCallback(async () => {
    if (busy) return;
    setError(null);
    setTab("lab");
    const snapshotId = current.id;
    const local = fieldNote({
      name: current.name,
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
    if (isHostedLab()) return;
    setBusy(true);
    try {
      const result = await chronicleUniverse({
        data: {
          name: current.name,
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
  }, [busy, current, locale, remember, versusLine]);

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
      title: `${current.name} · ${copy.appName}`,
      text: `${current.catalog} · ${copy.fateLabel[current.evaluation.fate]} · ${copy.carbon} ${formatPct(current.evaluation.lifeProb)} · ${copy.silicon} ${formatPct(current.evaluation.siliconProb)} · ${copy.eternal} ${formatPct(current.evaluation.eternalProb)}`,
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
  }, [copy, current]);

  const restore = useCallback((record: UniverseRecord) => {
    haptic(8);
    setCurrent(record);
    setError(null);
    setTab("sky");
    nudgeSoundscape(record.params);
  }, []);

  const starCurrent = useCallback(() => {
    haptic(10);
    const next = { ...current, starred: !current.starred };
    setCurrent(next);
    setArchive((list) => upsertArchive(list, next));
  }, [current]);

  const starById = useCallback((id: string) => {
    haptic(8);
    setArchive((prev) => toggleStar(prev, id));
    setCurrent((prev) => (prev.id === id ? { ...prev, starred: !prev.starred } : prev));
  }, []);

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
    if (aboutIntent) {
      setSettingsOpen(true);
    }
    if (born && !fromLinkRef.current) {
      window.clearTimeout(onboardBirthTimer.current);
      onboardBirthTimer.current = window.setTimeout(() => birth(), 220);
    }
  }, [aboutIntent, birth, current.params]);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const order = ["en", "ru", "be"] as const;
      const i = order.indexOf(prev as (typeof order)[number]);
      const next = order[i < 0 ? 0 : (i + 1) % order.length];
      persistLocale(next);
      return next;
    });
  }, []);

  const setLocaleExplicit = useCallback((next: Locale) => {
    persistLocale(next);
    setLocale(next);
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

  const overlayOpen = onboard || installOpen || settingsOpen || siliconOpen || eternalOpen || helpOpen;
  const panelOpen = tab === "lab" || tab === "log";
  const showOverlay = (which: "help" | "silicon" | "eternal" | "settings" | "install") => {
    setHelpOpen(which === "help");
    setSiliconOpen(which === "silicon");
    setEternalOpen(which === "eternal");
    setSettingsOpen(which === "settings");
    setInstallOpen(which === "install");
  };

  useEffect(() => {
    if (!settingsOpen) return;
    void loadCatalog();
  }, [settingsOpen]);

  useEffect(() => {
    asideRef.current?.scrollTo({ top: 0 });
  }, [labPane, tab]);

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
      const key = event.key.toLowerCase();
      const seq = noteEggKey(keyBuf.current, event.key);
      keyBuf.current = seq.buf;
      if (seq.hit) {
        if (seq.hit === "thought" || seq.hit === "answer") birthThought();
        else if (seq.hit === "tau") armTau();
        else flashEgg(copy.eggs[seq.hit]);
        if (seq.hit === "whale") setWhaleOn(true);
        return;
      }
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    birth,
    birthThought,
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
    setEvolving(false);
    setMode("galaxy");
    setCosmicTime(nowMarker(current.params, current.evaluation));
    // Reset the observatory when a new sky is born, not when sliders move.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visualSeed is the birth identity
  }, [current.visualSeed]);

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
  const ours = isOurParams(current.params);
  const slideEgg = sliderEgg(current.params);

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

          <div className="grid grid-cols-3 gap-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.carbon}
              </p>
              <p className={cn("mt-1 font-mono text-xl tabular-nums sm:text-2xl", lifeTone)}>
                {formatPct(ev.lifeProb)}
              </p>
            </div>
            <div className="min-w-0 text-center">
              <p className="truncate font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.silicon}
              </p>
              <p className={cn("mt-1 font-mono text-xl tabular-nums sm:text-2xl", siliconTone)}>
                {formatPct(ev.siliconProb)}
              </p>
            </div>
            <div className="min-w-0 text-right">
              <p className="truncate font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
                {copy.eternal}
              </p>
              <p className={cn("mt-1 font-mono text-xl tabular-nums sm:text-2xl", eternalTone)}>
                {formatPct(ev.eternalProb)}
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
                {reportSaved ? copy.report.downloaded : copy.report.download}
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
          </Fold>

          <Fold title={copy.foldObs}>
            <AstroPanel copy={copy} params={current.params} evaluation={ev} />
            <HubblePanel copy={copy} evaluation={ev} />
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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg text-fg" data-hydrated={hydrated ? "1" : "0"}>
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
          onEvolveEnd={() => {
            setEvolving(false);
            setCosmicTime(timeRef.current);
          }}
          mode={mode}
          collisionKey={collisionKey}
          eggs={{ whale: whaleOn || isAnswerCatalog(current.catalog), tau: tauOn }}
          onVoyager={() => flashEgg(copy.eggs.voyager)}
          onTau={armTau}
          className="absolute inset-0 z-0 h-full w-full"
          relaxed={tab !== "sky" || overlayOpen}
          wakeKey={wakeKey}
          ariaLabel={`${copy.appName} · ${copy.tabs.sky}`}
        />
        {birthFlash ? (
          <div aria-hidden className="birth-flash pointer-events-none absolute inset-0 z-[3]" />
        ) : null}
        {creationLine ? (
          <div
            role="status"
            className="birth-line pointer-events-none absolute inset-x-6 top-[22%] z-[8] text-center sm:top-[28%]"
          >
            <p className="font-display text-2xl leading-tight tracking-[-0.03em] text-fg sm:text-4xl">
              {creationLine}
            </p>
            {birthFate ? (
              <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.22em] text-fg-subtle uppercase">
                {birthFate}
              </p>
            ) : null}
          </div>
        ) : null}
        {hydrated && catalogOverlay && catalog && catalog.ok ? (
          <CatalogOverlay
            copy={copy}
            catalog={catalog}
            onClose={() => setCatalogOverlay(false)}
          />
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 sky-glow mix-blend-screen opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent lg:h-52"
        />

        <header className="relative z-10 flex items-start justify-between gap-3 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pointer-events-auto sm:px-8">
          <div className="min-w-0 flex-1 pr-2">
            <button
              type="button"
              className="bg-transparent p-0 text-left font-mono text-[0.6875rem] tracking-[0.22em] text-fg-subtle uppercase"
              onClick={() => {
                kickerTaps.current += 1;
                if (kickerTaps.current < 7) return;
                kickerTaps.current = 0;
                setWhaleOn(true);
                flashEgg(copy.eggs.whale);
              }}
            >
              {copy.kicker}
            </button>
            <h1 className="mt-1">
              <button
                type="button"
                className="w-fit max-w-full truncate bg-transparent p-0 text-left font-display text-xl leading-none tracking-[-0.03em] text-fg sm:text-2xl lg:text-3xl"
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
                soundOn && audioLive
                  ? "text-accent"
                  : soundOn
                    ? "text-accent hear-pulse"
                    : "text-fg-muted",
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
        <div className="relative z-10 px-5 pt-3 pointer-events-auto sm:px-8">
          <SkyModes
            copy={copy}
            mode={mode}
            nudge={insideNudge ? "planetarium" : null}
            onChange={(next) => {
              setMode(next);
              if (next === "planetarium") setInsideNudge(false);
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

        <div className="relative z-10 mt-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pointer-events-auto sm:px-8 lg:pb-8">
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
            <div className="h-[4.75rem] rounded-[var(--radius-md)] bg-bg-elevated/75" />
          )}
          <p className="mt-3 font-mono text-[0.6875rem] tracking-[0.18em] text-fg-subtle uppercase">
            {current.catalog}
            <span className="mx-2 text-fg-subtle/50">/</span>
            {copy.morphology[ev.morphology]}
          </p>
          {isAnswerCatalog(current.catalog) ? (
            <p className="mt-1 text-pretty text-xs leading-relaxed text-accent">{copy.eggs.answer}</p>
          ) : null}
          {slideEgg ? (
            <p className="mt-1 text-pretty text-xs leading-relaxed text-fg-muted">{copy.eggs[slideEgg]}</p>
          ) : null}
          {egg ? (
            <p className="mt-1 text-pretty text-xs leading-relaxed text-cyan" role="status">
              {egg}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-2" aria-live="polite">
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
                "rounded-full px-2.5 py-1 font-mono text-[0.6875rem] tracking-wide uppercase",
                ev.fate === "teeming" || ev.fate === "habitable"
                  ? "bg-life/20 text-life"
                  : ev.fate === "enduring"
                    ? "bg-eternal/20 text-eternal"
                  : ev.fate === "sterile"
                    ? "bg-sterile/15 text-sterile"
                    : ev.fate === "flash" || ev.fate === "crunch" || ev.fate === "rip"
                      ? "bg-silicon/20 text-silicon"
                      : "bg-nebula/20 text-cyan",
              )}
            >
              {copy.fateLabel[ev.fate]}
            </button>
            <span
              className={cn(
                "rounded-full bg-bg-elevated/80 px-2.5 py-1 font-mono text-[0.6875rem] tabular-nums",
                lifeTone,
              )}
            >
              {copy.carbon} {formatPct(ev.lifeProb)}
            </span>
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
              className={cn(
                "rounded-full bg-bg-elevated/80 px-2.5 py-1 font-mono text-[0.6875rem] tabular-nums",
                siliconTone,
              )}
            >
              {copy.silicon} {formatPct(ev.siliconProb)}
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
              className={cn(
                "rounded-full bg-bg-elevated/80 px-2.5 py-1 font-mono text-[0.6875rem] tabular-nums",
                eternalTone,
              )}
            >
              {copy.eternal} {formatPct(ev.eternalProb)}
            </button>
            {ours ? (
              <button
                type="button"
                onClick={() => flashEgg(copy.eggs.dot)}
                className="rounded-full bg-bg-elevated/80 px-2.5 py-1 font-mono text-[0.6875rem] tracking-wide text-fg-muted uppercase"
              >
                {copy.oursBadge}
              </button>
            ) : null}
          </div>
          <div className="mt-2 flex max-w-md items-center justify-between gap-3">
            <h2
              key={current.id}
              className="hud-swap min-w-0 truncate font-display text-xl tracking-[-0.02em] text-fg sm:text-2xl lg:text-3xl"
            >
              {current.name}
            </h2>
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
          <p className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-fg-muted line-clamp-2">
            {copy.fateCopy[ev.fate]}
          </p>
          {versusLine ? (
            <p
              className="mt-2 max-w-md text-pretty text-sm leading-relaxed text-fg-muted line-clamp-3"
              data-versus="1"
            >
              {versusLine}
            </p>
          ) : null}
          {diasporaLine ? (
            <p
              className="mt-2 max-w-md text-pretty text-xs leading-relaxed text-fg-subtle line-clamp-2"
              data-routes="1"
            >
              {diasporaLine}
            </p>
          ) : null}
          {!ours ? (
            <button
              type="button"
              onClick={resetOurs}
              data-nudge={oursNudge ? "ours" : undefined}
              className={cn(
                "mt-2 font-mono text-[0.6875rem] tracking-[0.16em] text-accent uppercase",
                oursNudge && "nudge-ring rounded-full px-2.5 py-1",
              )}
            >
              {copy.ours}
            </button>
          ) : null}
          {mode !== "galaxy" ? (
            <p className="mt-2 max-w-md text-pretty text-xs leading-relaxed text-fg-subtle line-clamp-2">
              {copy.obs.modeHint[mode]}
            </p>
          ) : null}
          {shared ? (
            <p className="mt-2 font-mono text-xs text-life">{copy.shared}</p>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={birth} className="min-w-0 flex-1 sm:flex-none">
              <Aperture />
              <span className="truncate">{copy.birth}</span>
            </Button>
            <Button
              variant="secondary"
              className={cn("shrink-0", surveyNudge && "nudge-ring")}
              data-nudge={surveyNudge ? "survey" : undefined}
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
              {copy.refine}
            </Button>
            <MoreMenu
              compact
              copy={copy}
              onOurs={resetOurs}
              onSilicon={() => applyPreset(SILICON_CORRIDOR, SILICON_SEED)}
              onEternal={() => applyPreset(ETERNAL_CORRIDOR, ETERNAL_SEED)}
              onDesert={() => applyPreset(DESERT_EPOCH, DESERT_SEED)}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label={copy.closePanel}
        data-open={panelOpen ? "true" : "false"}
        className="scrim-fade fixed inset-x-0 top-0 z-30 bg-bg/70 lg:bg-bg/50 bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
        tabIndex={panelOpen ? 0 : -1}
        aria-hidden={!panelOpen}
        onClick={() => setTab("sky")}
        inert={overlayOpen ? true : undefined}
      />

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
              <LabPanes copy={copy} pane={labPane} onChange={setLabPane} />
              <p className="mt-2 text-pretty text-xs leading-relaxed text-fg-subtle">
                {copy.labPaneHint[labPane]}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-col gap-6">
          {tab === "log" ? (
            <LogList
              copy={copy}
              locale={locale}
              archive={archive}
              currentId={current.id}
              onRestore={restore}
              onStar={starById}
              onRemove={removeById}
            />
          ) : tab === "lab" ? (
            lab
          ) : null}
        </div>
      </aside>

      <div inert={overlayOpen ? true : undefined}>
        <TabBar copy={copy} tab={tab} onChange={setTab} />
      </div>

      {onboard && !settingsOpen && !helpOpen && !installOpen && !siliconOpen && !eternalOpen ? (
        <Onboarding copy={copy} locale={locale} onLocale={toggleLocale} onDone={finishOnboard} />
      ) : null}
      {installOpen ? (
        <InstallSheet
          copy={copy}
          platform={platform}
          canNativeInstall={installReady}
          onInstall={() => void runInstall()}
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
          onDesert={() => {
            setSettingsOpen(false);
            applyPreset(DESERT_EPOCH, DESERT_SEED);
          }}
          onHelp={() => showOverlay("help")}
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
      {helpOpen ? <HelpSheet copy={copy} onClose={() => setHelpOpen(false)} /> : null}
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
    </div>
  );
}
