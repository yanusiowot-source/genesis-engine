import { intelligenceWindow } from "./civilization.ts";
import { buildGalaxy, type GalaxyModel } from "./galaxy.ts";
import type { Evaluation, UniverseParams } from "./types.ts";

export type SkyBuild = { model: GalaxyModel; ships: number };

type WorkerOk = { id: number; ok: true; result: SkyBuild };
type WorkerErr = { id: number; ok: false; error: string };

let worker: Worker | null = null;
let seq = 1;
const pending = new Map<number, { resolve: (v: SkyBuild) => void; reject: (e: Error) => void }>();

export function skyWorkerAvailable(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

function getWorker(): Worker | null {
  if (!skyWorkerAvailable()) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./sky-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerOk | WorkerErr>) => {
      const msg = event.data;
      const slot = pending.get(msg.id);
      if (!slot) return;
      pending.delete(msg.id);
      if (msg.ok) slot.resolve(msg.result);
      else slot.reject(new Error(msg.error));
    };
    worker.onerror = () => {
      const err = new Error("sky-worker");
      for (const [, slot] of pending) slot.reject(err);
      pending.clear();
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    worker = null;
    return null;
  }
}

export function buildGalaxyNow(
  params: UniverseParams,
  evaluation: Evaluation,
  seed: number,
  quality = 1,
): SkyBuild {
  return {
    model: buildGalaxy(params, evaluation, seed, quality),
    ships: intelligenceWindow(params, evaluation).ships,
  };
}

export async function buildGalaxyAsync(
  params: UniverseParams,
  evaluation: Evaluation,
  seed: number,
  quality = 1,
): Promise<SkyBuild> {
  const w = getWorker();
  if (!w) return buildGalaxyNow(params, evaluation, seed, quality);
  const id = seq++;
  return new Promise<SkyBuild>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error("timeout"));
    }, 12_000);
    pending.set(id, {
      resolve: (v) => {
        window.clearTimeout(timer);
        resolve(v);
      },
      reject: (e) => {
        window.clearTimeout(timer);
        reject(e);
      },
    });
    w.postMessage({ id, op: "galaxy", params, evaluation, seed, quality });
  });
}
