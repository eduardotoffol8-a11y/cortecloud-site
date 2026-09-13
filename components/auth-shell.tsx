"use client";

import { CalendarClock, Eye, EyeOff, Fingerprint, KeyRound, LoaderCircle, LogIn, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BrandMark } from "./brand-mark";
import { BudgetApp } from "./budget-app";
import { InstallAppButton } from "./install-app-button";
import { PricingScreen } from "./pricing-screen";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountProfile } from "@/lib/types";

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f2f6f5] p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit"><BrandMark /></div>
        <LoaderCircle className="mx-auto animate-spin text-[var(--brand)]" size={24} />
      </div>
    </main>
  );
}

function AuthScreen() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"passkey" | "email" | "password" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sendAccessLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading("email");
    setError("");
    setMessage("");
    const result = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    if (result.error) {
      if (result.error.message.toLowerCase().includes("rate limit")) setError("Muitos links foram solicitados. Aguarde alguns minutos e tente novamente.");
      else setError("Não foi possível enviar o acesso. Tente novamente.");
    }
    else setMessage("Acesso enviado. Abra o e-mail uma vez; depois este aparelho fica conectado.");
    setLoading("");
  };

  const signInWithPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading("password");
    setError("");
    const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (result.error) setError("E-mail ou senha incorretos.");
    setLoading("");
  };

  const signInWithPasskey = async () => {
    if (!supabase) return;
    setLoading("passkey");
    setError("");
    setMessage("");
    try {
      const { error: passkeyError } = await supabase.auth.signInWithPasskey();
      if (passkeyError) {
        if (passkeyError.code === "passkey_disabled") setError("A biometria ainda não está liberada no servidor. Use o e-mail abaixo.");
        else if (passkeyError.name === "NotAllowedError") setError("A entrada foi cancelada ou não há uma digital cadastrada para este site.");
        else setError("Não encontramos um acesso biométrico válido. Use o e-mail abaixo e ative a digital nos Ajustes.");
      }
    } catch {
      setError("Este navegador não permitiu usar a biometria. Use o e-mail abaixo.");
    }
    setLoading("");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(15,118,110,0.13),transparent_25rem)] px-4 py-8 sm:grid sm:place-items-center">
      <div className="fixed right-4 top-4 z-20"><InstallAppButton /></div>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-7 flex justify-center"><BrandMark /></div>
        <section className="app-card overflow-hidden">
          <div className="bg-[var(--brand-dark)] px-6 py-6 text-white">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/12"><ShieldCheck size={23} /></div>
            <h1 className="text-2xl font-extrabold tracking-[-0.035em]">Entre no OrçaMóvel</h1>
            <p className="mt-1.5 text-sm leading-6 text-[#c8e2de]">Sem criar ou memorizar senha.</p>
          </div>
          <form onSubmit={sendAccessLink} className="space-y-4 p-5 sm:p-6">
            <button type="button" onClick={() => void signInWithPasskey()} disabled={Boolean(loading)} className="primary-button w-full">
              {loading === "passkey" ? <LoaderCircle className="animate-spin" size={18} /> : <Fingerprint size={20} />}
              {loading === "passkey" ? "Aguarde…" : "Entrar com digital"}
            </button>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-[#8a9894]"><span className="h-px flex-1 bg-[#dfe7e5]" />primeiro acesso ou novo aparelho<span className="h-px flex-1 bg-[#dfe7e5]" /></div>
            <label><span className="field-label">E-mail</span><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82918e]" size={18} /><input required type="email" className="field-input !pl-11" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" /></div></label>
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-700">{error}</p>}
            {message && <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-semibold leading-5 text-emerald-700">{message}</p>}
            <button disabled={Boolean(loading)} className="secondary-button w-full"><LogIn size={18} />{loading === "email" ? "Enviando…" : "Receber acesso no e-mail"}</button>
          </form>
          <details className="border-t border-[#e1e9e7] px-5 py-4 sm:px-6">
            <summary className="cursor-pointer text-center text-sm font-semibold text-[#687875]">Outras formas de entrar</summary>
            <form onSubmit={signInWithPassword} className="mt-4 space-y-3">
              <label><span className="field-label">Senha opcional</span><div className="relative"><KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82918e]" size={18} /><input required type={showPassword ? "text" : "password"} className="field-input !pl-11 !pr-12" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Configurada nos Ajustes" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-[#6f7e7b]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
              <button disabled={Boolean(loading)} className="quiet-button w-full"><KeyRound size={17} />{loading === "password" ? "Aguarde…" : "Entrar com senha"}</button>
            </form>
          </details>
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-[#657570]"><CalendarClock size={17} className="text-[var(--brand)]" />30 dias grátis · sem cartão</p>
      </div>
    </main>
  );
}

export function AuthShell() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [now] = useState(() => Date.now());
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    setSession(currentSession);
    if (!currentSession || !supabase) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("id,email,trial_ends_at,subscription_status,plan_type,access_expires_at").eq("id", currentSession.user.id).single();
    if (data) {
      setProfile({
        id: data.id,
        email: data.email || currentSession.user.email || "",
        trialEndsAt: data.trial_ends_at,
        subscriptionStatus: data.subscription_status,
        planType: data.plan_type,
        accessExpiresAt: data.access_expires_at,
      });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => void loadProfile(nextSession), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [loadProfile, supabase]);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (!profile) return (
    <main className="grid min-h-screen place-items-center bg-[#f2f6f5] p-5">
      <section className="app-card w-full max-w-md p-6 text-center">
        <h1 className="text-xl font-extrabold">Não foi possível confirmar seu acesso</h1>
        <p className="mt-2 text-sm leading-6 text-[#657570]">Verifique a internet e tente novamente. Seus dados continuam seguros.</p>
        <button onClick={() => { setLoading(true); void loadProfile(session); }} className="primary-button mt-5 w-full"><RefreshCw size={17} />Tentar novamente</button>
        <button onClick={() => void signOut()} className="quiet-button mt-2 w-full">Sair da conta</button>
      </section>
    </main>
  );

  const paidAccess = profile.subscriptionStatus === "active" && (profile.planType === "lifetime" || !profile.accessExpiresAt || new Date(profile.accessExpiresAt).getTime() > now);
  const expired = !paidAccess && new Date(profile.trialEndsAt).getTime() <= now;
  if (expired) return <PricingScreen email={profile.email} onSignOut={signOut} onRefresh={() => void loadProfile(session)} />;

  return <BudgetApp userId={session.user.id} userEmail={session.user.email || ""} profile={profile} onSignOut={signOut} />;
}
