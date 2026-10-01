import type { UniverseParams } from "./types";

export {
  DEFAULT_MUSIC_VOLUME,
  loadMusicSource,
  loadMusicVolume,
  loadOwnTrackName,
  loadSoundPref,
  type MusicSource,
  type PlaylistEntry,
} from "./audio-prefs.ts";

type Engine = typeof import("./audio.ts");

let mod: Engine | null = null;
let wait: Promise<Engine> | null = null;
let pendingUnlock = false;
let pendingParams: UniverseParams | undefined;
type PendingPing =
  | { kind: "egg" }
  | { kind: "signal" }
  | { kind: "birth" }
  | { kind: "impact"; impact: "life" | "void" | "end" }
  | { kind: "contact" };
let pendingPing: PendingPing | null = null;

function playPing(loaded: Engine, ping: PendingPing) {
  if (ping.kind === "egg") loaded.pingEgg();
  else if (ping.kind === "signal") loaded.pingSignal();
  else if (ping.kind === "birth") loaded.pingBirth();
  else if (ping.kind === "impact") loaded.pingImpact(ping.impact);
  else loaded.pingContact();
}

function boot(): Promise<Engine> {
  if (!wait) {
    wait = import("./audio.ts").then((loaded) => {
      mod = loaded;
      if (pendingUnlock) {
        const params = pendingParams;
        pendingUnlock = false;
        pendingParams = undefined;
        loaded.unlockAndStart(params);
      }
      if (pendingPing) {
        const ping = pendingPing;
        pendingPing = null;
        playPing(loaded, ping);
      }
      return loaded;
    });
  }
  return wait;
}

// Start the engine chunk when this gate evaluates. Resume stays synchronous
// once the chunk is here: iOS drops audio that awaits inside a gesture.
void boot();

export function primeAudio(params: UniverseParams): void {
  if (mod) {
    mod.primeAudio(params);
    return;
  }
  void boot().then((loaded) => loaded.primeAudio(params));
}

export function unlockAndStart(params?: UniverseParams): void {
  if (mod) {
    mod.unlockAndStart(params);
    return;
  }
  pendingUnlock = true;
  if (params) pendingParams = params;
  void boot();
}

export function retuneSoundscape(params: UniverseParams): void {
  if (mod) {
    mod.retuneSoundscape(params);
    return;
  }
  void boot().then((loaded) => loaded.retuneSoundscape(params));
}

export function nudgeSoundscape(params: UniverseParams): void {
  if (mod) {
    mod.nudgeSoundscape(params);
    return;
  }
  void boot().then((loaded) => loaded.nudgeSoundscape(params));
}

function rememberPing(ping: PendingPing) {
  if (mod) {
    playPing(mod, ping);
    return;
  }
  pendingPing = ping;
  void boot();
}

export function releaseAudio(): void {
  if (!mod) return;
  mod.releaseAudio();
}

export function pingEgg(): void {
  rememberPing({ kind: "egg" });
}

export function pingSignal(): void {
  rememberPing({ kind: "signal" });
}

export function pingBirth(): void {
  rememberPing({ kind: "birth" });
}

export function pingImpact(kind: "life" | "void" | "end" = "void"): void {
  rememberPing({ kind: "impact", impact: kind });
}

export function pingContact(): void {
  rememberPing({ kind: "contact" });
}

export function persistMusicSource(next: "cosmos" | "own"): void {
  if (mod) {
    mod.persistMusicSource(next);
    return;
  }
  void boot().then((loaded) => loaded.persistMusicSource(next));
}

export function persistMusicVolume(next: number): void {
  if (mod) {
    mod.persistMusicVolume(next);
    return;
  }
  void boot().then((loaded) => loaded.persistMusicVolume(next));
}

export function setSoundscape(on: boolean, params: UniverseParams): Promise<void> {
  if (mod) return mod.setSoundscape(on, params);
  return boot().then((loaded) => loaded.setSoundscape(on, params));
}

export function restoreOwnTrack(): Promise<string> {
  return boot().then((loaded) => loaded.restoreOwnTrack());
}

export function addOwnTracks(files: Iterable<File>): Promise<number> {
  return boot().then((loaded) => loaded.addOwnTracks(files));
}

export function playOwnTrack(id: string): Promise<void> {
  return boot().then((loaded) => loaded.playOwnTrack(id));
}

export function removeOwnTrack(id: string): Promise<void> {
  return boot().then((loaded) => loaded.removeOwnTrack(id));
}

export function clearOwnTrack(): Promise<void> {
  return boot().then((loaded) => loaded.clearOwnTrack());
}

export function getOwnPlaylist() {
  return mod ? mod.getOwnPlaylist() : [];
}

export function getOwnTrackName(): string {
  return mod ? mod.getOwnTrackName() : "";
}

export function getPlayIndex(): number {
  return mod ? mod.getPlayIndex() : 0;
}

export function subscribeAudioStatus(
  fn: (status: { wanted: boolean; live: boolean; state: AudioContextState | "idle" }) => void,
): () => void {
  let unsub = () => {};
  let dead = false;
  if (mod) return mod.subscribeAudioStatus(fn);
  void boot().then((loaded) => {
    if (dead) return;
    unsub = loaded.subscribeAudioStatus(fn);
  });
  return () => {
    dead = true;
    unsub();
  };
}
