"use client";

import { useEffect } from "react";
import { trackOrcamovelEvent } from "@/lib/analytics-client";

export function AppAnalytics() {
  useEffect(() => {
    void trackOrcamovelEvent("app_open", { path: window.location.pathname, source: "app" });
  }, []);

  return null;
}
