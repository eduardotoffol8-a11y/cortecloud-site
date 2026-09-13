const CACHE = "orcamovel-v3";
const BRAND_ICON_CACHE = "orcamovel-brand-icon-v1";
const CORE = ["/", "/manifest.webmanifest", "/favicon.svg", "/pwa-company-icon-192.png", "/pwa-company-icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== BRAND_ICON_CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/pwa-company-icon-192.png" || url.pathname === "/pwa-company-icon-512.png") {
    event.respondWith(caches.open(BRAND_ICON_CACHE).then((cache) => cache.match(url.pathname)).then((custom) => custom || fetch(event.request)));
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put("/", response.clone()));
      return response;
    }).catch(() => caches.match("/")));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => {
    const network = fetch(event.request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return response;
    });
    return cached || network;
  }));
});
