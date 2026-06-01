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
import { addDays, getDaysElapsedInclusive } from "@/utils/bibleJourneyDate";
import { getTodayKey } from "@/utils/dateUtils";

const TOTAL_READINGS = 365;
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
  player_name: string;
  day_number: number;
  status: JourneyDayStatus;
  reading_completed: boolean | null;
  quiz_completed: boolean | null;
  word_completed: boolean | null;
  completed_at: string | null;
  completed_date: string | null;
  total_xp_earned: number | null;
};

function getPlayerName(playerName: string) {
  return playerName.trim() || "visitante";
}

function getUserId(userId: string) {
  return userId.trim() || "anonymous";
}

function getAvailableJourneyDay(journeyStartDate: string) {
  return Math.min(TOTAL_READINGS, Math.max(1, getDaysElapsedInclusive(journeyStartDate, getTodayKey())));
}

export function getJourneyDayStatus(
  dayNumber: number,
  completedDays: number[],
  availableJourneyDay: number
): JourneyDayStatus {
  if (completedDays.includes(dayNumber)) return "completed";
  if (dayNumber > availableJourneyDay) return "locked";
  return dayNumber === availableJourneyDay ? "available" : "pending";
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
  const availableJourneyDay = getAvailableJourneyDay(row.journey_start_date);
  const missedDays = Array.from({ length: availableJourneyDay }, (_, index) => index + 1).filter(
    (dayNumber) => !completedDays.includes(dayNumber)
  );

  return {
    playerName,
    journeyStartDate: row.journey_start_date,
    currentJourneyDay: missedDays[0] ?? availableJourneyDay,
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

  return Array.from({ length: TOTAL_READINGS }, (_, index) => {
    const dayNumber = index + 1;
    const completed = byDay.get(dayNumber);
    const isFullyCompleted = Boolean(
      completed?.reading_completed &&
      completed?.quiz_completed &&
      completed?.word_completed
    );
    return {
      dayNumber,
      status: isFullyCompleted
        ? "completed"
        : dayNumber > progress.availableJourneyDay
          ? "locked"
          : dayNumber === progress.currentJourneyDay
            ? "available"
            : "pending",
      readingCompleted: Boolean(completed?.reading_completed),
      quizCompleted: Boolean(completed?.quiz_completed),
      wordCompleted: Boolean(completed?.word_completed),
      xpEarned: completed?.total_xp_earned ?? 0,
      completedDate: completed?.completed_date ?? null
    };
  });
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
    const highestUnlockedDay = getAvailableJourneyDay(existingRow.journey_start_date);
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

async function buildState(userId: string, playerName: string, selectedDay?: number): Promise<CurrentReadingState> {
  logJourney("Building journey state", { userId, playerName, selectedDay });
  const progressRow = await getOrCreateJourneyProgress(userId, playerName);
  const completedRows = await getCompletedDays(userId, playerName);
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
  dayNumber?: number
): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);
  const userId = getUserId(userIdInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    return await buildState(userId, playerName, dayNumber);
  } catch (error) {
    logJourneyError("Journey state failed; using localStorage fallback", error);
    return localBibleJourneyService.getJourneyDay(userId, dayNumber);
  }
}

export async function completeJourneyDay(
  userIdInput: string,
  playerNameInput: string,
  dayNumber: number
): Promise<CurrentReadingState> {
  return completeJourneyPart(userIdInput, playerNameInput, dayNumber, "reading");
}

export async function completeJourneyPart(
  userIdInput: string,
  playerNameInput: string,
  dayNumber: number,
  part: "reading" | "quiz" | "word",
  xpOverride?: number
): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);
  const userId = getUserId(userIdInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    logJourney("Completing journey part", { playerName, dayNumber, part, xpOverride });
    const state = await buildState(userId, playerName, dayNumber);

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
    const status: JourneyDayStatus = isDayCompleted ? "completed" : dayNumber === state.progress.availableJourneyDay ? "available" : "pending";
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

    const dayWrite = currentStatus?.id
      ? await supabaseClient.from("user_journey_day_status").update(statusPayload).eq("id", currentStatus.id)
      : await supabaseClient.from("user_journey_day_status").insert(statusPayload);

    if (dayWrite.error) throw dayWrite.error;
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

    const progressUpdate = await supabaseClient
      .from("user_journey_progress")
      .update({
        current_streak: updatedCurrentStreak,
        best_streak: updatedBestStreak,
        total_xp: Number(progressRow.total_xp ?? 0) + xpEarned,
        weekly_xp: Number(progressRow.weekly_xp ?? 0) + xpEarned,
        completed_days: isDayCompleted ? state.progress.completedReadings + 1 : state.progress.completedReadings,
        current_journey_day: isDayCompleted
          ? Math.min(Math.max(...state.progress.completedDays, dayNumber) + 1, TOTAL_READINGS)
          : state.progress.currentJourneyDay,
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

    const nextState = await buildState(userId, playerName);
    const nextDay = nextState.progress.missedDays[0] ?? dayNumber;
    logJourney("Journey calendar refreshed", {
      playerName,
      nextDay,
      completedDays: nextState.progress.completedReadings,
      pendingCount: nextState.progress.pendingCount
    });
    return buildState(userId, playerName, nextDay);
  } catch (error) {
    logJourneyError("Journey completion failed; using localStorage fallback", error);
    return localBibleJourneyService.completeJourneyPart(userId, dayNumber, part, xpOverride);
  }
}

export const getCurrentReading = getJourneyDay;
export const completeCurrentReading = completeJourneyDay;
export const readingXP = READING_XP;
