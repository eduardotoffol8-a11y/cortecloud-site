import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const lifetimePromotionEndsAt = new Date("2026-09-21T03:59:59.000Z").getTime();
const plans = {
  monthly: { title: "OrçaMóvel Mensal", price: 9.99 },
  annual: { title: "OrçaMóvel Anual", price: 99.99 },
  lifetime: { title: "OrçaMóvel Vitalício", price: Date.now() <= lifetimePromotionEndsAt ? 149.99 : 249.99 },
} as const;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  const url = Deno.env.get("SUPABASE_URL")!;
  const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!token) return Response.json({ error: "Payments not configured" }, { status: 503, headers: cors });
  const client = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user?.email) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

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
  if (!response.ok || !preference.init_point) return Response.json({ error: "Checkout unavailable" }, { status: 502, headers: cors });
  return Response.json({ checkoutUrl: preference.init_point }, { headers: cors });
});
