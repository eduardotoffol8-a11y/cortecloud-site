const CACHE = "orcaobra-v4";
const APP_HOME = "/apps/obra-civil";
const CORE = [
  APP_HOME,
  "/orcaobra-manifest.webmanifest?v=20260916-6",
  "/api/orcaobra-icon/192?v=20260916-6",
  "/api/orcaobra-icon/512?v=20260916-6",
  "/orcaobra-logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("orcaobra-") && key !== CACHE).map((key) => caches.delete(key)),
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

  if (url.pathname === "/orcaobra-manifest.webmanifest" || url.pathname.startsWith("/api/orcaobra-icon/")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
  }
});
