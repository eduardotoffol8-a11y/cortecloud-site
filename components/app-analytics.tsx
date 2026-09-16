"use client";

import { useEffect } from "react";
import { getAnalyticsSessionId, getAnalyticsVisitorId, trackOrcamovelEvent } from "@/lib/analytics-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AppAnalytics() {
  useEffect(() => {
    void trackOrcamovelEvent("app_open", { path: window.location.pathname, source: "app" });

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;

    const trackWorkspace = async () => {
      const { data: authData } = await supabase.auth.getSession();
      const session = authData.session;
      if (!session || cancelled) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at,subscription_status,plan_type,access_expires_at")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!profile || cancelled) return;

      const now = Date.now();
      const paidAccess = profile.subscription_status === "active" && (
        profile.plan_type === "lifetime"
        || !profile.access_expires_at
        || new Date(profile.access_expires_at).getTime() > now
      );
      const trialAccess = new Date(profile.trial_ends_at).getTime() > now;
      if (!paidAccess && !trialAccess) return;

      await supabase.rpc("track_orcamovel_event", {
        p_event_type: "workspace_open",
        p_session_id: getAnalyticsSessionId(),
        p_metadata: { product: "moveis", source: "authenticated" },
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
