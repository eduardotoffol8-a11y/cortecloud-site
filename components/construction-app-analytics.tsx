"use client";

import { useEffect } from "react";
import { getAnalyticsSessionId, getAnalyticsVisitorId, trackOrcaEvent } from "@/lib/analytics-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ConstructionAppAnalytics() {
  useEffect(() => {
    void trackOrcaEvent("app_open", "obra-civil", { path: window.location.pathname, source: "app" });

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;

    const trackWorkspace = async () => {
      const { data: authData } = await supabase.auth.getSession();
      const session = authData.session;
      if (!session || cancelled) return;

      const { data: access } = await supabase
        .from("product_entitlements")
        .select("trial_ends_at,subscription_status,plan_type,access_expires_at")
        .eq("user_id", session.user.id)
        .eq("product_id", "obra-civil")
        .maybeSingle();
      if (!access || cancelled) return;

      const now = Date.now();
      const paidAccess = access.subscription_status === "active" && Boolean(access.plan_type) && (
        access.plan_type === "lifetime"
        || !access.access_expires_at
        || new Date(access.access_expires_at).getTime() > now
      );
      const trialAccess = access.subscription_status === "trial" && new Date(access.trial_ends_at).getTime() > now;
      if (!paidAccess && !trialAccess) return;

      await supabase.rpc("track_orca_event", {
        p_product_id: "obra-civil",
        p_event_type: "workspace_open",
        p_session_id: getAnalyticsSessionId(),
        p_metadata: { source: "authenticated" },
        p_visitor_id: getAnalyticsVisitorId(),
      });
    };

    void trackWorkspace();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) return;
      window.setTimeout(() => void trackWorkspace(), 0);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
