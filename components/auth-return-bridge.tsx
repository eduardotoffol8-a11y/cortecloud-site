"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthReturnBridge() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const isAuthReturn = query.has("code") || hash.has("access_token") || hash.has("refresh_token");
    if (!isAuthReturn) return;

    setActive(true);
    const savedDestination = window.localStorage.getItem("orcamento.auth-return");
    const lastProduct = window.localStorage.getItem("orcamento.pwa-last-product");
    const destination = savedDestination === "/apps/obra-civil" || (!savedDestination && lastProduct === "obra")
      ? "/apps/obra-civil"
      : "/apps/moveis";
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      window.location.replace(destination);
      return;
    }

    let cancelled = false;
    const goToApp = () => {
      if (cancelled) return;
      const openPlans = destination === "/apps/moveis" && window.localStorage.getItem("orcamovel.open-plans") === "1";
      window.localStorage.removeItem("orcamento.auth-return");
      window.location.replace(openPlans ? "/apps/moveis?plans=1" : destination);
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (session) goToApp(); });

    const finish = async () => {
      for (const delay of [0, 250, 750, 1500, 2500]) {
        if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
        if (cancelled) return;
        const { data } = await supabase.auth.getSession();
        if (data.session) return goToApp();
      }
      goToApp();
    };
    void finish();

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#f2f6f5] p-6" role="status" aria-live="polite">
      <div className="app-card w-full max-w-sm p-7 text-center">
        <LoaderCircle className="mx-auto animate-spin text-[var(--brand)]" size={28} />
        <h1 className="mt-4 text-lg font-extrabold">Concluindo seu acesso</h1>
        <p className="mt-2 text-sm leading-6 text-[#687875]">Abrindo seu aplicativo no dispositivo…</p>
      </div>
    </div>
  );
}
