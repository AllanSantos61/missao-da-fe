"use client";

import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/services/analyticsService";
import type { UserProgress } from "@/types/dailyProgress";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallButtonProps = {
  progress: UserProgress;
};

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function PwaInstallButton({ progress }: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const isIos = useMemo(() => isIosDevice(), []);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setIsInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    setIsInstalled(isStandalone());

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  async function install() {
    void trackEvent({
      eventName: "pwa_install_clicked",
      userId: progress.anonymousUserId,
      playerName: progress.playerName
    });

    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }

    if (isIos) {
      setShowIosHint((current) => !current);
    }
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
      <button onClick={install} className="w-full rounded-xl bg-navy px-4 py-3 text-sm font-black text-white">
        Instalar app
      </button>
      {showIosHint ? (
        <p className="mt-3 text-xs font-bold leading-5 text-ink/65">
          No iPhone, toque em Compartilhar no Safari e escolha “Adicionar à Tela de Início”.
        </p>
      ) : (
        <p className="mt-2 text-xs font-bold leading-5 text-ink/55">
          Acesse sua jornada em tela cheia pelo celular.
        </p>
      )}
    </div>
  );
}
