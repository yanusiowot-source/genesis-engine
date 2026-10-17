/* Genesis Engine — same-origin LTE cache. Not a CDN, not Workbox.
 * Hashed /assets → cache-first. Documents → network-first, cache fallback.
 * Third-party (fonts, MAST) left on the wire.
 */
const CACHE = "genesis-sw-2.7";

const SHELL = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/icon-180.png",
  "/proof/m51.jpg",
  "/proof/herschel.jpg",
  "/proof/galileo.jpg",
  "/proof/moon.jpg",
  "/proof/ring.jpg",
  "/proof/cmb.jpg",
  "/proof/antennae.jpg",
  "/proof/shred.jpg",
  "/proof/cluster.jpg",
  "/proof/crab.jpg",
  "/proof/newton.jpg",
  "/proof/kepler.jpg",
  "/proof/saturn.jpg",
  "/proof/sun.jpg",
  "/proof/giant.jpg",
  "/proof/sirius.jpg",
  "/proof/hole.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.all(SHELL.map((path) => cache.add(path).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("genesis-sw-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function isHashedAsset(url) {
  return url.pathname.includes("/assets/") || /\.(?:js|css|woff2|png|svg|jpe?g|webp|ico|wasm)$/i.test(url.pathname);
}

function isDocument(request) {
  return request.mode === "navigate";
}

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    const cache = await caches.open(CACHE);
    await cache.put(request, copy);
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (!sameOrigin(url)) return;
  if (url.pathname.endsWith("/sw.js")) return;
  if (url.pathname.startsWith("/api/")) return;
  if (isDocument(request)) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
