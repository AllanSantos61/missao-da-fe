import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabaseClient } from "@/lib/supabaseClient";
import { getTodayKey } from "@/utils/dateUtils";

export type DashboardMetric = {
  label: string;
  value: number;
  suffix?: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type FunnelStep = {
  label: string;
  value: number;
};

export type AdminDashboardData = {
  metrics: DashboardMetric[];
  usersByDay: ChartPoint[];
  missionsByDay: ChartPoint[];
  journeyDistribution: ChartPoint[];
  funnel: FunnelStep[];
  source: "supabase" | "empty";
};

type SupabaseLike = {
  from: (table: string) => any;
};

type ProfileRow = {
  user_id: string | null;
  player_name?: string | null;
  total_xp: number | null;
  best_streak: number | null;
};

type JourneyProgressRow = {
  user_id: string | null;
  player_name?: string | null;
  current_journey_day: number | null;
  total_xp: number | null;
  best_streak: number | null;
  last_access_date: string | null;
};

type JourneyDayStatusRow = {
  user_id: string | null;
  player_name?: string | null;
  status: string | null;
  completed_date: string | null;
  reading_completed: boolean | null;
  quiz_completed: boolean | null;
  word_completed: boolean | null;
};

type DailyResultRow = {
  player_name: string | null;
  challenge_date: string | null;
  challenge_type: string | null;
  xp_earned: number | null;
};

type AppEventRow = {
  event_name: string;
  user_id: string | null;
  player_name?: string | null;
  created_at: string;
};

function getDb(): SupabaseLike | null {
  return (getSupabaseAdmin() ?? supabaseClient) as SupabaseLike | null;
}

function getDaysAgoKey(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return getTodayKey(date);
}

function dateFromDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function isExpectedSchemaGap(error: unknown) {
  const supabaseError = error as { code?: string };
  return supabaseError.code === "42P01" || supabaseError.code === "PGRST205" || supabaseError.code === "42703";
}

async function safeSelect<T>(table: string, query: (db: SupabaseLike, tableName: string) => PromiseLike<{ data: unknown; error: unknown }>) {
  const db = getDb();
  if (!db) return [] as T[];

  try {
    const { data, error } = await query(db, table);
    if (error) {
      if (!isExpectedSchemaGap(error)) console.info("[Admin] Empty metric fallback", { table });
      return [] as T[];
    }
    return (data ?? []) as T[];
  } catch {
    return [] as T[];
  }
}

async function safeCount(table: string, build?: (query: any) => any) {
  const db = getDb();
  if (!db) return 0;

  try {
    let query = db.from(table).select("*", { count: "exact", head: true });
    if (build) query = build(query);
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function uniqueCount(rows: Array<{ user_id?: string | null; player_name?: string | null }>) {
  const ids = new Set(rows.map((row) => row.user_id ?? row.player_name).filter(Boolean));
  return ids.size;
}

function countEvents(events: AppEventRow[], eventName: string) {
  return uniqueCount(events.filter((event) => event.event_name === eventName));
}

function aggregateByDate(rows: Array<{ date: string | null }>, days = 14): ChartPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const dayKey = getDaysAgoKey(days - index - 1);
    return {
      label: dayKey.slice(5),
      value: rows.filter((row) => row.date === dayKey).length
    };
  });
}

export async function getTotalUsers() {
  return safeCount("profiles");
}

export async function getActiveUsersToday() {
  const today = getTodayKey();
  const events = await safeSelect<AppEventRow>("app_events", (db, table) =>
    db.from(table).select("event_name, user_id, player_name, created_at").gte("created_at", `${today}T00:00:00`)
  );
  return uniqueCount(events);
}

export async function getActiveUsers7Days() {
  const events = await safeSelect<AppEventRow>("app_events", (db, table) =>
    db.from(table).select("event_name, user_id, player_name, created_at").gte("created_at", dateFromDaysAgo(6))
  );
  return uniqueCount(events);
}

export async function getActiveUsers30Days() {
  const events = await safeSelect<AppEventRow>("app_events", (db, table) =>
    db.from(table).select("event_name, user_id, player_name, created_at").gte("created_at", dateFromDaysAgo(29))
  );
  return uniqueCount(events);
}

export async function getCompletedMissionsToday() {
  const today = getTodayKey();
  return safeCount("user_journey_day_status", (query) => query.eq("status", "completed").eq("completed_date", today));
}

export async function getFunnelMetrics(): Promise<FunnelStep[]> {
  const events = await safeSelect<AppEventRow>("app_events", (db, table) =>
    db.from(table).select("event_name, user_id, player_name, created_at").limit(5000)
  );

  return [
    { label: "Abriu app", value: countEvents(events, "app_opened") },
    { label: "Salvou nome", value: countEvents(events, "player_name_saved") },
    { label: "Iniciou jornada", value: countEvents(events, "journey_started") },
    { label: "Concluiu leitura", value: countEvents(events, "reading_completed") },
    { label: "Concluiu quiz", value: countEvents(events, "quiz_completed") },
    { label: "Concluiu palavra", value: countEvents(events, "word_completed") },
    { label: "Compartilhou", value: countEvents(events, "whatsapp_shared") }
  ];
}

export async function getJourneyDistribution(): Promise<ChartPoint[]> {
  const rows = await safeSelect<JourneyProgressRow>("user_journey_progress", (db, table) =>
    db.from(table).select("current_journey_day").limit(5000)
  );
  const buckets = [
    { label: "1-7", min: 1, max: 7 },
    { label: "8-30", min: 8, max: 30 },
    { label: "31-100", min: 31, max: 100 },
    { label: "101-180", min: 101, max: 180 },
    { label: "181-365", min: 181, max: 365 }
  ];

  return buckets.map((bucket) => ({
    label: bucket.label,
    value: rows.filter((row) => {
      const day = Number(row.current_journey_day ?? 1);
      return day >= bucket.min && day <= bucket.max;
    }).length
  }));
}

export async function getDailyActivity() {
  const events = await safeSelect<AppEventRow>("app_events", (db, table) =>
    db.from(table).select("event_name, user_id, player_name, created_at").gte("created_at", dateFromDaysAgo(13)).limit(5000)
  );
  const statuses = await safeSelect<JourneyDayStatusRow>("user_journey_day_status", (db, table) =>
    db.from(table).select("completed_date, status").gte("completed_date", getDaysAgoKey(13)).limit(5000)
  );

  return {
    usersByDay: aggregateByDate(
      events
        .filter((event) => event.event_name === "app_opened")
        .map((event) => ({ date: event.created_at.slice(0, 10) }))
    ),
    missionsByDay: aggregateByDate(
      statuses
        .filter((status) => status.status === "completed")
        .map((status) => ({ date: status.completed_date }))
    )
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const today = getTodayKey();
  const [
    profiles,
    progressRows,
    todayDailyResults,
    todayStatuses,
    todayEvents,
    totalUsers,
    activeToday,
    active7,
    active30,
    completedMissionsToday,
    funnel,
    journeyDistribution,
    dailyActivity
  ] = await Promise.all([
    safeSelect<ProfileRow>("profiles", (db, table) =>
      db.from(table).select("user_id, player_name, total_xp, best_streak").limit(5000)
    ),
    safeSelect<JourneyProgressRow>("user_journey_progress", (db, table) =>
      db.from(table).select("user_id, player_name, current_journey_day, total_xp, best_streak, last_access_date").limit(5000)
    ),
    safeSelect<DailyResultRow>("daily_results", (db, table) =>
      db.from(table).select("player_name, challenge_date, challenge_type, xp_earned").eq("challenge_date", today).limit(5000)
    ),
    safeSelect<JourneyDayStatusRow>("user_journey_day_status", (db, table) =>
      db.from(table).select("*").eq("completed_date", today).limit(5000)
    ),
    safeSelect<AppEventRow>("app_events", (db, table) =>
      db.from(table).select("event_name, user_id, player_name, created_at").gte("created_at", `${today}T00:00:00`).limit(5000)
    ),
    getTotalUsers(),
    getActiveUsersToday(),
    getActiveUsers7Days(),
    getActiveUsers30Days(),
    getCompletedMissionsToday(),
    getFunnelMetrics(),
    getJourneyDistribution(),
    getDailyActivity()
  ]);

  const averageJourneyDay =
    progressRows.length === 0
      ? 0
      : Math.round(progressRows.reduce((total, row) => total + Number(row.current_journey_day ?? 1), 0) / progressRows.length);
  const bestStreak = Math.max(0, ...progressRows.map((row) => Number(row.best_streak ?? 0)), ...profiles.map((row) => Number(row.best_streak ?? 0)));
  const totalXP = profiles.reduce((total, row) => total + Number(row.total_xp ?? 0), 0) || progressRows.reduce((total, row) => total + Number(row.total_xp ?? 0), 0);
  const sharesToday = todayEvents.filter((event) => event.event_name === "whatsapp_shared" || event.event_name === "public_result_shared").length;

  return {
    source: getDb() ? "supabase" : "empty",
    metrics: [
      { label: "Usuários totais", value: totalUsers },
      { label: "Ativos hoje", value: activeToday },
      { label: "Ativos 7 dias", value: active7 },
      { label: "Ativos 30 dias", value: active30 },
      { label: "Missões hoje", value: completedMissionsToday },
      { label: "Leituras hoje", value: todayDailyResults.filter((row) => row.challenge_type === "evangelho").length || todayStatuses.filter((row) => row.reading_completed).length },
      { label: "Quizzes hoje", value: todayDailyResults.filter((row) => row.challenge_type === "quiz").length || todayStatuses.filter((row) => row.quiz_completed).length },
      { label: "Palavras hoje", value: todayDailyResults.filter((row) => row.challenge_type === "palavra").length || todayStatuses.filter((row) => row.word_completed).length },
      { label: "Compartilhamentos hoje", value: sharesToday },
      { label: "Dia médio", value: averageJourneyDay },
      { label: "Maior streak", value: bestStreak },
      { label: "XP total gerado", value: totalXP }
    ],
    usersByDay: dailyActivity.usersByDay,
    missionsByDay: dailyActivity.missionsByDay,
    journeyDistribution,
    funnel
  };
}
