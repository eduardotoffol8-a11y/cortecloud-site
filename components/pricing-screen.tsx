"use client";

import { ArrowLeft, BadgeCheck, CalendarClock, Check, Clock3, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "./brand-mark";
import { InstallAppButton } from "./install-app-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanType } from "@/lib/types";

export const LIFETIME_PROMO_END = new Date("2026-09-21T03:59:59.000Z").getTime();

function countdown(target: number, now: number) {
  const remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return { remaining, label: `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s` };
}

export function PricingScreen({ email, onSignOut, onRefresh, onBack, trialEnded = true }: { email: string; onSignOut: () => void; onRefresh: () => void; onBack?: () => void; trialEnded?: boolean }) {
  const [loading, setLoading] = useState<PlanType | "">("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const offer = countdown(LIFETIME_PROMO_END, now);
  const plans = useMemo(() => [
    { id: "monthly" as const, name: "Mensal", price: "R$ 9,99", detail: "30 dias de acesso" },
    { id: "annual" as const, name: "Anual", price: "R$ 99,99", detail: "1 ano de acesso" },
    { id: "lifetime" as const, name: "Vitalício", price: offer.remaining ? "R$ 149,99" : "R$ 249,99", oldPrice: offer.remaining ? "R$ 249,99" : "", detail: "Pagamento único", highlight: true },
  ], [offer.remaining]);

  const choosePlan = async (plan: PlanType) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(plan);
    setMessage("");
    const { data, error } = await supabase.functions.invoke("create-mercado-pago-checkout", { body: { plan } });
    if (error || !data?.checkoutUrl) {
      let detail = data?.error as string | undefined;
      const response = (error as { context?: Response } | null)?.context;
      if (!detail && response) {
        try { detail = (await response.clone().json())?.error; } catch { /* Keep a helpful fallback. */ }
      }
      if (detail === "Payments not configured") setMessage("O pagamento ainda não está configurado.");
      else if (detail === "Unauthorized") setMessage("Sua sessão expirou. Entre novamente e tente pagar.");
      else if (detail?.toLowerCase().includes("policy returned unauthorized")) setMessage("A credencial do Mercado Pago está bloqueada ou sem permissão. Ative ou renove as credenciais de produção e tente novamente.");
      else setMessage(detail ? `O Mercado Pago não aceitou a solicitação: ${detail}` : "Não foi possível abrir o pagamento. Atualize a página e tente novamente.");
      setLoading("");
      return;
    }
    window.location.assign(data.checkoutUrl);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(15,118,110,0.13),transparent_28rem)] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex items-center justify-between gap-3"><BrandMark /><InstallAppButton /></div>
        {onBack && <button type="button" onClick={onBack} className="quiet-button mb-4 !px-2"><ArrowLeft size={18} />Voltar ao aplicativo</button>}
        <section className="app-card overflow-hidden">
          <div className="bg-[var(--brand-dark)] px-5 py-7 text-white sm:px-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/12"><CalendarClock size={25} /></div>
            <h1 className="text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">{trialEnded ? "Seus 30 dias grátis terminaram" : "Escolha seu plano"}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#c7e0dc]">{trialEnded ? "Seus dados continuam seguros. Escolha um plano para criar orçamentos e gerar PDFs novamente." : "Garanta seu acesso agora ou continue usando normalmente até o fim do período grátis."}</p>
          </div>
          <div className="p-4 sm:p-7">
            {offer.remaining > 0 && <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold">Oferta de lançamento: economize R$ 100</p><p className="mt-0.5 text-sm">O acesso vitalício volta para R$ 249,99 quando o prazo terminar.</p></div><span className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 font-mono text-sm font-extrabold shadow-sm"><Clock3 size={17} />{offer.label}</span></div>}
            <div className="grid gap-3 md:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className={`relative rounded-2xl border p-5 ${plan.highlight ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-lg" : "border-[#dce5e2] bg-white"}`}>
                  {plan.highlight && <span className="absolute -top-3 left-4 rounded-full bg-[var(--brand)] px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-white">Oferta temporária</span>}
                  <p className="font-bold text-[#48605b]">{plan.name}</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">{"oldPrice" in plan && plan.oldPrice && <span className="text-sm font-bold text-[#8a9794] line-through">{plan.oldPrice}</span>}<p className="text-2xl font-extrabold tracking-[-0.04em]">{plan.price}</p></div>
                  <p className="mt-1 text-sm text-[#71817d]">{plan.detail}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#315d57]"><Check size={17} />Todos os recursos</div>
                  <button type="button" disabled={Boolean(loading)} onClick={() => void choosePlan(plan.id)} className={`${plan.highlight ? "primary-button" : "secondary-button"} mt-5 w-full`}>
                    {loading === plan.id ? <LoaderCircle className="animate-spin" size={17} /> : <BadgeCheck size={17} />}{loading === plan.id ? "Abrindo…" : "Escolher plano"}
                  </button>
                </article>
              ))}
            </div>
            {message && <p role="alert" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">{message}</p>}
            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-[#e3ebe9] pt-5 sm:flex-row">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#64746f]"><ShieldCheck size={17} className="text-[var(--brand)]" />Pix ou cartão processado pelo Mercado Pago · {email}</p>
              <div className="flex gap-2"><button onClick={onRefresh} className="quiet-button !min-h-10 !px-3"><RefreshCw size={16} />Já paguei</button><button onClick={onSignOut} className="quiet-button !min-h-10 !px-3"><LogOut size={16} />Sair</button></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
