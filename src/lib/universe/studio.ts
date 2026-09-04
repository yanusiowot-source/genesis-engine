/** Hosted lab. Source stays in the private repository. */
export const PUBLIC_LAB_URL = "https://yanusiowot-source.github.io/genesis-lab/";
export const PUBLIC_ABOUT_URL = `${PUBLIC_LAB_URL}#about`;
export const AUTHOR_X_URL = "https://x.com/yanusio";

export function isHostedLab(href = "") {
  const url = href || (typeof window === "undefined" ? "" : window.location.href);
  return url.includes("yanusiowot-source.github.io/genesis-lab");
}

export function isAboutHash(href = "") {
  const url = href || (typeof window === "undefined" ? "" : window.location.href);
  try {
    return new URL(url, "https://yanusiowot-source.github.io/genesis-lab/").hash.replace(/^#/, "") === "about";
  } catch {
    return /#about(?:$|[?#])/i.test(url);
  }
}
