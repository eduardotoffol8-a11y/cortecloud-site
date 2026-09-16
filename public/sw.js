// Worker raiz legado. Mantido apenas para que instalações antigas recebam uma
// atualização que remove o controle global. Os PWAs atuais usam workers isolados
// em /apps/moveis e /apps/obra-civil.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith("orcamovel-") && key !== "orcamovel-brand-icon-v2")
      .map((key) => caches.delete(key)));
    await self.registration.unregister();
  })());
});
