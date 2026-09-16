"use client";

import { Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const USED_MS_KEY = "orcamovel.feedback.used-ms.v1";
const PROMPTED_KEY = "orcamovel.feedback.prompted.v1";
const TARGET_MS = 17 * 60 * 1000;

export function UsageFeedbackPrompt() {
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || localStorage.getItem(PROMPTED_KEY) === "true") return;
    let alive = true;
    let authenticated = false;
    let interval: number | undefined;

    const readUsed = () => Math.max(0, Number(localStorage.getItem(USED_MS_KEY) || "0") || 0);
    const writeUsed = (value: number) => localStorage.setItem(USED_MS_KEY, String(Math.round(value)));

    const maybeShow = () => {
      if (localStorage.getItem(PROMPTED_KEY) === "true") return true;
      if (readUsed() < TARGET_MS) return false;
      localStorage.setItem(PROMPTED_KEY, "true");
      setVisible(true);
      return true;
    };

    const flushVisibleTime = () => {
      if (startedAt.current === null) return;
      const now = Date.now();
      writeUsed(readUsed() + Math.max(0, now - startedAt.current));
      startedAt.current = now;
      maybeShow();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushVisibleTime();
        startedAt.current = null;
      } else if (authenticated && localStorage.getItem(PROMPTED_KEY) !== "true") {
        startedAt.current = Date.now();
      }
    };

    const begin = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive || !data.user) return;
      authenticated = true;
      setUser({ id: data.user.id, email: data.user.email || "" });
      if (maybeShow()) return;
      if (document.visibilityState === "visible") startedAt.current = Date.now();
      interval = window.setInterval(flushVisibleTime, 15_000);
      document.addEventListener("visibilitychange", handleVisibility);
    };

    void begin();
    return () => {
      alive = false;
      if (interval) window.clearInterval(interval);
      if (startedAt.current !== null) flushVisibleTime();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const submit = async () => {
    if (!user || message.trim().length < 2) {
      setNotice("Escreva um comentário antes de enviar.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSending(true);
    setNotice("");
    const { error } = await supabase.from("app_feedback").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: name.trim(),
      rating,
      message: message.trim(),
      product_id: "moveis",
      source: "usage_prompt",
    });
    setSending(false);
    if (error) {
      setNotice("Não foi possível enviar agora. Você pode avaliar depois em Ajustes.");
      return;
    }
    setNotice("Obrigado! Sua avaliação foi enviada para aprovação.");
    window.setTimeout(() => setVisible(false), 1200);
  };

  if (!visible || !user) return null;

  return (
    <div className="fixed inset-0 z-[115] grid place-items-center bg-[#10201d]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="usage-feedback-title">
      <section className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#9a7533]">17 minutos com o OrçaMóvel</p><h2 id="usage-feedback-title" className="mt-1 text-2xl font-extrabold tracking-[-.035em] text-[#172321]">Como está sendo sua experiência?</h2><p className="mt-2 text-sm leading-6 text-[#6f7f7b]">Essa pergunta aparece apenas uma vez. Sua avaliação só vai para o site depois de ser aprovada no Painel Mestre.</p></div>
          <button type="button" onClick={() => setVisible(false)} className="quiet-button !min-h-10 !w-10 !shrink-0 !p-0" aria-label="Fechar"><X size={18}/></button>
        </div>
        <fieldset className="mt-5"><legend className="field-label">Sua nota</legend><div className="mt-2 flex gap-1">{[1,2,3,4,5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className="grid h-11 w-11 place-items-center rounded-xl text-[#b5914e] hover:bg-[#fff7e7]" aria-label={`${value} estrelas`}><Star size={27} fill={value <= rating ? "currentColor" : "none"}/></button>)}</div></fieldset>
        <label className="mt-4 block"><span className="field-label">Nome para exibição</span><input className="field-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder="Opcional" /></label>
        <label className="mt-4 block"><span className="field-label">Comentário</span><textarea className="field-input min-h-28 resize-y" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={700} placeholder="O que o OrçaMóvel facilitou no seu trabalho?" /></label>
        {notice && <p className="mt-2 text-sm font-semibold text-[#6f7f7b]">{notice}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setVisible(false)} className="secondary-button">Agora não</button><button type="button" onClick={() => void submit()} disabled={sending} className="primary-button disabled:opacity-60"><Star size={17}/>{sending ? "Enviando…" : "Enviar avaliação"}</button></div>
      </section>
    </div>
  );
}
