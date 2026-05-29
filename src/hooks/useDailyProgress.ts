"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChallengeId, DailyChallengeResult, UserProgress } from "@/types/dailyProgress";
import {
  completeChallenge as completeChallengeInService,
  completeOnboarding as completeOnboardingInService,
  getUserProgress,
  hasCompletedChallengeToday,
  resetDailyStateIfNeeded,
  saveUserProgress,
  updatePlayerName as updatePlayerNameInService
} from "@/services/progressService";

export function useDailyProgress() {
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    const nextProgress = getUserProgress();
    saveUserProgress(nextProgress);
    setProgress(nextProgress);
  }, []);

  const todayHistory = useMemo(() => {
    if (!progress) return null;
    return progress.dailyHistory[progress.activeDate];
  }, [progress]);

  const refreshDay = useCallback(function refreshDay() {
    setProgress((current) => {
      if (!current) return current;
      const nextProgress = resetDailyStateIfNeeded(current);
      saveUserProgress(nextProgress);
      return nextProgress;
    });
  }, []);

  const completeChallenge = useCallback(function completeChallenge(
    challengeId: ChallengeId,
    result: DailyChallengeResult
  ) {
    setProgress((current) => {
      if (!current || hasCompletedChallengeToday(current, challengeId)) {
        return current;
      }

      return completeChallengeInService(current, challengeId, result);
    });
  }, []);

  const updatePlayerName = useCallback(function updatePlayerName(playerName: string) {
    setProgress((current) => {
      if (!current) return current;
      return updatePlayerNameInService(current, playerName);
    });
  }, []);

  const completeOnboarding = useCallback(function completeOnboarding(playerName?: string) {
    setProgress((current) => {
      if (!current) return current;
      return completeOnboardingInService(current, playerName);
    });
  }, []);

  return {
    progress,
    todayHistory,
    isLoaded: Boolean(progress),
    refreshDay,
    completeChallenge,
    updatePlayerName,
    completeOnboarding
  };
}
