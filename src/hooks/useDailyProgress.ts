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
  addXP as addXPInService,
  completeChallenge as completeChallengeInService,
  completeOnboarding as completeOnboardingInService,
  getFallbackUserProgress,
  getUserProgress,
  hasCompletedChallengeToday,
  resetDailyStateIfNeeded,
  saveUserProgress,
  updateCommunity as updateCommunityInService,
  updatePlayerName as updatePlayerNameInService,
  updateReminderPreference as updateReminderPreferenceInService
} from "@/services/progressService";

export function useDailyProgress() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fallbackNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    const timeout = window.setTimeout(() => {
      if (!isMounted) return;
      console.log("[App] Loading timeout; rendering local progress fallback");
      setProgress(getFallbackUserProgress());
      setIsLoading(false);
      console.log("[App] Loading finished");
    }, 3000);

    function loadProgress() {
      console.log("[App] Loading started");
      try {
        const nextProgress = getUserProgress();
        saveUserProgress(nextProgress);
        if (!isMounted) return;
        setProgress(nextProgress);
      } catch (error) {
        console.log("[App] Local progress load failed; creating safe initial progress", error);
        if (!isMounted) return;
        setProgress(getFallbackUserProgress());
      } finally {
        window.clearTimeout(timeout);
        if (isMounted) {
          setIsLoading(false);
          console.log("[App] Loading finished");
        }
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
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
    isLoaded: !isLoading && Boolean(progress),
    fallbackNotice,
    refreshDay,
    completeChallenge,
    updatePlayerName,
    updateCommunity,
    updateReminderPreference,
    addXP,
    completeOnboarding
  };
}
