import { supabaseClient } from "@/lib/supabaseClient";
import type { ChallengeId, DailyChallengeResult, RankingEntry, UserProgress } from "@/types/dailyProgress";
import { getTodayKey } from "@/utils/dateUtils";

type DailyResultRow = {
  player_name: string;
  xp_earned: number;
};

type ProfileRankingRow = {
  player_name: string;
  weekly_xp: number | null;
};

const challengeTypeMap: Record<ChallengeId, string> = {
  gospel: "evangelho",
  quiz: "quiz",
  word: "palavra"
};

function logSupabase(message: string, details?: unknown) {
  console.info(`[Supabase] ${message}`, details ?? "");
}

function logSupabaseError(message: string, error: unknown) {
  console.error(`[Supabase] ${message}`, error);
}

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

  const challengeType = challengeTypeMap[challengeId];
  logSupabase("Saving challenge result", {
    playerName,
    challengeDate,
    challengeType,
    xpEarned: result.xpEarned
  });

  const existingResult = await supabaseClient
    .from("daily_results")
    .select("id")
    .eq("player_name", playerName)
    .eq("challenge_date", challengeDate)
    .eq("challenge_type", challengeType)
    .maybeSingle();

  if (existingResult.error) {
    logSupabaseError("Select daily result failed", existingResult.error);
    throw existingResult.error;
  }

  const payload = {
    player_name: playerName,
    challenge_date: challengeDate,
    challenge_type: challengeType,
    xp_earned: result.xpEarned,
    completed: true,
    completed_at: result.completedAt
  };

  if (existingResult.data?.id) {
    const { error } = await supabaseClient
      .from("daily_results")
      .update(payload)
      .eq("id", existingResult.data.id);
    if (error) {
      logSupabaseError("Update daily result failed", error);
      throw error;
    }
    logSupabase("Insert success", { table: "daily_results", mode: "update" });
    return;
  }

  const { error } = await supabaseClient.from("daily_results").insert(payload);
  if (error) {
    logSupabaseError("Insert failed", error);
    throw error;
  }
  logSupabase("Insert success", { table: "daily_results", mode: "insert" });
}

export async function syncProgress(progress: UserProgress) {
  if (!supabaseClient || !progress.playerName) return;

  logSupabase("Syncing profile", {
    playerName: progress.playerName,
    totalXP: progress.totalXP,
    weeklyXP: progress.weeklyXP
  });

  const existingProfile = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("player_name", progress.playerName)
    .maybeSingle();

  if (existingProfile.error) {
    logSupabaseError("Select profile failed", existingProfile.error);
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
    if (error) {
      logSupabaseError("Update profile failed", error);
      throw error;
    }
    logSupabase("Insert success", { table: "profiles", mode: "update" });
  } else {
    const { error } = await supabaseClient.from("profiles").insert(payload);
    if (error) {
      logSupabaseError("Insert failed", error);
      throw error;
    }
    logSupabase("Insert success", { table: "profiles", mode: "insert" });
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

  logSupabase("Updating weekly XP", {
    playerName: progress.playerName,
    weeklyXP: progress.weeklyXP
  });

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      weekly_xp: progress.weeklyXP,
      total_xp: progress.totalXP,
      current_streak: progress.currentStreak,
      best_streak: progress.bestStreak
    })
    .eq("player_name", progress.playerName);

  if (error) {
    logSupabaseError("Update weekly XP failed", error);
    throw error;
  }
  logSupabase("Insert success", { table: "profiles", mode: "weekly_xp_update" });
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

  logSupabase("Fetching weekly ranking");

  const profiles = await supabaseClient
    .from("profiles")
    .select("player_name, weekly_xp")
    .gt("weekly_xp", 0)
    .order("weekly_xp", { ascending: false })
    .limit(10);

  if (!profiles.error && profiles.data?.length) {
    return (profiles.data as ProfileRankingRow[]).map((row, index) => ({
      rank: index + 1,
      name: row.player_name,
      xp: Number(row.weekly_xp ?? 0),
      isCurrentUser: Boolean(currentPlayerName && row.player_name === currentPlayerName)
    }));
  }

  const weekStart = getWeekStartKey();
  const { data, error } = await supabaseClient
    .from("daily_results")
    .select("player_name, xp_earned")
    .eq("completed", true)
    .gte("challenge_date", weekStart);

  if (error) {
    logSupabaseError("Fetch ranking failed", error);
    throw error;
  }

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

export async function testSupabaseInsert() {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured.");
  }

  logSupabase("Saving challenge result", { test: true });

  const { data, error } = await supabaseClient
    .from("daily_results")
    .insert({
      player_name: "TESTE",
      challenge_date: new Date().toISOString().split("T")[0],
      challenge_type: "evangelho",
      xp_earned: 10,
      completed: true
    })
    .select();

  if (error) {
    logSupabaseError("Insert failed", error);
    throw error;
  }

  logSupabase("Insert success", data);
  return data;
}
