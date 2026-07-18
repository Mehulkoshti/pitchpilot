/**
 * PitchPilot service worker.
 *
 * Makes the app genuinely usable on a stadium's saturated network: the app
 * shell and static assets are cached on install, so a cold start works with no
 * connection at all. The deterministic engine already ships to the browser, so
 * once the shell loads, wayfinding and the concierge keep answering offline.
 *
 * Two rules matter most:
 *  - `/api/*` is never cached. A stale gate queue is worse than no answer, and
 *    the client already falls back to the local engine when a call fails.
 *  - Navigations are network-first, so fans see live data whenever they can,
 *    and the cached shell (then the offline page) only when they cannot.
 *
 * Bump VERSION to invalidate every cache on the next deploy.
 */

const VERSION = 'v2';
const SHELL_CACHE = `pitchpilot-shell-${VERSION}`;
const RUNTIME_CACHE = `pitchpilot-runtime-${VERSION}`;
const OFFLINE_URL = '/offline';

/** Routes and assets precached so a cold start needs no network. */
const SHELL_ASSETS = [
  '/',
  '/fan',
  '/ops',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Added one-by-one: `addAll` rejects the whole install if any single
      // asset 404s, which would silently leave the app with no offline support.
      await Promise.allSettled(SHELL_ASSETS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GETs are cacheable; POSTs to the AI routes must always hit the network.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never serve stale telemetry or AI answers.
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Next.js fingerprints these filenames, so a hit is always correct.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

/** Live data when reachable; cached shell, then the offline page, when not. */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request)) ?? (await caches.match(request));
    if (cached) return cached;

    // Redirect to the offline page rather than serving its HTML under the
    // requested URL. Returning the body directly does render — but the client
    // router then hydrates, sees the address bar does not match the /offline
    // route, and replaces it with the 404 page. Redirecting keeps URL and
    // markup in agreement. The pathname guard stops a redirect loop when
    // /offline itself is the thing missing from the cache.
    if (new URL(request.url).pathname !== OFFLINE_URL) {
      return Response.redirect(
        new URL(OFFLINE_URL, self.location.origin).toString(),
        302
      );
    }
    return Response.error();
  }
}

/** For immutable, content-hashed assets. */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return Response.error();
  }
}

/** Instant from cache, refreshed in the background for the next visit. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached ?? Response.error());
  return cached ?? network;
}
