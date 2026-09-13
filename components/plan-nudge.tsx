"use client";

import { BadgeDollarSign, Clock3, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AccountProfile } from "@/lib/types";

function localDayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function PlanNudge({ userId, profile, onOpenPlans }: { userId: string; profile: AccountProfile; onOpenPlans: () => void }) {
  const [open, setOpen] = useState(false);
  const storageKey = useMemo(() => `orcamovel.plan-nudge.${userId}`, [userId]);
  const eligible = profile.subscriptionStatus === "trial" && !profile.planType;

  useEffect(() => {
    if (!eligible) return;
    const today = localDayKey();
    if (localStorage.getItem(storageKey) === today) return;

    const timer = window.setTimeout(() => {
      const companyConfigured = Boolean(localStorage.getItem("orcamovel.company.v2") || localStorage.getItem("orcamovel.company.v1"));
      if (!companyConfigured) return;
      localStorage.setItem(storageKey, today);
      setOpen(true);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [eligible, storageKey]);

  if (!open || !eligible) return null;

  const remainingDays = Math.max(0, Math.ceil((new Date(profile.trialEndsAt).getTime() - Date.now()) / 86_400_000));

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-black/30 p-4 backdrop-blur-[2px] sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="plan-nudge-title">
      <section className="app-card w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-start justify-between gap-4 bg-[var(--brand-dark)] px-5 py-5 text-white">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/12"><BadgeDollarSign size={22} /></span>
            <div>
              <h2 id="plan-nudge-title" className="text-lg font-extrabold">Continue com o OrçaMóvel</h2>
              <p className="mt-1 text-sm leading-5 text-white/75">Seu período grátis continua ativo.</p>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/80 hover:bg-white/10" aria-label="Fechar"><X size={19} /></button>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-[#5f706c]">Escolha um plano quando quiser garantir a continuidade do acesso. Você não será cobrado automaticamente.</p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#f3f7f6] px-3.5 py-3 text-sm font-semibold text-[#45605b]"><Clock3 size={17} className="text-[var(--brand)]" />{remainingDays > 0 ? `${remainingDays} ${remainingDays === 1 ? "dia restante" : "dias restantes"} no período grátis` : "Período grátis no fim"}</div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setOpen(false)} className="secondary-button w-full">Agora não</button>
            <button type="button" onClick={() => { setOpen(false); onOpenPlans(); }} className="primary-button w-full"><BadgeDollarSign size={17} />Ver planos</button>
          </div>
          <p className="mt-3 text-center text-[0.72rem] leading-5 text-[#81908c]">Este aviso aparece no máximo uma vez por dia enquanto nenhum plano tiver sido contratado.</p>
        </div>
      </section>
    </div>
  );
}
