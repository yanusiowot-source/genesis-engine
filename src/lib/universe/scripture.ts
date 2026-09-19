import type { CosmicEpoch, Fate } from "./types";

export type PassageId =
  | "gen1_1"
  | "gen1_2"
  | "gen1_3"
  | "gen1_16"
  | "gen1_31"
  | "john1_1"
  | "heb11_3"
  | "ps19_1"
  | "ps8_3"
  | "ps147_4"
  | "isa40_22"
  | "isa40_26"
  | "isa45_18"
  | "job26_7"
  | "job38_31"
  | "col1_17"
  | "eccl3_11"
  | "pet3_8"
  | "rev21_1";

export type ScriptureTheme =
  | "origin"
  | "void"
  | "light"
  | "stars"
  | "inhabited"
  | "heavens"
  | "word"
  | "hold"
  | "nothing"
  | "time"
  | "end";

type Tongue = { en: string; ru: string; be: string };

export type Passage = {
  id: PassageId;
  ref: string;
  query: string;
  theme: ScriptureTheme;
  line: Tongue;
  text: Tongue;
};

export const PASSAGES: readonly Passage[] = [
  {
    id: "gen1_1",
    ref: "Genesis 1:1",
    query: "Genesis 1:1",
    theme: "origin",
    line: {
      en: "In the beginning God created the heaven and the earth.",
      ru: "В начале сотворил Бог небо и землю.",
      be: "Напачатку стварыў Бог неба і зямлю.",
    },
    text: {
      en: "In the beginning God created the heaven and the earth.",
      ru: "В начале сотворил Бог небо и землю.",
      be: "Напачатку стварыў Бог неба і зямлю.",
    },
  },
  {
    id: "gen1_2",
    ref: "Genesis 1:2",
    query: "Genesis 1:2",
    theme: "void",
    line: {
      en: "And the earth was without form, and void; and darkness was upon the face of the deep.",
      ru: "Земля же была безвидна и пуста, и тьма над бездною.",
      be: "А зямля была безладная і пустая, і цемра над безданню.",
    },
    text: {
      en: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
      ru: "Земля же была безвидна и пуста, и тьма над бездною, и Дух Божий носился над водою.",
      be: "А зямля была безладная і пустая, і цемра над безданню, і Дух Божы насіўся над вадою.",
    },
  },
  {
    id: "gen1_3",
    ref: "Genesis 1:3",
    query: "Genesis 1:3",
    theme: "light",
    line: {
      en: "And God said, Let there be light: and there was light.",
      ru: "И сказал Бог: да будет свет. И стал свет.",
      be: "І сказаў Бог: няхай будзе святло. І стала святло.",
    },
    text: {
      en: "And God said, Let there be light: and there was light.",
      ru: "И сказал Бог: да будет свет. И стал свет.",
      be: "І сказаў Бог: няхай будзе святло. І стала святло.",
    },
  },
  {
    id: "gen1_16",
    ref: "Genesis 1:16",
    query: "Genesis 1:14-16",
    theme: "stars",
    line: {
      en: "He made the stars also.",
      ru: "…и звёзды.",
      be: "…і зоркі.",
    },
    text: {
      en: "And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.",
      ru: "И создал Бог два светила великие: светило большее, для управления днем, и светило меньшее, для управления ночью, и звезды.",
      be: "І стварыў Бог два свяцілы вялікія: свяціла большае, каб кіраваць днём, і свяціла меншае, каб кіраваць ноччу, і зоркі.",
    },
  },
  {
    id: "gen1_31",
    ref: "Genesis 1:31",
    query: "Genesis 1:31",
    theme: "inhabited",
    line: {
      en: "And God saw every thing that he had made, and, behold, it was very good.",
      ru: "И увидел Бог всё, что Он создал, и вот, хорошо весьма.",
      be: "І ўбачыў Бог усё, што Ён стварыў, і вось, добра вельмі.",
    },
    text: {
      en: "And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.",
      ru: "И увидел Бог всё, что Он создал, и вот, хорошо весьма. И был вечер, и было утро: день шестой.",
      be: "І ўбачыў Бог усё, што Ён стварыў, і вось, добра вельмі. І быў вечар, і была раніца: дзень шосты.",
    },
  },
  {
    id: "john1_1",
    ref: "John 1:1–3",
    query: "John 1:1-3",
    theme: "word",
    line: {
      en: "In the beginning was the Word… All things were made by him.",
      ru: "В начале было Слово… Всё чрез Него начало быть.",
      be: "Напачатку было Слова… Усё праз Яго пачало быць.",
    },
    text: {
      en: "In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God. All things were made by him; and without him was not any thing made that was made.",
      ru: "В начале было Слово, и Слово было у Бога, и Слово было Бог. Оно было в начале у Бога. Все чрез Него начало быть, и без Него ничто не начало быть, что начало быть.",
      be: "Напачатку было Слова, і Слова было ў Бога, і Слова было Бог. Яно было напачатку ў Бога. Усё праз Яго пачало быць, і без Яго нішто не пачало быць, што пачало быць.",
    },
  },
  {
    id: "heb11_3",
    ref: "Hebrews 11:3",
    query: "Hebrews 11:3",
    theme: "word",
    line: {
      en: "The worlds were framed by the word of God.",
      ru: "Верою познаём, что веки устроены словом Божиим.",
      be: "Вераю пазнаём, што вякі ўладкаваны словам Божым.",
    },
    text: {
      en: "Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.",
      ru: "Верою познаём, что веки устроены словом Божиим, так что из невидимого произошло видимое.",
      be: "Вераю пазнаём, што вякі ўладкаваны словам Божым, так што з нябачнага стала бачнае.",
    },
  },
  {
    id: "ps19_1",
    ref: "Psalm 19:1",
    query: "Psalm 19:1",
    theme: "heavens",
    line: {
      en: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
      ru: "Небеса проповедуют славу Божию, и о делах рук Его вещает твердь.",
      be: "Нябёсы абвяшчаюць славу Божую, і пра справы рук Яго гаворыць цвердзь.",
    },
    text: {
      en: "The heavens declare the glory of God; and the firmament sheweth his handywork.",
      ru: "Небеса проповедуют славу Божию, и о делах рук Его вещает твердь.",
      be: "Нябёсы абвяшчаюць славу Божую, і пра справы рук Яго гаворыць цвердзь.",
    },
  },
  {
    id: "ps8_3",
    ref: "Psalm 8:3–4",
    query: "Psalm 8:3-4",
    theme: "heavens",
    line: {
      en: "When I consider thy heavens… What is man, that thou art mindful of him?",
      ru: "Когда взираю я на небеса Твои… то что есть человек, что Ты помнишь его?",
      be: "Калі гляджу я на нябёсы Твае… што ёсць чалавек, што Ты памятаеш яго?",
    },
    text: {
      en: "When I consider thy heavens, the work of thy fingers, the moon and the stars, which thou hast ordained; What is man, that thou art mindful of him? and the son of man, that thou visitest him?",
      ru: "Когда взираю я на небеса Твои — дело Твоих перстов, на луну и звезды, которые Ты поставил, то что есть человек, что Ты помнишь его, и сын человеческий, что Ты посещаешь его?",
      be: "Калі гляджу я на нябёсы Твае — справу пальцаў Тваіх, на месяц і зоркі, якія Ты паставіў, што ёсць чалавек, што Ты памятаеш яго, і сын чалавечы, што Ты наведваеш яго?",
    },
  },
  {
    id: "ps147_4",
    ref: "Psalm 147:4",
    query: "Psalm 147:4",
    theme: "stars",
    line: {
      en: "He telleth the number of the stars; he calleth them all by their names.",
      ru: "Он исчисляет количество звёзд; всех их называет именами.",
      be: "Ён лічыць колькасць зорак; усіх іх называе імёнамі.",
    },
    text: {
      en: "He telleth the number of the stars; he calleth them all by their names.",
      ru: "Он исчисляет количество звезд; всех их называет именами своими.",
      be: "Ён лічыць колькасць зорак; усіх іх называе імёнамі сваімі.",
    },
  },
  {
    id: "isa40_22",
    ref: "Isaiah 40:22",
    query: "Isaiah 40:22",
    theme: "heavens",
    line: {
      en: "It is he… that stretcheth out the heavens as a curtain.",
      ru: "Он… распростёр небеса, как ткань.",
      be: "Ён… распасцёр нябёсы, як тканіну.",
    },
    text: {
      en: "It is he that sitteth upon the circle of the earth, and the inhabitants thereof are as grasshoppers; that stretcheth out the heavens as a curtain, and spreadeth them out as a tent to dwell in.",
      ru: "Он есть Тот, Который восседает над кругом земли, и живущие на ней — как саранча пред Ним; Он распростер небеса, как тонкую ткань, и раскинул их, как шатер для жилья.",
      be: "Ён ёсць Той, Хто сядзіць над кругам зямлі, і жыхары яе — як саранча перад Ім; Ён распасцёр нябёсы, як тонкую тканіну, і раскінуў іх, як шацёр для жытла.",
    },
  },
  {
    id: "isa40_26",
    ref: "Isaiah 40:26",
    query: "Isaiah 40:26",
    theme: "stars",
    line: {
      en: "Lift up your eyes on high, and behold who hath created these things.",
      ru: "Поднимите глаза ваши на высоту небес и посмотрите, кто сотворил их.",
      be: "Узнясіце вочы вашыя на вышыню нябёсаў і паглядзіце, хто стварыў іх.",
    },
    text: {
      en: "Lift up your eyes on high, and behold who hath created these things, that bringeth out their host by number: he calleth them all by names by the greatness of his might.",
      ru: "Поднимите глаза ваши на высоту небес и посмотрите, кто сотворил их? Кто выводит воинство их счетом? Он всех их называет по имени, по множеству могущества и великой силе у Него.",
      be: "Узнясіце вочы вашыя на вышыню нябёсаў і паглядзіце, хто стварыў іх? Хто выводзіць войска іх лікам? Ён усіх іх называе па імені, па мностве магутнасці і вялікай сіле ў Яго.",
    },
  },
  {
    id: "isa45_18",
    ref: "Isaiah 45:18",
    query: "Isaiah 45:18",
    theme: "inhabited",
    line: {
      en: "He created it not in vain, he formed it to be inhabited.",
      ru: "Он создал её не напрасно: Он образовал её для жительства.",
      be: "Ён стварыў яе не дарэмна: Ён утварыў яе для жыхарства.",
    },
    text: {
      en: "For thus saith the LORD that created the heavens; God himself that formed the earth and made it; he hath established it, he created it not in vain, he formed it to be inhabited: I am the LORD; and there is none else.",
      ru: "Ибо так говорит Господь, сотворивший небеса, Он, Бог, образовавший землю и создавший ее; Он утвердил ее, не напрасно сотворил ее; Он образовал ее для жительства: Я Господь, и нет иного.",
      be: "Бо так кажа Госпад, які стварыў нябёсы, Ён, Бог, які ўтварыў зямлю і стварыў яе; Ён сцвердзіў яе, не дарэмна стварыў яе; Ён утварыў яе для жыхарства: Я Госпад, і няма іншага.",
    },
  },
  {
    id: "job26_7",
    ref: "Job 26:7",
    query: "Job 26:7",
    theme: "nothing",
    line: {
      en: "He stretcheth out the north over the empty place, and hangeth the earth upon nothing.",
      ru: "Он распростёр север над пустотою, повесил землю ни на чем.",
      be: "Ён распасцёр поўнач над пустэчай, павесіў зямлю ні на чым.",
    },
    text: {
      en: "He stretcheth out the north over the empty place, and hangeth the earth upon nothing.",
      ru: "Он распростер север над пустотою, повесил землю ни на чем.",
      be: "Ён распасцёр поўнач над пустэчай, павесіў зямлю ні на чым.",
    },
  },
  {
    id: "job38_31",
    ref: "Job 38:31–33",
    query: "Job 38:31-33",
    theme: "stars",
    line: {
      en: "Canst thou bind the sweet influences of Pleiades, or loose the bands of Orion?",
      ru: "Можешь ли ты связать узел Плеяд и разрешить узы Ориона?",
      be: "Ці можаш ты звязаць вузел Плеяд і развязаць путы Арыёна?",
    },
    text: {
      en: "Canst thou bind the sweet influences of Pleiades, or loose the bands of Orion? Canst thou bring forth Mazzaroth in his season? or canst thou guide Arcturus with his sons? Knowest thou the ordinances of heaven?",
      ru: "Можешь ли ты связать узел Плеяд и разрешить узы Ориона? Можешь ли выводить созвездия в свое время и вести Медведицу с детьми ее? Знаешь ли ты уставы неба?",
      be: "Ці можаш ты звязаць вузел Плеяд і развязаць путы Арыёна? Ці можаш выводзіць сузор’і ў свой час і весці Мядзведзіцу з дзецьмі яе? Ці ведаеш ты статуты неба?",
    },
  },
  {
    id: "col1_17",
    ref: "Colossians 1:16–17",
    query: "Colossians 1:16-17",
    theme: "hold",
    line: {
      en: "All things were created by him… and by him all things consist.",
      ru: "Всё Им создано… и Им всё стоит.",
      be: "Усё Ім створана… і Ім усё стаіць.",
    },
    text: {
      en: "For by him were all things created, that are in heaven, and that are in earth, visible and invisible… all things were created by him, and for him: And he is before all things, and by him all things consist.",
      ru: "Ибо Им создано все, что на небесах и что на земле, видимое и невидимое… все Им и для Него создано; и Он есть прежде всего, и все Им стоит.",
      be: "Бо Ім створана ўсё, што на нябёсах і што на зямлі, бачнае і нябачнае… усё Ім і для Яго створана; і Ён ёсць раней за ўсё, і ўсё Ім стаіць.",
    },
  },
  {
    id: "eccl3_11",
    ref: "Ecclesiastes 3:11",
    query: "Ecclesiastes 3:11",
    theme: "time",
    line: {
      en: "He hath made every thing beautiful in his time: also he hath set the world in their heart.",
      ru: "Всё соделал Он прекрасным в свое время, и вложил мир в сердце их.",
      be: "Усё зрабіў Ён прыгожым у свой час, і ўклаў свет у сэрца іх.",
    },
    text: {
      en: "He hath made every thing beautiful in his time: also he hath set the world in their heart, so that no man can find out the work that God maketh from the beginning to the end.",
      ru: "Все соделал Он прекрасным в свое время, и вложил мир в сердце их, хотя человек не может постигнуть дел, которые Бог делает, от начала до конца.",
      be: "Усё зрабіў Ён прыгожым у свой час, і ўклаў свет у сэрца іх, хоць чалавек не можа зразумець спраў, якія Бог робіць, ад пачатку да канца.",
    },
  },
  {
    id: "pet3_8",
    ref: "2 Peter 3:8",
    query: "2 Peter 3:8",
    theme: "time",
    line: {
      en: "One day is with the Lord as a thousand years, and a thousand years as one day.",
      ru: "У Господа один день, как тысяча лет, и тысяча лет, как один день.",
      be: "У Госпада адзін дзень, як тысяча гадоў, і тысяча гадоў, як адзін дзень.",
    },
    text: {
      en: "But, beloved, be not ignorant of this one thing, that one day is with the Lord as a thousand years, and a thousand years as one day.",
      ru: "Одно то не должно быть сокрыто от вас, возлюбленные, что у Господа один день, как тысяча лет, и тысяча лет, как один день.",
      be: "Адно тое не павінна быць схавана ад вас, умілаваныя, што ў Госпада адзін дзень, як тысяча гадоў, і тысяча гадоў, як адзін дзень.",
    },
  },
  {
    id: "rev21_1",
    ref: "Revelation 21:1",
    query: "Revelation 21:1",
    theme: "end",
    line: {
      en: "And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away.",
      ru: "И увидел я новое небо и новую землю, ибо прежнее небо и прежняя земля миновали.",
      be: "І ўбачыў я новае неба і новую зямлю, бо ранейшае неба і ранейшая зямля мінулі.",
    },
    text: {
      en: "And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away; and there was no more sea.",
      ru: "И увидел я новое небо и новую землю, ибо прежнее небо и прежняя земля миновали, и моря уже нет.",
      be: "І ўбачыў я новае неба і новую зямлю, бо ранейшае неба і ранейшая зямля мінулі, і мора ўжо няма.",
    },
  },
];

const BY_ID = new Map(PASSAGES.map((p) => [p.id, p]));

export function passageById(id: PassageId): Passage {
  const hit = BY_ID.get(id);
  if (!hit) throw new Error(`unknown passage ${id}`);
  return hit;
}

export function pickPassageId(input: {
  epoch: CosmicEpoch;
  fate: Fate;
  ours: boolean;
}): PassageId {
  switch (input.epoch) {
    case "inflation":
      return "gen1_1";
    case "recombination":
      return "gen1_3";
    case "darkAges":
      return "gen1_2";
    case "reionization":
      return "gen1_16";
    case "stellar":
      if (input.fate === "teeming") return "gen1_31";
      if (input.fate === "habitable") return "isa45_18";
      if (input.fate === "enduring") return "eccl3_11";
      if (input.fate === "void" || input.fate === "fog" || input.fate === "rip") return "job26_7";
      if (input.ours) return "ps8_3";
      return "ps19_1";
    case "degeneracy":
      return "col1_17";
    case "blackHoles":
      return "job26_7";
    case "heatDeath":
      return "pet3_8";
  }
}

export function pickPassage(input: {
  epoch: CosmicEpoch;
  fate: Fate;
  ours: boolean;
}): Passage {
  return passageById(pickPassageId(input));
}

export function tongueOf(locale: string): keyof Tongue {
  if (locale === "ru" || locale.startsWith("ru-")) return "ru";
  if (locale === "be" || locale.startsWith("be-")) return "be";
  return "en";
}

const BOOKS: { en: string; ru: string; be: string }[] = [
  { en: "2 Peter", ru: "2 Петра", be: "2 Пятра" },
  { en: "Colossians", ru: "Колоссянам", be: "Да каласянаў" },
  { en: "Ecclesiastes", ru: "Екклесиаст", be: "Эклезіяст" },
  { en: "Revelation", ru: "Откровение", be: "Адкрыццё" },
  { en: "Hebrews", ru: "Евреям", be: "Да яўрэяў" },
  { en: "Genesis", ru: "Бытие", be: "Быццё" },
  { en: "Isaiah", ru: "Исаия", be: "Ісая" },
  { en: "Psalm", ru: "Псалом", be: "Псалом" },
  { en: "John", ru: "Иоанна", be: "Яна" },
  { en: "Job", ru: "Иов", be: "Ёў" },
];

/** Citation in the observatory tongue. Gateway search stays English. */
export function passageRef(passage: Passage, locale: string): string {
  const t = tongueOf(locale);
  if (t === "en") return passage.ref;
  const book = BOOKS.find((b) => passage.ref.startsWith(b.en));
  if (!book) return passage.ref;
  return `${book[t]}${passage.ref.slice(book.en.length)}`;
}

export function passageLine(passage: Passage, locale: string): string {
  return passage.line[tongueOf(locale)];
}

export function passageText(passage: Passage, locale: string): string {
  return passage.text[tongueOf(locale)];
}

export function passageUrl(passage: Passage, locale: string): string {
  const version = tongueOf(locale) === "en" ? "KJV" : "RUSV";
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage.query)}&version=${version}`;
}

export const THEME_ORDER: ScriptureTheme[] = [
  "origin",
  "word",
  "void",
  "light",
  "stars",
  "heavens",
  "inhabited",
  "hold",
  "nothing",
  "time",
  "end",
];

export const THEME_LABEL: Record<keyof Tongue, Record<ScriptureTheme, string>> = {
  en: {
    origin: "Origin",
    word: "Word",
    void: "Void",
    light: "Light",
    stars: "Stars",
    heavens: "Heavens",
    inhabited: "Inhabited",
    hold: "Hold",
    nothing: "Nothing",
    time: "Time",
    end: "End",
  },
  ru: {
    origin: "Начало",
    word: "Слово",
    void: "Пустота",
    light: "Свет",
    stars: "Звёзды",
    heavens: "Небеса",
    inhabited: "Обитаемо",
    hold: "Стоит",
    nothing: "Ни на чём",
    time: "Время",
    end: "Конец",
  },
  be: {
    origin: "Пачатак",
    word: "Слова",
    void: "Пустэча",
    light: "Святло",
    stars: "Зоркі",
    heavens: "Нябёсы",
    inhabited: "Населена",
    hold: "Стаіць",
    nothing: "Ні на чым",
    time: "Час",
    end: "Канец",
  },
};
