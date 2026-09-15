"use client";

import { Building2, Download, MonitorDown, MoreVertical, Share2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { prepareCompanyInstallIcon, useDefaultInstallIcon } from "@/lib/pwa-icon";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallProduct = "moveis" | "obra";

function runningStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export function InstallAppButton({
  companyLogo = "",
  onRequestLogo,
  product = "moveis",
}: {
  companyLogo?: string;
  onRequestLogo?: () => void;
  product?: InstallProduct;
}) {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoChoice, setShowLogoChoice] = useState(false);
  const appName = product === "obra" ? "OrçaObra" : "OrçaMóvel";
  const businessLabel = product === "obra" ? "empresa" : "marcenaria";

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
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

  useEffect(() => {
    // O OrçaMóvel mantém o ícone dinâmico já aprovado. O OrçaObra usa seu
    // manifesto e ícone próprios, sem tocar no cache de identidade do OrçaMóvel.
    if (product !== "moveis") return;
    if (companyLogo) void prepareCompanyInstallIcon(companyLogo).catch(() => undefined);
    else void useDefaultInstallIcon().catch(() => undefined);
  }, [companyLogo, product]);

  if (installed) return null;

  const openNativeInstall = async () => {
    if (!promptEvent) {
      setShowHelp(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  };

  const install = async () => {
    if (product === "obra") {
      await openNativeInstall();
      return;
    }
    if (!companyLogo && onRequestLogo) {
      setShowLogoChoice(true);
      return;
    }
    if (companyLogo) {
      try { await prepareCompanyInstallIcon(companyLogo); } catch { await useDefaultInstallIcon(); }
    } else {
      await useDefaultInstallIcon();
    }
    await openNativeInstall();
  };

  const installWithDefault = async () => {
    setShowLogoChoice(false);
    await useDefaultInstallIcon();
    await openNativeInstall();
  };

  return (
    <>
      <button onClick={() => void install()} className="install-pill" aria-label={`Instalar ${appName} neste dispositivo`}>
        <Download size={15} />
        <span>Instalar o app</span>
      </button>
      {showLogoChoice && product === "moveis" && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-[#102521]/35 p-4 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="logo-choice-title">
          <section className="app-card w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 id="logo-choice-title" className="text-lg font-extrabold">Ícone do aplicativo</h2><p className="mt-1 text-sm leading-6 text-[#657570]">Você pode usar a logo da sua {businessLabel} como ícone no celular ou computador.</p></div><button onClick={() => setShowLogoChoice(false)} className="quiet-button !min-h-10 !w-10 !p-0" aria-label="Fechar"><X size={18}/></button></div>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={() => { setShowLogoChoice(false); onRequestLogo?.(); }} className="primary-button w-full"><Building2 size={18}/>Adicionar logo da empresa</button>
              <button type="button" onClick={() => void installWithDefault()} className="secondary-button w-full"><Sparkles size={18}/>Usar ícone do {appName}</button>
            </div>
          </section>
        </div>
      )}
      {showHelp && (
        <div className="fixed inset-0 z-[70] grid place-items-end bg-[#102521]/25 p-4 sm:place-items-center" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <section className="app-card w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="install-title" className="text-lg font-extrabold">Instalar o {appName}</h2><p className="mt-1 text-sm leading-6 text-[#657570]">A instalação cria um ícone e abre o {appName} direto, sem passar pela loja de aplicativos.</p></div>
              <button onClick={() => setShowHelp(false)} className="quiet-button !min-h-10 !w-10 !p-0" aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-3 rounded-xl bg-[#f3f7f6] p-3 text-sm font-semibold"><MonitorDown size={19} className="mt-0.5 shrink-0 text-[var(--brand)]" /><span>PC: no Chrome ou Edge, use o ícone de instalação na barra de endereço ou menu ⋮ → Instalar {appName}.</span></div>
              <div className="flex items-start gap-3 rounded-xl bg-[#f3f7f6] p-3 text-sm font-semibold"><MoreVertical size={19} className="mt-0.5 shrink-0 text-[var(--brand)]" /><span>Android: menu ⋮ → Instalar aplicativo.</span></div>
              <div className="flex items-start gap-3 rounded-xl bg-[#f3f7f6] p-3 text-sm font-semibold"><Share2 size={19} className="mt-0.5 shrink-0 text-[var(--brand)]" /><span>iPhone/iPad: Compartilhar → Adicionar à Tela de Início.</span></div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
