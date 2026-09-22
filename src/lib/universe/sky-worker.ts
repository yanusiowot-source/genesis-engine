import { intelligenceWindow } from "./civilization.ts";
import { buildGalaxy } from "./galaxy.ts";
import { bootNfwWasm } from "./nfw-wasm.ts";
import type { Evaluation, UniverseParams } from "./types.ts";

void bootNfwWasm();

type Request = {
  id: number;
  op: "galaxy";
  params: UniverseParams;
  evaluation: Evaluation;
  seed: number;
  quality: number;
};

function reply(payload: unknown) {
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(payload);
}

self.onmessage = (event: MessageEvent<Request>) => {
  const msg = event.data;
  try {
    if (msg.op !== "galaxy") {
      reply({ id: msg.id, ok: false, error: "unknown op" });
      return;
    }
    const model = buildGalaxy(msg.params, msg.evaluation, msg.seed, msg.quality);
    const ships = intelligenceWindow(msg.params, msg.evaluation).ships;
    reply({ id: msg.id, ok: true, result: { model, ships } });
  } catch (err) {
    reply({
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : "Sky worker failed.",
    });
  }
};
