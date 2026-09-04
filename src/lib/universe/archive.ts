import { evaluate, snapParams } from "./physics";
import type { UniverseRecord } from "./types";

const KEY = "genesis-engine-archive-v1";
const DB_NAME = "genesis-engine";
const STORE = "kv";
const LIMIT = 32;

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
    if (fromIdb && fromIdb.length > 0) return fromIdb;
  }
  const fromLs = loadLocal();
  if (fromLs.length > 0) {
    const migrated = await openDb();
    if (migrated) {
      await idbSet(migrated, fromLs);
      migrated.close();
    }
  }
  return fromLs;
}

export async function saveArchive(records: UniverseRecord[]): Promise<void> {
  const next = sortArchive(records);
  saveLocal(next);
  const db = await openDb();
  if (!db) return;
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
  const combined = [merged, ...without];
  const starred = combined.filter((r) => r.starred);
  const rest = combined.filter((r) => !r.starred);
  const room = Math.max(0, LIMIT - starred.length);
  return [...starred, ...rest.slice(0, room)];
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
    record.evaluation.eternalProb >= 0.18
  );
}
