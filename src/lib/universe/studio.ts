/** Hosted lab. Source stays in the private repository. */
export const PUBLIC_LAB_URL = "https://yanusiowot-source.github.io/genesis-lab/";
export const AUTHOR_X_URL = "https://x.com/yanusio";

export function isHostedLab(href = "") {
  const url = href || (typeof window === "undefined" ? "" : window.location.href);
  return url.includes("yanusiowot-source.github.io/genesis-lab");
}
