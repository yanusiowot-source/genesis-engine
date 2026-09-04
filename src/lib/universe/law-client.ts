import { testHypothesis, type BayesResult, type Hypothesis } from "./bayes";
import type { ResearchTarget } from "./research";
import { discoverLaw, type DiscoveryResult } from "./symbolic";
import { runMcmc, type McmcResult } from "./mcmc";
import type { UniverseParams } from "./types";

type WorkerOk = { id: number; ok: true; result: DiscoveryResult | BayesResult | McmcResult };
type WorkerErr = { id: number; ok: false; error: string };

let worker: Worker | null = null;
let seq = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./law-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerOk | WorkerErr>) => {
      const msg = event.data;
      const slot = pending.get(msg.id);
      if (!slot) return;
      pending.delete(msg.id);
      if (msg.ok) slot.resolve(msg.result);
      else slot.reject(new Error(msg.error));
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    worker = null;
    return null;
  }
}

function callWorker<T>(payload: object, timeoutMs = 20_000): Promise<T> {
  const w = getWorker();
  if (!w) return Promise.reject(new Error("no worker"));
  const id = seq++;
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error("timeout"));
    }, timeoutMs);
    pending.set(id, {
      resolve: (v) => {
        window.clearTimeout(timer);
        resolve(v as T);
      },
      reject: (e) => {
        window.clearTimeout(timer);
        reject(e);
      },
    });
    w.postMessage({ id, ...payload });
  });
}

export async function discoverLawAsync(
  seed: number,
  target: ResearchTarget,
  n?: number,
): Promise<DiscoveryResult> {
  try {
    return await callWorker<DiscoveryResult>({ op: "discover", seed, target, n });
  } catch {
    return discoverLaw(seed, target, n);
  }
}

export async function testHypothesisAsync(
  seed: number,
  hypothesis: Hypothesis,
  n?: number,
): Promise<BayesResult> {
  try {
    return await callWorker<BayesResult>({ op: "bayes", seed, hypothesis, n });
  } catch {
    return testHypothesis(seed, hypothesis, n);
  }
}

export async function runMcmcAsync(
  seed: number,
  start: UniverseParams,
  target: ResearchTarget,
  nSteps?: number,
  burnIn?: number,
  thin?: number,
): Promise<McmcResult> {
  try {
    return await callWorker<McmcResult>(
      { op: "mcmc", seed, start, target, nSteps, burnIn, thin },
      28_000,
    );
  } catch {
    return runMcmc(seed, start, target, nSteps, burnIn, thin);
  }
}
