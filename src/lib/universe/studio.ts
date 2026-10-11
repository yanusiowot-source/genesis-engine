/** Hosted lab (Pages). genesis-lab is the build. genesis-engine is source, all rights reserved. */
export const PUBLIC_LAB_URL = "https://yanusiowot-source.github.io/genesis-lab/";
export const PUBLIC_ABOUT_URL = `${PUBLIC_LAB_URL}about/`;
export const PUBLIC_LAB_REPO_URL = "https://github.com/yanusiowot-source/genesis-lab";
export const PUBLIC_SOURCE_REPO_URL = "https://github.com/yanusiowot-source/genesis-engine";
export const AUTHOR_X_URL = "https://x.com/yanusio";
export const AUTHOR_X_ID = "1652518444795928590";
export const APP_VERSION = "1.66.0";
export const APP_VERSION_SHORT = APP_VERSION.split(".").slice(0, 2).join(".");
/** One-time desktop copy. Settled in USDT because card rails do not pay out to the author. */
export const COPY_PRICE = "15";
export const COPY_CURRENCY = "USDT";
/** Binance deposit — BNB Smart Chain / ETH-format. Not the USDT token contract. */
export const PAY_USDT_BEP20 = "0xcfbf90866165174a66aa99bda14917cc67fffb50";
/** Binance deposit — Native Segwit. Prefer this over Taproot for wallet support. */
export const PAY_BTC = "bc1qd6gnul7wjsq4yv78yt5gra82ywsslr6rtcw86v";

export const PAY_RAILS = [
  { id: "usdt", label: "USDT · BEP20", value: PAY_USDT_BEP20 },
  { id: "btc", label: "Bitcoin · Segwit", value: PAY_BTC },
] as const;

export type PayRail = (typeof PAY_RAILS)[number];

export function orderCopyUrl(text: string) {
  const q = new URLSearchParams({
    recipient_id: AUTHOR_X_ID,
    text,
  });
  return `https://x.com/messages/compose?${q.toString()}`;
}

export function isHostedLab(href = "") {
  const url = href || (typeof window === "undefined" ? "" : window.location.href);
  return url.includes("yanusiowot-source.github.io/genesis-lab");
}

export function isAboutHash(href = "") {
  const url = href || (typeof window === "undefined" ? "" : window.location.href);
  try {
    const parsed = new URL(url, "https://yanusiowot-source.github.io/genesis-lab/");
    if (parsed.hash.replace(/^#/, "") === "about") return true;
    return /\/about\/?$/.test(parsed.pathname.replace(/\/+$/, "") + "/");
  } catch {
    return /#about(?:$|[?#])/i.test(url) || /\/about\/?(?:$|[?#])/i.test(url);
  }
}

export function isKeepHash(href = "") {
  const url = href || (typeof window === "undefined" ? "" : window.location.href);
  try {
    const parsed = new URL(url, "https://yanusiowot-source.github.io/genesis-lab/");
    return parsed.hash.replace(/^#/, "") === "keep";
  } catch {
    return /#keep(?:$|[?#])/i.test(url);
  }
}

export function productOffers() {
  return [
    {
      "@type": "Offer",
      name: "Public laboratory",
      price: "0",
      priceCurrency: "USD",
      description: "The public laboratory is free. No ads, no accounts, no subscription.",
    },
    {
      "@type": "Offer",
      name: "Desktop copy",
      price: COPY_PRICE,
      priceCurrency: "USD",
      description:
        "Windows or Linux copy. One-time. 15 USDT (BEP20) or the same value in Bitcoin, then a note on X with the plate. Not a lock on the sky.",
    },
  ];
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
