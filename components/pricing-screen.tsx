"use client";

import { BadgeCheck, CalendarClock, Check, LoaderCircle, LogOut, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "./brand-mark";
import { InstallAppButton } from "./install-app-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PlanType } from "@/lib/types";

const plans: { id: PlanType; name: string; price: string; detail: string; highlight?: boolean }[] = [
  { id: "monthly", name: "Mensal", price: "R$ 9,99", detail: "30 dias de acesso" },
  { id: "annual", name: "Anual", price: "R$ 99,99", detail: "1 ano de acesso", highlight: true },
  { id: "lifetime", name: "Vitalício", price: "R$ 249,99", detail: "Pagamento único" },
];

export function PricingScreen({ email, onSignOut, onRefresh }: { email: string; onSignOut: () => void; onRefresh: () => void }) {
  const [loading, setLoading] = useState<PlanType | "">("");
  const [message, setMessage] = useState("");

  const choosePlan = async (plan: PlanType) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(plan);
    setMessage("");
    const { data, error } = await supabase.functions.invoke("create-mercado-pago-checkout", { body: { plan } });
    if (error || !data?.checkoutUrl) {
      setMessage("O pagamento está sendo conectado. Tente novamente em breve.");
      setLoading("");
      return;
    }
    window.location.assign(data.checkoutUrl);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(15,118,110,0.13),transparent_28rem)] px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-7 flex items-center justify-between gap-3"><BrandMark /><InstallAppButton /></div>
        <section className="app-card overflow-hidden">
          <div className="bg-[var(--brand-dark)] px-5 py-7 text-white sm:px-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white/12"><CalendarClock size={25} /></div>
            <h1 className="text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl">Seus 30 dias grátis terminaram</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#c7e0dc]">Seus dados continuam seguros. Escolha um plano para criar orçamentos e gerar PDFs novamente.</p>
          </div>
          <div className="p-4 sm:p-7">
            <div className="grid gap-3 md:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className={`relative rounded-2xl border p-5 ${plan.highlight ? "border-[var(--brand)] bg-[var(--brand-soft)] shadow-lg" : "border-[#dce5e2] bg-white"}`}>
                  {plan.highlight && <span className="absolute -top-3 left-4 rounded-full bg-[var(--brand)] px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-white">Melhor valor</span>}
                  <p className="font-bold text-[#48605b]">{plan.name}</p>
                  <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">{plan.price}</p>
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
              <p className="flex items-center gap-2 text-sm font-semibold text-[#64746f]"><ShieldCheck size={17} className="text-[var(--brand)]" />Pix ou cartão com pagamento seguro · {email}</p>
              <div className="flex gap-2"><button onClick={onRefresh} className="quiet-button !min-h-10 !px-3"><RefreshCw size={16} />Já paguei</button><button onClick={onSignOut} className="quiet-button !min-h-10 !px-3"><LogOut size={16} />Sair</button></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
