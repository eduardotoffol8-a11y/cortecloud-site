"use client";

import { useEffect } from "react";

export function ReferralRedirectBridge() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOrcamovelReferral = params.get("utm_source") === "indicacao"
      && params.get("utm_medium") === "compartilhamento";

    if (!isOrcamovelReferral) return;

    const query = params.toString();
    window.location.replace(`/apps/moveis/apresentacao${query ? `?${query}` : ""}`);
  }, []);

  return null;
}
