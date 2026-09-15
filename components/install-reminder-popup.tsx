"use client";

import { Download, MoreVertical, Share2, Smartphone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type ReminderStage = "first" | "second" | "daily";
type ReminderState = {
  firstDismissed?: boolean;
  secondDismissed?: boolean;
  lastDailyShown?: string;
};

const REMINDER_KEY = "orcamovel.install-reminder.v1";
const INSTALLED_KEY = "orcamovel.pwa-installed.v1";

function runningStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readState(): ReminderState {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_KEY) || "{}") as ReminderState;
  } catch {
    return {};
  }
}

function writeState(state: ReminderState) {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(state));
}

export function InstallReminderPopup() {
  const [visible, setVisible] = useState(false);
  const [stage, setStage] = useState<ReminderStage>("first");
  const [helpMode, setHelpMode] = useState(false);
  const promptEvent = useRef<InstallPromptEvent | null>(null);
  const secondTimer = useRef<number | null>(null);

  useEffect(() => {
    if (runningStandalone()) {
      localStorage.setItem(INSTALLED_KEY, "true");
      return;
    }
    if (localStorage.getItem(INSTALLED_KEY) === "true") return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      promptEvent.current = event as InstallPromptEvent;
    };
    const onInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      setVisible(false);
      setHelpMode(false);
      promptEvent.current = null;
      if (secondTimer.current) window.clearTimeout(secondTimer.current);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const timer = window.setTimeout(() => {
      const state = readState();
      if (!state.firstDismissed) {
        setStage("first");
        setVisible(true);
        return;
      }
      if (!state.secondDismissed) {
        setStage("second");
        setVisible(true);
        return;
      }
      const today = todayKey();
      if (state.lastDailyShown !== today) {
        writeState({ ...state, lastDailyShown: today });
        setStage("daily");
        setVisible(true);
      }
    }, 2800);

    return () => {
      window.clearTimeout(timer);
      if (secondTimer.current) window.clearTimeout(secondTimer.current);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const advanceReminder = () => {
    const state = readState();
    const today = todayKey();
    if (stage === "first") {
      writeState({ ...state, firstDismissed: true });
      secondTimer.current = window.setTimeout(() => {
        if (localStorage.getItem(INSTALLED_KEY) === "true" || runningStandalone()) return;
        setHelpMode(false);
        setStage("second");
        setVisible(true);
      }, 45_000);
      return;
    }
    if (stage === "second") {
      writeState({ ...state, firstDismissed: true, secondDismissed: true, lastDailyShown: today });
      return;
    }
    writeState({ ...state, firstDismissed: true, secondDismissed: true, lastDailyShown: today });
  };

  const dismiss = () => {
    setVisible(false);
    setHelpMode(false);
    advanceReminder();
  };

  const install = async () => {
    setVisible(false);
    advanceReminder();

    const existingInstallButton = document.querySelector<HTMLButtonElement>(".install-pill");
    if (existingInstallButton) {
      existingInstallButton.click();
      return;
    }

    if (promptEvent.current) {
      try {
        await promptEvent.current.prompt();
        const choice = await promptEvent.current.userChoice;
        if (choice.outcome === "accepted") localStorage.setItem(INSTALLED_KEY, "true");
        promptEvent.current = null;
        return;
      } catch {
        promptEvent.current = null;
      }
    }

    setHelpMode(true);
    setVisible(true);
  };

  if (!visible) return null;

  const title = stage === "second" ? "Que tal instalar agora?" : stage === "daily" ? "Tenha o OrçaMóvel a um toque" : "Instale o OrçaMóvel";
  const description = stage === "second"
    ? "É rapidinho. O OrçaMóvel ganha um ícone no seu celular ou computador e abre direto como aplicativo."
    : "Acesse seus clientes, orçamentos e PDFs direto pelo ícone, sem precisar procurar o site toda vez.";

  return (
    <aside className="fixed inset-x-4 bottom-[5.8rem] z-[65] mx-auto w-auto max-w-md rounded-3xl border border-[#cfe0dc] bg-white p-4 shadow-[0_20px_60px_rgba(18,55,49,0.22)] sm:bottom-6 sm:p-5" role="dialog" aria-live="polite" aria-labelledby="install-reminder-title">
      <div className="flex items-start gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--brand,#0C4D46)] text-white shadow-sm"><Smartphone size={23} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div><p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-[var(--brand,#0C4D46)]">Acesso mais rápido</p><h2 id="install-reminder-title" className="mt-0.5 text-lg font-extrabold tracking-[-0.025em] text-[#172321]">{helpMode ? "Como instalar" : title}</h2></div>
            <button type="button" onClick={dismiss} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#71817d] transition-colors hover:bg-[#f1f5f4]" aria-label="Agora não"><X size={18} /></button>
          </div>
          {!helpMode ? <p className="mt-1.5 text-sm leading-5 text-[#687875]">{description}</p> : (
            <div className="mt-3 space-y-2 text-sm text-[#566661]">
              <p className="flex items-start gap-2"><MoreVertical size={17} className="mt-0.5 shrink-0 text-[var(--brand,#0C4D46)]" /><span><strong>Android:</strong> menu ⋮ → Instalar aplicativo.</span></p>
              <p className="flex items-start gap-2"><Share2 size={17} className="mt-0.5 shrink-0 text-[var(--brand,#0C4D46)]" /><span><strong>iPhone:</strong> Compartilhar → Adicionar à Tela de Início.</span></p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={dismiss} className="min-h-11 rounded-xl border border-[#d9e4e1] bg-white px-3 text-sm font-extrabold text-[#52635f]">Agora não</button>
        {!helpMode ? <button type="button" onClick={() => void install()} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--brand,#0C4D46)] px-3 text-sm font-extrabold text-white shadow-sm"><Download size={17} />Instalar agora</button> : <button type="button" onClick={() => setVisible(false)} className="min-h-11 rounded-xl bg-[var(--brand,#0C4D46)] px-3 text-sm font-extrabold text-white">Entendi</button>}
      </div>
      {stage === "daily" && !helpMode && <p className="mt-2 text-center text-[11px] font-semibold text-[#8a9794]">Se deixar para depois, lembraremos novamente amanhã.</p>}
    </aside>
  );
}
