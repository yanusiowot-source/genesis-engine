import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { closedSkyWitness, fateAside, pickDispatch, plotNeedsFate, voiceFor } from "./plot.ts";
import { emptyMandate } from "./mandate.ts";
import { makeRecord } from "./archive.ts";
import { OUR_SEED, OUR_UNIVERSE } from "./physics.ts";

describe("pickDispatch", () => {
  it("opens on arrival, then empty, then the joke of the dice", () => {
    assert.equal(pickDispatch({ births: 1, fate: "void", next: "witness" }), "arrive");
    assert.equal(pickDispatch({ births: 3, fate: "fog", next: "corridor" }), "empty");
    assert.equal(
      pickDispatch({ births: 3, fate: "fog", next: "corridor", plate: "cluster" }),
      "cluster",
    );
    assert.equal(
      pickDispatch({ births: 3, fate: "fog", next: "corridor", plate: "dwarf" }),
      "dwarf",
    );
    assert.equal(pickDispatch({ births: 6, fate: "sterile", next: "atlas" }), "dice");
  });

  it("turns when a foothold appears, and stays a dispatch when the atlas seals", () => {
    assert.equal(pickDispatch({ births: 2, fate: "habitable", next: "home" }), "foothold");
    assert.equal(pickDispatch({ births: 4, fate: "habitable", next: "keep", ours: true }), "home");
    assert.equal(pickDispatch({ births: 8, fate: "teeming", next: null }), "done");
    assert.equal(pickDispatch({ births: 3, fate: "enduring", next: "keep" }), "enduring");
    assert.equal(pickDispatch({ births: 3, fate: "rip", next: "corridor" }), "hard");
    assert.equal(
      pickDispatch({ births: 2, fate: "sterile", next: "corridor", silicon: 0.62 }),
      "silicon",
    );
    assert.equal(
      pickDispatch({ births: 2, fate: "sterile", next: "corridor", swarm: 0.4 }),
      "tide",
    );
  });

  it("asks for the fate sentence only when the line is a next step", () => {
    for (const id of ["arrive", "empty", "dice", "hard", "survey", "home", "done"] as const) {
      assert.equal(plotNeedsFate(id), true, id);
    }
    for (const id of [
      "foothold",
      "teeming",
      "silicon",
      "tide",
      "enduring",
      "blink",
      "cluster",
      "dwarf",
      "highway",
      "belt",
      "desert",
      "caughtWow",
    ] as const) {
      assert.equal(plotNeedsFate(id), false, id);
    }
  });

  it("appends the fate when the life pane only says to survey", () => {
    assert.equal(closedSkyWitness(false, "Survey 64 is next.", "Nothing catches fire."), null);
    const line = closedSkyWitness(true, "Survey 64 is next.", "Nothing catches fire.");
    assert.equal(line, "Survey 64 is next. Nothing catches fire.");
    assert.equal(closedSkyWitness(true, "Already. Nothing catches fire.", "Nothing catches fire."), "Already. Nothing catches fire.");
  });

  it("does not repeat the fate name as the sentence", () => {
    assert.equal(fateAside("The void", "The void"), null);
    assert.equal(fateAside("The void", "  "), null);
    assert.equal(
      fateAside("The void", "Nothing ever catches fire."),
      "Nothing ever catches fire.",
    );
  });

  it("lets a blink interrupt, then a catch write the line", () => {
    assert.equal(
      pickDispatch({ births: 2, fate: "fog", next: "corridor", encounter: "wow" }),
      "blink",
    );
    assert.equal(
      pickDispatch({ births: 2, fate: "fog", next: "corridor", caught: "throat" }),
      "caughtThroat",
    );
    assert.equal(pickDispatch({ births: 2, fate: "void", next: "corridor", scanning: true }), "survey");
    assert.equal(
      pickDispatch({ births: 2, fate: "void", next: "corridor", caught: "wow" }),
      "caughtWow",
    );
    assert.equal(
      pickDispatch({ births: 2, fate: "void", next: "corridor", caught: "classified" }),
      "caughtClassified",
    );
  });

  it("lets a known plate speak before fate", () => {
    assert.equal(
      pickDispatch({ births: 3, fate: "habitable", next: "corridor", plate: "swarm" }),
      "tide",
    );
    assert.equal(
      pickDispatch({ births: 3, fate: "habitable", next: "corridor", plate: "belt" }),
      "belt",
    );
    assert.equal(
      pickDispatch({ births: 3, fate: "sterile", next: "corridor", plate: "highway" }),
      "highway",
    );
    assert.equal(
      pickDispatch({ births: 3, fate: "void", next: "corridor", plate: "desert" }),
      "desert",
    );
  });

  it("voices our sky as home through the plate, not a canvas mood", () => {
    const record = makeRecord(OUR_UNIVERSE, OUR_SEED);
    assert.equal(voiceFor(record, emptyMandate()), "home");
  });
});
