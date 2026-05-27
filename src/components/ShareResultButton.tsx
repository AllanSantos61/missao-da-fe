"use client";

import { buildWhatsAppShareUrl } from "@/utils/share";
import type { DayHistory, UserProgress } from "@/types/dailyProgress";

type ShareResultButtonProps = {
  progress: UserProgress;
  todayHistory: DayHistory;
};

export function ShareResultButton({ progress, todayHistory }: ShareResultButtonProps) {
  const url = typeof window === "undefined" ? "" : window.location.origin;
  const shareUrl = buildWhatsAppShareUrl({
    gospelDone: Boolean(todayHistory.results.gospel),
    quizScore: todayHistory.results.quiz?.quiz?.score ?? 0,
    quizTotal: todayHistory.results.quiz?.quiz?.total ?? 3,
    wordAttempts: todayHistory.results.word?.word?.attempts ?? 0,
    wordSolved: Boolean(todayHistory.results.word?.word?.solved),
    streak: progress.currentStreak,
    xpToday: todayHistory.xpEarned,
    journeyProgress: todayHistory.results.gospel?.scoreLabel,
    url
  });

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center rounded-2xl bg-faithGreen px-6 py-4 font-black text-white shadow-card transition hover:-translate-y-0.5 hover:bg-navy"
    >
      Compartilhar no WhatsApp
    </a>
  );
}
