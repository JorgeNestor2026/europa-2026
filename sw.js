// Europa 2026 — Service Worker
// Versión: cambiá este número cada vez que actualices archivos
const CACHE_NAME = 'europa-2026-v3';

// Archivos del HUB que se cachean para offline
const ASSETS = [
  '/europa-2026/',
  '/europa-2026/index.html',
  '/europa-2026/manifest.json',
  '/europa-2026/icons/icon-192.png',
  '/europa-2026/icons/icon-512.png',
];

// ── INSTALL: guardar assets del hub en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: borrar caches viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── FETCH: cache-first para assets propios, network-first para guías
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Para los repos de cada ciudad: intentar red primero, caché como fallback
  const cityRepos = [
    'paris-en-familia',
    'Londres-en-familia',
    'Roma-en-Familia',
    'Firenze',
    'Venecia',
    'MIlan',
    'Madrid',
  ];
  const isCity = cityRepos.some((r) => url.pathname.includes(r));

  if (isCity) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para assets propios: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
