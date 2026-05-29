"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/services/analyticsService";
import type { UserProgress } from "@/types/dailyProgress";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaInstallButtonProps = {
  progress: UserProgress;
};

export function PwaInstallButton({ progress }: PwaInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (isInstalled) return null;

  async function install() {
    void trackEvent({
      eventName: "pwa_install_clicked",
      userId: progress.anonymousUserId,
      playerName: progress.playerName
    });

    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <button
      onClick={install}
      className="w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm font-black text-navy shadow-sm"
    >
      Adicionar à tela inicial
    </button>
  );
}
