/**
 * Rebuild src/lib/universe/locales/one/*.ts from the authored pack bags.
 * Run: node --experimental-strip-types scripts/split-locale-packs.mjs
 */
import { writeFileSync } from "node:fs";
import { PACKS } from "../src/lib/universe/locales/packs.ts";
import { HUD } from "../src/lib/universe/locales/hud-packs.ts";
import { SETTINGS } from "../src/lib/universe/locales/settings-packs.ts";
import { APP_VERSION_SHORT } from "../src/lib/universe/studio.ts";

function scrub(value, key) {
  if (typeof value === "string") {
    if (key === "version" && value.endsWith(APP_VERSION_SHORT)) {
      return value.slice(0, -APP_VERSION_SHORT.length) + "__V__";
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => scrub(item, ""));
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = scrub(v, k);
    return out;
  }
  return value;
}

const ids = Object.keys(PACKS);
for (const id of ids) {
  if (!HUD[id] || !SETTINGS[id]) throw new Error(`missing overlay ${id}`);
  const body = `import type { Copy } from "../../i18n.ts";
import type { DeepPartial } from "../../copy-merge.ts";
import { stamp } from "./stamp.ts";

const packRaw = ${JSON.stringify(scrub(PACKS[id], ""))} as DeepPartial<Copy>;
const hudRaw = ${JSON.stringify(scrub(HUD[id], ""))} as DeepPartial<Copy>;
const settingsRaw = ${JSON.stringify(scrub(SETTINGS[id], ""))} as DeepPartial<Copy>;

export const pack: DeepPartial<Copy> = stamp(packRaw);
export const hud: DeepPartial<Copy> = stamp(hudRaw);
export const settings: DeepPartial<Copy> = stamp(settingsRaw);
`;
  writeFileSync(new URL(`../src/lib/universe/locales/one/${id}.ts`, import.meta.url), body);
}

console.log(ids.join(" "));
