import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!token) return Response.json({ error: "Payments not configured" }, { status: 503, headers: cors });
  const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}") as Record<string, string>;
  const publicKey = publishableKeys.default || Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(url, publicKey, { global: { headers: { Authorization: authorization } } });
  const jwt = authorization.replace(/^Bearer\s+/i, "");
  const { data: { user }, error: userError } = await client.auth.getUser(jwt);
  if (userError || !user?.email) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  const { data: settingsRows } = await client.rpc("get_orcamovel_settings");
  const settings = Array.isArray(settingsRows) ? settingsRows[0] : settingsRows;
  const promotionActive = settings?.promotion_ends_at && Date.now() <= new Date(settings.promotion_ends_at).getTime();
  const plans = {
    monthly: { title: "OrçaMóvel Mensal", price: Number(settings?.monthly_price ?? 9.99) },
    annual: { title: "OrçaMóvel Anual", price: Number(settings?.annual_price ?? 99.99) },
    lifetime: { title: "OrçaMóvel Vitalício", price: Number(promotionActive ? settings?.lifetime_promo_price ?? 149.99 : settings?.lifetime_price ?? 249.99) },
  } as const;

  const body = await request.json().catch(() => ({}));
  const plan = body.plan as keyof typeof plans;
  const selected = plans[plan];
  if (!selected) return Response.json({ error: "Invalid plan" }, { status: 400, headers: cors });
  const appUrl = Deno.env.get("APP_URL") || "https://cortecloud-site-l4lh.vercel.app";
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [{ id: plan, title: selected.title, description: "Acesso ao gerador profissional de orçamentos", category_id: "services", quantity: 1, currency_id: "BRL", unit_price: selected.price }],
      payer: { email: user.email }, external_reference: user.id, metadata: { user_id: user.id, plan },
      back_urls: { success: `${appUrl}/?payment=success`, pending: `${appUrl}/?payment=pending`, failure: `${appUrl}/?payment=failure` },
      auto_return: "approved", notification_url: `${url}/functions/v1/mercado-pago-webhook`,
    }),
  });
  const preference = await response.json();
  if (!response.ok || !preference.init_point) {
    console.error("Mercado Pago preference rejected", response.status, preference);
    const reason = preference?.message || preference?.cause?.[0]?.description || "Checkout unavailable";
    return Response.json({ error: reason, code: "mercado_pago_rejected" }, { status: 502, headers: cors });
  }
  return Response.json({ checkoutUrl: preference.init_point }, { headers: cors });
});
