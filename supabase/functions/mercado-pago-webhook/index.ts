import { createClient } from "npm:@supabase/supabase-js@2";

const lifetimePromotionEndsAt = new Date("2026-09-21T03:59:59.000Z").getTime();
const plans = { monthly: { prices: [9.99], days: 30 }, annual: { prices: [99.99], days: 365 }, lifetime: { prices: [149.99, 249.99], days: 0 } } as const;

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("ok");
  const token = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
  if (!token) return Response.json({ error: "Not configured" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const requestUrl = new URL(request.url);
  const paymentId = String(requestUrl.searchParams.get("data.id") || body?.data?.id || "");
  if (!/^\d+$/.test(paymentId)) return Response.json({ received: true });

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!paymentResponse.ok) return Response.json({ error: "Payment lookup failed" }, { status: 502 });
  const payment = await paymentResponse.json();
  if (payment.status !== "approved") return Response.json({ received: true });
  const plan = payment.metadata?.plan as keyof typeof plans;
  const selected = plans[plan];
  const userId = String(payment.external_reference || payment.metadata?.user_id || "");
  const amount = Number(payment.transaction_amount);
  const paidDuringPromotion = new Date(payment.date_created || 0).getTime() <= lifetimePromotionEndsAt;
  const validPrice = selected?.prices.some((price) => Math.abs(amount - price) <= 0.001)
    && !(plan === "lifetime" && Math.abs(amount - 149.99) <= 0.001 && !paidDuringPromotion);
  if (!selected || !/^[0-9a-f-]{36}$/i.test(userId) || payment.currency_id !== "BRL" || !validPrice) {
    return Response.json({ error: "Invalid payment" }, { status: 400 });
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { error: eventError } = await admin.from("payment_events").insert({ payment_id: paymentId, user_id: userId, plan_type: plan, amount, status: payment.status });
  const { data: profile } = await admin.from("profiles").select("access_expires_at,last_payment_id").eq("id", userId).single();
  if (eventError?.code === "23505" && profile?.last_payment_id === paymentId) return Response.json({ received: true, duplicate: true });
  if (eventError && eventError.code !== "23505") return Response.json({ error: "Could not record payment" }, { status: 500 });
  const currentExpiry = profile?.access_expires_at ? new Date(profile.access_expires_at).getTime() : 0;
  const base = Math.max(Date.now(), currentExpiry);
  const accessExpiresAt = plan === "lifetime" ? null : new Date(base + selected.days * 86_400_000).toISOString();
  const { error: updateError } = await admin.from("profiles").update({ subscription_status: "active", plan_type: plan, access_expires_at: accessExpiresAt, last_payment_id: paymentId, updated_at: new Date().toISOString() }).eq("id", userId);
  if (updateError) return Response.json({ error: "Could not activate access" }, { status: 500 });
  return Response.json({ activated: true });
});
