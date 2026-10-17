import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import type { Fate } from "./types.ts";
import { mergeCopy } from "./copy-merge.ts";
import { formatHudPct } from "./format.ts";
import { copyFor, hydrateBe, hydratePack, hydratePacks } from "./i18n.ts";
import { isAboutHash, isHostedLab, isKeepHash, PUBLIC_ABOUT_URL, PUBLIC_LAB_REPO_URL, PUBLIC_SOURCE_REPO_URL, orderCopyUrl, COPY_PRICE, COPY_PRICE_MIN, COPY_PRICE_MAX, clampCopyDollars, COPY_CURRENCY, PAY_USDT_BEP20, PAY_BTC, APP_VERSION, APP_VERSION_SHORT, productOffers } from "./studio.ts";
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

await hydrateBe();

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
    assert.match(c.gamesNote, /do not change the sky/i);
    assert.match(copyFor("ru").gamesNote, /не меняют небо/);
    assert.match(copyFor("be").gamesNote, /не мяняюць неба/);
    assert.doesNotMatch(c.gamesBlocks, /tetris/i);
    assert.doesNotMatch(copyFor("ru").gamesBlocks, /тетрис/i);
    assert.doesNotMatch(c.gamesRun, /mario|dino|chrome/i);
    assert.doesNotMatch(copyFor("ru").gamesRun, /марио|динозавр/i);
    assert.match(c.gamesRunHint, /does not change the sky/i);
    assert.match(c.gamesTilesHint, /2048/);
    assert.equal(copyFor("ru").gamesDrop, "Бросить");
    assert.equal(copyFor("be").gamesTurn, "Паварот");
    assert.match(c.onboarding[0].body, /look/i);
    assert.match(copyFor("ru").onboarding[0].body, /смотр/i);
    assert.match(c.shortcutsBody, /Space look/);
    assert.match(c.shortcutsBody, /\[ \] time/);
    assert.equal(c.research.target.swarm, "Tide");
    assert.match(c.research.targetHint.swarm, /von Neumann/i);
    assert.equal(copyFor("ru").research.target.swarm, "Прилив");
    assert.equal(copyFor("be").research.target.swarm, "Прыліў");
    assert.equal(c.report.failed, "Report did not save");
    assert.equal(copyFor("ru").report.failed, "Отчёт не сохранился");
    assert.equal(copyFor("be").report.failed, "Справаздача не захавалася");
    assert.match(c.onboarding[1].body, /Sculpt/);
    assert.match(c.labPaneHint.constants, /Sculpt/);
    assert.match(c.labCue, /Lab/);
    assert.match(copyFor("ru").labCue, /Лаб/);
    assert.match(copyFor("be").labCue, /Лаб/);
    assert.equal(copyFor("ru").onboarding.length, 3);
    assert.equal(copyFor("be").onboarding.length, 3);
    assert.match(c.birthWitness, /Most corridors stay closed/);
    assert.match(c.birthWitness, /Survey 64/);
    const fates: Fate[] = ["void", "crunch", "rip", "flash", "fog", "sterile", "enduring", "habitable", "teeming"];
    for (const locale of ["en", "ru", "be"] as const) {
      const copy = copyFor(locale);
      for (const fate of fates) {
        assert.notEqual(copy.fateCopy[fate].trim(), "", `${locale} ${fate}`);
        assert.notEqual(copy.fateCopy[fate].trim(), copy.fateLabel[fate].trim(), `${locale} ${fate}`);
      }
    }
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
    assert.match(c.studioKeepBody, /\$1/);
    assert.match(c.studioKeepBody, /USDT/);
    assert.match(c.studioKeepBody, /App Store/);
    assert.doesNotMatch(c.studioKeepBody, /15 USDT/);
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
    assert.equal(copyFor("ru").obs.modes.planetarium, "Внутреннее строение");
    assert.doesNotMatch(copyFor("ru").obs.modes.planetarium, /Изнутри/);
    assert.match(c.tapSky, /look/i);
    assert.match(copyFor("ru").tapSky, /Смотр/i);
    assert.match(c.plot.arrive, /first sky/i);
    assert.match(copyFor("ru").plot.dice, /журнале/);
    assert.doesNotMatch(copyFor("ru").plot.dice, /шутк/);
    assert.match(copyFor("be").plot.done, /Атлас/);
    assert.match(c.plot.caughtWow, /Nobody knows who sent it/);
    assert.match(copyFor("ru").plot.caughtWow, /неизвестно/);
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
    assert.equal(COPY_PRICE, "1");
    assert.equal(COPY_PRICE_MIN, 1);
    assert.equal(COPY_PRICE_MAX, 500);
    assert.equal(clampCopyDollars(0), 1);
    assert.equal(clampCopyDollars(1.6), 2);
    assert.equal(clampCopyDollars(15), 15);
    assert.equal(clampCopyDollars(9000), 500);
    assert.equal(COPY_CURRENCY, "USDT");
    assert.match(c.studioSupportBody, /\$1/);
    assert.match(c.studioSupportBody, /USDT/);
    assert.doesNotMatch(c.studioSupportBody, /15 USDT/);
    assert.doesNotMatch(c.studioSupportBody, /Linux now/);
    assert.match(c.studioReserveCta, /\$1/);
    assert.match(c.studioOrderText, /\$1/);
    assert.match(c.studioOrderText, /USDT/);
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
    assert.match(copyFor("ru").plot.home, /нашей вселенной/);
    assert.match(copyFor("en").plot.home, /our universe/);
    assert.doesNotMatch(copyFor("en").plot.home, /standing in this sky/);
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
    assert.match(copyFor("ru").studioKeepBody, /\$1/);
    assert.match(copyFor("ru").studioKeepBody, /USDT/);
    assert.doesNotMatch(copyFor("ru").studioKeepBody, /15 USDT/);
    assert.match(copyFor("ru").studioReserveCta, /\$1/);
    assert.match(copyFor("be").studioKeepBody, /\$1/);
    assert.match(copyFor("be").studioKeepBody, /USDT/);
    assert.doesNotMatch(copyFor("be").studioKeepBody, /15 USDT/);
    assert.doesNotMatch(copyFor("be").studioKeepBody, /ніжэй/);
    assert.match(copyFor("be").studioKeepBody, /пласцін/);
    assert.match(copyFor("be").studioReserveCta, /\$1/);
    assert.match(c.helpItems.map((item) => item.title).join(" "), /Games/);
    assert.match(c.helpItems.map((item) => item.title).join(" "), /A copy/);
    assert.match(copyFor("ru").helpItems.map((item) => item.title).join(" "), /Игры/);
    assert.match(copyFor("be").helpItems.map((item) => item.title).join(" "), /Гульні/);
    assert.match(c.helpItems.find((item) => item.title === "Games")?.body ?? "", /do not change the sky/i);
    assert.match(c.keep.openCta, /\$1/);
    assert.match(c.keep.orderText, /\{plate\}/);
    assert.match(c.keep.orderText, /\{amount\}/);
    assert.match(c.keep.storeBody, /App Store/);
    assert.match(c.keep.storeOnly, /\$1/);
    assert.match(copyFor("ru").keep.storeBody, /App Store/);
    assert.match(copyFor("be").keep.storeOnly, /\$1/);
    assert.match(c.keep.orderText, /Windows \/ Linux/);
    assert.match(c.keep.step3, /not instant/i);
    assert.match(c.keep.receiptHint, /writes back/i);
    assert.match(copyFor("ru").keep.step3, /архивом/);
    assert.match(copyFor("ru").keep.orderText, /Windows \/ Linux/);
    assert.match(c.keep.roomCta, /room/i);
    assert.match(copyFor("ru").keep.openCta, /\$1/);
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
    assert.equal(COPY_PRICE, "1");
    assert.equal(COPY_CURRENCY, "USDT");
    assert.match(PAY_USDT_BEP20, /^0xcfbf/);
    assert.doesNotMatch(PAY_USDT_BEP20, /55d39832/i);
    assert.match(PAY_BTC, /^bc1q/);
    assert.equal(isKeepHash("https://yanusiowot-source.github.io/genesis-lab/#keep"), true);
    assert.equal(isKeepHash("https://yanusiowot-source.github.io/genesis-lab/#about"), false);
    assert.equal(APP_VERSION, "2.15.0");
    const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };
    const desktop = JSON.parse(readFileSync(join(root, "desktop/package.json"), "utf8")) as {
      version: string;
    };
    const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8")) as {
      version: string;
      packages: { "": { version: string } };
    };
    assert.equal(pkg.version, "2.15.0");
    assert.equal(desktop.version, "2.15.0");
    assert.equal(lock.version, "2.15.0");
    assert.equal(lock.packages[""].version, "2.15.0");
    assert.equal(APP_VERSION, pkg.version);
    const about = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../../public/about/index.html"),
      "utf8",
    );
    assert.match(about, new RegExp(`"softwareVersion": "${APP_VERSION}"`));
    assert.match(about, new RegExp(`Version ${APP_VERSION_SHORT}`));
    assert.match(about, /github.com\/yanusiowot-source\/genesis-lab/);
    assert.match(about, /github.com\/yanusiowot-source\/genesis-engine/);
    assert.match(about, /from \$1/);
    assert.doesNotMatch(about, /15 USDT/);
    const offers = productOffers();
    assert.equal(offers[1]?.price, "1");
    assert.equal(offers[1]?.priceCurrency, "USD");
  });

  it("loads one locale from its own module", async () => {
    const { PACKS } = await import("./locales/packs.ts");
    const { HUD } = await import("./locales/hud-packs.ts");
    const { SETTINGS } = await import("./locales/settings-packs.ts");
    await hydratePack("de");
    assert.equal(copyFor("de").birth, PACKS.de?.birth);
    assert.equal(copyFor("de").obs.clock, HUD.de?.obs?.clock);
    assert.equal(copyFor("de").appearance, SETTINGS.de?.appearance);
    assert.equal(copyFor("nl").birth, "Birth a universe");
  });

  it("matches every authored pack to its source bag", async () => {
    const { PACKS } = await import("./locales/packs.ts");
    const { HUD } = await import("./locales/hud-packs.ts");
    const { SETTINGS } = await import("./locales/settings-packs.ts");
    await hydratePacks();
    for (const id of Object.keys(PACKS)) {
      const copy = copyFor(id);
      assert.equal(copy.birth, PACKS[id]?.birth, id);
      assert.equal(copy.obs.clock, HUD[id]?.obs?.clock, id);
      assert.equal(copy.appearance, SETTINGS[id]?.appearance, id);
    }
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

describe("disk panel", () => {
  it("paints the Toomre niche and lifts the Q=1 line only when the mesh crosses it", () => {
    const panel = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/disk-panel.tsx"),
      "utf8",
    );
    assert.match(panel, /fragmenting:\s*"text-life"/);
    assert.match(panel, /hot:\s*"text-fg-subtle"/);
    assert.match(panel, /rigid:\s*"text-fg-muted"/);
    assert.match(panel, /marginal:\s*"text-fg"/);
    assert.match(panel, /d\.unstable > 0 \? 0\.7 : 0\.22/);
    assert.doesNotMatch(panel, /barcode|toomreAt|toomreProfile/);
    assert.match(panel, /<\/dl>[\s\S]*diskH0/);
    assert.doesNotMatch(panel, /diskH0[\s\S]*<\/dl>/);
    const app = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/universe-app.tsx"),
      "utf8",
    );
    const hunt = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/research-panel.tsx"),
      "utf8",
    );
    assert.match(app, /setHuntFailed\(true\)/);
    assert.doesNotMatch(app, /\.catch\(\(\) => \{\}\)/);
    assert.match(hunt, /grid-cols-2 gap-1[\s\S]*sm:grid-cols-3/);
    assert.match(hunt, /whitespace-normal/);
    assert.match(hunt, /w-full min-h-11/);
    assert.match(hunt, /min-h-11 w-full/);
    assert.doesNotMatch(hunt, /min-\[420px\]:flex-row/);
    assert.doesNotMatch(hunt, /size="sm"/);
    const laws = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/laws-panel.tsx"),
      "utf8",
    );
    assert.match(laws, /w-full min-w-0 items-center justify-center whitespace-normal/);
    const desk = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/desk-panel.tsx"),
      "utf8",
    );
    assert.match(desk, /grid grid-cols-2 gap-1/);
    assert.doesNotMatch(desk, /min-\[420px\]:grid-cols-3/);
    assert.match(desk, /whitespace-normal text-balance/);
    assert.match(app, /line-clamp-2 text-pretty text-sm leading-relaxed text-fg-muted/);
    assert.doesNotMatch(app, /line-clamp-1 text-pretty text-sm leading-relaxed text-fg-muted/);
    const journal = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/log-list.tsx"),
      "utf8",
    );
    assert.match(journal, /grid grid-cols-1 gap-2/);
    assert.doesNotMatch(journal, /min-\[420px\]:grid-cols-3/);
    assert.match(journal, /line-clamp-2 text-\[0\.6875rem\] leading-relaxed text-fg-subtle/);
    assert.match(hunt, /whitespace-normal text-pretty text-xs leading-snug/);
    const keep = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/keep-desk.tsx"),
      "utf8",
    );
    assert.match(keep, /isStoreShell/);
    assert.match(keep, /COPY_PRICE_CHOICES/);
    assert.match(keep, /grid grid-cols-3 gap-2/);
    assert.match(keep, /h-auto min-h-11 w-full whitespace-normal text-balance/);
    assert.match(keep, /min=\{COPY_PRICE_MIN\}/);
    assert.match(keep, /store \? null :/);
    assert.doesNotMatch(keep, /15 USDT/);
    assert.match(hunt, /fateLabel\[bin\.fate\]/);
    assert.doesNotMatch(hunt, /title=\{`\$\{copy\.fateLabel/);
    for (const rel of ["research-panel.tsx", "laws-panel.tsx", "desk-panel.tsx"]) {
      const src = readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), "../../components", rel),
        "utf8",
      );
      assert.doesNotMatch(src, /closedSkyWitness|skyFate/, rel);
    }
    for (const locale of ["en", "ru", "be"] as const) {
      const copy = copyFor(locale);
      assert.match(copy.laws.symbolicHint, /not new physics|не новая физика|не новая фізіка/i);
      assert.match(copy.laws.bayesHint, /threshold|порог|парог/i);
      assert.match(copy.laws.bayesHint, /Bayes|Байес|Байес/i);
      assert.match(copy.desk.mcmcHint, /this sky|этого неба|гэтага неба/i);
      assert.doesNotMatch(copy.desk.mcmcHint, /L′\/L|L'\/L/);
      assert.match(copy.obs.diskHint, /clump|комк|камяк/i);
      assert.match(copy.obs.diskHint, /flowing-gas|текучего газа|цякучага газу/i);
      assert.doesNotMatch(copy.obs.diskHint, /^Toomre/);
      assert.match(copy.obs.rotationHint, /Rubin|Рубин|Рубін/);
      assert.match(copy.obs.rotationHint, /SPARC/);
      assert.doesNotMatch(copy.obs.rotationHint, /1\/√r/);
      assert.match(copy.obs.tfHint, /ridge|гребне|грэбені/i);
      assert.match(copy.obs.tfHint, /SPARC/);
      assert.match(copy.obs.tfHint, /MOND/);
      assert.match(copy.obs.fjHint, /SPARC/);
      assert.match(copy.obs.fpHint, /dwarf|карлик|карлік/i);
      assert.match(copy.obs.dmHint, /halo|гало/i);
      assert.doesNotMatch(copy.obs.dmHint, /Ωc/);
      assert.match(copy.obs.haloHint, /Einasto/);
      assert.match(copy.obs.haloHint, /Burkert/);
      assert.doesNotMatch(copy.obs.haloHint, /N-body/);
      assert.match(copy.obs.acousticHint, /peak|пик|пік/i);
      assert.doesNotMatch(copy.obs.acousticHint, /photon-baryon|Фотон-барион|Фатон-барыён/i);
      assert.match(copy.obs.imfHint, /chemistry|химии|хіміі/i);
      assert.match(copy.obs.imfHint, /heavy|тяжёл|цяжк/i);
      assert.doesNotMatch(copy.obs.imfHint, /^IMF/);
      assert.match(copy.obs.massHint, /Chabrier/);
      assert.match(copy.obs.massHint, /Einstein|Эйнштейн|Эйнштэйн/i);
      assert.doesNotMatch(copy.obs.massHint, /θE/);
      assert.match(copy.obs.bhHint, /jet|Струя|Бруя/i);
      assert.match(copy.obs.bhHint, /HARM/);
      assert.match(copy.obs.bhHint, /EHT/);
      assert.doesNotMatch(copy.obs.bhHint, /β/);
    }
    const entrance = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/onboarding.tsx"),
      "utf8",
    );
    assert.doesNotMatch(entrance, /onboard-sight/);
    for (const c of [copyFor("en"), copyFor("ru"), copyFor("be")]) {
      assert.match(c.research.failed, /\S/);
      assert.doesNotMatch(c.obs.worldsPhase, /^phase$|^фаза$/);
    }
    const hud = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/universe-app.tsx"),
      "utf8",
    );
    assert.doesNotMatch(hud, /disk\.niche === "fragmenting" \? "text-sterile"/);
    for (const c of [copyFor("en"), copyFor("ru"), copyFor("be")]) {
      assert.notEqual(c.obs.diskNiche.fragmenting, c.obs.diskNiche.hot);
      assert.notEqual(c.obs.diskNiche.marginal, c.obs.diskNiche.rigid);
      assert.match(c.obs.diskNicheHint.fragmenting, /Q/);
      assert.match(c.obs.diskNicheHint.hot, /Q/);
    }
  });
});

describe("imf panel", () => {
  it("draws the mass function on every morphology", () => {
    const panel = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/imf-panel.tsx"),
      "utf8",
    );
    assert.match(panel, /top:\s*"text-life"/);
    assert.match(panel, /chabrier:\s*"text-fg"/);
    assert.match(panel, /salpeter:\s*"text-fg-muted"/);
    assert.match(panel, /bottom:\s*"text-fg-subtle"/);
    assert.match(panel, /scale\.imfCurve/);
    assert.doesNotMatch(panel, /kind === "fj"/);
    const hubble = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/hubble-panel.tsx"),
      "utf8",
    );
    assert.doesNotMatch(hubble, /imfTitle|imfCurve|imfNiche/);
    const hud = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/universe-app.tsx"),
      "utf8",
    );
    assert.match(hud, /liveEpoch === "stellar"/);
    assert.match(hud, /copy\.obs\.imfNiche\[imf\.niche\]/);
    for (const c of [copyFor("en"), copyFor("ru"), copyFor("be")]) {
      assert.notEqual(c.obs.imfNiche.top, c.obs.imfNiche.bottom);
      assert.notEqual(c.obs.imfNiche.chabrier, c.obs.imfNiche.salpeter);
      assert.match(c.obs.imfHint, /IMF/);
    }
  });
});

describe("acoustic panel", () => {
  it("paints the wall niche and fattens odd peaks only when baryons load", () => {
    const panel = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../components/acoustic-panel.tsx"),
      "utf8",
    );
    assert.match(panel, /loaded:\s*"text-life"/);
    assert.match(panel, /clear:\s*"text-fg"/);
    assert.match(panel, /damped:\s*"text-fg-subtle"/);
    assert.match(panel, /silent:\s*"text-fg-muted"/);
    assert.match(panel, /d\.baryonLoad > 1\.15/);
    assert.doesNotMatch(panel, /camb|planck/i);
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
