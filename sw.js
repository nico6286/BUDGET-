/* ── Budget Couple — Service Worker ── */
const CACHE_NAME = "budget-couple-v8"; // Changé en v8 pour forcer le nettoyage de l'ancien index.html buggé
const ASSETS = ["./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // 1. IGNORER les requêtes non-HTTP/HTTPS (règle le bug des extensions "chrome-extension://")
  if (!e.request.url.startsWith("http://") && !e.request.url.startsWith("https://")) return;

  // 2. Ne jamais intercepter ni mettre en cache les appels vers Google Apps Script
  if (e.request.url.includes("script.google.com")) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
