import { OUR_SEED, evaluate, isOurParams, snapParams } from "./physics.ts";
import type { UniverseRecord } from "./types.ts";

const KEY = "genesis-engine-archive-v1";
const DB_NAME = "genesis-engine";
const STORE = "kv";
const LIMIT = 32;
let idbReadable = false;
let saveGen = 0;

function revive(record: UniverseRecord): UniverseRecord {
  const params = snapParams(record.params);
  return {
    ...record,
    params,
    evaluation: evaluate(params),
  };
}

function parseList(raw: unknown): UniverseRecord[] {
  if (!Array.isArray(raw)) return [];
  return sortArchive((raw as UniverseRecord[]).map(revive));
}

function loadLocal(): UniverseRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return parseList(JSON.parse(raw));
  } catch {
    return [];
  }
}

function saveLocal(records: UniverseRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(records.slice(0, LIMIT + 8)));
  } catch {
    /* quota */
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const done = (db: IDBDatabase | null) => {
      if (settled) return;
      settled = true;
      resolve(db);
    };
    const timer = setTimeout(() => done(null), 1600);
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => {
        clearTimeout(timer);
        done(req.result);
      };
      req.onerror = () => {
        clearTimeout(timer);
        done(null);
      };
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });
}

function idbGetRaw(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

function idbSetRaw(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function idbGet(db: IDBDatabase): Promise<UniverseRecord[] | null> {
  return idbGetRaw(db, KEY).then((raw) =>
    raw === undefined ? null : parseList(raw),
  );
}

function idbSet(db: IDBDatabase, records: UniverseRecord[]): Promise<void> {
  return idbSetRaw(db, KEY, records);
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  const raw = await idbGetRaw(db, key);
  db.close();
  if (raw === undefined || raw === null) return null;
  return raw as T;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await idbSetRaw(db, key, value);
  db.close();
}

export async function loadArchive(): Promise<UniverseRecord[]> {
  const db = await openDb();
  if (db) {
    const fromIdb = await idbGet(db);
    db.close();
    if (fromIdb !== null) {
      idbReadable = true;
      if (fromIdb.length > 0) return fromIdb;
    }
  }
  const fromLs = loadLocal();
  if (fromLs.length > 0) {
    const migrated = await openDb();
    if (migrated) {
      idbReadable = true;
      await idbSet(migrated, fromLs);
      migrated.close();
    }
  }
  return fromLs;
}

export async function saveArchive(records: UniverseRecord[]): Promise<void> {
  const next = sortArchive(records);
  saveLocal(next);
  const gen = ++saveGen;
  if (!idbReadable) {
    const probe = await openDb();
    if (!probe) return;
    const existing = await idbGet(probe);
    if (existing === null) {
      probe.close();
      return;
    }
    idbReadable = true;
    if (gen !== saveGen) {
      probe.close();
      return;
    }
    await idbSet(probe, next);
    probe.close();
    return;
  }
  const db = await openDb();
  if (!db) return;
  if (gen !== saveGen) {
    db.close();
    return;
  }
  await idbSet(db, next);
  db.close();
}

export function sortArchive(records: UniverseRecord[]): UniverseRecord[] {
  const starred = records.filter((r) => r.starred);
  const rest = records.filter((r) => !r.starred);
  return [...starred, ...rest];
}

export function upsertArchive(
  records: UniverseRecord[],
  next: UniverseRecord,
): UniverseRecord[] {
  const prev = records.find((r) => r.id === next.id);
  const merged: UniverseRecord = {
    ...next,
    starred: next.starred ?? prev?.starred,
    chronicle: next.chronicle ?? prev?.chronicle,
  };
  const without = records.filter((r) => r.id !== next.id);
  const trimmed = isLivingDraft(merged)
    ? without.filter((r) => !(isLivingDraft(r) && r.visualSeed === merged.visualSeed))
    : without;
  const combined = [merged, ...trimmed];
  const starred = combined.filter((r) => r.starred);
  const rest = combined.filter((r) => !r.starred);
  const room = Math.max(0, LIMIT - starred.length);
  return [...starred, ...rest.slice(0, room)];
}

/** Unpinned plate of a birth — sculpting replaces it. Home furniture and stars stay. */
function isLivingDraft(record: UniverseRecord): boolean {
  if (record.starred || record.chronicle) return false;
  if (record.visualSeed === OUR_SEED && isOurParams(record.params)) return false;
  return true;
}

export type PlatePath = "carbon" | "silicon" | "eternal" | "swarm" | "none";

export type PlateScore = { value: number; path: PlatePath };

/** Strongest open envelope on a plate — four corridors, not three. */
export function plateScore(record: UniverseRecord): PlateScore {
  const a = record.evaluation.lifeProb;
  const b = record.evaluation.siliconProb ?? 0;
  const e = record.evaluation.eternalProb ?? 0;
  const s = record.evaluation.swarmProb ?? 0;
  const value = Math.max(a, b, e, s);
  if (value < 0.18) return { value, path: "none" };
  if (s >= a && s >= b && s >= e) return { value, path: "swarm" };
  if (e >= a && e >= b) return { value, path: "eternal" };
  if (b > a) return { value, path: "silicon" };
  return { value, path: "carbon" };
}

export function removeFromArchive(
  records: UniverseRecord[],
  id: string,
): UniverseRecord[] {
  return records.filter((r) => r.id !== id);
}

export function toggleStar(
  records: UniverseRecord[],
  id: string,
): UniverseRecord[] {
  return sortArchive(
    records.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r)),
  );
}

export function isViable(record: UniverseRecord): boolean {
  return (
    record.evaluation.lifeProb >= 0.18 ||
    record.evaluation.siliconProb >= 0.18 ||
    record.evaluation.eternalProb >= 0.18 ||
    (record.evaluation.swarmProb ?? 0) >= 0.18
  );
}
