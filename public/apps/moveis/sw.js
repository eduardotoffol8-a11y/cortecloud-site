const CACHE = "orcamovel-v16";
const BRAND_ICON_CACHE = "orcamovel-brand-icon-v2";
const APP_HOME = "/apps/moveis";
const CORE = [
  APP_HOME,
  "/manifest.webmanifest?v=20260916-6",
  "/orcamovel-install-192-v2.png?v=20260916-6",
  "/orcamovel-install-512-v2.png?v=20260916-6",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("orcamovel-") && key !== CACHE && key !== BRAND_ICON_CACHE).map((key) => caches.delete(key)),
    )),
    self.clients.claim(),
  ]));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    if (!url.pathname.startsWith(APP_HOME)) return;
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request, { cache: "no-store" });
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(APP_HOME, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(APP_HOME)) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname === "/manifest.webmanifest") {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  if (url.pathname === "/orcamovel-install-192-v2.png" || url.pathname === "/orcamovel-install-512-v2.png") {
    event.respondWith(caches.open(BRAND_ICON_CACHE).then((cache) => cache.match(url.pathname)).then((custom) => custom || fetch(event.request, { cache: "no-store" })));
  }
});
