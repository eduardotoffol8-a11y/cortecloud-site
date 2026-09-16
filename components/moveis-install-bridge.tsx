"use client";

import { useEffect } from "react";

export function MoveisInstallBridge() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const rootScope = `${window.location.origin}/`;
        await Promise.all(registrations.filter((registration) => registration.scope === rootScope).map((registration) => registration.unregister()));
        await navigator.serviceWorker.register("/apps/moveis/sw.js", {
          scope: "/apps/moveis/",
          updateViaCache: "none",
        });
      } catch {
        // A aplicação continua funcional mesmo se o navegador bloquear PWA.
      }
    })();
  }, []);

  return null;
}
