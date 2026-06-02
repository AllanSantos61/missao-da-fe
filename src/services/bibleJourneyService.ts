import { supabaseClient } from "@/lib/supabaseClient";
import { getJourneyMission } from "@/services/journeyContentService";
import * as localBibleJourneyService from "@/services/localBibleJourneyService";
import type {
  BibleProgress,
  BibleReading,
  CurrentReadingState,
  JourneyCalendarDay,
  JourneyDayStatus
} from "@/types/bibleJourney";
import type { DailyChallengeResult } from "@/types/dailyProgress";
import { addDays } from "@/utils/bibleJourneyDate";
import { getTodayKey } from "@/utils/dateUtils";
import { getDayStatus, getJourneyState, TOTAL_JOURNEY_DAYS } from "@/utils/journeyState";

const TOTAL_READINGS = TOTAL_JOURNEY_DAYS;
const READING_XP = 40;

function logJourney(message: string, details?: unknown) {
  console.info(`[Journey/Supabase] ${message}`, details ?? "");
}

function logJourneyError(message: string, error: unknown) {
  console.error(`[Journey/Supabase] ${message}`, error);
}

type JourneyProgressRow = {
  id?: string;
  user_id?: string | null;
  local_user_id?: string | null;
  player_name: string;
  journey_start_date: string;
  current_journey_day?: number | null;
  highest_unlocked_day?: number | null;
  completed_days?: number | null;
  current_streak: number | null;
  best_streak: number | null;
  total_xp: number | null;
  weekly_xp?: number | null;
  last_completed_date?: string | null;
  last_access_date?: string | null;
};

type ProfileRow = {
  id: string;
  total_xp: number | null;
  weekly_xp: number | null;
  best_streak: number | null;
};

type JourneyDayRow = {
  id?: string;
  user_id?: string | null;
  local_user_id?: string | null;
  player_name: string;
  day_number: number;
  status: JourneyDayStatus;
  reading_completed: boolean | null;
  quiz_completed: boolean | null;
  word_completed: boolean | null;
  completed_at: string | null;
  completed_date: string | null;
  total_xp_earned: number | null;
  word_attempts_history?: JourneyCalendarDay["wordAttemptsHistory"] | null;
  word_result?: JourneyCalendarDay["wordResult"] | null;
  word_attempts?: number | null;
};

function getPlayerName(playerName: string) {
  return playerName.trim() || "visitante";
}

function getUserId(userId: string) {
  return userId.trim() || "anonymous";
}

function getResolvedLocalUserId(userIdInput: string) {
  return getUserId(userIdInput);
}

export function getJourneyDayStatus(
  dayNumber: number,
  completedDays: number[],
  availableJourneyDay: number
): JourneyDayStatus {
  const pendingDays = Array.from({ length: availableJourneyDay }, (_, index) => index + 1).filter(
    (availableDay) => !completedDays.includes(availableDay)
  );
  return getDayStatus(dayNumber, {
    completedDays,
    highestUnlockedDay: availableJourneyDay,
    currentMissionDay: pendingDays[0] ?? availableJourneyDay
  });
}

function buildProgress(playerName: string, row: JourneyProgressRow, completedRows: JourneyDayRow[]): BibleProgress {
  const completedDays = completedRows
    .filter((day) => day.reading_completed && day.quiz_completed && day.word_completed)
    .map((day) => day.day_number)
    .sort((a, b) => a - b);
  const lastCompletedDate =
    completedRows
      .map((day) => day.completed_date)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;
  const journeyState = getJourneyState({
    journeyStartDate: row.journey_start_date,
    completedDays,
    streak: row.current_streak ?? 0
  });
  const availableJourneyDay = journeyState.highestUnlockedDay;
  const missedDays = journeyState.pendingDays;

  return {
    playerName,
    journeyStartDate: row.journey_start_date,
    currentJourneyDay: journeyState.currentMissionDay,
    availableJourneyDay,
    completedDays,
    missedDays,
    availableDays: missedDays,
    lastAccessDate: row.last_access_date ?? getTodayKey(),
    lastCompletedDate,
    currentStreak: row.current_streak ?? 0,
    bestStreak: row.best_streak ?? 0,
    totalXp: row.total_xp ?? completedRows.reduce((total, day) => total + Number(day.total_xp_earned ?? 0), 0),
    completedReadings: completedDays.length,
    totalReadings: TOTAL_READINGS,
    pendingCount: missedDays.length
  };
}

function buildCalendar(progress: BibleProgress, completedRows: JourneyDayRow[]): JourneyCalendarDay[] {
  const byDay = new Map(completedRows.map((row) => [row.day_number, row]));
  const journeyState = getJourneyState({
    journeyStartDate: progress.journeyStartDate,
    completedDays: progress.completedDays,
    streak: progress.currentStreak
  });

  return Array.from({ length: TOTAL_READINGS }, (_, index) => {
    const dayNumber = index + 1;
    const completed = byDay.get(dayNumber);
    const isFullyCompleted = Boolean(
      completed?.reading_completed &&
      completed?.quiz_completed &&
      completed?.word_completed
    );
    const wordCompleted = Boolean(completed?.word_completed);
    const quizCompleted = Boolean(completed?.quiz_completed || wordCompleted);
    const readingCompleted = Boolean(completed?.reading_completed || quizCompleted || wordCompleted);
    return {
      dayNumber,
      status: getDayStatus(dayNumber, journeyState),
      readingCompleted,
      quizCompleted,
      wordCompleted,
      wordAttemptsHistory: Array.isArray(completed?.word_attempts_history) ? completed.word_attempts_history : [],
      wordResult: completed?.word_result ?? null,
      wordAttempts: Number(completed?.word_attempts ?? 0),
      xpEarned: completed?.total_xp_earned ?? 0,
      completedDate: completed?.completed_date ?? null
    };
  });
}

function isFullyCompletedRow(day: Pick<JourneyDayRow, "reading_completed" | "quiz_completed" | "word_completed">) {
  return Boolean(day.reading_completed && day.quiz_completed && day.word_completed);
}

function getProgressScore(row: JourneyProgressRow | null, completedRows: JourneyDayRow[]) {
  if (!row) return -1;
  const completedCount = completedRows.filter(isFullyCompletedRow).length;
  const highestCompletedDay = completedRows
    .filter(isFullyCompletedRow)
    .reduce((highest, day) => Math.max(highest, Number(day.day_number ?? 0)), 0);

  return (
    completedCount * 1_000_000 +
    highestCompletedDay * 10_000 +
    Number(row.total_xp ?? 0) * 10 +
    Number(row.current_streak ?? 0)
  );
}

function localSnapshotToRows(
  localUserId: string,
  playerName: string,
  snapshot: localBibleJourneyService.LocalJourneySnapshot
): { progressRow: JourneyProgressRow | null; completedRows: JourneyDayRow[] } {
  if (!snapshot.exists || !snapshot.progress) {
    return { progressRow: null, completedRows: [] };
  }

  const completedRows: JourneyDayRow[] = snapshot.completed.map((day) => ({
    user_id: localUserId,
    local_user_id: localUserId,
    player_name: playerName,
    day_number: day.dayNumber,
    status: day.status,
    reading_completed: day.readingCompleted,
    quiz_completed: day.quizCompleted,
    word_completed: day.wordCompleted,
    completed_at: day.completedDate ? `${day.completedDate}T12:00:00` : null,
    completed_date: day.completedDate || null,
    total_xp_earned: day.xpEarned,
    word_attempts_history: day.wordAttemptsHistory ?? [],
    word_result: day.wordResult ?? null,
    word_attempts: day.wordAttempts ?? 0
  }));
  const journeyState = getJourneyState({
    journeyStartDate: snapshot.progress.journeyStartDate,
    completedDays: completedRows.filter(isFullyCompletedRow).map((day) => day.day_number),
    streak: snapshot.progress.currentStreak
  });

  return {
    progressRow: {
      user_id: localUserId,
      local_user_id: localUserId,
      player_name: playerName,
      journey_start_date: snapshot.progress.journeyStartDate,
      current_journey_day: journeyState.currentMissionDay,
      highest_unlocked_day: journeyState.highestUnlockedDay,
      completed_days: journeyState.completedDays.length,
      current_streak: snapshot.progress.currentStreak,
      best_streak: snapshot.progress.bestStreak,
      total_xp: snapshot.progress.totalXp,
      weekly_xp: 0,
      last_completed_date: snapshot.progress.lastCompletedDate,
      last_access_date: snapshot.progress.lastAccessDate
    },
    completedRows
  };
}

function syncRemoteToLocal(localUserId: string, progressRow: JourneyProgressRow, completedRows: JourneyDayRow[]) {
  localBibleJourneyService.saveLocalJourneySnapshot(localUserId, {
    journeyStartDate: progressRow.journey_start_date || getTodayKey(),
    lastAccessDate: progressRow.last_access_date ?? getTodayKey(),
    lastCompletedDate: progressRow.last_completed_date ?? null,
    currentStreak: Number(progressRow.current_streak ?? 0),
    bestStreak: Number(progressRow.best_streak ?? 0),
    totalXp: Number(progressRow.total_xp ?? 0),
    completed: completedRows.map((row) => ({
      dayNumber: row.day_number,
      readingCompleted: Boolean(row.reading_completed),
      quizCompleted: Boolean(row.quiz_completed),
      wordCompleted: Boolean(row.word_completed),
      status: row.status,
      completedDate: row.completed_date ?? "",
      xpEarned: Number(row.total_xp_earned ?? 0),
      wordAttemptsHistory: row.word_attempts_history ?? [],
      wordResult: row.word_result ?? null,
      wordAttempts: Number(row.word_attempts ?? 0)
    }))
  });
}

function getCandidateUserIds(localUserId: string, legacyUserId?: string) {
  return Array.from(new Set([localUserId, legacyUserId].filter(Boolean))) as string[];
}

async function fetchRemoteProgress(localUserId: string, legacyUserId?: string): Promise<JourneyProgressRow | null> {
  if (!supabaseClient) return null;

  const candidateIds = getCandidateUserIds(localUserId, legacyUserId);
  const byLocalId = await supabaseClient
    .from("user_journey_progress")
    .select("*")
    .in("local_user_id", candidateIds)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (!byLocalId.error && byLocalId.data?.[0]) return byLocalId.data[0] as JourneyProgressRow;

  const byUserId = await supabaseClient
    .from("user_journey_progress")
    .select("*")
    .in("user_id", candidateIds)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (byUserId.error) throw byUserId.error;
  return (byUserId.data?.[0] ?? null) as JourneyProgressRow | null;
}

async function fetchRemoteDayRows(localUserId: string, legacyUserId?: string): Promise<JourneyDayRow[]> {
  if (!supabaseClient) return [];

  const candidateIds = getCandidateUserIds(localUserId, legacyUserId);
  const [byLocalId, byUserId] = await Promise.all([
    supabaseClient
    .from("user_journey_day_status")
    .select("*")
    .in("local_user_id", candidateIds)
    .order("day_number", { ascending: true }),
    supabaseClient
    .from("user_journey_day_status")
    .select("*")
    .in("user_id", candidateIds)
    .order("day_number", { ascending: true })
  ]);

  if (byLocalId.error) throw byLocalId.error;
  if (byUserId.error) throw byUserId.error;

  const rows = [...(byLocalId.data ?? []), ...(byUserId.data ?? [])] as JourneyDayRow[];
  const byDay = new Map<number, JourneyDayRow>();
  for (const row of rows) {
    const existing = byDay.get(row.day_number);
    const existingScore = existing ? getProgressScore({ ...existing, journey_start_date: getTodayKey(), player_name: existing.player_name, current_streak: 0, best_streak: 0, total_xp: existing.total_xp_earned }, [existing]) : -1;
    const rowScore = getProgressScore({ ...row, journey_start_date: getTodayKey(), player_name: row.player_name, current_streak: 0, best_streak: 0, total_xp: row.total_xp_earned }, [row]);
    if (!existing || rowScore >= existingScore) byDay.set(row.day_number, row);
  }

  return Array.from(byDay.values()).sort((a, b) => a.day_number - b.day_number);
}

async function syncResolvedProgressToSupabase(
  localUserId: string,
  playerName: string,
  progressRow: JourneyProgressRow,
  completedRows: JourneyDayRow[]
) {
  if (!supabaseClient) return;

  const today = getTodayKey();
  const journeyState = getJourneyState({
    journeyStartDate: progressRow.journey_start_date || today,
    completedDays: completedRows.filter(isFullyCompletedRow).map((day) => day.day_number),
    streak: progressRow.current_streak ?? 0
  });
  const progressPayload = {
    user_id: localUserId,
    local_user_id: localUserId,
    player_name: playerName,
    journey_start_date: progressRow.journey_start_date || today,
    current_journey_day: journeyState.currentMissionDay,
    highest_unlocked_day: journeyState.highestUnlockedDay,
    completed_days: journeyState.completedDays.length,
    current_streak: Math.max(0, Number(progressRow.current_streak ?? 0)),
    best_streak: Math.max(0, Number(progressRow.best_streak ?? 0)),
    total_xp: Math.max(0, Number(progressRow.total_xp ?? 0)),
    weekly_xp: Math.max(0, Number(progressRow.weekly_xp ?? 0)),
    last_completed_date: progressRow.last_completed_date ?? null,
    last_access_date: today,
    updated_at: new Date().toISOString()
  };

  if (progressRow.id) {
    const { error } = await supabaseClient.from("user_journey_progress").update(progressPayload).eq("id", progressRow.id);
    if (error) throw error;
  } else {
    const { error } = await supabaseClient
      .from("user_journey_progress")
      .upsert(progressPayload, { onConflict: "user_id" });
    if (error) throw error;
  }

  for (const row of completedRows) {
    const payload = {
      user_id: localUserId,
      local_user_id: localUserId,
      player_name: playerName,
      day_number: row.day_number,
      status: row.status,
      reading_completed: Boolean(row.reading_completed),
      quiz_completed: Boolean(row.quiz_completed),
      word_completed: Boolean(row.word_completed),
      total_xp_earned: Number(row.total_xp_earned ?? 0),
      completed_at: row.completed_at,
      completed_date: row.completed_date,
      word_attempts_history: row.word_attempts_history ?? [],
      word_result: row.word_result ?? null,
      word_attempts: Number(row.word_attempts ?? 0),
      updated_at: new Date().toISOString()
    };

    const existingId = row.id;
    const result = existingId
      ? await supabaseClient.from("user_journey_day_status").update(payload).eq("id", existingId)
      : await supabaseClient.from("user_journey_day_status").upsert(payload, { onConflict: "user_id,day_number" });

    if (result.error) throw result.error;
  }
}

export async function resolveUserProgress(userIdInput: string, playerNameInput: string, legacyUserIdInput?: string) {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const localUserId = getResolvedLocalUserId(userIdInput);
  const legacyUserId = legacyUserIdInput ? getUserId(legacyUserIdInput) : undefined;
  const playerName = getPlayerName(playerNameInput);
  const today = getTodayKey();
  const [remoteProgress, remoteRows] = await Promise.all([
    fetchRemoteProgress(localUserId, legacyUserId),
    fetchRemoteDayRows(localUserId, legacyUserId)
  ]);
  const primaryLocalSnapshot = localBibleJourneyService.getLocalJourneySnapshot(localUserId);
  const legacyLocalSnapshot =
    legacyUserId && legacyUserId !== localUserId
      ? localBibleJourneyService.getLocalJourneySnapshot(legacyUserId)
      : primaryLocalSnapshot;
  const primaryLocalRows = localSnapshotToRows(localUserId, playerName, primaryLocalSnapshot);
  const legacyLocalRows = localSnapshotToRows(localUserId, playerName, legacyLocalSnapshot);
  const localRows =
    getProgressScore(legacyLocalRows.progressRow, legacyLocalRows.completedRows) >
    getProgressScore(primaryLocalRows.progressRow, primaryLocalRows.completedRows)
      ? legacyLocalRows
      : primaryLocalRows;
  const remoteScore = getProgressScore(remoteProgress, remoteRows);
  const localScore = getProgressScore(localRows.progressRow, localRows.completedRows);

  if (!remoteProgress && !localRows.progressRow) {
    const initialRow: JourneyProgressRow = {
      user_id: localUserId,
      local_user_id: localUserId,
      player_name: playerName,
      journey_start_date: today,
      current_journey_day: 1,
      highest_unlocked_day: 1,
      completed_days: 0,
      current_streak: 0,
      best_streak: 0,
      total_xp: 0,
      weekly_xp: 0,
      last_access_date: today,
      last_completed_date: null
    };
    await syncResolvedProgressToSupabase(localUserId, playerName, initialRow, []);
    syncRemoteToLocal(localUserId, initialRow, []);
    logJourney("Resolved new journey progress", { localUserId });
    return { localUserId, progressRow: initialRow, completedRows: [] };
  }

  if (localScore > remoteScore && localRows.progressRow) {
    await syncResolvedProgressToSupabase(localUserId, playerName, localRows.progressRow, localRows.completedRows);
    syncRemoteToLocal(localUserId, localRows.progressRow, localRows.completedRows);
    logJourney("Resolved local progress as most advanced", { localUserId, localScore, remoteScore });
    return { localUserId, progressRow: localRows.progressRow, completedRows: localRows.completedRows };
  }

  if (remoteProgress) {
    const normalizedRemote = {
      ...remoteProgress,
      user_id: localUserId,
      local_user_id: localUserId,
      player_name: playerName || remoteProgress.player_name
    };
    await syncResolvedProgressToSupabase(localUserId, normalizedRemote.player_name, normalizedRemote, remoteRows);
    syncRemoteToLocal(localUserId, normalizedRemote, remoteRows);
    logJourney("Resolved Supabase progress as source of truth", { localUserId, remoteScore, localScore });
    return { localUserId, progressRow: normalizedRemote, completedRows: remoteRows };
  }

  if (localRows.progressRow) {
    await syncResolvedProgressToSupabase(localUserId, playerName, localRows.progressRow, localRows.completedRows);
    return { localUserId, progressRow: localRows.progressRow, completedRows: localRows.completedRows };
  }

  throw new Error("Unable to resolve journey progress.");
}

async function getOrCreateJourneyProgress(userIdInput: string, playerName: string): Promise<JourneyProgressRow> {
  return ensureJourneyProgress(userIdInput, playerName);
}

async function ensureJourneyProgress(userIdInput: string, playerName: string): Promise<JourneyProgressRow> {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const userId = getUserId(userIdInput);
  logJourney("Fetching user_journey_progress", { userId, playerName });
  const existing = await supabaseClient
    .from("user_journey_progress")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (existing.error) throw existing.error;

  const today = getTodayKey();
  const existingRow = (existing.data?.[0] ?? null) as JourneyProgressRow | null;
  if (existingRow) {
    const highestUnlockedDay = getJourneyState({
      journeyStartDate: existingRow.journey_start_date,
      completedDays: [],
      streak: existingRow.current_streak ?? 0
    }).highestUnlockedDay;
    logJourney("Progress found", {
      playerName,
      journeyStartDate: existingRow.journey_start_date,
      highestUnlockedDay
    });
    const updateQuery = supabaseClient
      .from("user_journey_progress")
      .update({
        last_access_date: today,
        highest_unlocked_day: highestUnlockedDay,
        updated_at: new Date().toISOString()
      });

    if (existingRow.id) {
      await updateQuery.eq("id", existingRow.id);
    } else {
      await updateQuery.eq("user_id", userId);
    }
    return { ...existingRow, last_access_date: today, highest_unlocked_day: highestUnlockedDay };
  }

  logJourney("Creating initial progress", { playerName, journeyStartDate: today });
  const payload = {
    player_name: playerName,
    user_id: userId,
    local_user_id: userId,
    journey_start_date: today,
    current_journey_day: 1,
    highest_unlocked_day: 1,
    completed_days: 0,
    current_streak: 0,
    best_streak: 0,
    total_xp: 0,
    weekly_xp: 0,
    last_access_date: today,
    updated_at: new Date().toISOString()
  };

  const upserted = await supabaseClient
    .from("user_journey_progress")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .limit(1);

  if (!upserted.error && upserted.data?.[0]) return upserted.data[0] as JourneyProgressRow;

  const created = await supabaseClient
    .from("user_journey_progress")
    .insert(payload)
    .select("*")
    .limit(1);

  if (created.error) throw created.error;
  return created.data?.[0] as JourneyProgressRow;
}

async function getCompletedDays(userIdInput: string, playerName: string): Promise<JourneyDayRow[]> {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const userId = getUserId(userIdInput);
  logJourney("Fetching user_journey_day_status", { userId, playerName });
  const result = await supabaseClient
    .from("user_journey_day_status")
    .select("*")
    .eq("user_id", userId)
    .order("day_number", { ascending: true });

  if (result.error) throw result.error;
  logJourney("Day status loaded", { playerName, rows: result.data?.length ?? 0 });
  return (result.data ?? []) as JourneyDayRow[];
}

async function buildState(userId: string, playerName: string, selectedDay?: number, legacyUserId?: string): Promise<CurrentReadingState> {
  logJourney("Building journey state", { userId, playerName, selectedDay });
  const resolved = await resolveUserProgress(userId, playerName, legacyUserId);
  const progressRow = resolved.progressRow;
  const completedRows = resolved.completedRows;
  const progress = buildProgress(playerName, progressRow, completedRows);
  const requestedDay = Math.min(Math.max(selectedDay ?? progress.currentJourneyDay, 1), TOTAL_READINGS);
  const dayNumber = requestedDay > progress.availableJourneyDay ? progress.currentJourneyDay : requestedDay;
  logJourney("Calculated journey day", {
    playerName,
    dayNumber,
    currentJourneyDay: progress.currentJourneyDay,
    highestUnlockedDay: progress.availableJourneyDay,
    completedDays: progress.completedReadings,
    pendingCount: progress.pendingCount
  });
  const mission = await getJourneyMission(dayNumber, { allowFallback: false });
  logJourney("Journey content ready", {
    dayNumber,
    reference: mission.bibleReference,
    word: mission.normalizedFaithWord,
    questions: mission.quizQuestions.length
  });
  const reading: BibleReading = {
    orderIndex: mission.dayNumber,
    testament: "novo_testamento",
    book: mission.bibleBook,
    chapterStart: mission.chapterStart,
    verseStart: mission.verseStart,
    chapterEnd: mission.chapterEnd,
    verseEnd: mission.verseEnd,
    reference: mission.bibleReference,
    title: mission.title,
    estimatedMinutes: mission.estimatedMinutes,
    xpReward: mission.readingXp
  };

  return {
    reading,
    selectedDay: dayNumber,
    mission,
    progress,
    calendar: buildCalendar(progress, completedRows),
    source: "supabase",
    notice:
      progress.pendingCount > 1
        ? `Você tem ${progress.pendingCount} missões pendentes. Tudo bem, sua jornada continua de onde parou.`
        : undefined
  };
}

async function syncProfileXP(userIdInput: string, playerName: string, xp: number, currentStreak: number, bestStreak: number) {
  if (!supabaseClient) return;

  const userId = getUserId(userIdInput);
  logJourney("Updating ranking/profile XP", { userId, playerName, xp, currentStreak, bestStreak });
  const profile = await supabaseClient
    .from("profiles")
    .select("id, total_xp, weekly_xp, best_streak")
    .eq("user_id", userId)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (profile.error) return;
  const profileRow = (profile.data?.[0] ?? null) as ProfileRow | null;

  const payload = {
    player_name: playerName,
    user_id: userId,
    local_user_id: userId,
    total_xp: Number(profileRow?.total_xp ?? 0) + xp,
    weekly_xp: Number(profileRow?.weekly_xp ?? 0) + xp,
    current_streak: currentStreak,
    best_streak: Math.max(Number(profileRow?.best_streak ?? 0), bestStreak)
  };

  if (profileRow?.id) {
    await supabaseClient.from("profiles").update(payload).eq("id", profileRow.id);
  } else {
    const upserted = await supabaseClient.from("profiles").upsert(payload, { onConflict: "user_id" });
    if (upserted.error) await supabaseClient.from("profiles").insert(payload);
  }
  logJourney("Ranking/profile XP updated", { playerName, weeklyXpDelta: xp });
}

export async function getJourneyDay(
  userIdInput: string,
  playerNameInput: string,
  dayNumber?: number,
  legacyUserIdInput?: string
): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);
  const userId = getUserId(userIdInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    return await buildState(userId, playerName, dayNumber, legacyUserIdInput);
  } catch (error) {
    logJourneyError("Journey state failed; using localStorage fallback", error);
    return localBibleJourneyService.getJourneyDay(userId, dayNumber);
  }
}

export async function completeJourneyDay(
  userIdInput: string,
  playerNameInput: string,
  dayNumber: number,
  legacyUserIdInput?: string
): Promise<CurrentReadingState> {
  return completeJourneyPart(userIdInput, playerNameInput, dayNumber, "reading", undefined, undefined, legacyUserIdInput);
}

export async function completeJourneyPart(
  userIdInput: string,
  playerNameInput: string,
  dayNumber: number,
  part: "reading" | "quiz" | "word",
  xpOverride?: number,
  result?: DailyChallengeResult,
  legacyUserIdInput?: string
): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);
  const userId = getUserId(userIdInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    logJourney("Completing journey part", { playerName, dayNumber, part, xpOverride });
    const state = await buildState(userId, playerName, dayNumber, legacyUserIdInput);

    if (dayNumber > state.progress.availableJourneyDay) {
      logJourney("Blocked future day completion", {
        playerName,
        dayNumber,
        highestUnlockedDay: state.progress.availableJourneyDay
      });
      return state;
    }

    if (state.progress.completedDays.includes(dayNumber)) {
      return state;
    }

    const today = getTodayKey();
    const progressRow = await getOrCreateJourneyProgress(userId, playerName);
    const completedRows = await getCompletedDays(userId, playerName);
    const lastCompletedDate = completedRows
      .map((row) => row.completed_date)
      .filter(Boolean)
      .sort()
      .at(-1);
    const nextStreak =
      lastCompletedDate === today
        ? Number(progressRow.current_streak ?? 0)
        : lastCompletedDate === addDays(today, -1)
          ? Number(progressRow.current_streak ?? 0) + 1
          : 1;
    const partColumn =
      part === "reading" ? "reading_completed" : part === "quiz" ? "quiz_completed" : "word_completed";
    const xpEarned = xpOverride ?? (part === "reading" ? state.reading.xpReward : part === "quiz" ? state.mission?.quizXp : state.mission?.wordXp) ?? READING_XP;
    const existingStatus = await supabaseClient
      .from("user_journey_day_status")
      .select("*")
      .eq("user_id", userId)
      .eq("day_number", dayNumber)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1);

    if (existingStatus.error) throw existingStatus.error;

    const currentStatus = (existingStatus.data?.[0] ?? null) as JourneyDayRow | null;
    if (currentStatus?.[partColumn as keyof JourneyDayRow]) {
      logJourney("Part already completed", { playerName, dayNumber, part });
      return state;
    }

    const readingCompleted = part === "reading" ? true : Boolean(currentStatus?.reading_completed);
    const quizCompleted = part === "quiz" ? true : Boolean(currentStatus?.quiz_completed);
    const wordCompleted = part === "word" ? true : Boolean(currentStatus?.word_completed);
    const isDayCompleted = readingCompleted && quizCompleted && wordCompleted;
    const status: JourneyDayStatus = isDayCompleted
      ? "completed"
      : getDayStatus(dayNumber, {
          completedDays: state.progress.completedDays,
          highestUnlockedDay: state.progress.availableJourneyDay,
          currentMissionDay: state.progress.currentJourneyDay
        });
    const updatedCurrentStreak = isDayCompleted ? nextStreak : Number(progressRow.current_streak ?? 0);
    const updatedBestStreak = isDayCompleted
      ? Math.max(Number(progressRow.best_streak ?? 0), nextStreak)
      : Number(progressRow.best_streak ?? 0);
    const statusPayload = {
      player_name: playerName,
      user_id: userId,
      day_number: dayNumber,
      status,
      reading_completed: readingCompleted,
      quiz_completed: quizCompleted,
      word_completed: wordCompleted,
      total_xp_earned: Number(currentStatus?.total_xp_earned ?? 0) + xpEarned,
      completed_at: isDayCompleted ? new Date().toISOString() : currentStatus?.completed_at,
      completed_date: isDayCompleted ? today : currentStatus?.completed_date,
      updated_at: new Date().toISOString()
    };
    const wordPayload = part === "word" && result?.word
      ? {
          word_attempts_history: result.word.attemptsHistory ?? result.word.guesses.map((guess) => ({
            guess,
            result: []
          })),
          word_result: {
            solved: result.word.solved,
            correctWord: result.word.correctWord ?? state.mission?.normalizedFaithWord
          },
          word_attempts: result.word.attempts
        }
      : {};
    const statusPayloadWithWord: Record<string, unknown> = {
      ...statusPayload,
      ...wordPayload
    };

    const dayWrite = currentStatus?.id
      ? await supabaseClient.from("user_journey_day_status").update(statusPayloadWithWord).eq("id", currentStatus.id)
      : await supabaseClient.from("user_journey_day_status").insert(statusPayloadWithWord);

    if (dayWrite.error) {
      const missingWordColumns =
        dayWrite.error.code === "42703" ||
        dayWrite.error.message?.includes("word_attempts") ||
        dayWrite.error.message?.includes("word_result");

      if (!missingWordColumns) throw dayWrite.error;

      const fallbackWrite = currentStatus?.id
        ? await supabaseClient.from("user_journey_day_status").update(statusPayload).eq("id", currentStatus.id)
        : await supabaseClient.from("user_journey_day_status").insert(statusPayload);

      if (fallbackWrite.error) throw fallbackWrite.error;
    }
    logJourney("Saved user_journey_day_status", {
      playerName,
      dayNumber,
      part,
      status,
      xpEarned,
      readingCompleted,
      quizCompleted,
      wordCompleted
    });
    const nextCompletedDays = isDayCompleted
      ? Array.from(new Set([...state.progress.completedDays, dayNumber])).sort((a, b) => a - b)
      : state.progress.completedDays;
    const nextPendingDays = Array.from({ length: state.progress.availableJourneyDay }, (_, index) => index + 1).filter(
      (availableDay) => !nextCompletedDays.includes(availableDay)
    );
    const nextCurrentJourneyDay = nextPendingDays[0] ?? state.progress.availableJourneyDay;

    const progressUpdate = await supabaseClient
      .from("user_journey_progress")
      .update({
        current_streak: updatedCurrentStreak,
        best_streak: updatedBestStreak,
        total_xp: Number(progressRow.total_xp ?? 0) + xpEarned,
        weekly_xp: Number(progressRow.weekly_xp ?? 0) + xpEarned,
        completed_days: isDayCompleted ? state.progress.completedReadings + 1 : state.progress.completedReadings,
        current_journey_day: nextCurrentJourneyDay,
        highest_unlocked_day: state.progress.availableJourneyDay,
        last_completed_date: isDayCompleted ? today : progressRow.last_completed_date,
        last_access_date: today,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (progressUpdate.error) throw progressUpdate.error;
    logJourney("Updated user_journey_progress", {
      playerName,
      dayNumber,
      part,
      isDayCompleted,
      totalXpDelta: xpEarned,
      nextStreak
    });
    await syncProfileXP(userId, playerName, xpEarned, updatedCurrentStreak, updatedBestStreak);

    const nextState = await buildState(userId, playerName, undefined, legacyUserIdInput);
    const nextDay = nextState.progress.missedDays[0] ?? dayNumber;
    logJourney("Journey calendar refreshed", {
      playerName,
      nextDay,
      completedDays: nextState.progress.completedReadings,
      pendingCount: nextState.progress.pendingCount
    });
    return buildState(userId, playerName, nextDay, legacyUserIdInput);
  } catch (error) {
    logJourneyError("Journey completion failed; using localStorage fallback", error);
    return localBibleJourneyService.completeJourneyPart(userId, dayNumber, part, xpOverride, result);
  }
}

export const getCurrentReading = getJourneyDay;
export const completeCurrentReading = completeJourneyDay;
export const readingXP = READING_XP;
