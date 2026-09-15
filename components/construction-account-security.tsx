"use client";

import { BadgeDollarSign, Fingerprint, KeyRound, LoaderCircle, LogOut, RefreshCw, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PasskeyCard } from "./passkey-card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Access = {
  subscription_status: "trial" | "active" | "past_due" | "canceled";
  plan_type: "monthly" | "annual" | "lifetime" | null;
  trial_ends_at: string;
  access_expires_at: string | null;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function planLabel(access: Access | null) {
  if (!access) return "Carregando seu plano…";
  if (access.subscription_status !== "active") return `Período grátis até ${formatDate(access.trial_ends_at)}`;
  if (access.plan_type === "lifetime") return "Plano Vitalício ativo · acesso sem vencimento";
  if (access.plan_type === "annual" && access.access_expires_at) return `Plano Anual ativo · acesso até ${formatDate(access.access_expires_at)}`;
  if (access.plan_type === "monthly" && access.access_expires_at) return `Plano Mensal ativo · acesso até ${formatDate(access.access_expires_at)}`;
  return "Plano ativo";
}

export function ConstructionAccountSecurity({ email, initialAccess, onSignOut, onOpenPlans }: { email: string; initialAccess: Access; onSignOut: () => void; onOpenPlans: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshingPlan, setRefreshingPlan] = useState(false);
  const [message, setMessage] = useState("");
  const [access, setAccess] = useState<Access | null>(initialAccess);

  const refreshPlan = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setRefreshingPlan(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { data } = await supabase.from("product_entitlements").select("subscription_status,plan_type,trial_ends_at,access_expires_at").eq("user_id", user.id).eq("product_id", "obra-civil").maybeSingle();
      if (data) setAccess(data as Access);
    }
    setRefreshingPlan(false);
  }, []);

  useEffect(() => {
    void refreshPlan();
    const onFocus = () => void refreshPlan();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshPlan]);

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) return setMessage("A senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirmPassword) return setMessage("As duas senhas estão diferentes.");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? "Não foi possível salvar a senha." : "Senha opcional salva com segurança.");
    if (!error) { setPassword(""); setConfirmPassword(""); }
    setSaving(false);
  };

  const deleteAccount = async () => {
    const confirmation = window.prompt("Para excluir definitivamente sua conta e os dados de todos os aplicativos Orça, digite EXCLUIR");
    if (confirmation !== "EXCLUIR") return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDeleting(true);
    setMessage("");
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) { setMessage("Não foi possível excluir a conta. Tente novamente."); setDeleting(false); return; }
    await supabase.auth.signOut({ scope: "local" });
    Object.keys(localStorage).filter((key) => key.startsWith("orcamovel.") || key.startsWith("orcaobra.")).forEach((key) => localStorage.removeItem(key));
    window.location.replace("/");
  };

  const hasPaidPlan = access?.subscription_status === "active" && Boolean(access.plan_type);

  return (
    <div className="mt-4 space-y-3">
      <section className="overflow-hidden rounded-[1.35rem] border border-[#efc28c] bg-[linear-gradient(135deg,#fffaf3,#fff2e3)] shadow-[0_14px_34px_rgba(177,85,24,0.09)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#ffe1bf] text-[#c45116] shadow-sm"><BadgeDollarSign size={22} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold text-[#3f2a1d]">Plano do OrçaObra</h2><span className="rounded-full bg-[#fff0d7] px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wide text-[#a44b16]">Acesso</span></div><p className="mt-1 text-sm font-bold leading-5 text-[#8a4219]">{planLabel(access)}</p><p className="mt-1 text-xs leading-5 text-[#7d6a5e]">Pagamentos avulsos por período. Não há renovação automática.</p></div></div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row"><button type="button" onClick={() => void refreshPlan()} disabled={refreshingPlan} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#e4c6aa] bg-white px-4 text-sm font-bold text-[#6f5a4b] transition-colors hover:bg-[#fff9f3]"><RefreshCw className={refreshingPlan ? "animate-spin" : ""} size={16} />Atualizar</button><button type="button" onClick={onOpenPlans} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d94f13] bg-[#e85c1e] px-4 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(232,92,30,0.24)] transition-colors hover:bg-[#cc4712]"><BadgeDollarSign size={17} />{hasPaidPlan ? "Ver upgrades" : "Ver planos"}</button></div>
        </div>
      </section>

      <details className="app-card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f3f1] text-[var(--brand)]"><Fingerprint size={21} /></span><div><p className="font-bold">Segurança e acesso</p><p className="mt-0.5 text-sm text-[#74837f]">Digital, rosto, PIN e senha opcional</p></div></div><span className="shrink-0 text-sm font-bold text-[var(--brand)]">Abrir</span></summary>
        <div className="space-y-4 border-t border-[#e3ebe9] bg-[#f8fbfa] p-3 sm:p-5"><PasskeyCard compact /><section className="app-card p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf5f3] text-[var(--brand)]"><KeyRound size={20} /></span><div><h3 className="font-bold">Senha opcional</h3><p className="mt-1 text-sm leading-5 text-[#6f7f7b]">Use apenas se quiser uma alternativa ao acesso com Google.</p></div></div><form onSubmit={savePassword} className="mt-4 grid gap-3 sm:grid-cols-2"><input required minLength={6} type="password" className="field-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nova senha" autoComplete="new-password" /><input required minLength={6} type="password" className="field-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repetir senha" autoComplete="new-password" /><button disabled={saving} className="secondary-button sm:col-span-2">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <KeyRound size={17} />}{saving ? "Salvando…" : "Salvar senha opcional"}</button></form>{message && <p role="status" className="mt-3 text-sm font-semibold text-[#536b67]">{message}</p>}</section></div>
      </details>

      <details className="app-card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1f5f4] text-[var(--brand)]"><UserRound size={20} /></span><div className="min-w-0"><p className="font-bold">Conta</p><p className="mt-0.5 truncate text-sm text-[#74837f]">{email}</p></div></div><span className="shrink-0 text-sm font-bold text-[var(--brand)]">Abrir</span></summary>
        <div className="border-t border-[#e3ebe9] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">Sessão neste aparelho</p><p className="mt-1 text-sm text-[#74837f]">Você pode sair sem apagar seus dados.</p></div><button onClick={onSignOut} className="secondary-button shrink-0"><LogOut size={17} />Sair deste aparelho</button></div><div className="my-5 h-px bg-[#e4ebe9]" /><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><ShieldAlert size={20} className="mt-0.5 shrink-0 text-rose-600" /><div><p className="font-bold text-rose-700">Excluir conta</p><p className="mt-1 text-sm leading-5 text-[#74837f]">Apaga os dados da conta em todos os aplicativos Orça. Não pode ser desfeito.</p></div></div><button type="button" disabled={deleting} onClick={() => void deleteAccount()} className="secondary-button shrink-0 !border-rose-200 !text-rose-700">{deleting ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}{deleting ? "Excluindo…" : "Excluir conta"}</button></div></div>
      </details>
    </div>
  );
}
