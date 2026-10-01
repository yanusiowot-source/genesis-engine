export const DEFAULT_MUSIC_VOLUME = 0.38;

export const SOUND_KEY = "genesis-engine-sound-v2";
export const SOURCE_KEY = "genesis-engine-music-source";
export const VOLUME_KEY = "genesis-engine-music-volume-v3";
export const NAME_KEY = "genesis-engine-music-name";

export type MusicSource = "cosmos" | "own";
export type PlaylistEntry = { id: string; name: string };

export function loadSoundPref(): boolean {
  try {
    const v = localStorage.getItem(SOUND_KEY);
    if (v === "0") return false;
    return true;
  } catch {
    return true;
  }
}

export function loadMusicSource(): MusicSource {
  try {
    return localStorage.getItem(SOURCE_KEY) === "own" ? "own" : "cosmos";
  } catch {
    return "cosmos";
  }
}

export function loadMusicVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw == null || raw === "") return DEFAULT_MUSIC_VOLUME;
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n));
  } catch {
    /* ignore */
  }
  return DEFAULT_MUSIC_VOLUME;
}

export function loadOwnTrackName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}
