"use client";

import { ArrowLeft, BadgeCheck, CalendarClock, Check, Clock3, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BrandMark } from "./brand-mark";
import { InstallAppButton } from "./install-app-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanType } from "@/lib/types";

export const LIFETIME_PROMO_END = new Date("2026-09-21T03:59:59.000Z").getTime();
type CommercialSettings = { monthly_price:number; annual_price:number; lifetime_price:number; lifetime_promo_price:number; promotion_ends_at:string };
const planRank: Record<PlanType, number> = { monthly: 1, annual: 2, lifetime: 3 };
const planNames: Record<PlanType, string> = { monthly: "Mensal", annual: "Anual", lifetime: "Vitalício" };

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
  const [currentPlan, setCurrentPlan] = useState<PlanType | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [commercial, setCommercial] = useState<CommercialSettings>({ monthly_price:9.99, annual_price:99.99, lifetime_price:249.99, lifetime_promo_price:149.99, promotion_ends_at:new Date(LIFETIME_PROMO_END).toISOString() });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const loadCurrentPlan = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      setCheckingPlan(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("subscription_status,plan_type,access_expires_at").eq("id", user.id).single();
    const plan = (data?.plan_type || null) as PlanType | null;
    const active = data?.subscription_status === "active" && Boolean(plan) && (
      plan === "lifetime" || Boolean(data?.access_expires_at && new Date(data.access_expires_at).getTime() > Date.now())
    );
    setCurrentPlan(active ? plan : null);
    setHasActivePlan(active);
    setCheckingPlan(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      void supabase.rpc("get_orcamovel_settings").then(({ data }) => { const row = Array.isArray(data) ? data[0] : data; if (row) setCommercial(row as CommercialSettings); });
      const sid = sessionStorage.getItem("orcamovel.analytics.session.v1") || crypto.randomUUID();
      sessionStorage.setItem("orcamovel.analytics.session.v1", sid);
      void supabase.rpc("track_orcamovel_event", { p_event_type: "plans_open", p_session_id: sid, p_metadata: { source: "app" } });
    }
    void loadCurrentPlan();
    const onFocus = () => void loadCurrentPlan();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadCurrentPlan]);

  const offer = countdown(new Date(commercial.promotion_ends_at).getTime(), now);
  const money = (value:number) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value);
  const plans = useMemo(() => [
    { id: "monthly" as const, name: "Mensal", price: money(commercial.monthly_price), detail: "30 dias de acesso · pagamento único" },
    { id: "annual" as const, name: "Anual", price: money(commercial.annual_price), detail: "365 dias de acesso · pagamento único" },
    { id: "lifetime" as const, name: "Vitalício", price: money(offer.remaining ? commercial.lifetime_promo_price : commercial.lifetime_price), oldPrice: offer.remaining ? money(commercial.lifetime_price) : "", detail: "Acesso sem vencimento · pagamento único", highlight: true },
  ], [commercial, offer.remaining]);

  const choosePlan = async (plan: PlanType) => {
    if (hasActivePlan && currentPlan && planRank[plan] <= planRank[currentPlan]) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(plan);
    setMessage("");
    const sid = sessionStorage.getItem("orcamovel.analytics.session.v1") || crypto.randomUUID();
    sessionStorage.setItem("orcamovel.analytics.session.v1", sid);
    void supabase.rpc("track_orcamovel_event", { p_event_type: "checkout_started", p_session_id: sid, p_metadata: { plan } });
    const { data, error } = await supabase.functions.invoke("create-mercado-pago-checkout", { body: { plan } });
    if (error || !data?.checkoutUrl) {
      let detail = data?.error as string | undefined;
      const response = (error as { context?: Response } | null)?.context;
      if (!detail && response) {
        try { detail = (await response.clone().json())?.error; } catch { /* Keep a helpful fallback. */ }
      }
      if (detail === "Payments not configured") setMessage("O pagamento ainda não está configurado.");
      else if (detail === "Unauthorized") setMessage("Sua sessão expirou. Entre novamente e tente pagar.");
      else if (detail === "Plan not eligible") {
        setMessage("Seu plano mudou. Atualizamos as opções disponíveis para você.");
        await loadCurrentPlan();
      }
      else if (detail?.toLowerCase().includes("policy returned unauthorized")) setMessage("A credencial do Mercado Pago está bloqueada ou sem permissão. Ative ou renove as credenciais de produção e tente novamente.");
      else setMessage(detail ? `O Mercado Pago não aceitou a solicitação: ${detail}` : "Não foi possível abrir o pagamento. Atualize a página e tente novamente.");
      setLoading("");
      return;
    }
    window.location.assign(data.checkoutUrl);
  };

  const currentRank = hasActivePlan && currentPlan ? planRank[currentPlan] : 0;
  const title = hasActivePlan && currentPlan ? "Gerencie seu plano" : trialEnded ? "Seus 30 dias grátis terminaram" : "Escolha seu plano";
  const description = hasActivePlan && currentPlan
    ? `Você está no Plano ${planNames[currentPlan]}. Somente planos superiores ficam disponíveis como upgrade.`
    : trialEnded
      ? "Seus dados continuam seguros. Escolha um plano para criar orçamentos e gerar PDFs novamente."
      : "Garanta seu acesso agora ou continue usando normalmente até o fim do período grátis.";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(245,158,11,0.18),transparent_28rem),linear-gradient(180deg,#fffaf5,#f7f3ef)] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex items-center justify-between gap-3"><BrandMark /><InstallAppButton /></div>
        {onBack && <button type="button" onClick={onBack} className="quiet-button mb-4 !px-2"><ArrowLeft size={18} />Voltar ao aplicativo</button>}
        <section className="overflow-hidden rounded-[1.55rem] border border-[#eadfd5] bg-white shadow-[0_26px_70px_rgba(91,49,24,0.12)]">
          <div className="bg-[linear-gradient(135deg,#5c2f18,#8a451d_58%,#bd6428)] px-5 py-7 text-white sm:px-8 sm:py-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/15"><CalendarClock size={25} /></div>
            <h1 className="text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#f8e6d8]">{description}</p>
          </div>
          <div className="p-4 sm:p-7">
            {offer.remaining > 0 && (!hasActivePlan || currentRank < planRank.lifetime) && (
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#f3c277] bg-[linear-gradient(135deg,#fff8e6,#fff0d7)] px-4 py-4 text-[#5e3319] shadow-[0_10px_28px_rgba(183,97,28,0.08)] sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-extrabold">Oferta de lançamento: economize R$ 100</p><p className="mt-0.5 text-sm text-[#7a4a2a]">O acesso vitalício volta para R$ 249,99 quando o prazo terminar.</p></div>
                <span className="flex shrink-0 items-center gap-2 rounded-xl border border-[#f0d5b1] bg-white px-3 py-2 font-mono text-sm font-extrabold text-[#7b3516] shadow-sm"><Clock3 size={17} />{offer.label}</span>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                const rank = planRank[plan.id];
                const isCurrent = hasActivePlan && currentPlan === plan.id;
                const isLower = hasActivePlan && rank < currentRank;
                const isUpgrade = hasActivePlan && rank > currentRank;
                const blocked = checkingPlan || isCurrent || isLower;
                const label = checkingPlan ? "Verificando…" : isCurrent ? "Plano atual" : isLower ? "Já incluído" : isUpgrade ? "Fazer upgrade" : "Escolher plano";

                const cardTone = plan.id === "monthly"
                  ? "border-[#dfd6ce] bg-white"
                  : plan.id === "annual"
                    ? "border-[#e5aa55] bg-[linear-gradient(180deg,#fffdf7,#fff7e9)] shadow-[0_12px_30px_rgba(190,122,34,0.08)]"
                    : "border-[#e66b30] bg-[linear-gradient(180deg,#fff6ec,#ffead8)] shadow-[0_18px_38px_rgba(211,85,28,0.16)]";

                const actionableButton = plan.id === "monthly"
                  ? "border-[#8b6a56] bg-[#6b4a39] text-white hover:bg-[#583b2e]"
                  : plan.id === "annual"
                    ? "border-[#c86c13] bg-[#d97706] text-white hover:bg-[#b75f05]"
                    : "border-[#d44716] bg-[#e4571f] text-white shadow-[0_10px_24px_rgba(228,87,31,0.24)] hover:bg-[#c94416]";

                const cardState = isCurrent
                  ? "ring-2 ring-[#7a5139] ring-offset-2"
                  : isLower
                    ? "opacity-60 grayscale-[0.12]"
                    : "";

                return (
                  <article key={plan.id} className={`relative rounded-[1.35rem] border p-5 sm:p-6 ${cardTone} ${cardState}`}>
                    {isCurrent ? (
                      <span className="absolute -top-3 left-4 rounded-full bg-[#6b4a39] px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-white shadow-sm">Plano atual</span>
                    ) : plan.highlight && !isLower ? (
                      <span className="absolute -top-3 left-4 rounded-full bg-[#e4571f] px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-white shadow-sm">Oferta temporária</span>
                    ) : plan.id === "annual" && !isLower ? (
                      <span className="absolute -top-3 left-4 rounded-full bg-[#d97706] px-3 py-1 text-[0.66rem] font-extrabold uppercase tracking-wide text-white shadow-sm">12 meses</span>
                    ) : null}

                    <p className="font-bold text-[#604a3b]">{plan.name}</p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-2">{"oldPrice" in plan && plan.oldPrice && !isLower && <span className="text-sm font-bold text-[#9a8273] line-through">{plan.oldPrice}</span>}<p className="text-2xl font-extrabold tracking-[-0.04em] text-[#221b17]">{plan.price}</p></div>
                    <p className="mt-1 text-sm text-[#76665c]">{plan.detail}</p>
                    <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#70462f]"><Check size={17} className="text-[#c76422]" />Todos os recursos</div>

                    <button
                      type="button"
                      disabled={Boolean(loading) || blocked}
                      onClick={() => void choosePlan(plan.id)}
                      className={`mt-5 inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition-all disabled:cursor-not-allowed disabled:border-[#ddd5cf] disabled:bg-[#f2efec] disabled:text-[#93877e] disabled:shadow-none ${!blocked ? actionableButton : ""}`}
                    >
                      {loading === plan.id || checkingPlan ? <LoaderCircle className="animate-spin" size={17} /> : <BadgeCheck size={17} />}{loading === plan.id ? "Abrindo…" : label}
                    </button>
                  </article>
                );
              })}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-[#74675f]">Os pagamentos são avulsos. O OrçaMóvel não faz renovação ou cobrança automática ao fim do período.</p>
            {message && <p role="alert" className="mt-4 rounded-xl border border-[#f1c27c] bg-[#fff7e7] px-4 py-3 text-center text-sm font-semibold text-[#8a4a16]">{message}</p>}
            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-[#eee4dc] pt-5 sm:flex-row">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#6c625c]"><ShieldCheck size={17} className="text-[#d06020]" />Pix ou cartão processado pelo Mercado Pago · {email}</p>
              <div className="flex gap-2"><button onClick={() => { void loadCurrentPlan(); onRefresh(); }} className="quiet-button !min-h-10 !px-3"><RefreshCw size={16} />Atualizar</button><button onClick={onSignOut} className="quiet-button !min-h-10 !px-3"><LogOut size={16} />Sair</button></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
