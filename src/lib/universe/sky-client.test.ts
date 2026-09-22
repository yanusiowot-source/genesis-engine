import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OUR_UNIVERSE, evaluate } from "./physics.ts";
import { buildGalaxyAsync, buildGalaxyNow, skyWorkerAvailable } from "./sky-client.ts";

describe("sky-client", () => {
  it("falls back on the same disk when Worker is absent", async () => {
    assert.equal(skyWorkerAvailable(), false);
    const ev = evaluate(OUR_UNIVERSE);
    const sync = buildGalaxyNow(OUR_UNIVERSE, ev, 9, 0.4);
    const async = await buildGalaxyAsync(OUR_UNIVERSE, ev, 9, 0.4);
    assert.equal(async.model.stars.length, sync.model.stars.length);
    assert.equal(async.ships, sync.ships);
    assert.ok(async.model.stars.length > 8);
  });
});
