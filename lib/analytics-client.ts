export type OrcamovelAnalyticsEvent =
  | "site_view"
  | "app_open"
  | "workspace_open"
  | "site_plans_interest"
  | "plans_open"
  | "checkout_started";

const SESSION_KEY = "orcamovel.analytics.session.v1";
const VISITOR_KEY = "orcamovel.analytics.visitor.v1";

function createAnalyticsId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getAnalyticsSessionId() {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const generated = createAnalyticsId();
    window.sessionStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Random browser identifier only. It never contains an e-mail or profile field.
export function getAnalyticsVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const generated = createAnalyticsId();
    window.localStorage.setItem(VISITOR_KEY, generated);
    return generated;
  } catch {
    return getAnalyticsSessionId();
  }
}

export async function trackOrcamovelEvent(
  eventType: OrcamovelAnalyticsEvent,
  metadata: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  const sessionId = getAnalyticsSessionId();
  const visitorId = getAnalyticsVisitorId();
  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType,
        sessionId,
        visitorId,
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
