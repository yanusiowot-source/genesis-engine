export type LangKind = "living" | "constructed";

export type LangRow = {
  id: string;
  iso: string;
  name: string;
  type: LangKind;
};

/** Interface packs we actually wrote. Everything else falls back to English chrome. */
export const AUTHORED = [
  "en",
  "ru",
  "be",
  "de",
  "nl",
  "fr",
  "es",
  "pt",
  "it",
  "pl",
  "uk",
  "zh",
  "ja",
  "ar",
  "tr",
  "hi",
  "ko",
  "eo",
  "tlh",
  "hv",
] as const;

export type AuthoredLocale = (typeof AUTHORED)[number];

export const AUTONYMS: Record<string, string> = {
  en: "English",
  ru: "Русский",
  be: "Беларуская",
  de: "Deutsch",
  nl: "Nederlands",
  fr: "Français",
  es: "Español",
  pt: "Português",
  it: "Italiano",
  pl: "Polski",
  uk: "Українська",
  zh: "中文",
  ja: "日本語",
  ar: "العربية",
  tr: "Türkçe",
  hi: "हिन्दी",
  ko: "한국어",
  eo: "Esperanto",
  tlh: "tlhIngan Hol",
  hv: "Valyrio Ābro",
};

export const ENGLISH_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  be: "Belarusian",
  de: "German",
  nl: "Dutch",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  pl: "Polish",
  uk: "Ukrainian",
  zh: "Chinese",
  ja: "Japanese",
  ar: "Arabic",
  tr: "Turkish",
  hi: "Hindi",
  ko: "Korean",
  eo: "Esperanto",
  tlh: "Klingon",
  hv: "High Valyrian",
  jbo: "Lojban",
  qya: "Quenya",
  sjn: "Sindarin",
};

const ISO3_TO_ID: Record<string, string> = {
  eng: "en",
  rus: "ru",
  bel: "be",
  deu: "de",
  nld: "nl",
  fra: "fr",
  spa: "es",
  por: "pt",
  ita: "it",
  pol: "pl",
  ukr: "uk",
  zho: "zh",
  cmn: "zh",
  jpn: "ja",
  ara: "ar",
  tur: "tr",
  hin: "hi",
  kor: "ko",
  epo: "eo",
};

/** Baked from ISO 639-3 (living) + constructed, including High Valyrian. */
export const LIVING_COUNT = 7027;
export const CONSTRUCTED_COUNT = 23;
export const LANGUAGE_COUNT = 7050;

export const PINNED_CONSTRUCTED = ["tlh", "hv", "eo", "jbo", "qya", "sjn"] as const;

export function hasPack(id: string): boolean {
  return (AUTHORED as readonly string[]).includes(id);
}

export function autonym(id: string): string {
  if (AUTONYMS[id]) return AUTONYMS[id];
  try {
    const tag = bcp47(id);
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(tag);
    if (name && name !== tag) return name;
  } catch {
    /* no CLDR name */
  }
  return ENGLISH_NAMES[id] ?? id;
}

export function bcp47(id: string): string {
  if (id === "hv") return "x-valyrian";
  if (id === "zh") return "zh-Hans";
  if (id === "tlh") return "tlh";
  return id;
}

export function isLanguageTag(raw: string): boolean {
  return /^[a-z]{2,8}(-[a-z0-9]{2,8})*$/i.test(raw.trim());
}

export function canonicalLocale(raw: string): string {
  const s = raw.trim().toLowerCase().replaceAll("_", "-");
  if (s === "x-valyrian" || s === "high-valyrian" || s === "valyrian") return "hv";
  if (s.startsWith("zh")) return "zh";
  const base = s.split("-")[0] ?? s;
  if (ISO3_TO_ID[base]) return ISO3_TO_ID[base];
  if (AUTONYMS[base] || hasPack(base)) return base;
  if (base.length >= 2 && base.length <= 8) return base;
  return "en";
}

export function isKnownLocale(raw: string): boolean {
  const id = canonicalLocale(raw);
  return hasPack(id) || isLanguageTag(id);
}
