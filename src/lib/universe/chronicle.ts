import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { FATE_LABEL } from "./physics";
import type { Evaluation, UniverseParams } from "./types";
import { autonym, bcp47 } from "./languages-core.ts";

const Input = z.object({
  name: z.string().min(1).max(80),
  catalog: z.string().min(1).max(24),
  locale: z.string().min(2).max(24),
  params: z.object({
    gravity: z.number(),
    expansion: z.number(),
    darkEnergy: z.number(),
    matter: z.number(),
    complexity: z.number(),
    quantumNoise: z.number(),
  }),
  evaluation: z.object({
    lifeProb: z.number(),
    siliconProb: z.number(),
    siliconNiche: z.enum(["impossible", "marginal", "viable", "favored"]),
    eternalProb: z.number().optional(),
    eternalNiche: z.enum(["closed", "glimpse", "open", "dyson"]).optional(),
    remnantStructure: z.number().optional(),
    swarmProb: z.number().optional(),
    swarmNiche: z.enum(["silent", "seed", "bloom", "tide"]).optional(),
    fate: z.enum([
      "void",
      "crunch",
      "rip",
      "flash",
      "fog",
      "sterile",
      "enduring",
      "habitable",
      "teeming",
    ]),
    morphology: z.enum(["scattered", "irregular", "elliptical", "spiral"]),
    stellarLifetimeGyr: z.number(),
    timeToStarsGyr: z.number(),
    lifeWindowGyr: z.number(),
    generations: z.number(),
    structure: z.number(),
    recollapseRisk: z.number(),
    runawayRisk: z.number(),
    environmentDensity: z.number(),
    darkMatterFraction: z.number(),
    hubbleMix: z.object({
      spiral: z.number(),
      elliptical: z.number(),
      irregular: z.number(),
    }),
  }),
});

export type ChronicleResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

function buildPrompt(
  name: string,
  catalog: string,
  params: UniverseParams,
  ev: Evaluation,
  locale: string,
): string {
  const facts = [
    `${name} (${catalog})`,
    `fate: ${FATE_LABEL[ev.fate]}`,
    `morphology: ${ev.morphology}`,
    `P(carbon/water intelligence)=${(ev.lifeProb * 100).toFixed(1)}%`,
    `P(silicon biochemistry, speculative)=${(ev.siliconProb * 100).toFixed(1)}% (${ev.siliconNiche})`,
    `P(Dyson/eternal remnant minds, envelope)=${(ev.eternalProb * 100).toFixed(1)}% (${ev.eternalNiche})`,
    `P(von Neumann tide, envelope)=${((ev.swarmProb ?? 0) * 100).toFixed(1)}% (${ev.swarmNiche ?? "silent"})`,
    `G=${params.gravity.toFixed(2)} G₀`,
    `H=${params.expansion.toFixed(2)} H₀`,
    `ΩΛ=${params.darkEnergy.toFixed(2)}`,
    `Ωm=${params.matter.toFixed(2)}`,
    `order=${params.complexity.toFixed(2)}`,
    `δ=${params.quantumNoise.toFixed(3)}`,
    `stellar lifetime ${ev.stellarLifetimeGyr.toFixed(1)} Gyr`,
    `time to first stars ${ev.timeToStarsGyr.toFixed(1)} Gyr`,
    `habitable window ${ev.lifeWindowGyr.toFixed(1)} Gyr`,
    `stellar generations ${ev.generations.toFixed(1)}`,
    `environment density ${ev.environmentDensity.toFixed(2)}`,
    `dark matter fraction ${(ev.darkMatterFraction * 100).toFixed(0)}%`,
    `Hubble mix S/E/Irr ${(ev.hubbleMix.spiral * 100).toFixed(0)}/${(ev.hubbleMix.elliptical * 100).toFixed(0)}/${(ev.hubbleMix.irregular * 100).toFixed(0)}`,
  ].join("; ");

  const siliconCue =
    ev.siliconProb >= 0.18
      ? "If silicon probability is material, paragraph 2 should contrast carbon-water vs speculative silicon chemistry. Do not invent organisms."
      : "Silicon chemistry is negligible here — do not inflate it.";

  const eternalCue =
    ev.eternalProb >= 0.18
      ? " If the Dyson envelope is open, say so honestly: unbounded subjective time is a loophole of Λ≈0, not a proof of immortality. Mention Krauss–Starkman if Λ is not zero. Do not promise gods."
      : " Eternal/Dyson computation is closed here (almost certainly by a de Sitter horizon). Do not hint at immortality.";

  if (locale === "be") {
    return (
      "Ты — касмолаг з пяром эсэіста. Па фактах ніжэй напішы два кароткіх абзацы " +
      "(сумарна ≤ 110 слоў) пра гэты сусвет: 1) фізіка і лёс, 2) што гэта значыць для жыцця. " +
      "Без эмодзі, без спісаў, без загалоўкаў, без двукоссяў вакол усяго тэксту. " +
      "Не выдумвай лічбы — выкарыстоўвай толькі дадзеныя. Тон: спакойны, дакладны, крыху элегічны. " +
      (ev.siliconProb >= 0.18
        ? "Калі крэмніевая верагоднасць прыкметная, у другім абзацы параўнай вугляродную і крэмніевую хімію; не выдумвай арганізмы."
        : "Крэмніевая хімія тут амаль мёртвая — не раздзімай яе.") +
      (ev.eternalProb >= 0.18
        ? " Калі акно Дайсана адкрытае — скажы сумленна: неабмежаваны суб’ектыўны час — шчыліна Λ≈0, не доказ неўміручасці. Не абяцай багоў."
        : " Вечнае вылічэнне Дайсана тут закрытае. Не намякай на неўміручасць.") +
      "\n\n" +
      facts
    );
  }

  if (locale === "ru") {
    return (
      "Ты — космолог с пером эссеиста. По фактам ниже напиши две коротких абзаца " +
      "(суммарно ≤ 110 слов) о этой вселенной: 1) физика и судьба, 2) что это значит для жизни. " +
      "Без эмодзи, без списков, без заголовков, без кавычек вокруг всего текста. " +
      "Не выдумывай числа — используй только данные. Тон: спокойный, точный, чуть элегический. " +
      (ev.siliconProb >= 0.18
        ? "Если кремниевая вероятность заметна, во втором абзаце сравни углеродную и кремниевую химию; не выдумывай организмы."
        : "Кремниевая химия здесь почти мертва — не раздувай её.") +
      (ev.eternalProb >= 0.18
        ? " Если окно Дайсона открыто — скажи честно: неограниченное субъективное время — лазейка Λ≈0, не доказательство бессмертия. Не обещай богов."
        : " Вечное вычисление Дайсона здесь закрыто. Не намекай на бессмертие.") +
      "\n\n" +
      facts
    );
  }

  const langName = autonym(locale);
  const tag = bcp47(locale);
  const langLine =
    locale === "en"
      ? "Write in English."
      : `Write the two paragraphs entirely in ${langName} (BCP-47 ${tag}, code ${locale}). Keep scientific tokens (ΛCDM, Gyr, ΩΛ, G₀) in Latin script. If you cannot actually write this language, say so in one honest sentence, then write English. Do not invent a fake dialect.`;

  return (
    "You are a cosmologist with an essayist's ear. Using ONLY the facts below, write two short " +
    "paragraphs (≤ 110 words total) about this universe: (1) its physics and fate, (2) what that " +
    "means for life. No emoji, no lists, no title, no wrapping quotes. Do not invent numbers. " +
    "Tone: calm, precise, slightly elegiac. " +
    langLine +
    " " +
    siliconCue +
    eternalCue +
    "\n\n" +
    facts
  );
}

export const chronicleUniverse = createServerFn({ method: "POST" })
  .validator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<ChronicleResult> => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "Chronicle is unavailable in this environment." };
    }

    let res: Response;
    try {
      res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          model: "grok-4.6",
          temperature: 0.8,
          max_tokens: 220,
          reasoning_effort: "low",
          messages: [
            {
              role: "user",
              content: buildPrompt(
                data.name,
                data.catalog,
                data.params,
                {
                  ...data.evaluation,
                  eternalProb: data.evaluation.eternalProb ?? 0,
                  eternalNiche: data.evaluation.eternalNiche ?? "closed",
                  remnantStructure: data.evaluation.remnantStructure ?? 0,
                  swarmProb: data.evaluation.swarmProb ?? 0,
                  swarmNiche: data.evaluation.swarmNiche ?? "silent",
                },
                data.locale,
              ),
            },
          ],
        }),
      });
    } catch {
      return { ok: false, error: "Chronicle timed out. Try again." };
    }

    if (!res.ok) {
      return { ok: false, error: `Chronicle failed (${res.status}). Try again.` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false, error: "The chronicle came back empty." };
    return { ok: true, text };
  });
