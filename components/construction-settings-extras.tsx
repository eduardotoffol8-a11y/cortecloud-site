"use client";

import { ChevronRight, Settings, Share2, Star, X } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ConstructionSettingsExtras({ userId, userEmail, calculatorEnabled, onCalculatorChange, onNotice, onOpenAdmin }: {
  userId: string;
  userEmail: string;
  calculatorEnabled: boolean;
  onCalculatorChange: (enabled: boolean) => void;
  onNotice: (message: string) => void;
  onOpenAdmin?: () => void;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  const shareOrcaObra = async () => {
    const url = `${window.location.origin}/apps/obra-civil/apresentacao?utm_source=indicacao&utm_medium=compartilhamento`;
    const shareData = { title: "OrçaObra", text: "Conheça o OrçaObra: orçamentos profissionais para construção e reformas no celular ou computador.", url };
    try {
      if (navigator.share) return void await navigator.share(shareData);
      await navigator.clipboard.writeText(`${shareData.text} ${url}`);
      onNotice("Link do OrçaObra copiado. Agora é só enviar.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      onNotice("Não foi possível compartilhar agora.");
    }
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) return onNotice("Escreva um comentário antes de enviar.");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return onNotice("Não foi possível enviar agora.");
    const { error } = await supabase.from("app_feedback").insert({ user_id: userId, user_email: userEmail, user_name: feedbackName.trim(), rating: feedbackRating, message: feedbackText.trim(), product_id: "obra-civil" });
    if (error) return onNotice("Não foi possível enviar a avaliação. Tente novamente.");
    setFeedbackOpen(false); setFeedbackText(""); setFeedbackName(""); setFeedbackRating(5);
    onNotice("Obrigado! Sua avaliação do OrçaObra foi enviada.");
  };

  return (
    <>
      {userEmail.toLowerCase() === "eduardo.toffol8@gmail.com" && onOpenAdmin && <button type="button" onClick={onOpenAdmin} className="mt-5 flex w-full items-center gap-4 rounded-2xl border border-[#9bbdb6] bg-[#e9f5f2] p-5 text-left transition-colors hover:bg-[#ddf0eb]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand)] text-white"><Settings size={22}/></span><span><span className="block font-extrabold text-[#172321]">Painel mestre</span><span className="mt-1 block text-sm text-[#60736e]">Métricas, usuários e planos do OrçaObra.</span></span><ChevronRight className="ml-auto text-[var(--brand)]" size={20}/></button>}

      <div className="app-card mt-5 flex items-center justify-between gap-4 p-4 sm:p-5"><div><p className="font-bold text-[#172321]">Calculadora flutuante</p><p className="mt-1 text-sm leading-5 text-[#74837f]">Deixe a calculadora disponível sobre as telas do aplicativo.</p></div><label className="relative inline-flex shrink-0 cursor-pointer items-center"><input type="checkbox" className="peer sr-only" checked={calculatorEnabled} onChange={(event) => onCalculatorChange(event.target.checked)} /><span className="h-7 w-12 rounded-full bg-[#cbd6d3] transition-colors peer-checked:bg-[var(--brand)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--brand)] after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" /></label></div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#dfc98e] bg-gradient-to-br from-[#fffaf0] via-[#fffdf8] to-[#f4ead1] p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#b5914e] text-white shadow-sm"><Share2 size={22} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#8a692c]">Ajude o OrçaObra a crescer</p><h2 className="mt-1 text-xl font-extrabold text-[#34291a]">Gostou? Indique para um amigo</h2><p className="mt-2 text-sm leading-6 text-[#75684e]">Compartilhe o OrçaObra com outro profissional da construção ou conte como o aplicativo está ajudando no seu trabalho.</p></div></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => void shareOrcaObra()} className="primary-button"><Share2 size={18}/>Indicar para um amigo</button><button type="button" onClick={() => setFeedbackOpen(true)} className="secondary-button !border-[#cbb06c] !text-[#72551c]"><Star size={18} fill="currentColor"/>Deixe sua avaliação</button></div>
      </div>

      {feedbackOpen && <div className="fixed inset-0 z-[110] grid place-items-center bg-[#10201d]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={(event) => { if (event.target === event.currentTarget) setFeedbackOpen(false); }}><div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#9a7533]">Sua opinião importa</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-[#172321]">Deixe sua avaliação</h2><p className="mt-2 text-sm leading-6 text-[#6f7f7b]">Conte sua experiência com o OrçaObra. Sua avaliação poderá aparecer no site após aprovação.</p></div><button type="button" onClick={() => setFeedbackOpen(false)} className="quiet-button !min-h-10 !w-10 !p-0" aria-label="Fechar"><X size={18}/></button></div><div className="mt-5 flex gap-1">{[1,2,3,4,5].map((rating) => <button type="button" key={rating} onClick={() => setFeedbackRating(rating)} className="p-1 text-[#c49531]" aria-label={`${rating} estrelas`}><Star size={28} fill={rating <= feedbackRating ? "currentColor" : "none"}/></button>)}</div><label className="mt-4 block"><span className="field-label">Nome para exibição (opcional)</span><input className="field-input" value={feedbackName} onChange={(event) => setFeedbackName(event.target.value)} placeholder="Seu nome ou empresa" /></label><label className="mt-4 block"><span className="field-label">Comentário</span><textarea className="field-input min-h-28" value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} placeholder="Conte o que achou do OrçaObra" /></label><button type="button" onClick={() => void sendFeedback()} className="primary-button mt-5 w-full"><Star size={18}/>Enviar avaliação</button></div></div>}
    </>
  );
}
