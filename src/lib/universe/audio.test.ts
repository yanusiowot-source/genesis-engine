import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_MUSIC_VOLUME,
  getAudioStatus,
  loadMusicVolume,
  loadSoundPref,
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
});
