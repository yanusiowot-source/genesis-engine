import { formatGyr, formatPct } from "./format.ts";
import { derivedAstro, FATE_COPY, isBeltParams, isHighwayParams } from "./physics.ts";
import { mulberry32 } from "./rng.ts";
import type { Evaluation, Fate, Morphology, UniverseParams } from "./types.ts";

const FATE_RU: Record<Fate, string> = {
  void: "Водород не собирается. Звёзды не зажигаются. Остывающий туман, и некому его назвать.",
  crunch: "Материя побеждает. Небо схлопывается и сгорает раньше химии.",
  rip: "Ускорение рвёт сгустки. Галактики не собираются. Ночь пустая.",
  flash: "Звёзды вспыхивают и гаснут сразу. Нет тихих гигалет для остывания мира.",
  fog: "Первые рябь — не того масштаба. Небо так и не становится галактиками.",
  sterile: "Диски есть. Химии нет. Музей без посетителей.",
  enduring:
    "Звёзды гаснут, горизонта нет. Остатки могут считать без границы — Дайсон 1979, если согласна физика частиц.",
  habitable: "Тонкий коридор. Звёзды живут. Металлы копятся. Водные миры не запрещены.",
  teeming: "Поколения звёзд, длинные ночи, плотное тихое небо. Здесь жизнь — правило, не чудо.",
};

const FATE_BE: Record<Fate, string> = {
  void: "Вадарод не збіраецца. Зоркі не запальваюцца. Астываючы туман, і няма каму яго назваць.",
  crunch: "Матэрыя перамагае. Неба складаецца і згарае раней за хімію.",
  rip: "Паскарэнне рве згусткі. Галактыкі не збіраюцца. Ноч пустая.",
  flash: "Зоркі ўспыхваюць і гаснуць адразу. Няма ціхіх гігалет для астывання свету.",
  fog: "Першая рабізна — не таго маштабу. Неба так і не становіцца галактыкамі.",
  sterile: "Дыскі ёсць. Хіміі няма. Музей без наведвальнікаў.",
  enduring:
    "Зоркі гаснуць, гарызонту няма. Рэшткі могуць лічыць без мяжы — Дайсан 1979, калі згодная фізіка часціц.",
  habitable: "Тонкі калідор. Зоркі жывуць. Металы копяцца. Водныя светы не забаронены.",
  teeming: "Пакаленні зорак, доўгія ночы, шчыльнае ціхае неба. Тут жыццё — правіла, не цуд.",
};

const MORPH_EN: Record<Morphology, string> = {
  scattered: "a field of embers",
  irregular: "an irregular",
  elliptical: "an elliptical",
  spiral: "a spiral",
};

const MORPH_RU: Record<Morphology, string> = {
  scattered: "поле углей",
  irregular: "неправильная",
  elliptical: "эллиптическая",
  spiral: "спираль",
};

const MORPH_BE: Record<Morphology, string> = {
  scattered: "поле вуголляў",
  irregular: "няправільная",
  elliptical: "эліптычная",
  spiral: "спіраль",
};

export type FieldNoteInput = {
  name: string;
  catalog: string;
  params: UniverseParams;
  evaluation: Evaluation;
  locale?: string;
  salt?: number;
  versus?: string | null;
};

function pick<T>(rng: () => number, a: T, b: T): T {
  return rng() < 0.5 ? a : b;
}

function lifeEn(ev: Evaluation, rng: () => number): string {
  const carbon = pick(
    rng,
    `Carbon–water intelligence sits at ${formatPct(ev.lifeProb)} — an envelope, not a census.`,
    `The carbon–water corridor is ${formatPct(ev.lifeProb)}. That is an envelope, not a headcount.`,
  );
  const silicon =
    ev.siliconProb >= 0.18
      ? ` Speculative silicon chemistry is ${formatPct(ev.siliconProb)} (${ev.siliconNiche}); no organism is claimed.`
      : " Silicon chemistry is negligible here; it is not inflated.";
  const eternal =
    ev.eternalProb >= 0.18
      ? ` Dyson’s remnant loophole is ${formatPct(ev.eternalProb)} (${ev.eternalNiche}): unbounded subjective time if Λ stays near zero, not a proof of gods.`
      : " Eternal computation is closed — a de Sitter horizon, or no remnants.";
  const swarm =
    ev.swarmProb >= 0.18
      ? ` Von Neumann tide ${formatPct(ev.swarmProb)} (${ev.swarmNiche}): a self-replicating wave is a clock, not a census.`
      : " No machine tide — Fermi still holds, or the hop is vetoed.";
  return carbon + silicon + eternal + swarm;
}

function lifeRu(ev: Evaluation): string {
  const carbon = `Углерод–вода: ${formatPct(ev.lifeProb)} — оболочка, не перепись.`;
  const silicon =
    ev.siliconProb >= 0.18
      ? ` Кремний (спекулятивно) ${formatPct(ev.siliconProb)} (${ev.siliconNiche}); организмов не выдумываем.`
      : " Кремниевая химия здесь почти мертва — не раздуваем её.";
  const eternal =
    ev.eternalProb >= 0.18
      ? ` Окно Дайсона ${formatPct(ev.eternalProb)} (${ev.eternalNiche}): лазейка Λ≈0, не бессмертие.`
      : " Вечное вычисление закрыто горизонтом де Ситтера.";
  const swarm =
    ev.swarmProb >= 0.18
      ? ` Прилив фон Неймана ${formatPct(ev.swarmProb)} (${ev.swarmNiche}): самовоспроизводящаяся волна — часы, не перепись.`
      : " Машинного прилива нет — Ферми держится, или прыжок запрещён.";
  return carbon + silicon + eternal + swarm;
}

function lifeBe(ev: Evaluation): string {
  const carbon = `Вуглярод–вада: ${formatPct(ev.lifeProb)} — абалонка, не перапіс.`;
  const silicon =
    ev.siliconProb >= 0.18
      ? ` Крэмній (спекулятыўна) ${formatPct(ev.siliconProb)} (${ev.siliconNiche}); арганізмаў не выдумваем.`
      : " Крэмніевая хімія тут амаль мёртвая — не раздзімаем яе.";
  const eternal =
    ev.eternalProb >= 0.18
      ? ` Акно Дайсана ${formatPct(ev.eternalProb)} (${ev.eternalNiche}): шчыліна Λ≈0, не несмяротнасць.`
      : " Вечнае вылічэнне закрытае гарызонтам дэ Сітэра.";
  const swarm =
    ev.swarmProb >= 0.18
      ? ` Прыліў фон Нэймана ${formatPct(ev.swarmProb)} (${ev.swarmNiche}): самаўзнаўляльная хваля — гадзіннік, не перапіс.`
      : " Машыннага прыліву няма — Фермі трымаецца, або скок забаронены.";
  return carbon + silicon + eternal + swarm;
}

export function fieldNote(input: FieldNoteInput): string {
  const { name, catalog, params, evaluation: ev } = input;
  const locale = (input.locale ?? "en").slice(0, 8);
  const rng = mulberry32((input.salt ?? 1) >>> 0 || 1);
  const astro = derivedAstro(params, ev);
  const age = formatGyr(astro.ageGyr);
  const first = formatGyr(ev.timeToStarsGyr);
  const lives = formatGyr(ev.stellarLifetimeGyr);

  const versus = (input.versus ?? "").trim();
  const versusBit = versus ? ` ${versus.replace(/\.*$/, ".")}` : "";
  const roadEn = isHighwayParams(params)
    ? " One road, two lanes, no towns for a Hubble time."
    : isBeltParams(params)
      ? " The ice is the mass that still moves — a belt, not a census."
      : "";
  const roadRu = isHighwayParams(params)
    ? " Одна дорога, две полосы, ни города на время Хаббла."
    : isBeltParams(params)
      ? " Лёд — масса, которая ещё движется. Пояс, не перепись."
      : "";
  const roadBe = isHighwayParams(params)
    ? " Адна дарога, дзве палосы, ні горада на час Хабла."
    : isBeltParams(params)
      ? " Лёд — маса, якая яшчэ рухаецца. Пояс, не перапіс."
      : "";

  if (locale === "ru") {
    const p1 = `${name} (${catalog}) — ${MORPH_RU[ev.morphology]}. Возраст ${age}.${versusBit}${roadRu} ${FATE_RU[ev.fate]} Первые звёзды около ${first}; живут ${lives}.`;
    return `${p1}\n\n${lifeRu(ev)}`;
  }
  if (locale === "be") {
    const p1 = `${name} (${catalog}) — ${MORPH_BE[ev.morphology]}. Узрост ${age}.${versusBit}${roadBe} ${FATE_BE[ev.fate]} Першыя зоркі каля ${first}; жывуць ${lives}.`;
    return `${p1}\n\n${lifeBe(ev)}`;
  }

  const opener = pick(
    rng,
    `${name} (${catalog}) is ${MORPH_EN[ev.morphology]}.`,
    `${MORPH_EN[ev.morphology][0].toUpperCase()}${MORPH_EN[ev.morphology].slice(1)} catalogued ${catalog}: ${name}.`,
  );
  const p1 = `${opener} Cosmic age ${age}.${versusBit}${roadEn} ${FATE_COPY[ev.fate]} First stars near ${first}; they live ${lives}.`;
  return `${p1}\n\n${lifeEn(ev, rng)}`;
}
