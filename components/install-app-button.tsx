"use client";

import { Download, MoreVertical, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function runningStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstalled(runningStandalone());
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
      setInstalled(false);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setShowHelp(false);
    };
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!promptEvent) {
      setShowHelp(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  };

  return (
    <>
      <button onClick={install} className="install-pill" aria-label="Instalar OrçaMóvel">
        <Download size={15} />
        <span>Instalar app</span>
      </button>
      {showHelp && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-[#102521]/25 p-4 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <section className="app-card w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="install-title" className="text-lg font-extrabold">Instalar o OrçaMóvel</h2><p className="mt-1 text-sm leading-6 text-[#657570]">Abra o menu do navegador e escolha a opção de instalação.</p></div>
              <button onClick={() => setShowHelp(false)} className="quiet-button !min-h-10 !w-10 !p-0" aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3 rounded-xl bg-[#f3f7f6] p-3 text-sm font-semibold"><MoreVertical size={19} className="text-[var(--brand)]" />Android: menu ⋮ → Instalar aplicativo</div>
              <div className="flex items-center gap-3 rounded-xl bg-[#f3f7f6] p-3 text-sm font-semibold"><Share2 size={19} className="text-[var(--brand)]" />iPhone: Compartilhar → Adicionar à Tela de Início</div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
