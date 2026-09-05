import type { Locale } from "./i18n";

export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

export function formatGyr(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 Gyr";
  if (n >= 100) return `${n.toFixed(0)} Gyr`;
  if (n >= 10) return `${n.toFixed(1)} Gyr`;
  if (n >= 1) return `${n.toFixed(2)} Gyr`;
  if (n >= 0.01) return `${n.toFixed(2)} Gyr`;
  return `${n.toExponential(1)} Gyr`;
}

export function formatKelvin(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 K";
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}×10⁶ K`;
  if (n >= 1000) return `${n.toFixed(0)} K`;
  if (n >= 10) return `${n.toFixed(1)} K`;
  return `${n.toFixed(2)} K`;
}

export function formatRelative(ts: number, locale: Locale): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  const abs = (unit: Intl.RelativeTimeFormatUnit, n: number) => {
    try {
      return new Intl.RelativeTimeFormat(locale === "hv" ? "en" : locale, {
        numeric: "auto",
      }).format(-n, unit);
    } catch {
      return locale === "be" || locale === "ru" ? `${n}` : `${n}`;
    }
  };
  if (s < 45) {
    try {
      return new Intl.RelativeTimeFormat(locale === "hv" ? "en" : locale, {
        numeric: "auto",
      }).format(0, "second");
    } catch {
      if (locale === "be") return "зараз";
      if (locale === "ru") return "сейчас";
      return "just now";
    }
  }
  const m = Math.round(s / 60);
  if (m < 60) return abs("minute", m);
  const h = Math.round(m / 60);
  if (h < 48) return abs("hour", h);
  const d = Math.round(h / 24);
  return abs("day", d);
}

export function formatSci(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "0";
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mant = n / 10 ** exp;
  const sign = n < 0 ? "−" : "";
  return `${sign}${Math.abs(mant).toFixed(2)}×10${toSuperscript(exp)}`;
}

export function formatGtC(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0 Gt C";
  if (n >= 100) return `${n.toFixed(0)} Gt C`;
  if (n >= 10) return `${n.toFixed(1)} Gt C`;
  if (n >= 1) return `${n.toFixed(2)} Gt C`;
  if (n >= 0.01) return `${n.toFixed(3)} Gt C`;
  return `${formatSci(n)} Gt C`;
}

export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 1000) return String(Math.round(n));
  return formatSci(n);
}

function toSuperscript(n: number): string {
  const glyphs: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
    "-": "⁻",
  };
  return String(n)
    .split("")
    .map((ch) => glyphs[ch] ?? ch)
    .join("");
}
