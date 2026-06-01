import { fallbackNewTestamentReadings } from "@/data/newTestamentReadings";
import { getJourneyMission } from "@/services/journeyContentService";
import type {
  BibleProgress,
  BibleReading,
  CurrentReadingState,
  JourneyCalendarDay,
  JourneyDayStatus
} from "@/types/bibleJourney";
import { addDays, getDaysElapsedInclusive } from "@/utils/bibleJourneyDate";
import { getTodayKey } from "@/utils/dateUtils";

const STORAGE_KEY = "missaoDaFeBibleJourney365";
const TOTAL_READINGS = 365;
export const readingXP = 40;

type CompletedJourneyDay = {
  dayNumber: number;
  readingCompleted: boolean;
  quizCompleted: boolean;
  wordCompleted: boolean;
  status: JourneyDayStatus;
  completedDate: string;
  xpEarned: number;
};

type LocalJourneyState = {
  progressByPlayer: Record<
    string,
    {
      journeyStartDate: string;
      lastAccessDate: string | null;
      lastCompletedDate: string | null;
      currentStreak: number;
      bestStreak: number;
      totalXp: number;
    }
  >;
  completedByPlayer: Record<string, CompletedJourneyDay[]>;
};

function getPlayerKey(playerName: string) {
  return playerName.trim() || "visitante";
}

function getInitialState(): LocalJourneyState {
  return {
    progressByPlayer: {},
    completedByPlayer: {}
  };
}

function readState(): LocalJourneyState {
  if (typeof window === "undefined") return getInitialState();

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "") as LocalJourneyState;
  } catch {
    return getInitialState();
  }
}

function saveState(state: LocalJourneyState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getReadingByDay(dayNumber: number): BibleReading {
  const fallback =
    fallbackNewTestamentReadings.find((reading) => reading.orderIndex === dayNumber) ??
    fallbackNewTestamentReadings[fallbackNewTestamentReadings.length - 1];

  return {
    ...fallback,
    orderIndex: dayNumber,
    reference: fallback.orderIndex === dayNumber ? fallback.reference : `Novo Testamento ${dayNumber}`,
    title: fallback.orderIndex === dayNumber ? fallback.title : `Dia ${dayNumber} da Jornada`,
    xpReward: fallback.xpReward ?? readingXP
  };
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

function buildProgress(playerName: string, state: LocalJourneyState): BibleProgress {
  const playerKey = getPlayerKey(playerName);
  const today = getTodayKey();
  const base = state.progressByPlayer[playerKey] ?? {
    journeyStartDate: today,
    lastAccessDate: null,
    lastCompletedDate: null,
    currentStreak: 0,
    bestStreak: 0,
    totalXp: 0
  };

  state.progressByPlayer[playerKey] = {
    ...base,
    lastAccessDate: today
  };

  const completed = state.completedByPlayer[playerKey] ?? [];
  const completedDays = completed
    .filter((day) => day.status === "completed")
    .map((day) => day.dayNumber)
    .sort((a, b) => a - b);
  const availableJourneyDay = getAvailableJourneyDay(base.journeyStartDate);
  const missedDays = Array.from({ length: availableJourneyDay }, (_, index) => index + 1).filter(
    (dayNumber) => !completedDays.includes(dayNumber)
  );
  const availableDays = missedDays;

  return {
    playerName: playerKey,
    journeyStartDate: base.journeyStartDate,
    currentJourneyDay: missedDays[0] ?? Math.min(availableJourneyDay + 1, TOTAL_READINGS),
    availableJourneyDay,
    completedDays,
    missedDays,
    availableDays,
    lastAccessDate: today,
    lastCompletedDate: base.lastCompletedDate,
    currentStreak: base.currentStreak,
    bestStreak: base.bestStreak,
    totalXp: base.totalXp,
    completedReadings: completedDays.length,
    totalReadings: TOTAL_READINGS,
    pendingCount: missedDays.length
  };
}

function buildCalendar(progress: BibleProgress, completedRows: CompletedJourneyDay[]): JourneyCalendarDay[] {
  const byDay = new Map(completedRows.map((row) => [row.dayNumber, row]));

  return Array.from({ length: TOTAL_READINGS }, (_, index) => {
    const dayNumber = index + 1;
    const completed = byDay.get(dayNumber);
    const isFullyCompleted = Boolean(
      completed?.readingCompleted &&
      completed?.quizCompleted &&
      completed?.wordCompleted
    );
    return {
      dayNumber,
      status: isFullyCompleted ? "completed" : getJourneyDayStatus(dayNumber, progress.completedDays, progress.availableJourneyDay),
      readingCompleted: Boolean(completed?.readingCompleted),
      quizCompleted: Boolean(completed?.quizCompleted),
      wordCompleted: Boolean(completed?.wordCompleted),
      xpEarned: completed?.xpEarned ?? 0,
      completedDate: completed?.completedDate ?? null
    };
  });
}

export async function getJourneyDay(playerName: string, dayNumber?: number): Promise<CurrentReadingState> {
  const playerKey = getPlayerKey(playerName);
  const state = readState();
  const progress = buildProgress(playerKey, state);
  const completedRows = state.completedByPlayer[playerKey] ?? [];
  saveState(state);

  const selectedDay = Math.min(Math.max(dayNumber ?? progress.currentJourneyDay, 1), TOTAL_READINGS);
  const calendar = buildCalendar(progress, completedRows);
  const mission = await getJourneyMission(selectedDay);

  return {
    reading: {
      ...getReadingByDay(selectedDay),
      reference: mission.bibleReference,
      book: mission.bibleBook,
      chapterStart: mission.chapterStart,
      verseStart: mission.verseStart,
      chapterEnd: mission.chapterEnd,
      verseEnd: mission.verseEnd,
      title: mission.title,
      estimatedMinutes: mission.estimatedMinutes,
      xpReward: mission.readingXp
    },
    selectedDay,
    mission,
    progress,
    calendar,
    source: "local",
    notice:
      progress.pendingCount > 1
        ? `Você tem ${progress.pendingCount} missões pendentes. Tudo bem, sua jornada continua de onde parou.`
        : undefined
  };
}

export async function completeJourneyDay(playerName: string, dayNumber: number): Promise<CurrentReadingState> {
  return completeJourneyPart(playerName, dayNumber, "reading");
}

export async function completeJourneyPart(
  playerName: string,
  dayNumber: number,
  part: "reading" | "quiz" | "word",
  xpOverride?: number
): Promise<CurrentReadingState> {
  const playerKey = getPlayerKey(playerName);
  const state = readState();
  const progress = buildProgress(playerKey, state);

  if (dayNumber > progress.availableJourneyDay) {
    return getJourneyDay(playerKey, dayNumber);
  }

  const completed = state.completedByPlayer[playerKey] ?? [];
  const existing = completed.find((day) => day.dayNumber === dayNumber);
  if (
    (part === "reading" && existing?.readingCompleted) ||
    (part === "quiz" && existing?.quizCompleted) ||
    (part === "word" && existing?.wordCompleted)
  ) {
    return getJourneyDay(playerKey, dayNumber);
  }

  const readingCompleted = part === "reading" ? true : Boolean(existing?.readingCompleted);
  const quizCompleted = part === "quiz" ? true : Boolean(existing?.quizCompleted);
  const wordCompleted = part === "word" ? true : Boolean(existing?.wordCompleted);
  const isDayCompleted = readingCompleted && quizCompleted && wordCompleted;
  const xpEarned = xpOverride ?? readingXP;

  const today = getTodayKey();
  const base = state.progressByPlayer[playerKey];
  const nextStreak =
    base.lastCompletedDate === today
      ? base.currentStreak
      : base.lastCompletedDate === addDays(today, -1)
        ? base.currentStreak + 1
        : 1;

  state.progressByPlayer[playerKey] = {
    ...base,
    lastAccessDate: today,
    lastCompletedDate: isDayCompleted ? today : base.lastCompletedDate,
    currentStreak: isDayCompleted ? nextStreak : base.currentStreak,
    bestStreak: isDayCompleted ? Math.max(base.bestStreak, nextStreak) : base.bestStreak,
    totalXp: base.totalXp + xpEarned
  };
  state.completedByPlayer[playerKey] = [
    ...completed.filter((day) => day.dayNumber !== dayNumber),
    {
      dayNumber,
      readingCompleted,
      quizCompleted,
      wordCompleted,
      status: isDayCompleted ? "completed" : dayNumber === progress.availableJourneyDay ? "available" : "pending",
      completedDate: isDayCompleted ? today : existing?.completedDate ?? "",
      xpEarned: Number(existing?.xpEarned ?? 0) + xpEarned
    }
  ];
  saveState(state);

  const nextProgress = buildProgress(playerKey, state);
  const nextDay = nextProgress.missedDays[0] ?? dayNumber;
  return getJourneyDay(playerKey, nextDay);
}
