import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeCopy } from "./copy-merge.ts";
import { copyFor } from "./i18n.ts";
import { isAboutHash, isHostedLab, PUBLIC_ABOUT_URL, orderCopyUrl, COPY_PRICE, COPY_CURRENCY, PAY_USDT_BEP20, PAY_BTC } from "./studio.ts";
import {
  AUTHORED,
  CONSTRUCTED_COUNT,
  LIVING_COUNT,
  canonicalLocale,
  hasPack,
  languageById,
  loadCatalog,
  searchLanguages,
} from "./languages.ts";

describe("language catalog", () => {
  it("loads ISO living languages plus constructed ones", async () => {
    const rows = await loadCatalog();
    assert.ok(rows.length >= LANGUAGE_FLOOR);
    assert.equal(languageById("tlh")?.name, "Klingon");
    assert.equal(languageById("hv")?.name, "High Valyrian");
    assert.equal(languageById("eo")?.type, "constructed");
    assert.equal(languageById("en")?.type, "living");
    assert.ok(LIVING_COUNT > 6900);
    assert.ok(CONSTRUCTED_COUNT >= 20);
  });

  it("canonicalizes BCP-47 and Valyrian aliases without the catalog", () => {
    assert.equal(canonicalLocale("nl-NL"), "nl");
    assert.equal(canonicalLocale("zh-CN"), "zh");
    assert.equal(canonicalLocale("x-valyrian"), "hv");
    assert.equal(canonicalLocale("bel"), "be");
  });

  it("finds Klingon and High Valyrian by search after load", async () => {
    await loadCatalog();
    const k = searchLanguages("klingon", 8);
    assert.ok(k.some((r) => r.id === "tlh"));
    const v = searchLanguages("valyrian", 8);
    assert.ok(v.some((r) => r.id === "hv"));
  });
});

const LANGUAGE_FLOOR = 6900;

describe("copyFor", () => {
  it("keeps English as the complete source", () => {
    const c = copyFor("en");
    assert.equal(c.birth, "Birth a universe");
    assert.equal(c.onboarding.length, 3);
    assert.equal(copyFor("ru").onboarding.length, 3);
    assert.equal(copyFor("be").onboarding.length, 3);
    assert.match(c.birthWitness, /Most stay empty/);
    assert.match(c.birthGood, /it was good/);
    assert.match(copyFor("ru").birthGood, /хорошо/);
    assert.match(copyFor("be").birthGood, /добра/);
    assert.equal(c.tabs.sky, "Sky");
    assert.match(c.eggs.tau, /homology/);
    assert.match(c.helpItems.map((item) => item.title).join(" "), /Nearby/);
    assert.match(c.studioHonesty, /not for sale/);
    assert.match(c.studioFreeBody, /No ads/);
    assert.match(c.studioFreeBody, /No subscription/);
    assert.match(c.studioKeepBody, /offline/i);
    assert.match(c.studioKeepBody, /Windows/);
    assert.match(c.studioKeepBody, /unsigned/i);
    assert.doesNotMatch(c.studioKeepBody, /is next/);
    assert.doesNotMatch(c.studioKeepBody, /is ready/);
    assert.match(c.studioKeepBody, /15 USDT/);
    assert.doesNotMatch(c.chronicleHint, /Grok/);
    assert.equal(COPY_PRICE, "15");
    assert.equal(COPY_CURRENCY, "USDT");
    assert.match(c.studioSupportBody, /15 USDT/);
    assert.doesNotMatch(c.studioSupportBody, /Linux now/);
    assert.match(c.studioReserveCta, /15 USDT/);
    assert.match(c.studioOrderText, /15 USDT/);
    assert.match(orderCopyUrl(c.studioOrderText), /messages\/compose/);
    assert.match(orderCopyUrl(c.studioOrderText), /1652518444795928590/);
    assert.match(c.studioPublicCta, /public lab/);
    assert.match(c.studioEnterCta, /laboratory/);
    assert.match(c.platforms.intro, /free lab/);
    assert.match(c.platforms.windowsBody, /paid portable copy/);
    assert.match(c.platforms.windowsBody, /SmartScreen/);
    assert.match(copyFor("ru").eggs.tau, /гомологи/);
    assert.match(copyFor("ru").studioHonesty, /не прода/);
    assert.match(copyFor("be").eggs.tau, /гамалог/);
    assert.match(copyFor("be").studioHonesty, /не прада/);
    assert.doesNotMatch(copyFor("ru").studioKeepBody, /уже есть/);
    assert.match(copyFor("ru").studioKeepBody, /разовая/);
    assert.match(copyFor("ru").studioKeepBody, /без сети/);
    assert.doesNotMatch(copyFor("ru").studioKeepBody, /следующий шаг/);
    assert.match(copyFor("ru").studioKeepBody, /15 USDT/);
    assert.match(copyFor("ru").studioReserveCta, /15 USDT/);
    assert.match(copyFor("be").studioKeepBody, /15 USDT/);
    assert.match(copyFor("be").studioReserveCta, /15 USDT/);
    assert.match(copyFor("ru").platforms.intro, /свободн/);
  });

  it("knows the public lab host and the about hash", () => {
    assert.equal(isHostedLab("https://yanusiowot-source.github.io/genesis-lab/"), true);
    assert.equal(isHostedLab("https://example.com/"), false);
    assert.equal(isAboutHash("https://yanusiowot-source.github.io/genesis-lab/#about"), true);
    assert.equal(isAboutHash("https://yanusiowot-source.github.io/genesis-lab/about/"), true);
    assert.equal(isAboutHash("https://yanusiowot-source.github.io/genesis-lab/"), false);
    assert.match(PUBLIC_ABOUT_URL, /\/about\/$/);
    assert.equal(COPY_PRICE, "15");
    assert.equal(COPY_CURRENCY, "USDT");
    assert.match(PAY_USDT_BEP20, /^0xcfbf/);
    assert.doesNotMatch(PAY_USDT_BEP20, /55d39832/i);
    assert.match(PAY_BTC, /^bc1q/);
    assert.match(copyFor("en").payWarn, /BEP20/);
  });

  it("translates authored chrome including Klingon, High Valyrian, and the clock", () => {
    assert.equal(copyFor("de").birth, "Universum gebären");
    assert.equal(copyFor("nl").tabs.sky, "Hemel");
    assert.equal(copyFor("nl").obs.clock, "Kosmische tijd");
    assert.equal(copyFor("nl").obs.jumps.stellar, "Sterren");
    assert.equal(copyFor("nl").appearance, "Weergave");
    assert.equal(copyFor("nl").musicTitle, "Muziek");
    assert.equal(copyFor("nl").aboutTitle, "Over");
    assert.equal(copyFor("nl").epochTitle, "Sterrenijdperk");
    assert.notEqual(copyFor("nl").epochTitle, copyFor("nl").obs.clock);
    assert.equal(copyFor("nl").civ.path, "Chemisch pad");
    assert.equal(copyFor("de").factorsTitle, "Warum diese Wahrscheinlichkeit");
    assert.equal(copyFor("tlh").language, "Hol");
    assert.equal(copyFor("hv").tabs.sky, "Vēzos");
    assert.equal(copyFor("hv").obs.clock, "Vēzos ābrar");
    assert.ok(AUTHORED.every((id) => hasPack(id) || id === "en"));
  });

  it("falls back to English chrome for a living language with no pack", () => {
    const yo = copyFor("yo");
    assert.equal(yo.birth, "Birth a universe");
    assert.equal(hasPack("yo"), false);
  });

  it("returns the same object on repeated calls", () => {
    assert.equal(copyFor("nl"), copyFor("nl"));
  });

  it("keeps settings chrome translated after cache", () => {
    const a = copyFor("fr");
    const b = copyFor("fr");
    assert.equal(a, b);
    assert.equal(a.appearance, "Apparence");
    assert.equal(a.languageLoading, "Chargement du catalogue…");
  });

  it("merges nested overlays without dropping English keys", () => {
    const merged = mergeCopy(
      { a: 1, nest: { x: 1, y: 2 } },
      { nest: { y: 9 } },
    );
    assert.deepEqual(merged, { a: 1, nest: { x: 1, y: 9 } });
  });
});
