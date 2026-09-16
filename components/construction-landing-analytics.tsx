"use client";

import { useEffect } from "react";
import { trackOrcaEvent } from "@/lib/analytics-client";

export function ConstructionLandingAnalytics() {
  useEffect(() => {
    void trackOrcaEvent("site_view", "obra-civil", { path: location.pathname, source: "site" });
    const click = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href="#planos"]');
      if (!anchor) return;
      void trackOrcaEvent("site_plans_interest", "obra-civil", { path: location.pathname, source: "site" });
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, []);
  return null;
}
