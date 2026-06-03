"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { buildWhatsAppShareUrl, generateShareMessage } from "@/utils/share";
import type { DayHistory, UserProgress } from "@/types/dailyProgress";
import { trackEvent } from "@/services/analyticsService";
import { buildPublicResult, savePublicResult } from "@/services/publicResultService";

type ShareResultButtonProps = {
  progress: UserProgress;
  todayHistory: DayHistory;
};

export function ShareResultButton({ progress, todayHistory }: ShareResultButtonProps) {
  const url = typeof window === "undefined" ? "" : window.location.origin;
  const [publicResultUrl, setPublicResultUrl] = useState("");
  const fallbackResult = buildPublicResult(progress, todayHistory);
  const readingDone = Boolean(todayHistory.results.gospel);
  const quizScore = todayHistory.results.quiz?.quiz?.score ?? 0;
  const quizTotal = todayHistory.results.quiz?.quiz?.total ?? 3;
  const wordAttempts = todayHistory.results.word?.word?.attempts ?? 0;
  const wordSolved = Boolean(todayHistory.results.word?.word?.solved);
  const missionCompleted = readingDone && quizScore >= quizTotal && wordSolved;

  useEffect(() => {
    let isMounted = true;
    async function preparePublicResult() {
      const result = await savePublicResult(progress, todayHistory);
      if (isMounted && typeof window !== "undefined") {
        setPublicResultUrl(`${window.location.origin}/resultado/${result.shareSlug}`);
      }
    }

    void preparePublicResult();
    return () => {
      isMounted = false;
    };
  }, [progress, todayHistory]);

  const shareParams = {
    playerName: progress.playerName,
    readingDone,
    quizScore,
    quizTotal,
    wordScore: wordAttempts,
    wordAttempts,
    wordSolved,
    streak: progress.currentStreak,
    xpToday: todayHistory.xpEarned,
    totalXP: progress.totalXP,
    currentDay: fallbackResult.journeyDay,
    url,
    resultUrl: publicResultUrl || url,
    publicResultUrl,
    variant: missionCompleted ? "complete" as const : "partial" as const
  };
  const shareUrl = buildWhatsAppShareUrl(shareParams);

  async function handleShare(event: MouseEvent<HTMLAnchorElement>) {
    void trackEvent({
      eventName: "whatsapp_shared",
      userId: progress.anonymousUserId,
      playerName: progress.playerName,
      metadata: { xpToday: todayHistory.xpEarned, publicResultUrl }
    });

    if (!navigator.share || !publicResultUrl) return;

    event.preventDefault();
    await navigator.share({
      title: "Missão da Fé",
      text: generateShareMessage(shareParams)
    }).catch(() => {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <a
      href={shareUrl}
      onClick={handleShare}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center rounded-2xl bg-faithGreen px-6 py-4 font-black text-white shadow-card transition hover:-translate-y-0.5 hover:bg-navy"
    >
      Compartilhar no WhatsApp
    </a>
  );
}
