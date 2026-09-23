import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ATLAS_N,
  FATE_ORDER,
  MANDATE_COUNT,
  MANDATE_IDS,
  actOf,
  bootstrap,
  bootstrapLab,
  emptyMandate,
  formatAtlasTick,
  isComplete,
  isIdleHome,
  missingFates,
  nextOpen,
  observe,
  parseMandate,
  sealedCount,

} from "./mandate.ts";
import { intelligenceWindow } from "./civilization.ts";
import {
  DESERT_EPOCH,
  ETERNAL_CORRIDOR,
  OUR_SEED,
  OUR_UNIVERSE,
  SILICON_CORRIDOR,
  SWARM_CORRIDOR,
  evaluate,
} from "./physics.ts";
import { catalogId, hashParams } from "./rng.ts";
import type { Fate, UniverseParams, UniverseRecord } from "./types.ts";
import { copyFor } from "./i18n.ts";

function recordOf(params: UniverseParams, seed = 1, extra: Partial<UniverseRecord> = {}): UniverseRecord {
  const evaluation = evaluate(params);
  const id = hashParams(params, seed);
  return {
    id,
    catalog: catalogId(id),
    name: "Test sky",
    visualSeed: seed,
    params,
    evaluation,
    createdAt: 1,
    ...extra,
  };
}

describe("mandate", () => {
  it("starts empty and names the thesis chapters", () => {
    const p = emptyMandate();
    assert.equal(MANDATE_IDS.length, 15);
    assert.equal(MANDATE_COUNT, 15);
    assert.equal(sealedCount(p), 0);
    assert.equal(nextOpen(p), "witness");
    assert.equal(isComplete(p), false);
    assert.equal(actOf("silicon"), "silicon");
    assert.equal(actOf("tide"), "tide");
    assert.equal(actOf("keep"), "star");
    assert.equal(actOf("core"), "survey");
    assert.equal(actOf("ring"), "survey");
  });

  it("seals home corridor diaspora on ΛCDM and leaves the other corridors open", () => {
    const ours = recordOf(OUR_UNIVERSE, OUR_SEED);
    const civ = intelligenceWindow(ours.params, ours.evaluation);
    const { progress, sealed } = observe(emptyMandate(), { record: ours, civ, event: "see" });
    assert.ok(sealed.includes("witness"));
    assert.ok(sealed.includes("home"));
    assert.ok(sealed.includes("corridor"));
    assert.equal(ours.evaluation.fate, "habitable");
    assert.ok(civ.ships >= 0.05);
    assert.ok(progress.sealed.diaspora);
    assert.equal(progress.sealed.silicon, undefined);
    assert.equal(progress.sealed.eternal, undefined);
    assert.equal(progress.sealed.atlas, undefined);
    assert.equal(progress.sealed.chronicle, undefined);
    assert.equal(progress.sealed.keep, undefined);
    assert.equal(progress.sealed.core, undefined);
    assert.equal(progress.sealed.toomre, undefined);
    assert.equal(progress.sealed.peak, undefined);
    assert.equal(progress.sealed.engine, undefined);
    assert.equal(progress.sealed.ring, undefined);
    assert.equal(nextOpen(progress), "silicon");
  });

  it("seals silicon on the silicon corridor and eternal on the Dyson corridor", () => {
    const si = recordOf(SILICON_CORRIDOR, 7);
    const siCiv = intelligenceWindow(si.params, si.evaluation);
    const afterSi = observe(emptyMandate(), { record: si, civ: siCiv, event: "see" }).progress;
    assert.ok(afterSi.sealed.silicon);
    assert.ok(si.evaluation.siliconNiche === "viable" || si.evaluation.siliconNiche === "favored");

    const et = recordOf(ETERNAL_CORRIDOR, 8);
    const etCiv = intelligenceWindow(et.params, et.evaluation);
    const afterEt = observe(emptyMandate(), { record: et, civ: etCiv, event: "see" }).progress;
    assert.ok(afterEt.sealed.eternal);
    assert.ok(
      et.evaluation.eternalNiche === "glimpse" ||
        et.evaluation.eternalNiche === "open" ||
        et.evaluation.eternalNiche === "dyson",
    );

    const sw = recordOf(SWARM_CORRIDOR, 9);
    const swCiv = intelligenceWindow(sw.params, sw.evaluation);
    const afterSw = observe(emptyMandate(), { record: sw, civ: swCiv, event: "see" }).progress;
    assert.ok(afterSw.sealed.tide);
    assert.ok(sw.evaluation.swarmNiche === "bloom" || sw.evaluation.swarmNiche === "tide");
  });

  it("does not treat a desert as a corridor or a diaspora", () => {
    const desert = recordOf(DESERT_EPOCH, 3);
    const civ = intelligenceWindow(desert.params, desert.evaluation);
    const { progress } = observe(emptyMandate(), { record: desert, civ, event: "birth" });
    assert.ok(progress.sealed.witness);
    assert.equal(progress.sealed.corridor, undefined);
    assert.equal(progress.sealed.diaspora, undefined);
    assert.equal(progress.births, 1);
  });

  it("seals atlas after five distinct fates, chronicle and keep on explicit acts", () => {
    const fates: Fate[] = ["void", "crunch", "rip", "flash", "fog"];
    assert.equal(fates.length, ATLAS_N);
    let p = emptyMandate();
    for (const fate of fates) {
      const rec = recordOf(DESERT_EPOCH, fates.indexOf(fate) + 1);
      rec.evaluation = { ...rec.evaluation, fate };
      p = observe(p, {
        record: rec,
        civ: intelligenceWindow(rec.params, rec.evaluation),
        event: "birth",
      }).progress;
    }
    assert.ok(p.sealed.atlas);
    assert.equal(p.fates.length >= ATLAS_N, true);

    const note = recordOf(OUR_UNIVERSE, 11, { chronicle: "A field note." });
    const afterNote = observe(p, {
      record: note,
      civ: intelligenceWindow(note.params, note.evaluation),
      event: "chronicle",
    }).progress;
    assert.ok(afterNote.sealed.chronicle);

    const starred = recordOf(OUR_UNIVERSE, 12, { starred: true });
    const afterStar = observe(afterNote, {
      record: starred,
      civ: intelligenceWindow(starred.params, starred.evaluation),
      event: "star",
    }).progress;
    assert.ok(afterStar.sealed.keep);
  });

  it("bootstraps from an archive without double-counting", () => {
    const ours = recordOf(OUR_UNIVERSE, OUR_SEED, { starred: true, chronicle: "Kept." });
    const si = recordOf(SILICON_CORRIDOR, 2);
    const civ = intelligenceWindow(ours.params, ours.evaluation);
    const p = bootstrap(emptyMandate(), [ours, si, ours], ours, civ);
    assert.ok(p.sealed.home);
    assert.ok(p.sealed.silicon);
    assert.ok(p.sealed.keep);
    assert.ok(p.sealed.chronicle);
    const again = bootstrap(p, [ours, si], ours, civ);
    assert.equal(sealedCount(again), sealedCount(p));
  });

  it("is idempotent and parses junk as empty", () => {
    const ours = recordOf(OUR_UNIVERSE, OUR_SEED);
    const civ = intelligenceWindow(ours.params, ours.evaluation);
    const first = observe(emptyMandate(), { record: ours, civ, event: "see" });
    assert.equal(first.addedFate, ours.evaluation.fate);
    const second = observe(first.progress, { record: ours, civ, event: "see" });
    assert.equal(second.progress, first.progress);
    assert.equal(second.sealed.length, 0);
    assert.equal(second.addedFate, null);
    assert.equal(sealedCount(parseMandate(null)), 0);
    assert.equal(sealedCount(parseMandate({ v: 1, sealed: { witness: "no" } })), 0);
  });

  it("keeps copy honest — thesis, not a score, not a fleet", () => {
    const en = copyFor("en").mandate;
    const ru = copyFor("ru").mandate;
    const be = copyFor("be").mandate;
    assert.equal(Object.keys(en.chapters).length, 15);
    assert.match(en.chapters.core.body, /coreNFW/i);
    assert.match(en.chapters.core.body, /empirical/i);
    assert.match(ru.chapters.core.body, /эмпирическ/);
    assert.doesNotMatch(en.chapters.core.body, /Burkert or coreNFW/);
    assert.match(en.chapters.toomre.body, /Toomre|Q/);
    assert.doesNotMatch(en.hint, /ten skies/i);
    assert.match(en.chapters.tide.body, /Hart/i);
    assert.match(en.title, /work/i);
    assert.match(en.hint, /not a score/);
    assert.match(en.done, /atlas is sealed/i);
    assert.match(en.chapters.diaspora.body, /not a fleet/i);
    assert.match(ru.done, /атлас/i);
    assert.match(be.done, /атлас/i);
    assert.match(ru.chapters.diaspora.body, /не флот/);
    assert.match(be.chapters.diaspora.body, /не флот/);
    assert.match(en.atlasTick, /\{fate\}/);
    assert.match(en.atlasTick, /\{n\}/);
    assert.doesNotMatch(en.hint + en.done, /census|narcotic|gang|XP|level up/i);
  });

  it("does not treat factory ΛCDM as work already done", () => {
    const home = recordOf(OUR_UNIVERSE, OUR_SEED);
    const civ = intelligenceWindow(home.params, home.evaluation);
    const idle = bootstrapLab(emptyMandate(), [home], home, civ);
    assert.equal(sealedCount(idle), 0);
    assert.equal(nextOpen(idle), "witness");
    assert.equal(isIdleHome(home), true);

    const linked = bootstrapLab(emptyMandate(), [home], home, civ, { fromLink: true });
    assert.ok(linked.sealed.home);
    assert.ok(linked.sealed.witness);

    const si = recordOf(SILICON_CORRIDOR, 2);
    const used = bootstrapLab(emptyMandate(), [home, si], home, civ);
    assert.ok(used.sealed.silicon);
    assert.equal(used.sealed.home, undefined);

    const kept = recordOf(OUR_UNIVERSE, OUR_SEED, { starred: true });
    assert.equal(isIdleHome(kept), false);
    const starred = bootstrapLab(emptyMandate(), [kept], kept, civ);
    assert.ok(starred.sealed.home);
    assert.ok(starred.sealed.keep);
  });

  it("tracks missing fates and formats an atlas tick", () => {
    const ours = recordOf(OUR_UNIVERSE, OUR_SEED);
    const civ = intelligenceWindow(ours.params, ours.evaluation);
    const { progress } = observe(emptyMandate(), { record: ours, civ, event: "see" });
    assert.ok(progress.fates.includes("habitable"));
    const missing = missingFates(progress);
    assert.ok(missing.includes("void"));
    assert.ok(!missing.includes("habitable"));
    assert.equal(missing.length + progress.fates.length, FATE_ORDER.length);
    const tick = formatAtlasTick("{fate}. Atlas {n} of {m}.", "The void", 2);
    assert.equal(tick, "The void. Atlas 2 of 5.");
    assert.equal(actOf("atlas"), "birth");
  });

  it("does not confuse ΛCDM with a cored halo or a SIS ring", () => {
    const noisy = recordOf({ ...OUR_UNIVERSE, quantumNoise: 0.7 }, 4);
    const civN = intelligenceWindow(noisy.params, noisy.evaluation);
    const core = observe(emptyMandate(), { record: noisy, civ: civN, event: "see" });
    assert.ok(core.sealed.includes("core"), "burkert/corenfw");

    const ell = recordOf({ ...OUR_UNIVERSE, matter: 1.1 }, 5);
    const civE = intelligenceWindow(ell.params, ell.evaluation);
    const { sealed } = observe(emptyMandate(), { record: ell, civ: civE, event: "see" });
    assert.ok(sealed.includes("ring") || sealed.includes("engine"));
  });
});
