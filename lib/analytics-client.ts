export type OrcamovelAnalyticsEvent = "site_view" | "app_open" | "plans_open" | "checkout_started";

const SESSION_KEY = "orcamovel.analytics.session.v1";

export function getAnalyticsSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export async function trackOrcamovelEvent(
  eventType: OrcamovelAnalyticsEvent,
  metadata: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const sessionId = getAnalyticsSessionId();
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        sessionId,
        metadata: { product: "moveis", ...metadata },
      }),
      cache: "no-store",
      keepalive: true,
      credentials: "same-origin",
    });
  } catch {
    // Analytics must never block the user experience.
  }
}
