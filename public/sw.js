const CACHE = "orcamovel-v14";
const BRAND_ICON_CACHE = "orcamovel-brand-icon-v2";
const CORE = [
  "/apps/moveis",
  "/manifest.webmanifest",
  "/orcamovel-official-192.png",
  "/orcamovel-official-512.png",
  "/orcamovel-install-192-v2.png",
  "/orcamovel-install-512-v2.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys
      .filter((key) => key.startsWith("orcamovel-") && key !== CACHE && key !== BRAND_ICON_CACHE)
      .map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // OrçaObra has its own worker, manifest, route and offline fallback. The legacy
  // OrçaMóvel worker may still exist with root scope on devices that installed an
  // older version, so it must never answer OrçaObra requests.
  if (
    url.pathname.startsWith("/apps/obra-civil")
    || url.pathname === "/orcaobra-manifest.webmanifest"
    || url.pathname.startsWith("/orcaobra-")
  ) return;

  // The product hub is not part of the OrçaMóvel PWA. Always load it from the
  // network so an old cached shell cannot render without its current CSS/JS.
  if (event.request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(fetch(event.request));
    return;
  }

  if (url.pathname === "/manifest.webmanifest") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request, { cache: "no-store" });
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch {
        return (await cache.match(event.request)) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname === "/orcamovel-install-192-v2.png" || url.pathname === "/orcamovel-install-512-v2.png") {
    event.respondWith(caches.open(BRAND_ICON_CACHE).then((cache) => cache.match(url.pathname)).then((custom) => custom || fetch(event.request)));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok && url.pathname.startsWith("/apps/moveis")) {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        if (!url.pathname.startsWith("/apps/moveis")) return Response.error();
        const cache = await caches.open(CACHE);
        return (await cache.match(event.request, { ignoreSearch: true }))
          || (await cache.match("/apps/moveis"))
          || Response.error();
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