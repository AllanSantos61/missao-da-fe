import { adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

type ProgressRow = {
  user_id: string | null;
  local_user_id: string | null;
  player_name: string | null;
  total_xp: number | null;
  weekly_xp: number | null;
  current_streak: number | null;
  best_streak: number | null;
  current_journey_day: number | null;
  completed_days: number | null;
  journey_start_date: string | null;
  last_access_date: string | null;
  last_completed_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ProfileRow = {
  user_id: string | null;
  local_user_id: string | null;
  player_name: string | null;
  total_xp: number | null;
  weekly_xp: number | null;
  current_streak: number | null;
  best_streak: number | null;
  created_at: string | null;
};

type DayStatusRow = {
  user_id: string | null;
  local_user_id: string | null;
  day_number: number | null;
  status: string | null;
  reading_completed: boolean | null;
  quiz_completed: boolean | null;
  word_completed: boolean | null;
};

function identity(row: { local_user_id?: string | null; user_id?: string | null; player_name?: string | null }) {
  return row.local_user_id || row.user_id || row.player_name || "";
}

function isCompleted(row: DayStatusRow) {
  return Boolean(row.reading_completed && row.quiz_completed && row.word_completed) || row.status === "completed";
}

export async function GET(request: Request) {
  try {
    console.info("[Admin] Fetching users");
    const supabase = requireAdminApi();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

    const [progressResult, profilesResult, statusResult] = await Promise.all([
      supabase
        .from("user_journey_progress")
        .select("user_id, local_user_id, player_name, total_xp, weekly_xp, current_streak, best_streak, current_journey_day, completed_days, journey_start_date, last_access_date, last_completed_date, created_at, updated_at")
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1000),
      supabase
        .from("profiles")
        .select("user_id, local_user_id, player_name, total_xp, weekly_xp, current_streak, best_streak, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("user_journey_day_status")
        .select("user_id, local_user_id, day_number, status, reading_completed, quiz_completed, word_completed")
        .limit(10000)
    ]);

    if (progressResult.error) throw progressResult.error;
    if (profilesResult.error) throw profilesResult.error;
    if (statusResult.error) throw statusResult.error;

    const completedByIdentity = new Map<string, { completed: number; highestDay: number }>();
    for (const row of (statusResult.data ?? []) as DayStatusRow[]) {
      const key = identity(row);
      if (!key || !isCompleted(row)) continue;
      const current = completedByIdentity.get(key) ?? { completed: 0, highestDay: 0 };
      completedByIdentity.set(key, {
        completed: current.completed + 1,
        highestDay: Math.max(current.highestDay, Number(row.day_number ?? 0))
      });
    }

    const byIdentity = new Map<string, Record<string, unknown>>();
    for (const profile of (profilesResult.data ?? []) as ProfileRow[]) {
      const key = identity(profile);
      if (!key) continue;
      byIdentity.set(key, {
        id: key,
        user_id: profile.user_id,
        local_user_id: profile.local_user_id,
        player_name: profile.player_name,
        total_xp: profile.total_xp ?? 0,
        weekly_xp: profile.weekly_xp ?? 0,
        current_streak: profile.current_streak ?? 0,
        best_streak: profile.best_streak ?? 0,
        source: "profiles",
        created_at: profile.created_at
      });
    }

    for (const progress of (progressResult.data ?? []) as ProgressRow[]) {
      const key = identity(progress);
      if (!key) continue;
      const stats = completedByIdentity.get(key) ?? { completed: Number(progress.completed_days ?? 0), highestDay: 0 };
      byIdentity.set(key, {
        ...(byIdentity.get(key) ?? {}),
        id: key,
        user_id: progress.user_id,
        local_user_id: progress.local_user_id,
        player_name: progress.player_name,
        total_xp: progress.total_xp ?? 0,
        weekly_xp: progress.weekly_xp ?? 0,
        current_streak: progress.current_streak ?? 0,
        best_streak: progress.best_streak ?? 0,
        current_journey_day: progress.current_journey_day ?? 1,
        completed_days: Math.max(Number(progress.completed_days ?? 0), stats.completed),
        highest_completed_day: stats.highestDay,
        journey_start_date: progress.journey_start_date,
        last_access_date: progress.last_access_date,
        last_completed_date: progress.last_completed_date,
        created_at: progress.created_at,
        updated_at: progress.updated_at,
        source: "journey"
      });
    }

    const users = Array.from(byIdentity.values())
      .filter((user) => {
        if (!search) return true;
        return String(user.player_name ?? "").toLowerCase().includes(search) || String(user.local_user_id ?? user.user_id ?? "").toLowerCase().includes(search);
      })
      .sort((a, b) => Number(b.total_xp ?? 0) - Number(a.total_xp ?? 0));

    return adminSuccess({ users });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
