import type { Copy, Locale } from "./i18n.ts";
import { formatCount, formatGtC, formatGyr, formatPct, formatSci } from "./format.ts";
import type { SiliconDossier } from "./physics.ts";
import { PARAM_META, derivedAstro, FATE_LABEL } from "./physics.ts";
import {
  acousticDossier,
  agnDossier,
  diskDossier,
  grmhdDossier,
  haloDossier,
  imfHighMass,
  imfMeanMass,
  imfNicheOf,
  imfReturn,
} from "./observatory.ts";
import type { CivModel } from "./civilization.ts";
import { biosphereOf } from "./biosphere.ts";
import type { ExpeditionResult } from "./research.ts";
import type { UniverseRecord } from "./types.ts";
import type { DiscoveryResult } from "./symbolic.ts";
import type { BayesResult } from "./bayes.ts";
import { formatBf } from "./bayes.ts";
import type { McmcResult } from "./mcmc.ts";
import { PUBLIC_LAB_URL } from "./studio.ts";

export function buildFieldReport(args: {
  record: UniverseRecord;
  locale: Locale;
  copy: Copy;
  silicon: SiliconDossier;
  civ?: CivModel;
  expedition?: ExpeditionResult | null;
  law?: DiscoveryResult | null;
  bayes?: BayesResult | null;
  mcmc?: McmcResult | null;
}): string {
  const { record, locale, copy, silicon, civ, expedition, law, bayes, mcmc } = args;
  const ev = record.evaluation;
  const p = record.params;
  const astro = derivedAstro(p, ev);
  const ru = locale === "ru" || locale === "be";

  const lines: string[] = [];
  lines.push(`# ${ru ? "Полевой отчёт" : "Field report"} · ${record.name}`);
  lines.push("");
  lines.push(`${ru ? "Каталог" : "Catalog"}: ${record.catalog}`);
  lines.push(`${ru ? "Судьба" : "Fate"}: ${copy.fateLabel[ev.fate]} (${FATE_LABEL[ev.fate]})`);
  lines.push(
    `${ru ? "Морфология" : "Morphology"}: ${copy.morphology[ev.morphology]}`,
  );
  lines.push("");
  lines.push(`## ${ru ? "Аннотация" : "Abstract"}`);
  lines.push("");
  lines.push(copy.fateCopy[ev.fate]);
  lines.push("");
  lines.push(
    ru
      ? `Углеродная обитаемость ${formatPct(ev.lifeProb)}; кремниевая (спекулятивная) ${formatPct(ev.siliconProb)} (${copy.siliconNote[ev.siliconNiche]}); Дайсон/вечность ${formatPct(ev.eternalProb)} (${copy.eternalNote[ev.eternalNiche]}); прилив фон Неймана ${formatPct(ev.swarmProb ?? 0)} (${copy.swarmNote[ev.swarmNiche ?? "silent"]}). Это гомология по константам, не космологический код.`
      : `Carbon habitability ${formatPct(ev.lifeProb)}; silicon (speculative) ${formatPct(ev.siliconProb)} (${copy.siliconNote[ev.siliconNiche]}); Dyson/eternal ${formatPct(ev.eternalProb)} (${copy.eternalNote[ev.eternalNiche]}); von Neumann tide ${formatPct(ev.swarmProb ?? 0)} (${copy.swarmNote[ev.swarmNiche ?? "silent"]}). Homology from the constants, not a Boltzmann solver.`,
  );
  lines.push("");
  lines.push(`## ${ru ? "Методы" : "Methods"}`);
  lines.push("");
  lines.push(
    ru
      ? "Оценка жизни — замкнутая форма: окна Гаусса вокруг ΛCDM, сигмоиды по времени жизни звёзд, риск сжатия и разгона. Кремний смещён к большей G. Вечность — отдельная огибающая (Дайсон 1979 / Краусс–Старкман 2000): Λ≈0, без сжатия и разрыва. Нейросеть не обучалась."
      : "Life is a closed form: Gaussians around ΛCDM, sigmoids on stellar lifetime, recollapse and runaway risk. Silicon is shifted to higher G. Eternity is a separate envelope (Dyson 1979 / Krauss–Starkman 2000): Λ≈0, no crunch, no rip. No neural net was trained.",
  );
  lines.push("");
  lines.push(`## ${ru ? "Константы" : "Constants"}`);
  lines.push("");
  for (const meta of PARAM_META) {
    const digits = meta.step < 0.01 ? 3 : 2;
    lines.push(
      `- ${copy.params[meta.key].label} (${meta.unit}): ${p[meta.key].toFixed(digits)}`,
    );
  }
  lines.push("");
  lines.push(`## ${ru ? "Результаты" : "Results"}`);
  lines.push("");
  lines.push(`- ${copy.stats.stellar}: ${formatGyr(ev.stellarLifetimeGyr)}`);
  lines.push(`- ${copy.stats.first}: ${formatGyr(ev.timeToStarsGyr)}`);
  lines.push(`- ${copy.stats.window}: ${formatGyr(ev.lifeWindowGyr)}`);
  lines.push(`- ${copy.stats.generations}: ${ev.generations.toFixed(1)}`);
  lines.push(`- ${copy.astroHubble}: ${astro.hubble.toFixed(1)} km/s/Mpc`);
  lines.push(`- ${copy.astroAge}: ${formatGyr(astro.ageGyr)}`);
  lines.push(`- ${copy.astroGalaxy}: ${astro.galaxyKpc.toFixed(1)} kpc`);
  lines.push(`- ${copy.astroSfr}: ${astro.sfr.toFixed(2)} M☉/yr`);
  lines.push(`- ${copy.astroRho}: ${formatSci(astro.rhoCrit)} kg/m³`);
  lines.push(`- ${copy.astroCurvature}: ${astro.omegaK.toFixed(3)}`);
  lines.push(
    `- ${ru ? "Доля тёмной материи" : "Dark-matter share"}: ${formatPct(ev.darkMatterFraction)}`,
  );
  const halo = haloDossier(p, ev);
  lines.push(`- ${copy.obs.haloTitle}: ${copy.obs.haloNiche[halo.niche]}`);
  lines.push(
    `- ${copy.obs.haloOuter}: ${Math.round(halo.outerKms)} ${copy.obs.rotationV} (${copy.obs.haloBaryonV} ${Math.round(halo.baryonKms)})`,
  );
  const ac = acousticDossier(p, ev);
  lines.push(
    `- ${copy.obs.acousticTitle}: ${copy.obs.acousticNiche[ac.niche]}, ${copy.obs.acousticEll} ${Math.round(ac.ell1)}`,
  );
  const disk = diskDossier(p, ev);
  lines.push(
    `- ${copy.obs.diskTitle}: ${copy.obs.diskNiche[disk.niche]}, ${copy.obs.diskQ} ${disk.Q.toFixed(2)}`,
  );
  const xImf = imfHighMass(p, ev);
  const nImf = imfNicheOf(xImf);
  lines.push(
    `- ${copy.obs.imfTitle}: ${copy.obs.imfNiche[nImf]}, ${copy.obs.imfSlope} ${xImf.toFixed(2)}, ${copy.obs.imfMean} ${imfMeanMass(xImf, nImf).toFixed(2)}, ${copy.obs.imfR} ${imfReturn(xImf, nImf).toFixed(2)}`,
  );
  const agn = agnDossier(p, ev);
  const hole = grmhdDossier(p, ev);
  lines.push(
    `- ${copy.obs.bhTitle}: ${copy.obs.bhNiche[agn.niche]}, ${copy.obs.agnMode[agn.mode]}, ${copy.obs.grmhdSpin} ${hole.aStar.toFixed(2)}, ${copy.obs.grmhdState[hole.state]}`,
  );
  lines.push("");
  lines.push(`## ${ru ? "Кремниевое досье" : "Silicon dossier"}`);
  lines.push("");
  lines.push(`- ${copy.siliconSolvent}: ${copy.solventLabel[silicon.solvent]}`);
  lines.push(`- ${copy.siliconStarT}: ${silicon.starTempK} K`);
  lines.push(`- ${copy.siliconSurfaceG}: ${silicon.surfaceG} g`);
  lines.push(`- ${copy.siliconOxygen}: ${formatPct(silicon.oxygenSink)}`);
  if (silicon.blockers.length) {
    lines.push(
      `- ${copy.siliconBlockers}: ${silicon.blockers.map((b) => copy.siliconBlocker[b]).join("; ")}`,
    );
  } else {
    lines.push(`- ${copy.siliconNoVeto}`);
  }
  lines.push("");

  if (civ) {
    lines.push(`## ${ru ? "Окно разума (спекуляция)" : "Intelligence window (speculative)"}`);
    lines.push("");
    lines.push(
      ru
        ? `Это не прогноз. Бутылочные горлышки Drake-типа по структуре, окну жизни и устойчивости. Путь: ${civ.path === "none" ? "нет химии" : civ.path === "carbon" ? "углерод" : "кремний"}. P(разум) ${formatPct(civ.pIntelligence)}.`
        : `Not a forecast. Drake-style bottlenecks from structure, the life window, and stability. Path: ${civ.path}. P(intelligence) ${formatPct(civ.pIntelligence)}.`,
    );
    for (const s of civ.stages) {
      lines.push(
        `- ${copy.civ.stages[s.id]}: ${formatPct(s.pSurvive)} @ ${formatGyr(s.tStartGyr)}`,
      );
    }
    lines.push("");
  }

  {
    const bio = biosphereOf(record.params, ev);
    lines.push(`## ${ru ? "Биомасса (гомология)" : "Biomass (homology)"}`);
    lines.push("");
    lines.push(
      ru
        ? `Мир-аналог ${formatGtC(bio.worldGtC)}. Калибровка — живой углерод Земли (Bar-On et al. 2018). Не перепись.`
        : `World analog ${formatGtC(bio.worldGtC)}. Calibrated to Earth’s living carbon (Bar-On et al. 2018). Not a census.`,
    );
    if (bio.taxa.length) {
      const ranked = [...bio.taxa].sort((a, b) => b.biomassGtC - a.biomassGtC);
      for (const t of ranked) {
        lines.push(
          `- ${copy.bio.taxa[t.id]}: ${formatGtC(t.biomassGtC)}${t.open ? ` · ${formatCount(t.species)}` : ""}`,
        );
      }
    }
    for (const g of bio.grades) {
      lines.push(
        `- ${copy.bio.grades[g.id]}: ${g.open ? copy.bio.open : copy.bio.closed} @ ${formatGyr(g.tOpenGyr)}`,
      );
    }
    lines.push("");
  }

  if (expedition) {
    lines.push(`## ${ru ? "Экспедиция" : "Expedition"}`);
    lines.push("");
    lines.push(
      ru
        ? `Наблюдатель: ${expedition.sampleN} вселенных из смешанного приора. Цель: ${copy.research.target[expedition.target]}. Углеродно обитаемых ${expedition.viableCarbon}, кремниевых ${expedition.viableSilicon}, открытых Дайсону ${expedition.viableEternal}, открытых приливу ${expedition.viableSwarm}. Корреляция C–Si: ${expedition.corr.toFixed(2)}.`
        : `Observer: ${expedition.sampleN} universes from a mixed prior. Target: ${copy.research.target[expedition.target]}. Carbon-viable ${expedition.viableCarbon}, silicon-viable ${expedition.viableSilicon}, Dyson-open ${expedition.viableEternal}, tide-open ${expedition.viableSwarm}. C–Si correlation: ${expedition.corr.toFixed(2)}.`,
    );
    lines.push("");
    lines.push(ru ? "Важность признаков (перестановка evaluate, не сеть):" : "Feature importance (permutation of evaluate, not a net):");
    for (const row of expedition.importance) {
      lines.push(`- ${copy.params[row.key].label}: ${formatPct(row.value)}`);
    }
    lines.push("");
  }

  if (law) {
    lines.push(`## ${ru ? "Символический закон" : "Symbolic law"}`);
    lines.push("");
    lines.push(`$${law.best.formula}$`);
    lines.push("");
    lines.push(
      ru
        ? `Цель ${copy.research.target[law.target]}. Метод: ${law.best.method === "gp" ? "генетическая программа" : "словарь + ridge"}. R² обучение ${law.best.r2Train.toFixed(2)}, отложено ${law.best.r2Test.toFixed(2)}, AIC ${law.best.aic.toFixed(0)}, узлов ${law.best.complexity}. Формула восстанавливает evaluate, не природу.`
        : `Target ${copy.research.target[law.target]}. Method: ${law.best.method === "gp" ? "genetic program" : "dictionary + ridge"}. R² train ${law.best.r2Train.toFixed(2)}, held-out ${law.best.r2Test.toFixed(2)}, AIC ${law.best.aic.toFixed(0)}, nodes ${law.best.complexity}. Recovery of evaluate, not a claim about nature.`,
    );
    lines.push("");
  }

  if (bayes) {
    const h = bayes.hypothesis;
    lines.push(`## ${ru ? "Байесовский тест" : "Bayesian test"}`);
    lines.push("");
    lines.push(
      ru
        ? `${copy.params[h.key].label} ${h.dir === "lt" ? "<" : ">"} ${h.threshold}. P(жизнь | условие) ${formatPct(bayes.pCond)} [${formatPct(bayes.pCondLo)}, ${formatPct(bayes.pCondHi)}]; вне ${formatPct(bayes.pNot)}. BF₁₀ ${formatBf(bayes.bf10)} (ln ${bayes.logBf10.toFixed(2)}). P(p₁>p₀) ${formatPct(bayes.pGreater)}.`
        : `${copy.params[h.key].label} ${h.dir === "lt" ? "<" : ">"} ${h.threshold}. P(life | condition) ${formatPct(bayes.pCond)} [${formatPct(bayes.pCondLo)}, ${formatPct(bayes.pCondHi)}]; otherwise ${formatPct(bayes.pNot)}. BF₁₀ ${formatBf(bayes.bf10)} (ln ${bayes.logBf10.toFixed(2)}). P(p₁>p₀) ${formatPct(bayes.pGreater)}.`,
    );
    lines.push("");
  }

  if (mcmc) {
    lines.push(`## ${ru ? "Метрополис–Гастингс" : "Metropolis–Hastings"}`);
    lines.push("");
    lines.push(
      ru
        ? `Равномерный приор на шести ручках. Правдоподобие — evaluate() для цели ${copy.research.target[mcmc.target]}. Шагов ${mcmc.nSteps}, отжиг ${mcmc.burnIn}, прореживание ${mcmc.thin}. Принято ${formatPct(mcmc.acceptRate)}, ESS ${mcmc.ess.toFixed(0)}, MAP ${formatPct(mcmc.map.score)}.`
        : `Uniform prior on the six knobs. Likelihood is evaluate() for ${copy.research.target[mcmc.target]}. ${mcmc.nSteps} steps, burn-in ${mcmc.burnIn}, thin ${mcmc.thin}. Accepted ${formatPct(mcmc.acceptRate)}, ESS ${mcmc.ess.toFixed(0)}, MAP ${formatPct(mcmc.map.score)}.`,
    );
    lines.push("");
  }

  if (record.chronicle) {
    lines.push(`## ${copy.chronicle}`);
    lines.push("");
    lines.push(record.chronicle);
    lines.push("");
  }

  lines.push(`## ${ru ? "Ограничения" : "Limitations"}`);
  lines.push("");
  lines.push(
    ru
      ? "Числа — аналоги, подогнанные к Planck H₀, 13.8 млрд лет и диску Млечного Пути в нашей вселенной. Нет уравнений Фридмана, нет химической кинетики, нет переписи умов. Кремниевая биохимия на Земле не наблюдалась."
      : "Numbers are analogs tuned so our universe lands near Planck H₀, 13.8 Gyr, and a Milky-Way disk. No Friedmann solver, no chemical kinetics, no census of minds. Silicon biochemistry has not been observed on Earth.",
  );
  lines.push("");
  lines.push(`— Genesis Engine ${copy.version}`);
  lines.push(PUBLIC_LAB_URL);
  return lines.join("\n");
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function reportFilename(record: UniverseRecord): string {
  return `genesis-${record.catalog.toLowerCase()}.md`;
}
