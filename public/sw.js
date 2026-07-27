const CACHE_NAME = 'escalalouvor-v2';
const APP_SHELL = [
  '/escalas/',
  '/escalas/index.html',
  '/escalas/manifest.json',
];

// ── Install: cacheia o app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ── Activate: remove caches antigos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: Network-first para API do Google, Cache-first para assets ──────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Requisições externas (Google APIs, fonts) — sempre network, sem cache
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('accounts.google.com') ||
    url.hostname.includes('firebase') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Assets do app (JS, CSS, imagens) — Cache-first com fallback para network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Retorna do cache mas atualiza em background (stale-while-revalidate)
        const fetchPromise = fetch(event.request)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkRes.clone());
              });
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached;
      }

      // Não está no cache — busca da rede e cacheia
      return fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkRes.clone());
            });
          }
          return networkRes;
        })
        .catch(() => {
          // Offline e não tem cache — retorna o index.html para SPA funcionar
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/escalas/');
          }
        });
    })
  );
});

// ── Sync em background quando volta online ────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
