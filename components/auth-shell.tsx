"use client";

import { CalendarClock, Eye, EyeOff, Fingerprint, KeyRound, LoaderCircle, LogIn, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BrandMark } from "./brand-mark";
import { BudgetApp } from "./budget-app";
import { InstallAppButton } from "./install-app-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AccountProfile } from "@/lib/types";

type AuthMode = "login" | "signup";

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f2f6f5] p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit"><BrandMark /></div>
        <LoaderCircle className="mx-auto animate-spin text-[#0f766e]" size={24} />
      </div>
    </main>
  );
}

function AuthScreen() {
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [loading, setLoading] = useState<"passkey" | "email" | "password" | "signup" | "">("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(mode === "signup" ? "signup" : usePassword ? "password" : "email");
    setError("");
    setMessage("");

    if (mode === "signup") {
      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const generatedPassword = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
      const result = await supabase.auth.signUp({
        email: email.trim(),
        password: generatedPassword,
        options: { data: { full_name: name.trim() } },
      });
      if (result.error) setError(result.error.message);
      else if (!result.data.session) setMessage("Abra o link que enviamos para entrar. Você não precisará criar uma senha.");
    } else if (usePassword) {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) setError(result.error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : result.error.message);
    } else {
      const result = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
      });
      if (result.error) {
        if (result.error.message.toLowerCase().includes("rate limit")) {
          setUsePassword(true);
          setError("Muitos links foram solicitados. Aguarde alguns minutos ou entre com sua senha antiga.");
        }
        else setError(result.error.message.includes("Signups not allowed") ? "Não encontramos uma conta com este e-mail." : result.error.message);
      }
      else setMessage("Pronto. Enviamos um link de acesso para o seu e-mail.");
    }
    setLoading("");
  };

  const signInWithPasskey = async () => {
    if (!supabase) return;
    setLoading("passkey");
    setError("");
    setMessage("");
    const { error: passkeyError } = await supabase.auth.signInWithPasskey();
    if (passkeyError) setError(passkeyError.name === "NotAllowedError" ? "A entrada foi cancelada." : "Não encontramos uma digital cadastrada neste aparelho. Use o e-mail abaixo.");
    setLoading("");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(15,118,110,0.13),transparent_25rem)] px-4 py-8 sm:grid sm:place-items-center">
      <div className="fixed right-4 top-4 z-20"><InstallAppButton /></div>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-7 flex justify-center"><BrandMark /></div>
        <section className="app-card overflow-hidden">
          <div className="bg-[#123d39] px-6 py-6 text-white">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/12"><ShieldCheck size={23} /></div>
            <h1 className="text-2xl font-extrabold tracking-[-0.035em]">{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
            <p className="mt-1.5 text-sm leading-6 text-[#c8e2de]">{mode === "login" ? "Seus clientes e orçamentos em um só lugar." : "Teste todos os recursos gratuitamente por 30 dias."}</p>
          </div>
          <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
            {mode === "login" && (
              <button type="button" onClick={() => void signInWithPasskey()} disabled={Boolean(loading)} className="primary-button w-full">
                {loading === "passkey" ? <LoaderCircle className="animate-spin" size={18} /> : <Fingerprint size={20} />}
                {loading === "passkey" ? "Aguarde…" : "Entrar com digital"}
              </button>
            )}
            {mode === "login" && <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-[#8a9894]"><span className="h-px flex-1 bg-[#dfe7e5]" />ou use seu e-mail<span className="h-px flex-1 bg-[#dfe7e5]" /></div>}
            {mode === "signup" && (
              <label><span className="field-label">Seu nome</span><div className="relative"><UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82918e]" size={18} /><input required className="field-input !pl-11" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome completo" autoComplete="name" /></div></label>
            )}
            <label><span className="field-label">E-mail</span><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82918e]" size={18} /><input required type="email" className="field-input !pl-11" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" /></div></label>
            {mode === "login" && usePassword && <label><span className="field-label">Senha antiga</span><div className="relative"><KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#82918e]" size={18} /><input required type={showPassword ? "text" : "password"} className="field-input !pl-11 !pr-12" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha cadastrada" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-[#6f7e7b]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>}
            {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-700">{error}</p>}
            {message && <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-semibold leading-5 text-emerald-700">{message}</p>}
            <button disabled={Boolean(loading)} className={mode === "login" ? "secondary-button w-full" : "primary-button w-full"}><LogIn size={18} />{loading === "email" || loading === "password" || loading === "signup" ? "Aguarde…" : mode === "login" ? usePassword ? "Entrar com senha" : "Enviar link de acesso" : "Criar conta sem senha"}</button>
            {mode === "login" && <button type="button" onClick={() => { setUsePassword((value) => !value); setError(""); setMessage(""); }} className="quiet-button w-full">{usePassword ? "Prefiro receber um link no e-mail" : "Entrar com minha senha antiga"}</button>}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setUsePassword(false); setPassword(""); setError(""); setMessage(""); }} className="quiet-button w-full">{mode === "login" ? "Ainda não tenho conta" : "Já tenho uma conta"}</button>
          </form>
        </section>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-[#657570]"><CalendarClock size={17} className="text-[#0f766e]" />30 dias grátis · sem cartão</p>
      </div>
    </main>
  );
}

function TrialExpired({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f2f6f5] p-5">
      <div className="fixed right-4 top-4 z-20"><InstallAppButton /></div>
      <section className="app-card w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700"><CalendarClock size={28} /></div>
        <h1 className="text-2xl font-extrabold tracking-[-0.035em]">Seu período de teste terminou</h1>
        <p className="mt-3 text-sm leading-6 text-[#657570]">A conta <strong>{email}</strong> e seus dados continuam protegidos. Ative um plano para voltar a criar e editar orçamentos.</p>
        <div className="mt-6 rounded-xl bg-[#edf5f3] px-4 py-3 text-sm font-semibold text-[#285d57]">A ativação do plano é feita pelo administrador.</div>
        <button onClick={onSignOut} className="quiet-button mt-2 w-full">Sair da conta</button>
      </section>
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
    const { data } = await supabase.from("profiles").select("id,email,trial_ends_at,subscription_status").eq("id", currentSession.user.id).single();
    if (data) {
      setProfile({
        id: data.id,
        email: data.email || currentSession.user.email || "",
        trialEndsAt: data.trial_ends_at,
        subscriptionStatus: data.subscription_status,
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

  const expired = profile && profile.subscriptionStatus !== "active" && new Date(profile.trialEndsAt).getTime() <= now;
  if (expired) return <TrialExpired email={profile.email} onSignOut={signOut} />;

  return <BudgetApp userId={session.user.id} userEmail={session.user.email || ""} profile={profile} onSignOut={signOut} />;
}
