import { createClient } from "npm:@supabase/supabase-js@2";

const lifetimePromotionEndsAt = new Date("2026-09-21T03:59:59.000Z").getTime();
const plans = { monthly: { prices: [9.99], days: 30 }, annual: { prices: [99.99], days: 365 }, lifetime: { prices: [149.99, 249.99], days: 0 } } as const;
const planNames = { monthly: "Mensal", annual: "Anual", lifetime: "Vitalício" } as const;
const appUrl = "https://cortecloud-site-l4lh.vercel.app/apps/moveis";
const whatsappUrl = "https://wa.me/5515981620985?text=Ol%C3%A1%2C%20vi%20seu%20contato%20no%20Or%C3%A7aM%C3%B3vel%20e%20gostaria%20de%20conversar%20sobre%20um%20site%20ou%20aplicativo%20personalizado.";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Boa_Vista" }).format(new Date(value)) : "Sem vencimento";
}

function purchaseEmail(plan: keyof typeof plans, amount: number, paymentId: string, accessExpiresAt: string | null) {
  const planName = planNames[plan];
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#f2f5f4;color:#172b28;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">Pagamento aprovado. Seu plano ${planName} do OrçaMóvel já está ativo.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f5f4"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dce7e3;border-radius:20px;overflow:hidden"><tr><td style="padding:28px 32px;background:#0c5149;color:#fff"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td><img src="https://cortecloud-site-l4lh.vercel.app/orcamovel-brand-192.png" width="58" height="58" alt="OrçaMóvel" style="display:block;border-radius:15px"></td><td style="padding-left:15px"><div style="font-size:24px;font-weight:800">OrçaMóvel</div><div style="margin-top:3px;color:#c6ddd7;font-size:13px">Marcenaria sob medida</div></td></tr></table></td></tr><tr><td style="padding:34px 32px"><div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#e2f3ee;color:#0b665b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.7px">Pagamento aprovado</div><h1 style="margin:18px 0 10px;font-size:28px;line-height:1.2">Seu plano já está ativo.</h1><p style="margin:0 0 26px;color:#5e716c;font-size:16px;line-height:1.65">Obrigado por escolher o OrçaMóvel. Sua compra foi confirmada e todos os recursos do aplicativo estão liberados.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f8f7;border:1px solid #e0e9e6;border-radius:14px"><tr><td style="padding:20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:5px 0;color:#687a75;font-size:13px">Plano</td><td align="right" style="padding:5px 0;font-weight:700">${planName}</td></tr><tr><td style="padding:5px 0;color:#687a75;font-size:13px">Valor pago</td><td align="right" style="padding:5px 0;font-weight:700">${money(amount)}</td></tr><tr><td style="padding:5px 0;color:#687a75;font-size:13px">Acesso até</td><td align="right" style="padding:5px 0;font-weight:700">${date(accessExpiresAt)}</td></tr><tr><td style="padding:5px 0;color:#687a75;font-size:13px">Pagamento</td><td align="right" style="padding:5px 0;font-size:12px">#${paymentId}</td></tr></table></td></tr></table><div style="text-align:center;margin:28px 0"><a href="${appUrl}" style="display:inline-block;padding:15px 24px;border-radius:10px;background:#0c5149;color:#fff;text-decoration:none;font-weight:700">Abrir o OrçaMóvel</a></div><hr style="border:0;border-top:1px solid #e4ebe9;margin:30px 0"><h2 style="margin:0 0 8px;font-size:19px">Quer um site ou aplicativo para sua empresa?</h2><p style="margin:0 0 18px;color:#63756f;font-size:14px;line-height:1.6">Criamos soluções personalizadas para apresentar sua marca, organizar seu trabalho e atender melhor seus clientes.</p><a href="${whatsappUrl}" style="display:inline-block;padding:12px 18px;border:1px solid #0c5149;border-radius:9px;color:#0c5149;text-decoration:none;font-weight:700">Conversar pelo WhatsApp</a><p style="margin:18px 0 0;color:#74837f;font-size:12px;line-height:1.6">WhatsApp: +55 15 98162-0985<br>E-mail: <a href="mailto:eduardo.toffol8@gmail.com" style="color:#0c665b">eduardo.toffol8@gmail.com</a></p></td></tr><tr><td style="padding:20px 32px;background:#f7f9f8;color:#7a8985;font-size:11px;line-height:1.55">Esta é uma confirmação automática da sua compra no OrçaMóvel. Guarde este e-mail para consultar os dados do plano.</td></tr></table></td></tr></table></body></html>`;
}

async function sendPurchaseEmail(to: string, plan: keyof typeof plans, amount: number, paymentId: string, accessExpiresAt: string | null) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY is not configured" };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `orcamovel-payment-${paymentId}` },
    body: JSON.stringify({
      from: Deno.env.get("PURCHASE_EMAIL_FROM") || "OrçaMóvel <onboarding@resend.dev>",
      to: [to],
      reply_to: "eduardo.toffol8@gmail.com",
      subject: `Compra confirmada — Plano ${planNames[plan]} OrçaMóvel`,
      html: purchaseEmail(plan, amount, paymentId, accessExpiresAt),
    }),
  });
  if (!response.ok) return { sent: false, reason: await response.text() };
  const result = await response.json();
  return { sent: true, id: result.id as string };
}

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
  const { data: event } = await admin.from("payment_events").select("confirmation_email_sent_at").eq("payment_id", paymentId).maybeSingle();
  const { data: profile } = await admin.from("profiles").select("email,access_expires_at,last_payment_id").eq("id", userId).single();
  if (eventError?.code === "23505" && profile?.last_payment_id === paymentId && event?.confirmation_email_sent_at) return Response.json({ received: true, duplicate: true });
  if (eventError && eventError.code !== "23505") return Response.json({ error: "Could not record payment" }, { status: 500 });
  const currentExpiry = profile?.access_expires_at ? new Date(profile.access_expires_at).getTime() : 0;
  const base = Math.max(Date.now(), currentExpiry);
  const accessExpiresAt = plan === "lifetime" ? null : new Date(base + selected.days * 86_400_000).toISOString();
  const { error: updateError } = await admin.from("profiles").update({ subscription_status: "active", plan_type: plan, access_expires_at: accessExpiresAt, last_payment_id: paymentId, updated_at: new Date().toISOString() }).eq("id", userId);
  if (updateError) return Response.json({ error: "Could not activate access" }, { status: 500 });
  let email = { sent: false, reason: "No user email" } as { sent: boolean; reason?: string; id?: string };
  if (profile?.email && !event?.confirmation_email_sent_at) {
    email = await sendPurchaseEmail(profile.email, plan, amount, paymentId, accessExpiresAt);
    if (email.sent) await admin.from("payment_events").update({ confirmation_email_sent_at: new Date().toISOString(), confirmation_email_id: email.id }).eq("payment_id", paymentId);
  }
  if (!email.sent) return Response.json({ activated: true, confirmationEmailSent: false, error: email.reason }, { status: 503 });
  return Response.json({ activated: true, confirmationEmailSent: email.sent });
});
