const CACHE = "orcamovel-v15";
const APP_HOME = "/apps/moveis/";
const CORE = [
  APP_HOME,
  "/manifest.webmanifest",
  "/orcamovel-install-192-v2.png",
  "/orcamovel-install-512-v2.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith("orcamovel-") && key !== CACHE && key !== "orcamovel-brand-icon-v2").map((key) => caches.delete(key)),
  )));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    if (!url.pathname.startsWith("/apps/moveis")) return;
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
    event.respondWith(caches.open("orcamovel-brand-icon-v2").then((cache) => cache.match(url.pathname)).then((custom) => custom || fetch(event.request)));
  }
});
