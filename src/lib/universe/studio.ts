/** Hosted lab. Source stays in the private repository. */
export const PUBLIC_LAB_URL = "https://yanusiowot-source.github.io/genesis-lab/";
export const PUBLIC_ABOUT_URL = `${PUBLIC_LAB_URL}about/`;
export const AUTHOR_X_URL = "https://x.com/yanusio";
export const AUTHOR_X_ID = "1652518444795928590";
/** One-time desktop copy. Settled in USDT because card rails do not pay out to the author. */
export const COPY_PRICE = "15";
export const COPY_CURRENCY = "USDT";

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
