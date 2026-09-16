"use client";

import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";
import type { ProductId } from "@/lib/product-catalog";
import { getAnalyticsVisitorId } from "@/lib/analytics-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProductFeedbackForm({ productId, productName }: { productId: ProductId; productName: string }) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async () => {
    if (message.trim().length < 2) {
      setNotice("Escreva um comentário antes de enviar.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice("Não foi possível enviar agora.");
      return;
    }
    setSending(true);
    setNotice("");
    const { error } = await supabase.rpc("submit_public_product_feedback", {
      p_product_id: productId,
      p_user_name: name.trim(),
      p_user_email: email.trim(),
      p_rating: rating,
      p_message: message.trim(),
      p_visitor_id: getAnalyticsVisitorId(),
    });
    setSending(false);
    if (error) {
      if (error.message.toLowerCase().includes("recently submitted")) {
        setNotice("Sua avaliação já foi recebida recentemente. Obrigado!");
      } else {
        setNotice("Não foi possível enviar sua avaliação agora. Tente novamente.");
      }
      return;
    }
    setSent(true);
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 md:py-16" aria-labelledby={`${productId}-feedback-title`}>
      <div className="grid gap-6 rounded-3xl border border-[#dfe9e6] bg-white p-5 shadow-[0_18px_60px_rgba(26,60,54,0.08)] sm:p-7 lg:grid-cols-[.9fr_1.1fr] lg:gap-10 lg:p-9">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#0c4d46]">SUA OPINIÃO IMPORTA</p>
          <h2 id={`${productId}-feedback-title`} className="mt-2 text-2xl font-extrabold tracking-[-.035em] text-[#172321] sm:text-3xl">Conte sua experiência com o {productName}.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#687875]">Sua avaliação vai primeiro para o Painel Mestre. Só depois de aprovada ela poderá aparecer publicamente no site.</p>
          <div className="mt-5 rounded-2xl bg-[#f3f7f6] p-4 text-sm leading-6 text-[#566661]">
            Avaliações ajudam outros profissionais a entender como o aplicativo funciona na rotina, sem publicar automaticamente nada que você enviar.
          </div>
        </div>

        {sent ? (
          <div className="grid min-h-64 place-items-center rounded-2xl bg-[#f4f9f7] p-6 text-center">
            <div><CheckCircle2 className="mx-auto text-[#0c4d46]" size={42}/><h3 className="mt-3 text-xl font-extrabold text-[#172321]">Avaliação enviada</h3><p className="mt-2 text-sm leading-6 text-[#687875]">Obrigado. Ela ficará aguardando aprovação antes de aparecer no site.</p></div>
          </div>
        ) : (
          <div>
            <fieldset>
              <legend className="text-sm font-extrabold text-[#253431]">Sua nota</legend>
              <div className="mt-2 flex gap-1">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className="grid h-11 w-11 place-items-center rounded-xl text-[#b5914e] transition-colors hover:bg-[#fff7e7]" aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}><Star size={27} fill={value <= rating ? "currentColor" : "none"}/></button>)}</div>
            </fieldset>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#71817d]">Nome ou empresa</span><input className="field-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="Opcional" /></label>
              <label><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#71817d]">E-mail</span><input className="field-input" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} inputMode="email" placeholder="Opcional" /></label>
            </div>
            <label className="mt-3 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#71817d]">Sua experiência</span><textarea className="field-input min-h-28 resize-y" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={700} placeholder={`O que você achou do ${productName}?`} /></label>
            {notice && <p className="mt-2 text-sm font-semibold text-[#8a5f1d]">{notice}</p>}
            <button type="button" onClick={() => void submit()} disabled={sending} className="primary-button mt-4 w-full disabled:opacity-60"><Star size={18}/>{sending ? "Enviando…" : "Enviar avaliação"}</button>
          </div>
        )}
      </div>
    </section>
  );
}
