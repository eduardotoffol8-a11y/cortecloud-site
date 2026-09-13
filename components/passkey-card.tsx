"use client";

import { Fingerprint, KeyRound, LoaderCircle, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PasskeyInfo = { id: string; friendly_name?: string; created_at: string; last_used_at?: string };

export function PasskeyCard({ compact = false }: { compact?: boolean }) {
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data, error } = await supabase.auth.passkey.list();
    setPasskeys((data || []) as PasskeyInfo[]);
    if (error && error.code === "passkey_disabled") setMessage("A biometria está temporariamente indisponível. Entre por e-mail.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const checkSupport = async () => {
      if (!("PublicKeyCredential" in window) || !window.isSecureContext) return setSupported(false);
      try {
        setSupported(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
      } catch { setSupported(false); }
    };
    void checkSupport();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const passkeyError = (error: { code?: string; name?: string }) => {
    if (error.code === "passkey_disabled") return "A biometria ainda não está liberada no servidor.";
    if (error.code === "webauthn_credential_exists") return "A digital deste aparelho já está cadastrada.";
    if (error.code === "email_not_confirmed") return "Abra o link de acesso enviado por e-mail uma vez antes de ativar.";
    if (error.name === "NotAllowedError") return "A ativação foi cancelada ou bloqueada pelo aparelho.";
    return "Não foi possível ativar neste navegador. Tente pelo Chrome, Safari ou pelo app instalado.";
  };

  const register = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.registerPasskey();
      if (error) setMessage(passkeyError(error));
      else {
        setMessage("Acesso rápido ativado. Na próxima entrada, use a digital, o rosto ou o PIN.");
        await load();
      }
    } catch (error) {
      setMessage(passkeyError(error as { code?: string; name?: string }));
    }
    setLoading(false);
  };

  const remove = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !window.confirm("Remover este acesso por digital?")) return;
    setLoading(true);
    const { error } = await supabase.auth.passkey.delete({ passkeyId: id });
    setMessage(error ? "Não foi possível remover este acesso." : "Acesso removido.");
    await load();
    setLoading(false);
  };

  if (!supported && !loading) return (
    <section className={`app-card ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <p className="text-sm font-semibold text-[#687875]">Este navegador não oferece biometria. Use o e-mail ou abra o app instalado em um aparelho compatível.</p>
    </section>
  );

  return (
    <section className={`app-card ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e4f2ef] text-[var(--brand)]"><Fingerprint size={23} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold">Entrar com digital</h2>
          <p className="mt-1 text-sm leading-5 text-[#6f7f7b]">Use a digital, o rosto ou o PIN deste aparelho. Sem memorizar senha.</p>
        </div>
      </div>

      {passkeys.length > 0 && (
        <div className="mt-4 space-y-2">
          {passkeys.map((passkey) => (
            <div key={passkey.id} className="flex items-center gap-3 rounded-xl bg-[#f2f7f5] px-3 py-2.5">
              <ShieldCheck size={18} className="shrink-0 text-[var(--brand)]" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{passkey.friendly_name || "Acesso deste aparelho"}</p><p className="text-xs text-[#7b8b87]">Ativo e protegido</p></div>
              <button type="button" onClick={() => void remove(passkey.id)} className="quiet-button !min-h-9 !w-9 !p-0 !text-rose-600" aria-label="Remover acesso"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => void register()} disabled={loading} className={`${passkeys.length ? "secondary-button" : "primary-button"} mt-4 w-full`}>
        {loading ? <LoaderCircle className="animate-spin" size={18} /> : passkeys.length ? <KeyRound size={18} /> : <Fingerprint size={19} />}
        {loading ? "Aguarde…" : passkeys.length ? "Adicionar outro aparelho" : "Ativar acesso com digital"}
      </button>
      {message && <p role="status" className="mt-3 text-center text-sm font-semibold text-[#376b64]">{message}</p>}
    </section>
  );
}
