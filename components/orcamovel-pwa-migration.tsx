"use client";

import { Download, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const MIGRATION_KEY = "orcamovel.pwa-migration.v3";
const OLD_INSTALLED_KEY = "orcamovel.pwa-installed.v1";
const NEW_SCOPE = "/apps/moveis";

function standalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function OrcaMovelPwaMigration() {
  const [visible, setVisible] = useState(false);
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (localStorage.getItem(MIGRATION_KEY) === "complete") return;

    const detect = async () => {
      if (!("serviceWorker" in navigator)) return;
      const registrations = await navigator.serviceWorker.getRegistrations();
      const rootScope = `${location.origin}/`;
      const oldRootWorker = registrations.some((r) => r.scope === rootScope);
      const knownOldInstall = localStorage.getItem(OLD_INSTALLED_KEY) === "true";
      if (oldRootWorker || (knownOldInstall && !standalone())) setVisible(true);
    };

    void detect();
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      if (localStorage.getItem(OLD_INSTALLED_KEY) === "true") setVisible(true);
    };
    const onInstalled = () => {
      localStorage.setItem(MIGRATION_KEY, "complete");
      localStorage.setItem(OLD_INSTALLED_KEY, "true");
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const migrate = async () => {
    setWorking(true);
    setMessage("");
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const rootScope = `${location.origin}/`;
        await Promise.all(registrations.filter((r) => r.scope === rootScope).map((r) => r.unregister()));
        await navigator.serviceWorker.register("/apps/moveis/sw.js", { scope: NEW_SCOPE, updateViaCache: "none" });
      }
      if ("caches" in window) {
        const names = await caches.keys();
        await Promise.all(names.filter((name) => name.startsWith("orcamovel-") && name !== "orcamovel-v16" && name !== "orcamovel-brand-icon-v2").map((name) => caches.delete(name)));
      }
      if (promptEvent) {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          localStorage.setItem(MIGRATION_KEY, "complete");
          setVisible(false);
        } else {
          setMessage("Atualização cancelada. Você poderá tentar novamente depois.");
        }
        setPromptEvent(null);
      } else {
        setMessage("A nova versão está preparada. Remova o atalho antigo e, no Chrome, toque em ⋮ → Instalar aplicativo.");
      }
    } catch {
      setMessage("Não foi possível concluir agora. Seus dados não foram alterados. Tente novamente.");
    } finally {
      setWorking(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-end bg-[#102521]/40 p-4 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="pwa-migration-title">
      <section className="app-card w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-[var(--brand-dark)] p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12"><RefreshCw size={22}/></div>
            <button type="button" onClick={() => setVisible(false)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10" aria-label="Agora não"><X size={18}/></button>
          </div>
          <h2 id="pwa-migration-title" className="mt-4 text-xl font-extrabold">Nova instalação do OrçaMóvel</h2>
          <p className="mt-2 text-sm leading-6 text-[#c8e2de]">Corrigimos o escopo de instalação para o OrçaMóvel abrir como aplicativo independente, sem compartilhar a navegação dos outros produtos Orça.</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex gap-3 rounded-xl bg-[#f3f7f6] p-3 text-sm font-semibold text-[#42514e]"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--brand)]" size={19}/><span>Seus clientes, projetos, orçamentos e PDFs continuam na sua conta. Esta atualização não apaga seus dados.</span></div>
          {message && <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</p>}
          <button type="button" disabled={working} onClick={() => void migrate()} className="primary-button w-full"><Download size={18}/>{working ? "Preparando atualização…" : "Preparar nova instalação"}</button>
          <button type="button" onClick={() => setVisible(false)} className="quiet-button w-full">Agora não</button>
        </div>
      </section>
    </div>
  );
}
