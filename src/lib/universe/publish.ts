import type { BayesResult } from "./bayes.ts";
import { formatBf } from "./bayes.ts";
import type { CivModel } from "./civilization.ts";
import { formatGyr, formatPct, formatSci } from "./format.ts";
import type { Copy, Locale } from "./i18n.ts";
import type { SiliconDossier } from "./physics.ts";
import { FATE_LABEL, PARAM_META, derivedAstro } from "./physics.ts";
import { buildFieldReport } from "./report.ts";
import type { ExpeditionResult } from "./research.ts";
import type { DiscoveryResult } from "./symbolic.ts";
import type { UniverseRecord } from "./types.ts";

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function downloadBytes(filename: string, bytes: Uint8Array, mime: string): void {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  downloadBlob(filename, new Blob([copy], { type: mime }));
}

type ReportArgs = {
  record: UniverseRecord;
  locale: Locale;
  copy: Copy;
  silicon: SiliconDossier;
  civ?: CivModel;
  expedition?: ExpeditionResult | null;
  law?: DiscoveryResult | null;
  bayes?: BayesResult | null;
};

function slug(record: UniverseRecord): string {
  return record.catalog.toLowerCase();
}

export async function downloadDocx(args: ReportArgs): Promise<void> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");
  const md = buildFieldReport(args);
  const children = md.split("\n").map((line) => {
    if (line.startsWith("# ")) {
      return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 });
    }
    if (line.startsWith("## ")) {
      return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 });
    }
    if (line.startsWith("- ")) {
      return new Paragraph({ text: line.slice(2), bullet: { level: 0 } });
    }
    return new Paragraph({
      children: [new TextRun({ text: line.length ? line : " ", size: 22 })],
      spacing: { after: 80 },
    });
  });
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  downloadBlob(`genesis-${slug(args.record)}.docx`, blob);
}

export async function downloadPptx(args: ReportArgs): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "GENESIS", width: 13.333, height: 7.5 });
  pptx.layout = "GENESIS";
  pptx.author = "Genesis Engine";
  pptx.title = args.record.name;

  const bg = "09061A";
  const fg = "F6F0E4";
  const muted = "CFC0D8";
  const life = "5EE0B8";
  const ru = args.locale === "ru" || args.locale === "be";
  const ev = args.record.evaluation;
  const astro = derivedAstro(args.record.params, ev);
  const copy = args.copy;

  const title = pptx.addSlide();
  title.background = { color: bg };
  title.addText(copy.appName, {
    x: 0.8,
    y: 1.6,
    w: 11.5,
    h: 0.5,
    fontSize: 14,
    fontFace: "IBM Plex Mono",
    color: muted,
    margin: 0,
  });
  title.addText(args.record.name, {
    x: 0.8,
    y: 2.2,
    w: 11.5,
    h: 1.1,
    fontSize: 40,
    fontFace: "Georgia",
    color: fg,
    margin: 0,
  });
  title.addText(
    `${args.record.catalog}  ·  ${copy.fateLabel[ev.fate]}  ·  ${copy.carbon} ${formatPct(ev.lifeProb)}  ·  ${copy.silicon} ${formatPct(ev.siliconProb)}  ·  ${copy.eternal} ${formatPct(ev.eternalProb)}  ·  ${copy.swarm} ${formatPct(ev.swarmProb ?? 0)}`,
    {
      x: 0.8,
      y: 3.5,
      w: 11.5,
      h: 0.5,
      fontSize: 16,
      fontFace: "IBM Plex Mono",
      color: life,
      margin: 0,
    },
  );

  const constants = pptx.addSlide();
  constants.background = { color: bg };
  constants.addText(ru ? "Константы" : "Constants", {
    x: 0.8,
    y: 0.5,
    w: 11,
    h: 0.5,
    fontSize: 22,
    fontFace: "Georgia",
    color: fg,
    margin: 0,
  });
  constants.addTable(
    [
      [
        { text: ru ? "Параметр" : "Parameter", options: { color: muted, fontFace: "IBM Plex Mono", fontSize: 11 } },
        { text: ru ? "Значение" : "Value", options: { color: muted, fontFace: "IBM Plex Mono", fontSize: 11 } },
        { text: ru ? "Ед." : "Unit", options: { color: muted, fontFace: "IBM Plex Mono", fontSize: 11 } },
      ],
      ...PARAM_META.map((m) => [
        { text: copy.params[m.key].label, options: { color: fg, fontFace: "Calibri", fontSize: 14 } },
        {
          text: args.record.params[m.key].toFixed(m.step < 0.01 ? 3 : 2),
          options: { color: fg, fontFace: "IBM Plex Mono", fontSize: 14 },
        },
        { text: m.unit, options: { color: muted, fontFace: "IBM Plex Mono", fontSize: 14 } },
      ]),
    ],
    { x: 0.8, y: 1.2, w: 11.5, h: 5.2, colW: [5.5, 3.5, 2.5], border: [{ pt: 0 }, { pt: 0 }, { pt: 0 }, { pt: 0 }] },
  );

  const results = pptx.addSlide();
  results.background = { color: bg };
  results.addText(ru ? "Результаты (гомология)" : "Results (homology)", {
    x: 0.8,
    y: 0.5,
    w: 11,
    h: 0.5,
    fontSize: 22,
    fontFace: "Georgia",
    color: fg,
    margin: 0,
  });
  const rows: [string, string][] = [
    [copy.stats.stellar, formatGyr(ev.stellarLifetimeGyr)],
    [copy.stats.window, formatGyr(ev.lifeWindowGyr)],
    [copy.astroHubble, `${astro.hubble.toFixed(1)} km/s/Mpc`],
    [copy.astroAge, formatGyr(astro.ageGyr)],
    [copy.astroRho, `${formatSci(astro.rhoCrit)} kg/m³`],
    [copy.siliconSolvent, copy.solventLabel[args.silicon.solvent]],
  ];
  if (args.bayes) {
    rows.push([copy.laws.bf, formatBf(args.bayes.bf10)]);
  }
  if (args.law) {
    rows.push([copy.laws.r2Test, args.law.best.r2Test.toFixed(2)]);
  }
  results.addTable(
    rows.map(([k, v]) => [
      { text: k, options: { color: muted, fontFace: "Calibri", fontSize: 16 } },
      { text: v, options: { color: fg, fontFace: "IBM Plex Mono", fontSize: 16 } },
    ]),
    { x: 0.8, y: 1.3, w: 11.5, h: 5, colW: [6, 5.5], border: [{ pt: 0 }, { pt: 0 }, { pt: 0 }, { pt: 0 }] },
  );

  const limits = pptx.addSlide();
  limits.background = { color: bg };
  limits.addText(ru ? "Ограничения" : "Limitations", {
    x: 0.8,
    y: 1.8,
    w: 11.5,
    h: 0.6,
    fontSize: 22,
    fontFace: "Georgia",
    color: fg,
    margin: 0,
  });
  limits.addText(
    ru
      ? "Числа — аналоги, подогнанные к Planck H₀. Нет уравнений Фридмана, нет химической кинетики, нет нейросети. Кремниевая биохимия на Земле не наблюдалась."
      : "Numbers are analogs tuned to Planck H₀. No Friedmann solver, no chemical kinetics, no neural net. Silicon biochemistry has not been observed on Earth.",
    {
      x: 0.8,
      y: 2.6,
      w: 11.5,
      h: 2.2,
      fontSize: 18,
      fontFace: "Calibri",
      color: muted,
      margin: 0,
    },
  );

  await pptx.writeFile({ fileName: `genesis-${slug(args.record)}.pptx` });
}
