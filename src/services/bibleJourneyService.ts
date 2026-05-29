import { fallbackNewTestamentReadings } from "@/data/newTestamentReadings";
import { supabaseClient } from "@/lib/supabaseClient";
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

type ReadingPlanRow = {
  id: string;
  day_number: number;
  reference: string | null;
  book: string | null;
  chapter_start: number | null;
  verse_start: number | null;
  chapter_end: number | null;
  verse_end: number | null;
  title: string | null;
  estimated_minutes: number | null;
  xp_reward: number | null;
  active: boolean | null;
  reading_id?: string | null;
  bible_readings?: BibleReadingRow | null;
};

type BibleReadingRow = {
  id: string;
  order_index: number;
  testament: "novo_testamento";
  book: string;
  chapter_start: number;
  verse_start: number | null;
  chapter_end: number | null;
  verse_end: number | null;
  reference: string;
  title: string | null;
  content: string | null;
  source: string | null;
  estimated_minutes: number | null;
};

type JourneyProgressRow = {
  player_name: string;
  journey_start_date: string;
  current_streak: number | null;
  best_streak: number | null;
  total_xp: number | null;
  last_access_date?: string | null;
};

type JourneyDayRow = {
  id?: string;
  player_name: string;
  day_number: number;
  status: JourneyDayStatus;
  completed_at: string | null;
  completed_date: string | null;
  xp_earned: number | null;
};

function getPlayerName(playerName: string) {
  return playerName.trim() || "visitante";
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

function fallbackReading(dayNumber: number): BibleReading {
  const fallback =
    fallbackNewTestamentReadings.find((reading) => reading.orderIndex === dayNumber) ??
    fallbackNewTestamentReadings[fallbackNewTestamentReadings.length - 1];

  return {
    ...fallback,
    orderIndex: dayNumber,
    reference: fallback.orderIndex === dayNumber ? fallback.reference : `Novo Testamento ${dayNumber}`,
    title: fallback.orderIndex === dayNumber ? fallback.title : `Dia ${dayNumber} da Jornada`,
    xpReward: fallback.xpReward ?? READING_XP
  };
}

function mapBibleReading(row: BibleReadingRow, dayNumber = row.order_index, xpReward = READING_XP): BibleReading {
  return {
    id: row.id,
    orderIndex: dayNumber,
    testament: row.testament,
    book: row.book,
    chapterStart: row.chapter_start,
    verseStart: row.verse_start,
    chapterEnd: row.chapter_end,
    verseEnd: row.verse_end,
    reference: row.reference,
    title: row.title ?? row.reference,
    content: row.content,
    source: row.source,
    estimatedMinutes: row.estimated_minutes ?? 10,
    xpReward
  };
}

function mapPlanReading(row: ReadingPlanRow): BibleReading {
  if (row.reference && row.book && row.chapter_start) {
    return {
      id: row.id,
      orderIndex: row.day_number,
      testament: "novo_testamento",
      book: row.book,
      chapterStart: row.chapter_start,
      verseStart: row.verse_start,
      chapterEnd: row.chapter_end,
      verseEnd: row.verse_end,
      reference: row.reference,
      title: row.title ?? row.reference,
      estimatedMinutes: row.estimated_minutes ?? 10,
      xpReward: row.xp_reward ?? READING_XP
    };
  }

  if (row.bible_readings) {
    return mapBibleReading(row.bible_readings, row.day_number, row.xp_reward ?? READING_XP);
  }

  return fallbackReading(row.day_number);
}

function buildProgress(playerName: string, row: JourneyProgressRow, completedRows: JourneyDayRow[]): BibleProgress {
  const completedDays = completedRows.map((day) => day.day_number).sort((a, b) => a - b);
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
    currentJourneyDay: missedDays[0] ?? Math.min(availableJourneyDay + 1, TOTAL_READINGS),
    availableJourneyDay,
    completedDays,
    missedDays,
    availableDays: missedDays,
    lastAccessDate: row.last_access_date ?? getTodayKey(),
    lastCompletedDate,
    currentStreak: row.current_streak ?? 0,
    bestStreak: row.best_streak ?? 0,
    totalXp: row.total_xp ?? completedRows.reduce((total, day) => total + Number(day.xp_earned ?? 0), 0),
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
    return {
      dayNumber,
      status: getJourneyDayStatus(dayNumber, progress.completedDays, progress.availableJourneyDay),
      xpEarned: completed?.xp_earned ?? 0,
      completedDate: completed?.completed_date ?? null
    };
  });
}

async function getOrCreateJourneyProgress(playerName: string): Promise<JourneyProgressRow> {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const existing = await supabaseClient
    .from("user_journey_progress")
    .select("*")
    .eq("player_name", playerName)
    .maybeSingle();

  if (existing.error) throw existing.error;

  const today = getTodayKey();
  if (existing.data) {
    await supabaseClient
      .from("user_journey_progress")
      .update({ last_access_date: today, updated_at: new Date().toISOString() })
      .eq("player_name", playerName);
    return { ...(existing.data as JourneyProgressRow), last_access_date: today };
  }

  const created = await supabaseClient
    .from("user_journey_progress")
    .insert({
      player_name: playerName,
      journey_start_date: today,
      current_streak: 0,
      best_streak: 0,
      total_xp: 0,
      last_access_date: today,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (created.error) throw created.error;
  return created.data as JourneyProgressRow;
}

async function getCompletedDays(playerName: string): Promise<JourneyDayRow[]> {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const result = await supabaseClient
    .from("user_journey_days")
    .select("*")
    .eq("player_name", playerName)
    .eq("status", "completed")
    .order("day_number", { ascending: true });

  if (result.error) throw result.error;
  return (result.data ?? []) as JourneyDayRow[];
}

async function getReading(dayNumber: number): Promise<BibleReading> {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const plan = await supabaseClient
    .from("reading_plan")
    .select("*, bible_readings(*)")
    .eq("day_number", dayNumber)
    .eq("active", true)
    .maybeSingle();

  if (!plan.error && plan.data) return mapPlanReading(plan.data as ReadingPlanRow);

  const legacy = await supabaseClient
    .from("bible_readings")
    .select("*")
    .eq("order_index", dayNumber)
    .maybeSingle();

  if (legacy.error) throw legacy.error;
  return legacy.data ? mapBibleReading(legacy.data as BibleReadingRow, dayNumber, READING_XP) : fallbackReading(dayNumber);
}

async function buildState(playerName: string, selectedDay?: number): Promise<CurrentReadingState> {
  const progressRow = await getOrCreateJourneyProgress(playerName);
  const completedRows = await getCompletedDays(playerName);
  const progress = buildProgress(playerName, progressRow, completedRows);
  const dayNumber = Math.min(Math.max(selectedDay ?? progress.currentJourneyDay, 1), TOTAL_READINGS);
  const reading = await getReading(dayNumber);

  return {
    reading,
    selectedDay: dayNumber,
    progress,
    calendar: buildCalendar(progress, completedRows),
    source: "supabase",
    notice:
      progress.pendingCount > 1
        ? `Você tem ${progress.pendingCount} missões pendentes. Tudo bem, sua jornada continua de onde parou.`
        : undefined
  };
}

async function syncProfileXP(playerName: string, xp: number, currentStreak: number, bestStreak: number) {
  if (!supabaseClient) return;

  const profile = await supabaseClient
    .from("profiles")
    .select("id, total_xp, weekly_xp, best_streak")
    .eq("player_name", playerName)
    .maybeSingle();

  if (profile.error) return;

  const payload = {
    player_name: playerName,
    total_xp: Number(profile.data?.total_xp ?? 0) + xp,
    weekly_xp: Number(profile.data?.weekly_xp ?? 0) + xp,
    current_streak: currentStreak,
    best_streak: Math.max(Number(profile.data?.best_streak ?? 0), bestStreak)
  };

  if (profile.data?.id) {
    await supabaseClient.from("profiles").update(payload).eq("id", profile.data.id);
  } else {
    await supabaseClient.from("profiles").insert(payload);
  }
}

export async function getJourneyDay(playerNameInput: string, dayNumber?: number): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    return await buildState(playerName, dayNumber);
  } catch (error) {
    console.warn("Bible journey Supabase failed; using local fallback.", error);
    return localBibleJourneyService.getJourneyDay(playerName, dayNumber);
  }
}

export async function completeJourneyDay(playerNameInput: string, dayNumber: number): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    const state = await buildState(playerName, dayNumber);

    if (dayNumber > state.progress.availableJourneyDay) {
      return state;
    }

    if (state.progress.completedDays.includes(dayNumber)) {
      return state;
    }

    const today = getTodayKey();
    const progressRow = await getOrCreateJourneyProgress(playerName);
    const completedRows = await getCompletedDays(playerName);
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
    const xpEarned = state.reading.xpReward ?? READING_XP;

    const dayInsert = await supabaseClient.from("user_journey_days").insert({
      player_name: playerName,
      day_number: dayNumber,
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_date: today,
      xp_earned: xpEarned
    });

    if (dayInsert.error) throw dayInsert.error;

    const progressUpdate = await supabaseClient
      .from("user_journey_progress")
      .update({
        current_streak: nextStreak,
        best_streak: Math.max(Number(progressRow.best_streak ?? 0), nextStreak),
        total_xp: Number(progressRow.total_xp ?? 0) + xpEarned,
        last_access_date: today,
        updated_at: new Date().toISOString()
      })
      .eq("player_name", playerName);

    if (progressUpdate.error) throw progressUpdate.error;
    await syncProfileXP(playerName, xpEarned, nextStreak, Math.max(Number(progressRow.best_streak ?? 0), nextStreak));

    const nextState = await buildState(playerName);
    const nextDay = nextState.progress.missedDays[0] ?? dayNumber;
    return buildState(playerName, nextDay);
  } catch (error) {
    console.warn("Bible journey completion failed; using local fallback.", error);
    return localBibleJourneyService.completeJourneyDay(playerName, dayNumber);
  }
}

export const getCurrentReading = getJourneyDay;
export const completeCurrentReading = completeJourneyDay;
export const readingXP = READING_XP;
