import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { fieldNote } from "./field-note.ts";
import { evaluate, OUR_UNIVERSE } from "./physics.ts";

describe("fieldNote", () => {
  it("stays off the sky until the lab constants pane or the commission button", () => {
    const app = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/universe-app.tsx"),
      "utf8",
    );
    assert.doesNotMatch(app, /import \{ fieldNote \}/);
    assert.match(app, /import\("@\/lib\/universe\/field-note"\)/);
    assert.doesNotMatch(app, /import \{ loadVotes/);
    assert.match(app, /import\("@\/components\/lab-panes"\)/);
  });

  it("writes ΛCDM as a habitable envelope with a Friedmann age", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const text = fieldNote({
      name: "Home",
      catalog: "GE-TEST",
      params: OUR_UNIVERSE,
      evaluation: ev,
      locale: "en",
      salt: 1,
    });
    assert.match(text, /13\.\d Gyr/);
    assert.match(text, /envelope, not a (census|headcount)/);
    assert.doesNotMatch(text, /Grok/);
    assert.doesNotMatch(text, /neural/i);
    assert.doesNotMatch(text, /organism is claimed|invented a species/);
    assert.match(text, /Carbon/);
  });

  it("does not inflate silicon when it is dead", () => {
    const ev = evaluate({ ...OUR_UNIVERSE, gravity: 0.4, darkEnergy: 1.6 });
    const text = fieldNote({
      name: "Rip",
      catalog: "GE-RIP",
      params: { ...OUR_UNIVERSE, gravity: 0.4, darkEnergy: 1.6 },
      evaluation: ev,
      locale: "en",
      salt: 2,
      versus: "Younger than home by 4.2 Gyr.",
    });
    assert.match(text, /Silicon chemistry is negligible|not inflated/i);
    assert.match(text, /Younger than home by 4\.2 Gyr/);
  });

  it("writes Russian without claiming a census", () => {
    const ev = evaluate(OUR_UNIVERSE);
    const text = fieldNote({
      name: "Дом",
      catalog: "GE-TEST",
      params: OUR_UNIVERSE,
      evaluation: ev,
      locale: "ru",
    });
    assert.match(text, /оболочка, не перепись/);
    assert.doesNotMatch(text, /Grok/);
  });
});
