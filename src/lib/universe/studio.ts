/** Hosted lab (Pages). genesis-lab is the build. genesis-engine is the MIT source. */
export const PUBLIC_LAB_URL = "https://yanusiowot-source.github.io/genesis-lab/";
export const PUBLIC_ABOUT_URL = `${PUBLIC_LAB_URL}about/`;
export const PUBLIC_LAB_REPO_URL = "https://github.com/yanusiowot-source/genesis-lab";
export const PUBLIC_SOURCE_REPO_URL = "https://github.com/yanusiowot-source/genesis-engine";
export const AUTHOR_X_URL = "https://x.com/yanusio";
export const AUTHOR_X_ID = "1652518444795928590";
export const APP_VERSION = "2.30.0";
export const APP_VERSION_SHORT = APP_VERSION.split(".").slice(0, 2).join(".");
/** Lowest whole dollar. A store listing can use this tier. The web desk accepts any whole dollar up to the cap. */
export const COPY_PRICE_MIN = 1;
export const COPY_PRICE_MAX = 500;
export const COPY_PRICE_CHOICES = [1, 5, 15] as const;
/** Floor, not the only price. Web settlement is this many USDT, or Bitcoin of the same value. */
export const COPY_PRICE = String(COPY_PRICE_MIN);
export const COPY_CURRENCY = "USDT";
/** Consumable the author creates in App Store Connect. The web desk is not that checkout. */
export const STORE_PRODUCT_ID = "app.genesisengine.lab.copy";
/** Binance deposit — BNB Smart Chain / ETH-format. Not the USDT token contract. */
export const PAY_USDT_BEP20 = "0xcfbf90866165174a66aa99bda14917cc67fffb50";
/** Binance deposit — Native Segwit. Prefer this over Taproot for wallet support. */
export const PAY_BTC = "bc1qd6gnul7wjsq4yv78yt5gra82ywsslr6rtcw86v";

export const PAY_RAILS = [
  { id: "usdt", label: "USDT · BEP20", value: PAY_USDT_BEP20 },
  { id: "btc", label: "Bitcoin · Segwit", value: PAY_BTC },
] as const;

export type PayRail = (typeof PAY_RAILS)[number];

export function clampCopyDollars(raw: number): number {
  if (!Number.isFinite(raw)) return COPY_PRICE_MIN;
  return Math.min(COPY_PRICE_MAX, Math.max(COPY_PRICE_MIN, Math.round(raw)));
}

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
        "From 1 USD, any whole dollar. On the web that many USDT (BEP20) or the same value in Bitcoin, then a note on X with the plate. An App Store price, if listed, is a dollar tier from $1 and is not this desk. Not a lock on the sky.",
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
