/* Phonetic Word Replicator — offline service worker.
 *
 * Strategy (see docs/ARCHITECTURE.md → PWA):
 *  - navigations (HTML): network-first with cache fallback (fresh content when
 *    online, last-known page when offline).
 *  - immutable build assets (/…/_next/static/): cache-first.
 *  - dictionary packs, images, manifest: stale-while-revalidate.
 *  - everything else: network with cache fallback.
 *
 * The base path (GitHub Pages project sites) is handled implicitly: caching
 * decisions are same-origin and path-shape based, not hard-coded to "/pwr".
 */

const VERSION = "pwr-sw-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;

self.addEventListener("install", (event) => {
  // Nothing to precache: runtime caching fills the caches on first use.
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => !name.startsWith(VERSION)).map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

function isImmutableAsset(url) {
  return url.pathname.includes("/_next/static/");
}

function isCacheableStatic(url) {
  return (
    url.pathname.includes("/dictionaries/") ||
    url.pathname.includes("/img/") ||
    url.pathname.endsWith("/manifest.webmanifest")
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  if (hit) return hit;
  const response = await network;
  return response ?? new Response("Offline", { status: 503, statusText: "Offline" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES_CACHE));
    return;
  }
  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (isCacheableStatic(url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }
  // Other same-origin GETs: try the network, fall back to any cached copy.
  event.respondWith(networkFirst(request, PAGES_CACHE));
});
