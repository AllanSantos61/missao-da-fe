import { supabaseClient } from "@/lib/supabaseClient";
import { fallbackNewTestamentReadings } from "@/data/newTestamentReadings";
import * as localBibleJourneyService from "@/services/localBibleJourneyService";
import type {
  BibleProgress,
  BibleReading,
  CurrentReadingState,
  ReadingCalendarDay
} from "@/types/bibleJourney";
import { addDays, getDaysBetweenExclusive, getLastNDays } from "@/utils/bibleJourneyDate";
import { getTodayKey } from "@/utils/dateUtils";

const TOTAL_READINGS = 365;
const READING_XP = 40;

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
  content: string;
  estimated_minutes: number | null;
};

type BibleProgressRow = {
  id: string;
  player_name: string;
  current_reading_index: number;
  completed_readings: number;
  total_readings: number;
  current_streak: number;
  best_streak: number;
  last_completed_date: string | null;
  missed_days: number;
};

type CalendarStatusRow = {
  calendar_date: string;
  status: "completed" | "missed" | "pending";
  reading_index: number | null;
  xp_earned: number | null;
};

function getPlayerName(playerName: string) {
  return playerName.trim() || "visitante";
}

function mapReading(row: BibleReadingRow): BibleReading {
  return {
    id: row.id,
    orderIndex: row.order_index,
    testament: row.testament,
    book: row.book,
    chapterStart: row.chapter_start,
    verseStart: row.verse_start,
    chapterEnd: row.chapter_end,
    verseEnd: row.verse_end,
    reference: row.reference,
    title: row.title ?? row.reference,
    content: row.content,
    estimatedMinutes: row.estimated_minutes ?? 10
  };
}

function mapProgress(row: BibleProgressRow): BibleProgress {
  return {
    playerName: row.player_name,
    currentReadingIndex: row.current_reading_index,
    completedReadings: row.completed_readings,
    totalReadings: row.total_readings,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    lastCompletedDate: row.last_completed_date,
    missedDays: row.missed_days
  };
}

function fallbackReading(index: number) {
  return (
    fallbackNewTestamentReadings.find((reading) => reading.orderIndex === index) ?? {
      ...fallbackNewTestamentReadings[fallbackNewTestamentReadings.length - 1],
      orderIndex: index,
      reference: `Novo Testamento ${index}`,
      title: `Leitura ${index} da Jornada`
    }
  );
}

async function getOrCreateProgress(playerName: string) {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const existing = await supabaseClient
    .from("user_bible_progress")
    .select("*")
    .eq("player_name", playerName)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return mapProgress(existing.data as BibleProgressRow);

  const created = await supabaseClient
    .from("user_bible_progress")
    .insert({
      player_name: playerName,
      current_reading_index: 1,
      completed_readings: 0,
      total_readings: TOTAL_READINGS,
      current_streak: 0,
      best_streak: 0,
      missed_days: 0,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (created.error) throw created.error;
  return mapProgress(created.data as BibleProgressRow);
}

async function getReading(index: number) {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const planResult = await supabaseClient
    .from("reading_plan")
    .select("reading_id")
    .eq("day_number", index)
    .eq("active", true)
    .maybeSingle();

  if (planResult.error) throw planResult.error;

  if (planResult.data?.reading_id) {
    const plannedReading = await supabaseClient
      .from("bible_readings")
      .select("*")
      .eq("id", planResult.data.reading_id)
      .maybeSingle();

    if (plannedReading.error) throw plannedReading.error;
    if (plannedReading.data) return mapReading(plannedReading.data as BibleReadingRow);
  }

  const result = await supabaseClient
    .from("bible_readings")
    .select("*")
    .eq("order_index", index)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data ? mapReading(result.data as BibleReadingRow) : fallbackReading(index);
}

async function getCalendar(playerName: string): Promise<ReadingCalendarDay[]> {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const startDate = getLastNDays(30)[0];
  const result = await supabaseClient
    .from("user_calendar_status")
    .select("calendar_date, status, reading_index, xp_earned")
    .eq("player_name", playerName)
    .gte("calendar_date", startDate);

  if (result.error) throw result.error;

  const byDate = ((result.data ?? []) as CalendarStatusRow[]).reduce<Record<string, ReadingCalendarDay>>(
    (acc, row) => {
      acc[row.calendar_date] = {
        date: row.calendar_date,
        status: row.status,
        readingIndex: row.reading_index ?? undefined,
        xpEarned: row.xp_earned ?? 0
      };
      return acc;
    },
    {}
  );

  return getLastNDays(30).map((date) => byDate[date] ?? { date, status: "pending", xpEarned: 0 });
}

async function upsertCalendarStatus(day: ReadingCalendarDay, playerName: string) {
  if (!supabaseClient) throw new Error("Supabase not configured.");

  const existing = await supabaseClient
    .from("user_calendar_status")
    .select("id")
    .eq("player_name", playerName)
    .eq("calendar_date", day.date)
    .maybeSingle();

  if (existing.error) throw existing.error;

  const payload = {
    player_name: playerName,
    calendar_date: day.date,
    status: day.status,
    reading_index: day.readingIndex,
    xp_earned: day.xpEarned
  };

  if (existing.data?.id) {
    const updated = await supabaseClient
      .from("user_calendar_status")
      .update(payload)
      .eq("id", existing.data.id);
    if (updated.error) throw updated.error;
    return;
  }

  const inserted = await supabaseClient.from("user_calendar_status").insert(payload);
  if (inserted.error) throw inserted.error;
}

export async function checkMissedDays(playerNameInput: string) {
  const playerName = getPlayerName(playerNameInput);
  if (!supabaseClient) return localBibleJourneyService.checkMissedDays(playerName);

  const progress = await getOrCreateProgress(playerName);
  const today = getTodayKey();

  if (!progress.lastCompletedDate) {
    return { progress, missedDaysSinceLastVisit: 0 };
  }

  const missedDates = getDaysBetweenExclusive(progress.lastCompletedDate, today);

  for (const date of missedDates) {
    await upsertCalendarStatus(
      {
        date,
        status: "missed",
        readingIndex: progress.currentReadingIndex,
        xpEarned: 0
      },
      playerName
    );
  }

  if (!missedDates.length) {
    return { progress, missedDaysSinceLastVisit: 0 };
  }

  const updated = await supabaseClient
    .from("user_bible_progress")
    .update({
      current_streak: 0,
      missed_days: progress.missedDays + missedDates.length,
      updated_at: new Date().toISOString()
    })
    .eq("player_name", playerName)
    .select("*")
    .single();

  if (updated.error) throw updated.error;

  return {
    progress: mapProgress(updated.data as BibleProgressRow),
    missedDaysSinceLastVisit: missedDates.length
  };
}

export async function getCurrentReading(playerNameInput: string): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    const checked = await checkMissedDays(playerName);
    const reading = await getReading(checked.progress.currentReadingIndex);
    const calendar = await getCalendar(playerName);

    return {
      reading,
      progress: checked.progress,
      calendar,
      missedDaysSinceLastVisit: checked.missedDaysSinceLastVisit,
      source: "supabase"
    };
  } catch (error) {
    console.warn("Bible journey Supabase failed; using local fallback.", error);
    return localBibleJourneyService.getCurrentReading(playerName);
  }
}

export async function completeCurrentReading(playerNameInput: string): Promise<CurrentReadingState> {
  const playerName = getPlayerName(playerNameInput);

  try {
    if (!supabaseClient) throw new Error("Supabase not configured.");
    const checked = await checkMissedDays(playerName);
    const progress = checked.progress;
    const today = getTodayKey();

    const existingHistory = await supabaseClient
      .from("user_reading_history")
      .select("id")
      .eq("player_name", playerName)
      .eq("reading_index", progress.currentReadingIndex)
      .maybeSingle();

    if (existingHistory.error) throw existingHistory.error;
    if (existingHistory.data?.id) return getCurrentReading(playerName);

    const reading = await getReading(progress.currentReadingIndex);
    const nextStreak = progress.lastCompletedDate === addDays(today, -1) ? progress.currentStreak + 1 : 1;
    const nextCompletedReadings = progress.completedReadings + 1;

    const historyInsert = await supabaseClient.from("user_reading_history").insert({
      player_name: playerName,
      reading_index: progress.currentReadingIndex,
      reading_reference: reading.reference,
      completed_date: today,
      xp_earned: READING_XP
    });
    if (historyInsert.error) throw historyInsert.error;

    await upsertCalendarStatus(
      {
        date: today,
        status: "completed",
        readingIndex: progress.currentReadingIndex,
        xpEarned: READING_XP
      },
      playerName
    );

    const progressUpdate = await supabaseClient
      .from("user_bible_progress")
      .update({
        current_reading_index: progress.currentReadingIndex + 1,
        completed_readings: nextCompletedReadings,
        current_streak: nextStreak,
        best_streak: Math.max(progress.bestStreak, nextStreak),
        last_completed_date: today,
        updated_at: new Date().toISOString()
      })
      .eq("player_name", playerName);
    if (progressUpdate.error) throw progressUpdate.error;

    const profile = await supabaseClient
      .from("profiles")
      .select("id, total_xp, weekly_xp, best_streak")
      .eq("player_name", playerName)
      .maybeSingle();

    if (!profile.error && profile.data?.id) {
      await supabaseClient
        .from("profiles")
        .update({
          total_xp: Number(profile.data.total_xp ?? 0) + READING_XP,
          weekly_xp: Number(profile.data.weekly_xp ?? 0) + READING_XP,
          current_streak: nextStreak,
          best_streak: Math.max(Number(profile.data.best_streak ?? 0), nextStreak)
        })
        .eq("id", profile.data.id);
    }

    return getCurrentReading(playerName);
  } catch (error) {
    console.warn("Bible journey completion failed; using local fallback.", error);
    return localBibleJourneyService.completeCurrentReading(playerName);
  }
}

export const readingXP = READING_XP;
