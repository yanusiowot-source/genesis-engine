import { APP_VERSION_SHORT } from "./studio.ts";

export const SW_CACHE_PREFIX = "genesis-sw-";
export const SW_CACHE_NAME = `${SW_CACHE_PREFIX}${APP_VERSION_SHORT}`;

export function shouldRegisterWorker(location: { protocol: string; hostname: string }): boolean {
  if (location.protocol === "https:") return true;
  return location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

/** Scope is the document directory so GitHub Pages /genesis-lab/ owns its cache. */
export function workerScope(href: string): { script: string; scope: string } {
  const here = new URL(href);
  const scope = new URL("./", here).href;
  const script = new URL("sw.js", here).href;
  return { script, scope };
}

export async function registerGenesisWorker(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!shouldRegisterWorker(window.location)) return false;
  const { script, scope } = workerScope(window.location.href);
  await navigator.serviceWorker.register(script, { scope });
  return true;
}
