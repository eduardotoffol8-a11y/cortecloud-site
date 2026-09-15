const CACHE = "orcamovel-v11";
const BRAND_ICON_CACHE = "orcamovel-brand-icon-v2";
const CORE = [
  "/",
  "/apps/moveis",
  "/apps/obra-civil",
  "/manifest.webmanifest",
  "/orcaobra-manifest.webmanifest",
  "/orcamovel-official-192.png",
  "/orcamovel-official-512.png",
  "/orcamovel-install-192-v2.png",
  "/orcamovel-install-512-v2.png",
  "/orcaobra-logo.png",
];

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

  if (url.pathname === "/orcamovel-install-192-v2.png" || url.pathname === "/orcamovel-install-512-v2.png") {
    event.respondWith(caches.open(BRAND_ICON_CACHE).then((cache) => cache.match(url.pathname)).then((custom) => custom || fetch(event.request)));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE);
        const constructionFallback = url.pathname.startsWith("/apps/obra-civil")
          ? await cache.match("/apps/obra-civil")
          : undefined;
        return (await cache.match(event.request, { ignoreSearch: true }))
          || constructionFallback
          || (await cache.match("/apps/moveis"))
          || (await cache.match("/"));
      }
    })());
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
