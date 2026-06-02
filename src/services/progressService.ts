import type {
  ChallengeId,
  CommunityInfo,
  DailyChallengeResult,
  RankingFilter,
  ReminderPreference,
  UserProgress,
  WeeklyRankingResult
} from "@/types/dailyProgress";
import * as localProgressService from "@/services/localProgressService";
import * as supabaseProgressService from "@/services/supabaseProgressService";

function syncInBackground(task: () => Promise<void>) {
  task().catch((error) => {
    console.warn("Supabase sync failed; localStorage fallback remains active.", error);
  });
}

export function getUserProgress() {
  return localProgressService.getUserProgress();
}

export function getFallbackUserProgress() {
  return localProgressService.createInitialProgress();
}

export function saveUserProgress(progress: UserProgress) {
  localProgressService.saveUserProgress(progress);
  syncInBackground(() => supabaseProgressService.syncProgress(progress));
}

export function updatePlayerName(progress: UserProgress, playerName: string) {
  const nextProgress = localProgressService.updatePlayerName(progress, playerName);
  syncInBackground(() => supabaseProgressService.syncProgress(nextProgress));
  return nextProgress;
}

export function updateCommunity(progress: UserProgress, community: CommunityInfo) {
  const nextProgress = localProgressService.updateCommunity(progress, community);
  syncInBackground(() => supabaseProgressService.syncProgress(nextProgress));
  return nextProgress;
}

export function updateReminderPreference(progress: UserProgress, reminder: ReminderPreference) {
  const nextProgress = localProgressService.updateReminderPreference(progress, reminder);
  syncInBackground(() => supabaseProgressService.syncProgress(nextProgress));
  return nextProgress;
}

export function completeOnboarding(progress: UserProgress, playerName?: string) {
  const nextProgress = localProgressService.completeOnboarding(progress, playerName);
  syncInBackground(() => supabaseProgressService.syncProgress(nextProgress));
  return nextProgress;
}

export function addXP(progress: UserProgress, xp: number) {
  const nextProgress = localProgressService.addXP(progress, xp);
  syncInBackground(() => supabaseProgressService.syncProgress(nextProgress));
  return nextProgress;
}

export async function getWeeklyRanking(progress?: UserProgress, filter: RankingFilter = "global"): Promise<WeeklyRankingResult> {
  const localProgress = progress ?? localProgressService.getUserProgress();

  try {
    const entries = await supabaseProgressService.fetchWeeklyRanking(localProgress, filter);
    return { entries, source: "supabase" };
  } catch (error) {
    console.warn("Supabase ranking failed; using local ranking.", error);
    return {
      entries: localProgressService.getWeeklyRanking(localProgress),
      source: "local"
    };
  }
}

export function completeChallenge(
  progress: UserProgress,
  challengeId: ChallengeId,
  result: DailyChallengeResult
) {
  const nextProgress = localProgressService.completeChallenge(progress, challengeId, result);
  syncInBackground(async () => {
    await supabaseProgressService.syncProgress(nextProgress);
    await supabaseProgressService.saveChallengeResult(nextProgress, challengeId, result);
    await supabaseProgressService.updateWeeklyXP(nextProgress);
  });
  return nextProgress;
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
