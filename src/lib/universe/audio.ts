import type { UniverseParams } from "./types";
import {
  DEFAULT_MUSIC_VOLUME,
  NAME_KEY,
  SOUND_KEY,
  SOURCE_KEY,
  VOLUME_KEY,
  loadMusicSource,
  loadMusicVolume,
  loadOwnTrackName,
  loadSoundPref,
  type MusicSource,
  type PlaylistEntry,
} from "./audio-prefs.ts";

export {
  DEFAULT_MUSIC_VOLUME,
  loadMusicSource,
  loadMusicVolume,
  loadOwnTrackName,
  loadSoundPref,
  type MusicSource,
  type PlaylistEntry,
} from "./audio-prefs.ts";

const TRACK_KEY = "own-track";
const META_KEY = "own-playlist";
const TRACK_PREFIX = "own-track:";
const DB_NAME = "genesis-engine";
const STORE = "kv";

export type AudioStatus = {
  wanted: boolean;
  live: boolean;
  state: AudioContextState | "idle";
};

type Voice = {
  osc: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let cosmosGain: GainNode | null = null;
let ownGain: GainNode | null = null;
let delay: DelayNode | null = null;
let delayGain: GainNode | null = null;
let delayFilter: BiquadFilterNode | null = null;
let voices: Voice[] = [];
let sparkleTimer = 0;
let sparkleEcho = 0;
let chordTimer = 0;
let chordIndex = 0;
let playing = false;
let enabled = false;
let source: MusicSource = "cosmos";
let volume = DEFAULT_MUSIC_VOLUME;
let lastParams: UniverseParams | null = null;
let ownEl: HTMLAudioElement | null = null;
let ownNode: MediaElementAudioSourceNode | null = null;
let ownObjectUrl: string | null = null;
let ownName = "";
let playlist: PlaylistEntry[] = [];
let playIndex = 0;
let wiredOwn = false;
let kicked = false;
let visWired = false;
const statusListeners = new Set<(s: AudioStatus) => void>();

const DORIAN: number[][] = [
  [0, 3, 7, 10, 12],
  [-2, 2, 5, 10, 14],
  [3, 7, 10, 15, 19],
  [7, 10, 14, 17, 19],
];

export function persistSound(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(SOUND_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
  emitStatus();
}

export function persistMusicSource(next: MusicSource): void {
  source = next;
  try {
    localStorage.setItem(SOURCE_KEY, next);
  } catch {
    /* ignore */
  }
  applyMix();
}

export function persistMusicVolume(next: number): void {
  volume = Math.min(1, Math.max(0, next));
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    /* ignore */
  }
  applyMaster();
}

function persistOwnName(name: string): void {
  ownName = name;
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}

export function getOwnTrackName(): string {
  return ownName;
}

export function getOwnPlaylist(): PlaylistEntry[] {
  return playlist.slice();
}

export function getPlayIndex(): number {
  return playIndex;
}

export function nextPlayIndex(length: number, index: number): number {
  if (length <= 0) return 0;
  return (index + 1) % length;
}

export function getMusicSource(): MusicSource {
  return source;
}

export function getMusicVolume(): number {
  return volume;
}

export function getAudioStatus(): AudioStatus {
  return {
    wanted: enabled,
    live: Boolean(enabled && playing && ctx && ctx.state === "running"),
    state: ctx?.state ?? "idle",
  };
}

export function subscribeAudioStatus(fn: (s: AudioStatus) => void): () => void {
  statusListeners.add(fn);
  try {
    fn(getAudioStatus());
  } catch {
    /* listener must never break the mixer */
  }
  return () => {
    statusListeners.delete(fn);
  };
}

function emitStatus(): void {
  const s = getAudioStatus();
  for (const fn of statusListeners) {
    try {
      fn(s);
    } catch {
      /* ignore */
    }
  }
  if (typeof window !== "undefined") {
    (window as Window & { __genesisAudio?: AudioStatus }).__genesisAudio = s;
  }
}

function midi(n: number): number {
  return 440 * Math.pow(2, (n - 69) / 12);
}

function rootMidi(params: UniverseParams): number {
  return 38 + params.gravity * 10;
}

function kickSilent(audio: AudioContext): void {
  if (kicked) return;
  kicked = true;
  try {
    const buf = audio.createBuffer(1, 1, audio.sampleRate);
    const src = audio.createBufferSource();
    src.buffer = buf;
    src.connect(audio.destination);
    src.start(0);
  } catch {
    kicked = false;
  }
}

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor({ latencyHint: "playback" });
  ctx.addEventListener("statechange", () => {
    if (ctx?.state === "running" && enabled && lastParams) {
      graph();
      ensureVoices(lastParams);
      applyMix();
      applyMaster();
    }
    emitStatus();
  });
  if (!visWired) {
    visWired = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible" || !enabled || !ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      if (lastParams) {
        graph();
        ensureVoices(lastParams);
        applyMix();
        applyMaster();
      }
      if (source === "own" && ownEl && ownEl.paused) void ownEl.play().catch(() => undefined);
      emitStatus();
    });
    window.addEventListener("focus", () => {
      if (!enabled || !ctx) return;
      if (ctx.state === "suspended") void ctx.resume();
      emitStatus();
    });
  }
  return ctx;
}

function applyMaster(): void {
  if (!master || !ctx) return;
  const target = enabled ? Math.pow(volume, 1.6) * 0.32 : 0;
  master.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
}

function applyMix(): void {
  if (!ctx || !cosmosGain || !ownGain) return;
  const t = ctx.currentTime;
  const cosmos = enabled && source === "cosmos" ? 1 : 0;
  const own = enabled && source === "own" ? 1 : 0;
  cosmosGain.gain.setTargetAtTime(cosmos, t, 0.12);
  ownGain.gain.setTargetAtTime(own, t, 0.12);
  if (ownEl) {
    if (own && enabled) void ownEl.play().catch(() => undefined);
    else ownEl.pause();
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function closeDb(db: IDBDatabase | null): void {
  try {
    db?.close();
  } catch {
    /* ignore */
  }
}

async function idbPutKey(key: string, value: unknown): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  try {
    return await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } finally {
    closeDb(db);
  }
}

async function idbGetKey<T>(key: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  try {
    return await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } finally {
    closeDb(db);
  }
}

async function idbDelKey(key: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } finally {
    closeDb(db);
  }
}

async function idbPut(value: unknown): Promise<void> {
  await idbPutKey(TRACK_KEY, value);
}

async function idbGet(): Promise<{ name: string; type: string; blob: Blob } | null> {
  const v = await idbGetKey<{ name?: string; type?: string; blob?: Blob }>(TRACK_KEY);
  if (v?.blob instanceof Blob) {
    return { name: v.name ?? "track", type: v.type ?? v.blob.type, blob: v.blob };
  }
  return null;
}

async function idbDel(): Promise<void> {
  await idbDelKey(TRACK_KEY);
}

type PlaylistMeta = { ids: string[]; names: string[]; index: number };
type StoredTrack = { id: string; name: string; type: string; blob: Blob };

function newTrackId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

async function saveMeta(): Promise<void> {
  const meta: PlaylistMeta = {
    ids: playlist.map((t) => t.id),
    names: playlist.map((t) => t.name),
    index: playIndex,
  };
  await idbPutKey(META_KEY, meta);
}

async function loadCurrentBlob(): Promise<void> {
  const entry = playlist[playIndex];
  if (!entry) {
    if (ownEl) {
      ownEl.pause();
      ownEl.removeAttribute("src");
      ownEl.load();
    }
    persistOwnName("");
    return;
  }
  const stored = await idbGetKey<StoredTrack>(TRACK_PREFIX + entry.id);
  if (!stored?.blob) return;
  attachBlob(stored.blob, stored.name || entry.name);
}

function graph(): void {
  const audio = ensureCtx();
  if (!audio || master) return;
  master = audio.createGain();
  master.gain.value = 0;
  master.connect(audio.destination);

  cosmosGain = audio.createGain();
  cosmosGain.gain.value = source === "cosmos" ? 1 : 0;
  cosmosGain.connect(master);

  ownGain = audio.createGain();
  ownGain.gain.value = source === "own" ? 1 : 0;
  ownGain.connect(master);

  delay = audio.createDelay(1.8);
  delay.delayTime.value = 0.42;
  delayFilter = audio.createBiquadFilter();
  delayFilter.type = "lowpass";
  delayFilter.frequency.value = 2400;
  delayGain = audio.createGain();
  delayGain.gain.value = 0.16;
  cosmosGain.connect(delay);
  delay.connect(delayFilter);
  delayFilter.connect(delayGain);
  delayGain.connect(delay);
  delayGain.connect(cosmosGain);
}

function stopVoices(): void {
  for (const v of voices) {
    try {
      v.osc.stop();
      v.osc.disconnect();
      v.gain.disconnect();
      v.filter.disconnect();
    } catch {
      /* already stopped */
    }
  }
  voices = [];
  playing = false;
  if (sparkleTimer) {
    window.clearTimeout(sparkleTimer);
    sparkleTimer = 0;
  }
  if (sparkleEcho) {
    window.clearTimeout(sparkleEcho);
    sparkleEcho = 0;
  }
  if (chordTimer) {
    window.clearInterval(chordTimer);
    chordTimer = 0;
  }
}

function chordTones(params: UniverseParams, index: number): number[] {
  const root = rootMidi(params);
  return DORIAN[index % DORIAN.length].map((semi) => midi(root + semi));
}

function ensureVoices(params: UniverseParams): void {
  const audio = ensureCtx();
  if (!audio || !cosmosGain) return;
  if (voices.length === 5) {
    glide(params, chordIndex);
    playing = true;
    emitStatus();
    return;
  }
  stopVoices();
  const freqs = chordTones(params, 0);
  freqs.forEach((freq, i) => {
    const osc = audio.createOscillator();
    osc.type = i === 0 ? "sine" : i % 2 === 0 ? "triangle" : "sine";
    osc.frequency.value = freq * (i === 3 ? 1.003 : i === 4 ? 0.997 : 1);
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420 + params.matter * 900;
    filter.Q.value = 0.7;
    const gain = audio.createGain();
    const amp = i === 0 ? 0.13 : 0.065 / Math.sqrt(i);
    gain.gain.value = amp;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(cosmosGain!);
    osc.start();
    voices.push({ osc, gain, filter });
  });
  playing = true;
  scheduleSparkle(params);
  const period = 9800 + params.expansion * 2800;
  chordTimer = window.setInterval(() => {
    chordIndex = (chordIndex + 1) % DORIAN.length;
    if (lastParams) glide(lastParams, chordIndex);
  }, period);
  emitStatus();
}

function glide(params: UniverseParams, index: number): void {
  if (!ctx || voices.length === 0) return;
  const t = ctx.currentTime;
  const freqs = chordTones(params, index);
  voices.forEach((v, i) => {
    const f = freqs[i] * (i === 3 ? 1.003 : i === 4 ? 0.997 : 1);
    v.osc.frequency.setTargetAtTime(f, t, 1.1);
    v.filter.frequency.setTargetAtTime(420 + params.matter * 900, t, 0.6);
  });
  if (delay) delay.delayTime.setTargetAtTime(0.34 + params.expansion * 0.22, t, 0.5);
}

function pluck(freq: number, params: UniverseParams): void {
  const audio = ctx;
  if (!audio || !cosmosGain || audio.state !== "running") return;
  const osc = audio.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1100 + params.complexity * 900;
  const gain = audio.createGain();
  const t = audio.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.016 + params.quantumNoise * 0.008, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0008, t + 2.4);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(cosmosGain);
  osc.start(t);
  osc.stop(t + 2.5);
  osc.onended = () => {
    try {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    } catch {
      /* ignore */
    }
  };
}

function scheduleSparkle(params: UniverseParams): void {
  if (sparkleTimer) window.clearTimeout(sparkleTimer);
  if (sparkleEcho) {
    window.clearTimeout(sparkleEcho);
    sparkleEcho = 0;
  }
  const tick = () => {
    if (!enabled || source !== "cosmos" || !playing) return;
    const p = lastParams ?? params;
    const tones = chordTones(p, chordIndex);
    const pick = tones[1 + Math.floor(Math.random() * Math.min(4, tones.length - 1))];
    pluck(pick * 2, p);
    if (Math.random() > 0.82) {
      sparkleEcho = window.setTimeout(() => pluck(pick * 3, p), 280 + Math.random() * 240);
    }
    const wait = 4200 + p.expansion * 2800 + Math.random() * 3600;
    sparkleTimer = window.setTimeout(tick, wait);
  };
  sparkleTimer = window.setTimeout(tick, 2800);
}

function wireOwnElement(): void {
  const audio = ensureCtx();
  if (!audio || !ownGain || !ownEl || wiredOwn) return;
  try {
    ownNode = audio.createMediaElementSource(ownEl);
    ownNode.connect(ownGain);
    wiredOwn = true;
  } catch {
    /* already connected in this document */
  }
}

function attachBlob(blob: Blob, name: string): void {
  if (ownObjectUrl) URL.revokeObjectURL(ownObjectUrl);
  ownObjectUrl = URL.createObjectURL(blob);
  if (!ownEl) {
    ownEl = new Audio();
    ownEl.preload = "auto";
    ownEl.crossOrigin = "anonymous";
    ownEl.addEventListener("ended", () => {
      void advancePlaylist();
    });
  }
  ownEl.loop = playlist.length <= 1;
  ownEl.src = ownObjectUrl;
  persistOwnName(name);
  wireOwnElement();
}

async function advancePlaylist(): Promise<void> {
  if (playlist.length <= 1) return;
  playIndex = nextPlayIndex(playlist.length, playIndex);
  await saveMeta();
  await loadCurrentBlob();
  if (enabled && source === "own" && ownEl) {
    void ownEl.play().catch(() => undefined);
  }
}

export async function addOwnTracks(files: Iterable<File>): Promise<number> {
  const list = [...files].filter((file) => file.size > 0);
  if (!list.length) return 0;
  const wasEmpty = playlist.length === 0;
  let added = 0;
  for (const file of list) {
    const id = newTrackId();
    const ok = await idbPutKey(TRACK_PREFIX + id, {
      id,
      name: file.name,
      type: file.type,
      blob: file,
    } satisfies StoredTrack);
    if (!ok) continue;
    playlist = [...playlist, { id, name: file.name }];
    added += 1;
  }
  if (!added) return 0;
  if (wasEmpty) playIndex = 0;
  await saveMeta();
  persistMusicSource("own");
  if (wasEmpty) await loadCurrentBlob();
  else if (ownEl) ownEl.loop = playlist.length <= 1;
  persistOwnName(playlist[playIndex]?.name ?? "");
  return added;
}

export async function setOwnTrack(file: File): Promise<void> {
  await addOwnTracks([file]);
}

export async function playOwnTrack(id: string): Promise<void> {
  const index = playlist.findIndex((t) => t.id === id);
  if (index < 0) return;
  playIndex = index;
  await saveMeta();
  await loadCurrentBlob();
  persistMusicSource("own");
  if (enabled && ownEl) void ownEl.play().catch(() => undefined);
}

export async function removeOwnTrack(id: string): Promise<void> {
  const index = playlist.findIndex((t) => t.id === id);
  if (index < 0) return;
  const wasCurrent = index === playIndex;
  playlist = playlist.filter((t) => t.id !== id);
  await idbDelKey(TRACK_PREFIX + id);
  if (!playlist.length) {
    playIndex = 0;
    await saveMeta();
    await clearOwnTrack();
    return;
  }
  if (index < playIndex) playIndex -= 1;
  else if (wasCurrent) playIndex = playIndex % playlist.length;
  await saveMeta();
  if (wasCurrent) await loadCurrentBlob();
  else if (ownEl) ownEl.loop = playlist.length <= 1;
  persistOwnName(playlist[playIndex]?.name ?? "");
}

export async function clearOwnTrack(): Promise<void> {
  if (ownEl) {
    ownEl.pause();
    ownEl.removeAttribute("src");
    ownEl.load();
  }
  if (ownObjectUrl) {
    URL.revokeObjectURL(ownObjectUrl);
    ownObjectUrl = null;
  }
  const ids = playlist.map((t) => t.id);
  playlist = [];
  playIndex = 0;
  persistOwnName("");
  await Promise.all(ids.map((id) => idbDelKey(TRACK_PREFIX + id)));
  await idbDelKey(META_KEY);
  await idbDel();
  persistMusicSource("cosmos");
}

export async function restoreOwnTrack(): Promise<string> {
  ownName = loadOwnTrackName();
  source = loadMusicSource();
  volume = loadMusicVolume();
  const meta = await idbGetKey<PlaylistMeta>(META_KEY);
  if (meta?.ids?.length) {
    playlist = meta.ids.map((id, i) => ({ id, name: meta.names?.[i] || id }));
    playIndex = Math.min(Math.max(0, meta.index | 0), playlist.length - 1);
    await loadCurrentBlob();
    return ownName;
  }
  const stored = await idbGet();
  if (stored) {
    const id = newTrackId();
    const ok = await idbPutKey(TRACK_PREFIX + id, {
      id,
      name: stored.name,
      type: stored.type,
      blob: stored.blob,
    } satisfies StoredTrack);
    if (ok) {
      playlist = [{ id, name: stored.name }];
      playIndex = 0;
      await saveMeta();
      await idbDel();
      attachBlob(stored.blob, stored.name);
      return ownName;
    }
  }
  if (source === "own") persistMusicSource("cosmos");
  return ownName;
}

/** Remember prefs + last sky without creating an AudioContext (must wait for a gesture). */
export function primeAudio(params: UniverseParams): void {
  enabled = loadSoundPref();
  source = loadMusicSource();
  volume = loadMusicVolume();
  lastParams = params;
  emitStatus();
}

/**
 * Create/resume the context and start voices in the SAME turn as a user gesture.
 * Do not await before resume() — iOS drops the activation.
 */
export function unlockAndStart(params?: UniverseParams): void {
  if (params) lastParams = params;
  if (ctx?.state === "running" && playing && enabled && voices.length === 5) {
    emitStatus();
    return;
  }
  const audio = ensureCtx();
  if (!audio) return;
  graph();
  kickSilent(audio);
  if (audio.state === "suspended") void audio.resume();
  if (enabled && lastParams) {
    ensureVoices(lastParams);
    applyMix();
    applyMaster();
    if (source === "own" && ownEl) void ownEl.play().catch(() => undefined);
  }
  emitStatus();
}

export async function setSoundscape(on: boolean, params: UniverseParams): Promise<void> {
  persistSound(on);
  lastParams = params;
  if (!on) {
    applyMaster();
    applyMix();
    if (ownEl) ownEl.pause();
    emitStatus();
    return;
  }
  unlockAndStart(params);
  const audio = ctx;
  if (audio && audio.state === "suspended") {
    try {
      await audio.resume();
    } catch {
      /* voices are already wired; a later tap will resume */
    }
    if (enabled && lastParams) {
      ensureVoices(lastParams);
      applyMix();
      applyMaster();
    }
    emitStatus();
  }
}

export function retuneSoundscape(params: UniverseParams): void {
  lastParams = params;
  if (!enabled || !playing) return;
  glide(params, chordIndex);
}

export function nudgeSoundscape(params: UniverseParams): void {
  lastParams = params;
  if (!enabled) return;
  unlockAndStart(params);
}

export function unlockAudio(): void {
  unlockAndStart();
}

/** Pause the graph without writing the mute pref (unmount / HMR). */
export function releaseAudio(): void {
  if (ownEl) ownEl.pause();
  if (master && ctx) {
    try {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
    } catch {
      /* ignore */
    }
  }
  stopVoices();
  emitStatus();
}

export function stopSoundscape(): void {
  persistSound(false);
  applyMaster();
  applyMix();
  if (ownEl) ownEl.pause();
  emitStatus();
}

/** Quiet blip for easter eggs. No-op if the sky is muted. */
export function pingEgg(): void {
  if (!enabled) return;
  const audio = ensureCtx();
  if (!audio || audio.state !== "running") return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const peak = 0.018;
    osc.type = "sine";
    osc.frequency.setValueAtTime(622.25, t);
    osc.frequency.exponentialRampToValueAtTime(311.13, t + 0.2);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peak, t + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.32);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.34);
  } catch {
    /* exponentialRamp throws on 0 — never block the joke */
  }
}

/** Call-and-return chirp: a signal out, a faint reply. Quieter than pingEgg. */
export function pingSignal(): void {
  if (!enabled) return;
  const audio = ensureCtx();
  if (!audio || audio.state !== "running") return;
  try {
    const t0 = audio.currentTime;
    const blip = (t: number, hz: number, peak: number, hold: number) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(hz, t);
      gain.gain.setValueAtTime(0.0008, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + hold);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t);
      osc.stop(t + hold + 0.02);
    };
    blip(t0, 740, 0.012, 0.16);
    blip(t0 + 0.28, 494, 0.009, 0.22);
  } catch {
    /* a missed chirp is not a missed joke */
  }
}

export function pingBirth(): void {
  pingImpact("void");
}

/** Birth chord. Life is brighter; the void drops; a rip bites. */
export function pingImpact(kind: "life" | "void" | "end" = "void"): void {
  if (!enabled) return;
  const audio = ensureCtx();
  if (!audio || audio.state !== "running") return;
  try {
    const t = audio.currentTime;
    const triad =
      kind === "life"
        ? [196, 246.94, 329.63]
        : kind === "end"
          ? [98, 116.54, 73.42]
          : [130.81, 155.56, 196];
    const peak0 = kind === "life" ? 0.038 : kind === "end" ? 0.03 : 0.022;
    triad.forEach((hz, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = kind === "end" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(hz, t);
      const peak = peak0 - i * 0.006;
      const start = t + i * 0.045;
      gain.gain.setValueAtTime(0.0008, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + (kind === "life" ? 0.9 : 0.55));
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(start);
      osc.stop(start + 1);
    });
  } catch {
    /* a missed chord is not a missed sky */
  }
}

/** Catching a blink in the disk. */
export function pingContact(): void {
  if (!enabled) return;
  const audio = ensureCtx();
  if (!audio || audio.state !== "running") return;
  try {
    const t = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.28);
    gain.gain.setValueAtTime(0.0008, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.36);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.38);
  } catch {
    /* never block the catch */
  }
}
