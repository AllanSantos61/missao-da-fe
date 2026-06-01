"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ChallengeId,
  CommunityInfo,
  DailyChallengeResult,
  ReminderPreference,
  UserProgress
} from "@/types/dailyProgress";
import {
  completeChallenge as completeChallengeInService,
  completeOnboarding as completeOnboardingInService,
  getUserProgress,
  hasCompletedChallengeToday,
  resetDailyStateIfNeeded,
  saveUserProgress,
  addXP as addXPInService,
  updateCommunity as updateCommunityInService,
  updatePlayerName as updatePlayerNameInService,
  updateReminderPreference as updateReminderPreferenceInService
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

  const updateCommunity = useCallback(function updateCommunity(community: CommunityInfo) {
    setProgress((current) => {
      if (!current) return current;
      return updateCommunityInService(current, community);
    });
  }, []);

  const updateReminderPreference = useCallback(function updateReminderPreference(reminder: ReminderPreference) {
    setProgress((current) => {
      if (!current) return current;
      return updateReminderPreferenceInService(current, reminder);
    });
  }, []);

  const addXP = useCallback(function addXP(xp: number) {
    setProgress((current) => {
      if (!current) return current;
      return addXPInService(current, xp);
    });
  }, []);

  return {
    progress,
    todayHistory,
    isLoaded: Boolean(progress),
    refreshDay,
    completeChallenge,
    updatePlayerName,
    updateCommunity,
    updateReminderPreference,
    addXP,
    completeOnboarding
  };
}
