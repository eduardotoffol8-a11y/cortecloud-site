import { createClient } from "@supabase/supabase-js";

// This public endpoint only accepts anonymous acquisition events. Authenticated
// commercial stages are recorded directly through the signed-in Supabase client.
const allowedEvents = new Set(["site_view", "app_open", "site_plans_interest"]);
const allowedProducts = new Set(["moveis", "obra-civil"]);
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dswqqmgadqwvisygnuib.supabase.co";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_4tv8A3SqS_9KC_Q8nykwlA_ZtX1dFtl";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      eventType?: string;
      product?: string;
      sessionId?: string;
      visitorId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.eventType || !allowedEvents.has(body.eventType)) {
      return Response.json({ ok: false, error: "invalid_event" }, { status: 400 });
    }
    const product = String(body.product || "moveis");
    if (!allowedProducts.has(product)) {
      return Response.json({ ok: false, error: "invalid_product" }, { status: 400 });
    }

    const sessionId = String(body.sessionId || "").slice(0, 100);
    if (!sessionId) {
      return Response.json({ ok: false, error: "missing_session" }, { status: 400 });
    }
    const visitorId = String(body.visitorId || sessionId).slice(0, 100);

    const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
      ? body.metadata
      : {};

    if (JSON.stringify(metadata).length > 4096) {
      return Response.json({ ok: false, error: "metadata_too_large" }, { status: 400 });
    }

    const supabase = createClient(projectUrl, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.rpc("track_orca_event", {
      p_product_id: product,
      p_event_type: body.eventType,
      p_session_id: sessionId,
      p_metadata: metadata,
      p_visitor_id: visitorId,
    });

    if (error) {
      console.error("Orça analytics error", error.message);
      return Response.json({ ok: false }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
