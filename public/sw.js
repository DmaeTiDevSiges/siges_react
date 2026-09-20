// SIGES service worker — SAFE version for Vite hashed builds behind Cloudflare.
//
// Goals:
// 1. NEVER cache the Cloudflare security challenge (it is served as text/html
//    with 200/403 for ANY path, including /assets/*.js). Caching it poisons
//    the app: dynamic import() then receives HTML instead of JS and throws
//    "Failed to fetch dynamically imported module".
// 2. NEVER serve a stale index.html that references deleted hashed chunks.
//    Navigations are network-first with fallback to cache only when offline.
// 3. Hashed /assets/* files are immutable — cache-first is safe for them.
// 4. Clean up legacy caches (e.g. 'siges-v1' from the old aggressive SW that
//    cached every 200 response including challenge pages).

const CACHE_NAME = 'siges-safe-v1';
const LEGACY_CACHES = ['siges-v1'];
const PRECACHE_URLS = ['/manifest.json', '/siges_logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // Extra safety: also drop known legacy names even if the list above changes.
      await Promise.all(LEGACY_CACHES.map((name) => caches.delete(name)).map((p) => p.catch(() => undefined)));
      await self.clients.claim();
    })()
  );
});

function isAssetRequest(url) {
  return url.pathname.startsWith('/assets/');
}

function shouldBypass(request, url) {
  // Non-GET, cross-origin, Cloudflare challenge endpoints and
  // Turnstile/challenge iframes must never go through our cache.
  if (request.method !== 'GET') return true;
  if (url.origin !== self.location.origin) return true;
  if (url.pathname.startsWith('/cdn-cgi/')) return true;
  if (request.destination === 'document' && url.searchParams.has('t')) return false;
  return false;
}

function isChallengeResponse(response, url) {
  // Cloudflare challenge pages are HTML. If we requested JS/CSS (or an
  // /assets/* file) but got HTML back, it is a challenge/captcha page or the
  // SPA fallback — never cache it as the asset.
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const wantsAsset =
    isAssetRequest(url) ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');
  if (wantsAsset && contentType.includes('text/html')) return true;
  if (response.headers.has('cf-mitigated')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  if (shouldBypass(request, url)) return;

  // Navigations (/, /index.html, SPA routes): network-first.
  // A cached index.html with old hashed chunk names is exactly what causes
  // "Failed to fetch dynamically imported module" after each deploy.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  // Hashed build assets: cache-first (immutable filenames).
  if (isAssetRequest(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.status === 200 && !isChallengeResponse(response, url)) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
            }
            return response;
          })
      )
    );
    return;
  }

  // Everything else (images, fonts, manifest): network-first, cache fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && !isChallengeResponse(response, url)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
