"use client";

import { useEffect, useMemo, useState } from "react";
import { InstallAppButton } from "./install-app-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function ensureConstructionWorker() {
  if (!("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  const rootScope = `${window.location.origin}/`;

  await Promise.all(registrations.map(async (registration) => {
    if (registration.scope !== rootScope) return;
    const script = registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || "";
    if (script.endsWith("/sw.js")) await registration.unregister();
  }));

  await navigator.serviceWorker.register("/apps/obra-civil/sw.js", {
    scope: "/apps/obra-civil/",
    updateViaCache: "none",
  });
}

export function ConstructionInstallBridge() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [show, setShow] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("orcamento.pwa-last-product", "obra");
    void ensureConstructionWorker().catch(() => undefined);
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setShow(!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setShow(!session));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!show) return null;
  return (
    <div className="fixed right-4 top-4 z-[60]">
      <InstallAppButton product="obra" />
    </div>
  );
}
