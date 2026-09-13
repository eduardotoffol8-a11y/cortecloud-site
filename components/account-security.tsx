"use client";

import { KeyRound, LoaderCircle, LogOut, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { PasskeyCard } from "./passkey-card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AccountSecurity({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

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
    const confirmation = window.prompt('Para excluir definitivamente, digite EXCLUIR');
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

  return (
    <div className="mt-5 space-y-5">
      <PasskeyCard />
      <section className="app-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#edf5f3] text-[#0f766e]"><KeyRound size={22} /></span>
          <div><h2 className="font-bold">Senha opcional</h2><p className="mt-1 text-sm leading-5 text-[#6f7f7b]">Só configure se quiser outra forma de entrar. O link por e-mail continua funcionando.</p></div>
        </div>
        <form onSubmit={savePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input required minLength={6} type="password" className="field-input" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nova senha" autoComplete="new-password" />
          <input required minLength={6} type="password" className="field-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repetir senha" autoComplete="new-password" />
          <button disabled={saving} className="secondary-button sm:col-span-2">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <KeyRound size={17} />}{saving ? "Salvando…" : "Salvar senha opcional"}</button>
        </form>
        {message && <p role="status" className="mt-3 text-sm font-semibold text-[#536b67]">{message}</p>}
      </section>
      <section className="app-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="font-bold">Sua conta</p><p className="mt-1 truncate text-sm text-[#74837f]">{email}</p></div>
          <button onClick={onSignOut} className="secondary-button shrink-0"><LogOut size={17} />Sair deste aparelho</button>
        </div>
        <div className="my-5 h-px bg-[#e4ebe9]" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><ShieldAlert size={20} className="mt-0.5 shrink-0 text-rose-600" /><div><p className="font-bold text-rose-700">Excluir conta</p><p className="mt-1 text-sm leading-5 text-[#74837f]">Apaga empresa, clientes, orçamentos e arquivos. Não pode ser desfeito.</p></div></div>
          <button type="button" disabled={deleting} onClick={() => void deleteAccount()} className="secondary-button shrink-0 !border-rose-200 !text-rose-700">{deleting ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}{deleting ? "Excluindo…" : "Excluir conta"}</button>
        </div>
      </section>
    </div>
  );
}
