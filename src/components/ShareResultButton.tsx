"use client";

import { buildWhatsAppShareUrl } from "@/utils/share";
import type { DayHistory, UserProgress } from "@/types/dailyProgress";
import { trackEvent } from "@/services/analyticsService";

type ShareResultButtonProps = {
  progress: UserProgress;
  todayHistory: DayHistory;
};

export function ShareResultButton({ progress, todayHistory }: ShareResultButtonProps) {
  const url = typeof window === "undefined" ? "" : window.location.origin;
  const shareUrl = buildWhatsAppShareUrl({
    readingDone: Boolean(todayHistory.results.gospel),
    quizScore: todayHistory.results.quiz?.quiz?.score ?? 0,
    quizTotal: todayHistory.results.quiz?.quiz?.total ?? 3,
    wordAttempts: todayHistory.results.word?.word?.attempts ?? 0,
    wordSolved: Boolean(todayHistory.results.word?.word?.solved),
    streak: progress.currentStreak,
    xpToday: todayHistory.xpEarned,
    day: Number(todayHistory.results.gospel?.scoreLabel?.split("/")[0] ?? 1),
    url
  });

  return (
    <a
      href={shareUrl}
      onClick={() =>
        void trackEvent({
          eventName: "whatsapp_shared",
          userId: progress.anonymousUserId,
          playerName: progress.playerName,
          metadata: { xpToday: todayHistory.xpEarned }
        })
      }
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center rounded-2xl bg-faithGreen px-6 py-4 font-black text-white shadow-card transition hover:-translate-y-0.5 hover:bg-navy"
    >
      Compartilhar no WhatsApp
    </a>
  );
}
