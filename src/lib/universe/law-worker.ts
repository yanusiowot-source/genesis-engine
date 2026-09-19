import { testHypothesis, type Hypothesis } from "./bayes.ts";
import { discoverLaw } from "./symbolic.ts";
import { runExpedition, type ResearchTarget } from "./research.ts";
import { runAdaptiveWalk, runHmc, runMcmc } from "./mcmc.ts";
import type { UniverseParams } from "./types.ts";

type Request =
  | { id: number; op: "discover"; seed: number; target: ResearchTarget; n?: number }
  | { id: number; op: "bayes"; seed: number; hypothesis: Hypothesis; n?: number }
  | {
      id: number;
      op: "mcmc";
      seed: number;
      start: UniverseParams;
      target: ResearchTarget;
      nSteps?: number;
      burnIn?: number;
      thin?: number;
      walker?: "mh" | "hmc" | "adaptive";
    }
  | {
      id: number;
      op: "expedition";
      seed: number;
      target: ResearchTarget;
      current: UniverseParams;
    };

function reply(payload: unknown) {
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(payload);
}

self.onmessage = (event: MessageEvent<Request>) => {
  const msg = event.data;
  try {
    if (msg.op === "discover") {
      reply({ id: msg.id, ok: true, result: discoverLaw(msg.seed, msg.target, msg.n) });
      return;
    }
    if (msg.op === "bayes") {
      reply({ id: msg.id, ok: true, result: testHypothesis(msg.seed, msg.hypothesis, msg.n) });
      return;
    }
    if (msg.op === "mcmc") {
      const walk =
        msg.walker === "hmc"
          ? runHmc(msg.seed, msg.start, msg.target, msg.nSteps, msg.burnIn, msg.thin)
          : msg.walker === "mh"
            ? runMcmc(msg.seed, msg.start, msg.target, msg.nSteps, msg.burnIn, msg.thin)
            : runAdaptiveWalk(msg.seed, msg.start, msg.target);
      reply({
        id: msg.id,
        ok: true,
        result: walk,
      });
      return;
    }
    if (msg.op === "expedition") {
      reply({
        id: msg.id,
        ok: true,
        result: runExpedition(msg.seed, msg.target, msg.current),
      });
    }
  } catch (err) {
    reply({
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : "Worker failed.",
    });
  }
};
