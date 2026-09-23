import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { mergeCopy } from "./copy-merge.ts";
import { formatHudPct } from "./format.ts";
import { copyFor, hydratePacks } from "./i18n.ts";
import { isAboutHash, isHostedLab, isKeepHash, PUBLIC_ABOUT_URL, PUBLIC_LAB_REPO_URL, PUBLIC_SOURCE_REPO_URL, orderCopyUrl, COPY_PRICE, COPY_CURRENCY, PAY_USDT_BEP20, PAY_BTC, APP_VERSION, APP_VERSION_SHORT, productOffers } from "./studio.ts";
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
    assert.match(c.onboarding[0].body, /Survey 64/);
    assert.match(c.onboarding[0].body, /look/i);
    assert.match(copyFor("ru").onboarding[0].body, /смотр/i);
    assert.match(c.shortcutsBody, /Space look/);
    assert.match(c.shortcutsBody, /\[ \] time/);
    assert.equal(c.research.target.swarm, "Tide");
    assert.match(c.research.targetHint.swarm, /von Neumann/i);
    assert.equal(copyFor("ru").research.target.swarm, "Прилив");
    assert.equal(copyFor("be").research.target.swarm, "Прыліў");
    assert.match(c.onboarding[1].body, /Sculpt/);
    assert.match(c.labPaneHint.constants, /Sculpt/);
    assert.match(c.labCue, /Lab/);
    assert.match(copyFor("ru").labCue, /Лаб/);
    assert.match(copyFor("be").labCue, /Лаб/);
    assert.equal(copyFor("ru").onboarding.length, 3);
    assert.equal(copyFor("be").onboarding.length, 3);
    assert.match(c.birthWitness, /Most stay empty/);
    assert.match(c.birthWitness, /Survey 64/);
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
    assert.match(c.studioKeepBody, /plate/);
    assert.doesNotMatch(c.studioKeepBody, /is next/);
    assert.doesNotMatch(c.studioKeepBody, /is ready/);
    assert.doesNotMatch(c.studioKeepBody, /below/i);
    assert.match(c.studioKeepBody, /15 USDT/);
    assert.doesNotMatch(c.payAfter, /zip/i);
    assert.doesNotMatch(c.platforms.windowsBody, /zip/i);
    assert.doesNotMatch(c.platforms.linuxBody, /zip/i);
    assert.match(c.versusYounger, /Younger than home/);
    assert.match(c.civ.spend, /not a fleet/);
    assert.match(copyFor("ru").civ.spend, /не флот/);
    assert.match(copyFor("be").civ.spend, /не флот/);
    assert.match(c.aboutBody, /four thin corridors/);
    assert.match(c.onboarding[2].title, /Four corridors/);
    assert.match(copyFor("ru").onboarding[2].title, /Четыре/);
    assert.match(copyFor("be").onboarding[2].title, /Чатыры/);
    assert.match(c.mandate.title, /work/i);
    assert.match(c.mandate.hint, /not a score/);
    assert.equal(Object.keys(c.mandate.chapters).length, 15);
    assert.doesNotMatch(c.onboarding.map((s) => s.body).join(" "), /ten skies/i);
    assert.doesNotMatch(copyFor("ru").onboarding.map((s) => s.body).join(" "), /Десять небес/);
    assert.match(c.mandate.done, /atlas is sealed/i);
    assert.match(c.mandate.atlasTick, /Atlas \{n\} of \{m\}/);
    assert.match(copyFor("ru").mandate.done, /атлас/i);
    assert.match(copyFor("be").mandate.done, /атлас/i);
    assert.match(c.helpItems.map((item) => item.title).join(" "), /The work/);
    assert.match(c.helpItems.map((item) => item.title).join(" "), /Canon/);
    assert.match(c.helpItems.map((item) => item.title).join(" "), /Side roads/);
    assert.match(c.eggs.ice, /ice is the only mass/i);
    assert.match(c.eggs.wow, /hydrogen/i);
    assert.match(c.eggs.witness, /not to land/i);
    assert.match(c.eggs.throat, /Morris/i);
    assert.match(copyFor("ru").eggs.throat, /горловин/i);
    assert.match(copyFor("be").eggs.throat, /гарлавін/i);
    assert.match(c.obs.modeHint.lensing, /NFW/);
    assert.doesNotMatch(c.obs.modeHint.lensing, /\bSIS\b/);
    assert.match(copyFor("ru").obs.modeHint.lensing, /NFW/);
    assert.doesNotMatch(copyFor("ru").obs.modeHint.lensing, /\bSIS\b/);
    assert.match(copyFor("be").obs.modeHint.lensing, /NFW/);
    assert.match(c.tapSky, /look/i);
    assert.match(copyFor("ru").tapSky, /Смотр/i);
    assert.match(c.plot.arrive, /Posted to watch/i);
    assert.match(copyFor("ru").plot.dice, /шутк/i);
    assert.match(copyFor("be").plot.done, /Атлас/i);
    assert.match(c.presetHighway, /long road/i);
    assert.match(copyFor("be").presetBelt, /Ледзяны/);
    assert.match(c.scripture.intro, /not a measurement/i);
    assert.match(copyFor("ru").scripture.title, /Канон/);
    assert.match(c.research.running, /prior/);
    assert.match(copyFor("ru").versusYounger, /Моложе дома/);
    assert.match(copyFor("ru").research.running, /приор/);
    assert.match(copyFor("be").versusYounger, /Маладзейшы/);
    assert.doesNotMatch(copyFor("ru").payAfter, /zip/i);
    assert.doesNotMatch(copyFor("be").payAfter, /zip/i);
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
    assert.match(c.studioLabRepoCta, /build/i);
    assert.match(c.studioSourceCta, /rights reserved/i);
    assert.equal(c.obs.diskH0, "H0");
    assert.match(c.obs.haloOffChart, /not on the density/);
    assert.match(copyFor("ru").obs.haloOffChart, /не на графике/);
    assert.match(PUBLIC_LAB_REPO_URL, /genesis-lab/);
    assert.match(PUBLIC_SOURCE_REPO_URL, /genesis-engine/);
    assert.match(c.studioEnterCta, /laboratory/);
    assert.match(c.platforms.intro, /free lab/);
    assert.match(c.platforms.windowsBody, /paid portable copy/);
    assert.match(c.platforms.windowsBody, /SmartScreen/);
    assert.match(copyFor("ru").eggs.tau, /гомологи/);
    assert.match(copyFor("ru").studioHonesty, /не прода/);
    assert.match(copyFor("ru").birthWitness, /Обзор 64/);
    assert.match(copyFor("be").eggs.tau, /гамалог/);
    assert.match(copyFor("be").studioHonesty, /не прада/);
    assert.doesNotMatch(copyFor("ru").studioKeepBody, /уже есть/);
    assert.match(copyFor("ru").studioKeepBody, /разовая/);
    assert.match(copyFor("ru").studioKeepBody, /без сети/);
    assert.match(copyFor("ru").studioKeepBody, /пластин/);
    assert.doesNotMatch(copyFor("ru").studioKeepBody, /следующий шаг/);
    assert.doesNotMatch(copyFor("ru").studioKeepBody, /ниже/);
    assert.match(copyFor("ru").studioKeepBody, /15 USDT/);
    assert.match(copyFor("ru").studioReserveCta, /15 USDT/);
    assert.match(copyFor("be").studioKeepBody, /15 USDT/);
    assert.doesNotMatch(copyFor("be").studioKeepBody, /ніжэй/);
    assert.match(copyFor("be").studioKeepBody, /пласцін/);
    assert.match(copyFor("be").studioReserveCta, /15 USDT/);
    assert.match(c.helpItems.map((item) => item.title).join(" "), /A copy/);
    assert.match(c.keep.openCta, /15 USDT/);
    assert.match(c.keep.orderText, /\{plate\}/);
    assert.match(c.keep.orderText, /Windows \/ Linux/);
    assert.match(c.keep.step3, /not instant/i);
    assert.match(c.keep.receiptHint, /writes back/i);
    assert.match(copyFor("ru").keep.step3, /архивом/);
    assert.match(copyFor("ru").keep.orderText, /Windows \/ Linux/);
    assert.match(c.keep.roomCta, /room/i);
    assert.match(copyFor("ru").keep.openCta, /15 USDT/);
    assert.match(copyFor("be").keep.step2, /пласцін/);
    assert.equal(c.version, `Version ${APP_VERSION_SHORT}`);
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
    assert.equal(isKeepHash("https://yanusiowot-source.github.io/genesis-lab/#keep"), true);
    assert.equal(isKeepHash("https://yanusiowot-source.github.io/genesis-lab/#about"), false);
    assert.equal(APP_VERSION, "1.28.0");
    const pkg = JSON.parse(
      readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../../package.json"), "utf8"),
    ) as { version: string };
    assert.equal(APP_VERSION, pkg.version);
    const about = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../public/about/index.html"),
      "utf8",
    );
    assert.match(about, new RegExp(`"softwareVersion": "${APP_VERSION}"`));
    assert.match(about, new RegExp(`Version ${APP_VERSION_SHORT}`));
    assert.match(about, /github.com\/yanusiowot-source\/genesis-lab/);
    assert.match(about, /github.com\/yanusiowot-source\/genesis-engine/);
    const offers = productOffers();
    assert.equal(offers[1]?.price, "15");
    assert.equal(offers[1]?.priceCurrency, "USD");
  });

  it("translates authored chrome including Klingon, High Valyrian, and the clock", async () => {
    await hydratePacks();
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

  it("returns the same object on repeated calls", async () => {
    await hydratePacks();
    assert.equal(copyFor("nl"), copyFor("nl"));
  });

  it("keeps settings chrome translated after cache", async () => {
    await hydratePacks();
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

describe("formatHudPct", () => {
  it("keeps the sky readout short", () => {
    assert.equal(formatHudPct(0), "0%");
    assert.equal(formatHudPct(0.0001), "0%");
    assert.equal(formatHudPct(0.015), "1.5%");
    assert.equal(formatHudPct(0.481), "48%");
    assert.equal(formatHudPct(Number.NaN), "—");
  });
});
