import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { APP_VERSION_SHORT } from "./studio.ts";
import { shouldRegisterWorker, SW_CACHE_NAME, workerScope } from "./service-worker.ts";

describe("service worker", () => {
  it("registers only on https or localhost", () => {
    assert.equal(shouldRegisterWorker({ protocol: "https:", hostname: "yanusiowot-source.github.io" }), true);
    assert.equal(shouldRegisterWorker({ protocol: "https:", hostname: "abc.grok-sandbox.com" }), false);
    assert.equal(shouldRegisterWorker({ protocol: "http:", hostname: "localhost" }), true);
    assert.equal(shouldRegisterWorker({ protocol: "file:", hostname: "" }), false);
    assert.equal(shouldRegisterWorker({ protocol: "http:", hostname: "example.com" }), false);
  });

  it("scopes the worker to the lab directory, not the host root", () => {
    const a = workerScope("https://yanusiowot-source.github.io/genesis-lab/");
    assert.equal(a.script, "https://yanusiowot-source.github.io/genesis-lab/sw.js");
    assert.equal(a.scope, "https://yanusiowot-source.github.io/genesis-lab/");
    const b = workerScope("https://yanusiowot-source.github.io/genesis-lab/index.html");
    assert.equal(b.scope, "https://yanusiowot-source.github.io/genesis-lab/");
  });

  it("keeps the public sw.js cache name on this version", () => {
    const sw = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../public/sw.js"), "utf8");
    assert.match(sw, new RegExp(`genesis-sw-${APP_VERSION_SHORT.replace(".", "\\.")}`));
    assert.equal(SW_CACHE_NAME, `genesis-sw-${APP_VERSION_SHORT}`);
    assert.match(sw, /cache-first/);
    assert.match(sw, /network-first/);
    assert.match(sw, /wasm/);
  });
});
