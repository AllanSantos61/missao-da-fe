import { supabaseClient } from "@/lib/supabaseClient";
import type { ChallengeId, DailyChallengeResult, RankingEntry, UserProgress } from "@/types/dailyProgress";
import { getTodayKey } from "@/utils/dateUtils";

type DailyResultRow = {
  player_name: string;
  xp_earned: number;
};

function getWeekStartKey(date = new Date()) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const offset = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - offset);
  return getTodayKey(weekStart);
}

export function isSupabaseEnabled() {
  return Boolean(supabaseClient);
}

async function upsertDailyResult(
  playerName: string,
  challengeDate: string,
  challengeId: ChallengeId,
  result: DailyChallengeResult
) {
  if (!supabaseClient) return;

  const existingResult = await supabaseClient
    .from("daily_results")
    .select("id")
    .eq("player_name", playerName)
    .eq("challenge_date", challengeDate)
    .eq("challenge_type", challengeId)
    .maybeSingle();

  if (existingResult.error) {
    throw existingResult.error;
  }

  const payload = {
    player_name: playerName,
    challenge_date: challengeDate,
    challenge_type: challengeId,
    xp_earned: result.xpEarned,
    completed: true,
    completed_at: result.completedAt
  };

  if (existingResult.data?.id) {
    const { error } = await supabaseClient
      .from("daily_results")
      .update(payload)
      .eq("id", existingResult.data.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabaseClient.from("daily_results").insert(payload);
  if (error) throw error;
}

export async function syncProgress(progress: UserProgress) {
  if (!supabaseClient || !progress.playerName) return;

  const existingProfile = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("player_name", progress.playerName)
    .maybeSingle();

  if (existingProfile.error) {
    throw existingProfile.error;
  }

  const payload = {
    player_name: progress.playerName,
    total_xp: progress.totalXP,
    weekly_xp: progress.weeklyXP,
    current_streak: progress.currentStreak,
    best_streak: progress.bestStreak
  };

  if (existingProfile.data?.id) {
    const { error } = await supabaseClient.from("profiles").update(payload).eq("id", existingProfile.data.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseClient.from("profiles").insert(payload);
    if (error) throw error;
  }

  for (const day of Object.values(progress.dailyHistory)) {
    for (const [challengeId, result] of Object.entries(day.results)) {
      if (result) {
        await upsertDailyResult(progress.playerName, day.date, challengeId as ChallengeId, result);
      }
    }
  }
}

export async function updateWeeklyXP(progress: UserProgress) {
  if (!supabaseClient || !progress.playerName) return;

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      weekly_xp: progress.weeklyXP,
      total_xp: progress.totalXP,
      current_streak: progress.currentStreak,
      best_streak: progress.bestStreak
    })
    .eq("player_name", progress.playerName);

  if (error) throw error;
}

export async function saveChallengeResult(
  progress: UserProgress,
  challengeId: ChallengeId,
  result: DailyChallengeResult
) {
  if (!supabaseClient || !progress.playerName) return;

  await upsertDailyResult(progress.playerName, getTodayKey(), challengeId, result);
}

export async function fetchWeeklyRanking(currentPlayerName?: string): Promise<RankingEntry[]> {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured.");
  }

  const weekStart = getWeekStartKey();
  const { data, error } = await supabaseClient
    .from("daily_results")
    .select("player_name, xp_earned")
    .eq("completed", true)
    .gte("challenge_date", weekStart);

  if (error) throw error;

  const totals = (data as DailyResultRow[] | null ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.player_name] = (acc[row.player_name] ?? 0) + Number(row.xp_earned ?? 0);
    return acc;
  }, {});

  return Object.entries(totals)
    .sort(([, a], [, b]) => b - a)
    .map(([name, xp], index) => ({
      rank: index + 1,
      name,
      xp,
      isCurrentUser: Boolean(currentPlayerName && name === currentPlayerName)
    }))
    .filter((entry, index) => index < 10 || entry.isCurrentUser);
}
