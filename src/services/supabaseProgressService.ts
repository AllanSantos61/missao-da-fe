import { supabaseClient } from "@/lib/supabaseClient";
import type { ChallengeId, DailyChallengeResult, RankingEntry, RankingFilter, UserProgress } from "@/types/dailyProgress";
import { getTodayKey } from "@/utils/dateUtils";

type DailyResultRow = {
  player_name: string;
  xp_earned: number;
};

type ExistingDailyResultRow = {
  id: string;
};

type ProfileRankingRow = {
  user_id?: string | null;
  player_name: string;
  weekly_xp: number | null;
  city?: string | null;
  parish?: string | null;
  group_name?: string | null;
  diocese?: string | null;
};

type ProfileRow = {
  id: string;
  total_xp?: number | null;
  weekly_xp?: number | null;
  current_streak?: number | null;
  best_streak?: number | null;
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

function isMissingColumn(error: unknown, columnName: string) {
  const supabaseError = error as { code?: string; message?: string };
  return supabaseError.code === "42703" || Boolean(supabaseError.message?.includes(columnName));
}

async function findProfileByUserId(userId: string, playerName?: string): Promise<ProfileRow | null> {
  if (!supabaseClient) return null;

  const byUserId = await supabaseClient
    .from("profiles")
    .select("id, total_xp, weekly_xp, current_streak, best_streak")
    .eq("user_id", userId)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (!byUserId.error) return ((byUserId.data?.[0] ?? null) as ProfileRow | null);
  if (!playerName || !isMissingColumn(byUserId.error, "user_id")) throw byUserId.error;

  const byPlayerName = await supabaseClient
    .from("profiles")
    .select("id, total_xp, weekly_xp, current_streak, best_streak")
    .eq("player_name", playerName)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (byPlayerName.error) throw byPlayerName.error;
  return ((byPlayerName.data?.[0] ?? null) as ProfileRow | null);
}

export async function ensureUserProfile(progress: UserProgress): Promise<ProfileRow | null> {
  if (!supabaseClient || !progress.playerName) return null;

  const payload = {
    user_id: progress.anonymousUserId,
    local_user_id: progress.localUserId,
    player_name: progress.playerName,
    total_xp: progress.totalXP,
    weekly_xp: progress.weeklyXP,
    current_streak: progress.currentStreak,
    best_streak: progress.bestStreak,
    city: progress.community.city || null,
    parish: progress.community.parish || null,
    group_name: progress.community.groupName || null,
    diocese: progress.community.diocese || null,
    reminder_period: progress.reminder.enabled ? progress.reminder.period : null,
    reminder_time: progress.reminder.enabled
      ? progress.reminder.period === "custom"
        ? progress.reminder.customTime
        : progress.reminder.period
      : null
  };

  const existingProfile = await findProfileByUserId(progress.anonymousUserId, progress.playerName);

  if (existingProfile?.id) {
    const { error } = await supabaseClient.from("profiles").update(payload).eq("id", existingProfile.id);
    if (error) throw error;
    return existingProfile;
  }

  const upsertResult = await supabaseClient
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("id, total_xp, weekly_xp, current_streak, best_streak")
    .limit(1);

  if (!upsertResult.error) return ((upsertResult.data?.[0] ?? null) as ProfileRow | null);

  const insertResult = await supabaseClient
    .from("profiles")
    .insert(payload)
    .select("id, total_xp, weekly_xp, current_streak, best_streak")
    .limit(1);

  if (insertResult.error) throw insertResult.error;
  return ((insertResult.data?.[0] ?? null) as ProfileRow | null);
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
  progress: Pick<UserProgress, "anonymousUserId" | "localUserId" | "playerName">,
  challengeDate: string,
  challengeId: ChallengeId,
  result: DailyChallengeResult
) {
  if (!supabaseClient) return;

  const playerName = progress.playerName;
  const challengeType = challengeTypeMap[challengeId];
  logSupabase("Saving challenge result", {
    userId: progress.anonymousUserId,
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
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (existingResult.error) {
    logSupabaseError("Select daily result failed", existingResult.error);
    throw existingResult.error;
  }

  const payload = {
    user_id: progress.anonymousUserId,
    local_user_id: progress.localUserId,
    player_name: playerName,
    challenge_date: challengeDate,
    challenge_type: challengeType,
    xp_earned: result.xpEarned,
    completed: true,
    completed_at: result.completedAt
  };

  const existingRow = (existingResult.data?.[0] ?? null) as ExistingDailyResultRow | null;

  if (existingRow?.id) {
    const { error } = await supabaseClient
      .from("daily_results")
      .update(payload)
      .eq("id", existingRow.id);
    if (error) {
      logSupabaseError("Update daily result failed", error);
      throw error;
    }
    logSupabase("Insert success", { table: "daily_results", mode: "update" });
    return;
  }

  const { error } = await supabaseClient
    .from("daily_results")
    .upsert(payload, { onConflict: "player_name,challenge_date,challenge_type" });
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

  try {
    await ensureUserProfile(progress);
    logSupabase("Insert success", { table: "profiles", mode: "ensure" });
  } catch (error) {
    logSupabaseError("Ensure profile failed", error);
    throw error;
  }

  for (const day of Object.values(progress.dailyHistory)) {
    for (const [challengeId, result] of Object.entries(day.results)) {
      if (result) {
        await upsertDailyResult(progress, day.date, challengeId as ChallengeId, result);
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

  try {
    await ensureUserProfile(progress);
  } catch (error) {
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

  await upsertDailyResult(progress, getTodayKey(), challengeId, result);
}

export async function saveStandaloneWordResult(progress: UserProgress, result: DailyChallengeResult) {
  if (!supabaseClient || !progress.playerName) return;

  const challengeDate = getTodayKey();
  const challengeType = "palavra_standalone";
  const existingResult = await supabaseClient
    .from("daily_results")
    .select("id")
    .eq("player_name", progress.playerName)
    .eq("challenge_date", challengeDate)
    .eq("challenge_type", challengeType)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (existingResult.error) throw existingResult.error;

  const payload = {
    user_id: progress.anonymousUserId,
    local_user_id: progress.localUserId,
    player_name: progress.playerName,
    challenge_date: challengeDate,
    challenge_type: challengeType,
    xp_earned: result.xpEarned,
    completed: true,
    completed_at: result.completedAt
  };
  const existingRow = (existingResult.data?.[0] ?? null) as ExistingDailyResultRow | null;

  if (existingRow?.id) {
    const { error } = await supabaseClient.from("daily_results").update(payload).eq("id", existingRow.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabaseClient.from("daily_results").insert(payload);
  if (error) throw error;
}

function getRankingFilterValue(progress: UserProgress, filter: RankingFilter) {
  if (filter === "city") return progress.community.city;
  if (filter === "parish") return progress.community.parish;
  if (filter === "group") return progress.community.groupName;
  if (filter === "diocese") return progress.community.diocese;
  return "";
}

function getRankingFilterColumn(filter: RankingFilter) {
  if (filter === "group") return "group_name";
  return filter;
}

export async function fetchWeeklyRanking(progress: UserProgress, filter: RankingFilter = "global"): Promise<RankingEntry[]> {
  if (!supabaseClient) {
    throw new Error("Supabase is not configured.");
  }

  logSupabase("Fetching weekly ranking", { filter });

  const currentPlayerName = progress.playerName;
  const filterValue = getRankingFilterValue(progress, filter);
  if (filter !== "global" && !filterValue) return [];

  let profilesQuery = supabaseClient
    .from("profiles")
    .select("user_id, player_name, weekly_xp, city, parish, group_name, diocese")
    .gt("weekly_xp", 0)
    .order("weekly_xp", { ascending: false })
    .limit(10);

  if (filter !== "global") {
    profilesQuery = profilesQuery.eq(getRankingFilterColumn(filter), filterValue);
  }

  const profiles = await profilesQuery;

  if (!profiles.error && profiles.data?.length) {
    return (profiles.data as ProfileRankingRow[]).map((row, index) => ({
      rank: index + 1,
      name: row.player_name,
      xp: Number(row.weekly_xp ?? 0),
      isCurrentUser: Boolean(row.user_id && row.user_id === progress.anonymousUserId) || Boolean(currentPlayerName && row.player_name === currentPlayerName)
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
