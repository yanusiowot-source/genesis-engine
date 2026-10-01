import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MUSIC_VOLUME,
  getAudioStatus,
  loadMusicVolume,
  loadSoundPref,
  nextPlayIndex,
  persistMusicVolume,
  persistSound,
  primeAudio,
} from "./audio.ts";
import { OUR_UNIVERSE } from "./physics.ts";

function mockStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
  return store;
}

describe("audio prefs", () => {
  it("keeps the engine off the first import of the app", () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const app = readFileSync(join(here, "../../components/universe-app.tsx"), "utf8");
    const gate = readFileSync(join(here, "audio-gate.ts"), "utf8");
    assert.match(app, /from "@\/lib\/universe\/audio-gate"/);
    assert.doesNotMatch(app, /from "@\/lib\/universe\/audio"/);
    assert.match(gate, /import\("\.\/audio\.ts"\)/);
    assert.doesNotMatch(gate, /from "\.\/audio\.ts"/);
  });

  it("defaults sound on when storage is empty", () => {
    mockStorage();
    assert.equal(loadSoundPref(), true);
  });

  it("round-trips the mute pref without creating an AudioContext", () => {
    mockStorage();
    persistSound(false);
    assert.equal(loadSoundPref(), false);
    assert.equal(getAudioStatus().wanted, false);
    persistSound(true);
    assert.equal(loadSoundPref(), true);
    assert.equal(getAudioStatus().wanted, true);
    assert.equal(getAudioStatus().live, false);
    assert.equal(getAudioStatus().state, "idle");
  });

  it("clamps volume and keeps the mixer idle until a gesture", () => {
    mockStorage();
    assert.equal(loadMusicVolume(), DEFAULT_MUSIC_VOLUME);
    persistMusicVolume(1.8);
    assert.equal(loadMusicVolume(), 1);
    persistMusicVolume(-4);
    assert.equal(loadMusicVolume(), 0);
    persistMusicVolume(0.5);
    assert.equal(loadMusicVolume(), 0.5);
  });

  it("primeAudio remembers the sky without opening Web Audio", () => {
    mockStorage();
    persistSound(true);
    primeAudio(OUR_UNIVERSE);
    const s = getAudioStatus();
    assert.equal(s.wanted, true);
    assert.equal(s.live, false);
    assert.equal(s.state, "idle");
  });

  it("walks a playlist without a cap", () => {
    assert.equal(nextPlayIndex(0, 0), 0);
    assert.equal(nextPlayIndex(1, 0), 0);
    assert.equal(nextPlayIndex(3, 0), 1);
    assert.equal(nextPlayIndex(3, 2), 0);
    assert.equal(nextPlayIndex(64, 63), 0);
  });
});
