import type {
  ChallengeId,
  DailyChallengeResult,
  DayHistory,
  RankingEntry,
  UserProgress
} from "@/types/dailyProgress";
import { getPreviousDayKey, getTodayKey } from "@/utils/dateUtils";

const STORAGE_KEY = "missionFaithUser";
const LEGACY_STORAGE_KEY = "missaoDaFeProgress";

function createDayHistory(date: string): DayHistory {
  return {
    date,
    completedChallenges: [],
    xpEarned: 0,
    results: {}
  };
}

function createInitialProgress(today = getTodayKey()): UserProgress {
  return {
    activeDate: today,
    playerName: "",
    totalXP: 0,
    weeklyXP: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    dailyHistory: {
      [today]: createDayHistory(today)
    }
  };
}

function getWeekStartKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00-03:00`);
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - offset);
  return getTodayKey(date);
}

function isSameWeek(dateKey: string, today = getTodayKey()) {
  return getWeekStartKey(dateKey) === getWeekStartKey(today);
}

function calculateWeeklyXP(dailyHistory: UserProgress["dailyHistory"], today = getTodayKey()) {
  return Object.values(dailyHistory).reduce((total, day) => {
    return isSameWeek(day.date, today) ? total + day.xpEarned : total;
  }, 0);
}

export function resetDailyStateIfNeeded(progress: UserProgress): UserProgress {
  const today = getTodayKey();
  const dailyHistory = {
    ...progress.dailyHistory,
    [today]: progress.dailyHistory[today] ?? createDayHistory(today)
  };

  return {
    ...progress,
    activeDate: today,
    weeklyXP: calculateWeeklyXP(dailyHistory, today),
    dailyHistory
  };
}

export function getUserProgress(): UserProgress {
  if (typeof window === "undefined") {
    return createInitialProgress();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return createInitialProgress();
  }

  try {
    return resetDailyStateIfNeeded(JSON.parse(stored) as UserProgress);
  } catch {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return createInitialProgress();
  }
}

export function saveUserProgress(progress: UserProgress) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function updatePlayerName(progress: UserProgress, playerName: string) {
  const nextProgress = {
    ...progress,
    playerName: playerName.trim().slice(0, 32)
  };

  saveUserProgress(nextProgress);
  return nextProgress;
}

export function addXP(progress: UserProgress, xp: number) {
  const nextProgress = resetDailyStateIfNeeded(progress);
  const today = getTodayKey();
  const todayHistory = nextProgress.dailyHistory[today] ?? createDayHistory(today);
  const nextDailyHistory = {
    ...nextProgress.dailyHistory,
    [today]: {
      ...todayHistory,
      xpEarned: todayHistory.xpEarned + xp
    }
  };

  const updated = {
    ...nextProgress,
    totalXP: nextProgress.totalXP + xp,
    weeklyXP: calculateWeeklyXP(nextDailyHistory, today),
    dailyHistory: nextDailyHistory
  };

  saveUserProgress(updated);
  return updated;
}

export function hasCompletedChallengeToday(progress: UserProgress, challengeId: ChallengeId) {
  const today = getTodayKey();
  return Boolean(progress.dailyHistory[today]?.completedChallenges.includes(challengeId));
}

export function getTodayProgress(progress: UserProgress) {
  const freshProgress = resetDailyStateIfNeeded(progress);
  return freshProgress.dailyHistory[freshProgress.activeDate];
}

export function completeChallenge(
  progress: UserProgress,
  challengeId: ChallengeId,
  result: DailyChallengeResult
) {
  const freshProgress = resetDailyStateIfNeeded(progress);
  const today = getTodayKey();
  const day = freshProgress.dailyHistory[today] ?? createDayHistory(today);

  if (day.completedChallenges.includes(challengeId)) {
    return freshProgress;
  }

  const isFirstChallengeToday = day.completedChallenges.length === 0;
  const nextStreak = isFirstChallengeToday
    ? freshProgress.lastCompletedDate === getPreviousDayKey(today)
      ? freshProgress.currentStreak + 1
      : 1
    : freshProgress.currentStreak;

  const nextDay: DayHistory = {
    ...day,
    completedChallenges: [...day.completedChallenges, challengeId],
    xpEarned: day.xpEarned + result.xpEarned,
    results: {
      ...day.results,
      [challengeId]: result
    }
  };

  const nextDailyHistory = {
    ...freshProgress.dailyHistory,
    [today]: nextDay
  };

  const nextProgress: UserProgress = {
    ...freshProgress,
    currentStreak: nextStreak,
    bestStreak: Math.max(freshProgress.bestStreak, nextStreak),
    lastCompletedDate: isFirstChallengeToday ? today : freshProgress.lastCompletedDate,
    totalXP: freshProgress.totalXP + result.xpEarned,
    weeklyXP: calculateWeeklyXP(nextDailyHistory, today),
    dailyHistory: nextDailyHistory
  };

  saveUserProgress(nextProgress);
  return nextProgress;
}

export function getWeeklyRanking(progress = getUserProgress()): RankingEntry[] {
  const freshProgress = resetDailyStateIfNeeded(progress);

  if (!freshProgress.playerName || freshProgress.weeklyXP <= 0) {
    return [];
  }

  return [
    {
      rank: 1,
      name: freshProgress.playerName,
      xp: freshProgress.weeklyXP,
      isCurrentUser: true
    }
  ];
}
