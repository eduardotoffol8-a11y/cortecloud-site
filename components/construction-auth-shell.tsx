"use client";

import {
  CalendarClock,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BrandMark } from "./brand-mark";
import { ConstructionBudgetApp } from "./construction-budget-app";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ProductAccess = {
  user_id: string;
  product_id: "obra-civil";
  trial_started_at: string;
  trial_ends_at: string;
  subscription_status: "trial" | "active" | "past_due" | "canceled";
  plan_type: "monthly" | "annual" | "lifetime" | null;
  access_expires_at: string | null;
  last_payment_id: string | null;
};

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f3] p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 w-fit"><BrandMark loading product="obra" /></div>
        <LoaderCircle className="mx-auto animate-spin text-[#a6400d]" size={24} />
      </div>
    </main>
  );
}

function AuthScreen() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"google" | "passkey" | "password" | "">("");
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    if (!supabase) return;
    setLoading("google");
    setError("");
    window.localStorage.setItem("orcamento.auth-return", "/apps/obra-civil");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/apps/obra-civil`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (oauthError) {
      setError("Não foi possível iniciar o acesso com Google. Tente novamente.");
      setLoading("");
    }
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
    try {
      const { error: passkeyError } = await supabase.auth.signInWithPasskey();
      if (passkeyError) {
        if (passkeyError.code === "passkey_disabled") {
          setError("A biometria ainda não está habilitada no servidor. Entre com Google por enquanto.");
        } else if (passkeyError.name === "NotAllowedError") {
          setError("A entrada foi cancelada ou não há uma credencial cadastrada para este dispositivo.");
        } else {
          setError("Não encontramos uma credencial válida. Entre com Google.");
        }
      }
    } catch {
      setError("Este navegador não permitiu usar biometria ou PIN. Entre com Google.");
    }
    setLoading("");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(166,64,13,0.13),transparent_25rem)] px-4 py-8 sm:grid sm:place-items-center lg:px-8">
      <div className="mx-auto w-full max-w-5xl lg:grid lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch lg:gap-6">
        <aside className="hidden overflow-hidden rounded-[1.6rem] bg-[#6d2e0d] p-9 text-white shadow-[0_24px_70px_rgba(75,36,15,0.16)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-10 w-fit rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold tracking-wide text-[#ffe4cf]">PC · CELULAR · TABLET</div>
            <h1 className="max-w-lg text-4xl font-extrabold leading-[1.08] tracking-[-0.05em]">O OrçaObra organiza a construção, do levantamento à proposta.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#f4d9c7]">Clientes, obras, serviços, custos e PDFs ficam organizados em um espaço próprio, separado do OrçaMóvel.</p>
          </div>
          <div className="mt-10 grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-4"><Monitor size={21} /><div><p className="font-bold">Trabalhe melhor no PC</p><p className="text-sm text-[#f4d9c7]">Mais espaço para planilhas, etapas e propostas.</p></div></div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-4"><Smartphone size={21} /><div><p className="font-bold">Continue no celular</p><p className="text-sm text-[#f4d9c7]">Leve o orçamento para o canteiro ou visita técnica.</p></div></div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-4"><FileText size={21} /><div><p className="font-bold">PDFs de obra</p><p className="text-sm text-[#f4d9c7]">Escopo, etapas, custos, BDI e condições em uma proposta profissional.</p></div></div>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <div className="mb-7 flex justify-center lg:justify-start"><BrandMark product="obra" /></div>
          <section className="app-card overflow-hidden">
            <div className="bg-[#6d2e0d] px-6 py-6 text-white">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-white/12"><ShieldCheck size={23} /></div>
              <h2 className="text-2xl font-extrabold tracking-[-0.035em]">Entre no OrçaObra</h2>
              <p className="mt-1.5 text-sm leading-6 text-[#f4d9c7]">O período grátis do OrçaObra começa apenas quando você acessa este aplicativo.</p>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <button type="button" onClick={() => void signInWithGoogle()} disabled={Boolean(loading)} className="primary-button w-full !bg-[#a6400d]">
                {loading === "google" ? <LoaderCircle className="animate-spin" size={18} /> : <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-black text-[#4285F4]">G</span>}
                {loading === "google" ? "Abrindo Google…" : "Continuar com Google"}
              </button>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-[#8a9894]"><span className="h-px flex-1 bg-[#eadfd8]" />ou neste dispositivo<span className="h-px flex-1 bg-[#eadfd8]" /></div>
              <button type="button" onClick={() => void signInWithPasskey()} disabled={Boolean(loading)} className="secondary-button w-full">
                {loading === "passkey" ? <LoaderCircle className="animate-spin" size={18} /> : <Fingerprint size={20} />}
                {loading === "passkey" ? "Aguarde…" : "Entrar com biometria ou PIN"}
              </button>
              {error && <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-700">{error}</p>}
            </div>
            <details className="border-t border-[#eadfd8] px-5 py-4 sm:px-6">
              <summary className="cursor-pointer text-center text-sm font-semibold text-[#786b64]">Outras formas de entrar</summary>
              <form onSubmit={signInWithPassword} className="mt-4 space-y-3">
                <label><span className="field-label">E-mail</span><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7e76]" size={18} /><input required type="email" className="field-input !pl-11" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" /></div></label>
                <label><span className="field-label">Senha opcional</span><div className="relative"><KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8d7e76]" size={18} /><input required type={showPassword ? "text" : "password"} className="field-input !pl-11 !pr-12" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Configurada nos Ajustes" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-[#786b64]" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
                <button disabled={Boolean(loading)} className="quiet-button w-full"><KeyRound size={17} />{loading === "password" ? "Aguarde…" : "Entrar com senha"}</button>
              </form>
            </details>
          </section>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-semibold text-[#75685f]"><CalendarClock size={17} className="text-[#a6400d]" />30 dias grátis próprios do OrçaObra</p>
        </div>
      </div>
    </main>
  );
}

function AccessProblem({ message, onRetry, onSignOut }: { message: string; onRetry: () => void; onSignOut: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#fff8f3] p-5">
      <section className="app-card w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-5 w-fit"><BrandMark product="obra" /></div>
        <h1 className="text-xl font-extrabold">Não foi possível confirmar o acesso ao OrçaObra</h1>
        <p className="mt-2 text-sm leading-6 text-[#75685f]">{message}</p>
        <button onClick={onRetry} className="primary-button mt-5 w-full !bg-[#a6400d]"><RefreshCw size={17} />Tentar novamente</button>
        <button onClick={onSignOut} className="quiet-button mt-2 w-full"><LogOut size={17} />Sair da conta</button>
      </section>
    </main>
  );
}

function TrialEnded({ onSignOut }: { onSignOut: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#fff8f3,#f8efe9)] p-5">
      <section className="w-full max-w-lg overflow-hidden rounded-[1.55rem] border border-[#ead7cb] bg-white shadow-[0_24px_70px_rgba(91,49,24,0.12)]">
        <div className="bg-[#6d2e0d] p-6 text-white">
          <CalendarClock size={30} />
          <h1 className="mt-4 text-2xl font-extrabold">O período grátis do OrçaObra terminou</h1>
          <p className="mt-2 text-sm leading-6 text-[#f4d9c7]">Seus clientes, obras e propostas continuam salvos nas tabelas exclusivas do OrçaObra.</p>
        </div>
        <div className="p-6">
          <p className="text-sm leading-6 text-[#6f625b]">Os planos comerciais próprios do OrçaObra ainda não estão liberados. Assim, nenhuma compra do OrçaMóvel será usada por engano para liberar este produto.</p>
          <button onClick={onSignOut} className="quiet-button mt-5 w-full"><LogOut size={17} />Sair da conta</button>
        </div>
      </section>
    </main>
  );
}

export function ConstructionAuthShell() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<ProductAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const loadAccess = useCallback(async (currentSession: Session | null) => {
    setSession(currentSession);
    setError("");
    if (!currentSession || !supabase) {
      setAccess(null);
      setLoading(false);
      return;
    }

    const { data, error: accessError } = await supabase.rpc("get_or_activate_product_access", {
      p_product_id: "obra-civil",
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (accessError || !row) {
      setAccess(null);
      setError("A estrutura de acesso do OrçaObra não respondeu. Nenhum dado do OrçaMóvel foi alterado.");
    } else {
      setAccess(row as ProductAccess);
    }
    setNow(Date.now());
    setLoading(false);
  }, [supabase]);

  const refresh = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    await loadAccess(data.session);
  }, [loadAccess, supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => void loadAccess(nextSession), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [loadAccess, refresh, supabase]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onFocus = () => void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const signOut = async () => { await supabase?.auth.signOut(); };

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (!access) return <AccessProblem message={error || "Tente novamente em alguns instantes."} onRetry={() => { setLoading(true); void refresh(); }} onSignOut={() => void signOut()} />;

  const paidAccess = access.subscription_status === "active" && (
    access.plan_type === "lifetime" ||
    !access.access_expires_at ||
    new Date(access.access_expires_at).getTime() > now
  );
  const trialAccess = access.subscription_status === "trial" && new Date(access.trial_ends_at).getTime() > now;

  if (!paidAccess && !trialAccess) return <TrialEnded onSignOut={() => void signOut()} />;

  return <ConstructionBudgetApp userId={session.user.id} profile={null} onSignOut={() => void signOut()} />;
}
