import type { ChallengeId, DailyChallengeResult, UserProgress } from "@/types/dailyProgress";
import * as localProgressService from "@/services/localProgressService";

export function getUserProgress() {
  return localProgressService.getUserProgress();
}

export function saveUserProgress(progress: UserProgress) {
  return localProgressService.saveUserProgress(progress);
}

export function updatePlayerName(progress: UserProgress, playerName: string) {
  return localProgressService.updatePlayerName(progress, playerName);
}

export function addXP(progress: UserProgress, xp: number) {
  return localProgressService.addXP(progress, xp);
}

export function getWeeklyRanking(progress?: UserProgress) {
  return localProgressService.getWeeklyRanking(progress);
}

export function completeChallenge(
  progress: UserProgress,
  challengeId: ChallengeId,
  result: DailyChallengeResult
) {
  return localProgressService.completeChallenge(progress, challengeId, result);
}

export function hasCompletedChallengeToday(progress: UserProgress, challengeId: ChallengeId) {
  return localProgressService.hasCompletedChallengeToday(progress, challengeId);
}

export function getTodayProgress(progress: UserProgress) {
  return localProgressService.getTodayProgress(progress);
}

export function resetDailyStateIfNeeded(progress: UserProgress) {
  return localProgressService.resetDailyStateIfNeeded(progress);
}
