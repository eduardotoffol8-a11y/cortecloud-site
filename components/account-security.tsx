"use client";

import { BadgeDollarSign, Fingerprint, KeyRound, LoaderCircle, LogOut, RefreshCw, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PasskeyCard } from "./passkey-card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountProfile } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function planLabel(profile: AccountProfile | null) {
  if (!profile) return "Carregando seu plano…";
  if (profile.subscriptionStatus !== "active") return `Período grátis até ${formatDate(profile.trialEndsAt)}`;
  if (profile.planType === "lifetime") return "Plano Vitalício ativo · acesso sem vencimento";
  if (profile.planType === "annual" && profile.accessExpiresAt) return `Plano Anual ativo · acesso até ${formatDate(profile.accessExpiresAt)}`;
  if (profile.planType === "monthly" && profile.accessExpiresAt) return `Plano Mensal ativo · acesso até ${formatDate(profile.accessExpiresAt)}`;
  return "Plano ativo";
}

export function AccountSecurity({ email, onSignOut, onOpenPlans }: { email: string; onSignOut: () => void; onOpenPlans: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshingPlan, setRefreshingPlan] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  const refreshPlan = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setRefreshingPlan(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (user) {
      const { data } = await supabase.from("profiles").select("id,email,trial_ends_at,subscription_status,plan_type,access_expires_at").eq("id", user.id).single();
      if (data) {
        setProfile({
          id: data.id,
          email: data.email || user.email || "",
          trialEndsAt: data.trial_ends_at,
          subscriptionStatus: data.subscription_status,
          planType: data.plan_type,
          accessExpiresAt: data.access_expires_at,
        });
      }
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
    if (!error) {
      setPassword("");
      setConfirmPassword("");
    }
    setSaving(false);
  };

  const deleteAccount = async () => {
    const confirmation = window.prompt("Para excluir definitivamente, digite EXCLUIR");
    if (confirmation !== "EXCLUIR") return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setDeleting(true);
    setMessage("");
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) {
      setMessage("Não foi possível excluir a conta. Tente novamente.");
      setDeleting(false);
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    Object.keys(localStorage).filter((key) => key.startsWith("orcamovel.")).forEach((key) => localStorage.removeItem(key));
    window.location.replace("/");
  };

  const hasPaidPlan = profile?.subscriptionStatus === "active" && Boolean(profile.planType);

  return (
    <div className="mt-4 space-y-3">
      <section className="app-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]"><BadgeDollarSign size={22} /></span>
            <div>
              <h2 className="font-bold">Plano do OrçaMóvel</h2>
              <p className="mt-1 text-sm font-semibold leading-5 text-[#315d57]">{planLabel(profile)}</p>
              <p className="mt-1 text-xs leading-5 text-[#71817d]">Pagamentos avulsos por período. Não há renovação automática.</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => void refreshPlan()} disabled={refreshingPlan} className="quiet-button !px-3"><RefreshCw className={refreshingPlan ? "animate-spin" : ""} size={16} />Atualizar</button>
            <button type="button" onClick={onOpenPlans} className="primary-button"><BadgeDollarSign size={17} />{hasPaidPlan ? "Ver upgrades" : "Ver planos"}</button>
          </div>
        </div>
      </section>

      <details className="app-card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e8f3f1] text-[var(--brand)]"><Fingerprint size={21} /></span>
            <div><p className="font-bold">Segurança e acesso</p><p className="mt-0.5 text-sm text-[#74837f]">Digital, rosto, PIN e senha opcional</p></div>
          </div>
          <span className="shrink-0 text-sm font-bold text-[var(--brand)]">Abrir</span>
        </summary>
        <div className="space-y-4 border-t border-[#e3ebe9] bg-[#f8fbfa] p-3 sm:p-5">
          <PasskeyCard compact />
          <section className="app-card p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf5f3] text-[var(--brand)]"><KeyRound size={20} /></span>
              <div><h3 className="font-bold">Senha opcional</h3><p className="mt-1 text-sm leading-5 text-[#6f7f7b]">Use apenas se quiser uma alternativa ao acesso com Google.</p></div>
            </div>
            <form onSubmit={savePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required minLength={6} type="password" className="field-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nova senha" autoComplete="new-password" />
              <input required minLength={6} type="password" className="field-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repetir senha" autoComplete="new-password" />
              <button disabled={saving} className="secondary-button sm:col-span-2">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <KeyRound size={17} />}{saving ? "Salvando…" : "Salvar senha opcional"}</button>
            </form>
            {message && <p role="status" className="mt-3 text-sm font-semibold text-[#536b67]">{message}</p>}
          </section>
        </div>
      </details>

      <details className="app-card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1f5f4] text-[var(--brand)]"><UserRound size={20} /></span>
            <div className="min-w-0"><p className="font-bold">Conta</p><p className="mt-0.5 truncate text-sm text-[#74837f]">{email}</p></div>
          </div>
          <span className="shrink-0 text-sm font-bold text-[var(--brand)]">Abrir</span>
        </summary>
        <div className="border-t border-[#e3ebe9] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-bold">Sessão neste aparelho</p><p className="mt-1 text-sm text-[#74837f]">Você pode sair sem apagar seus dados.</p></div>
            <button onClick={onSignOut} className="secondary-button shrink-0"><LogOut size={17} />Sair deste aparelho</button>
          </div>
          <div className="my-5 h-px bg-[#e4ebe9]" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><ShieldAlert size={20} className="mt-0.5 shrink-0 text-rose-600" /><div><p className="font-bold text-rose-700">Excluir conta</p><p className="mt-1 text-sm leading-5 text-[#74837f]">Apaga empresa, clientes, orçamentos e arquivos. Não pode ser desfeito.</p></div></div>
            <button type="button" disabled={deleting} onClick={() => void deleteAccount()} className="secondary-button shrink-0 !border-rose-200 !text-rose-700">{deleting ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}{deleting ? "Excluindo…" : "Excluir conta"}</button>
          </div>
        </div>
      </details>
    </div>
  );
}
