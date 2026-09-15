"use client";

import { useEffect, useMemo, useState } from "react";
import { InstallAppButton } from "./install-app-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ConstructionInstallBridge() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [show, setShow] = useState(false);

  useEffect(() => {
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
