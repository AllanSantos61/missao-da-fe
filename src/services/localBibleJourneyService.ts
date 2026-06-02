import { fallbackNewTestamentReadings } from "@/data/newTestamentReadings";
import { getJourneyMission } from "@/services/journeyContentService";
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

const STORAGE_KEY = "missaoDaFeBibleJourney365";
const TOTAL_READINGS = TOTAL_JOURNEY_DAYS;
export const readingXP = 40;

export type CompletedJourneyDay = {
  dayNumber: number;
  readingCompleted: boolean;
  quizCompleted: boolean;
  wordCompleted: boolean;
  status: JourneyDayStatus;
  completedDate: string;
  xpEarned: number;
  wordAttemptsHistory?: JourneyCalendarDay["wordAttemptsHistory"];
  wordResult?: JourneyCalendarDay["wordResult"];
  wordAttempts?: number;
};

export type LocalJourneySnapshot = {
  exists: boolean;
  key: string;
  progress: LocalJourneyState["progressByPlayer"][string] | null;
  completed: CompletedJourneyDay[];
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
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    console.warn("[App] local journey cache save failed.");
  }
}

export function getLocalJourneySnapshot(userKeyInput: string): LocalJourneySnapshot {
  const key = getPlayerKey(userKeyInput);
  const state = readState();
  const progress = state.progressByPlayer[key] ?? null;
  const completed = state.completedByPlayer[key] ?? [];

  return {
    exists: Boolean(progress || completed.length),
    key,
    progress,
    completed
  };
}

export function saveLocalJourneySnapshot(
  userKeyInput: string,
  snapshot: {
    journeyStartDate: string;
    lastAccessDate?: string | null;
    lastCompletedDate?: string | null;
    currentStreak?: number;
    bestStreak?: number;
    totalXp?: number;
    completed: CompletedJourneyDay[];
  }
) {
  const key = getPlayerKey(userKeyInput);
  const state = readState();
  state.progressByPlayer[key] = {
    journeyStartDate: snapshot.journeyStartDate,
    lastAccessDate: snapshot.lastAccessDate ?? getTodayKey(),
    lastCompletedDate: snapshot.lastCompletedDate ?? null,
    currentStreak: Math.max(0, Number(snapshot.currentStreak ?? 0)),
    bestStreak: Math.max(0, Number(snapshot.bestStreak ?? 0)),
    totalXp: Math.max(0, Number(snapshot.totalXp ?? 0))
  };
  state.completedByPlayer[key] = snapshot.completed;
  saveState(state);
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
    .filter((day) => day.readingCompleted && day.quizCompleted && day.wordCompleted)
    .map((day) => day.dayNumber)
    .sort((a, b) => a - b);
  const journeyState = getJourneyState({
    journeyStartDate: base.journeyStartDate,
    completedDays,
    streak: base.currentStreak
  });
  const availableJourneyDay = journeyState.highestUnlockedDay;
  const missedDays = journeyState.pendingDays;
  const availableDays = missedDays;

  return {
    playerName: playerKey,
    journeyStartDate: base.journeyStartDate,
    currentJourneyDay: journeyState.currentMissionDay,
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
  const journeyState = getJourneyState({
    journeyStartDate: progress.journeyStartDate,
    completedDays: progress.completedDays,
    streak: progress.currentStreak
  });

  return Array.from({ length: TOTAL_READINGS }, (_, index) => {
    const dayNumber = index + 1;
    const completed = byDay.get(dayNumber);
    const isFullyCompleted = Boolean(
      completed?.readingCompleted &&
      completed?.quizCompleted &&
      completed?.wordCompleted
    );
    const wordCompleted = Boolean(completed?.wordCompleted);
    const quizCompleted = Boolean(completed?.quizCompleted || wordCompleted);
    const readingCompleted = Boolean(completed?.readingCompleted || quizCompleted || wordCompleted);
    return {
      dayNumber,
      status: getDayStatus(dayNumber, journeyState),
      readingCompleted,
      quizCompleted,
      wordCompleted,
      wordAttemptsHistory: completed?.wordAttemptsHistory ?? [],
      wordResult: completed?.wordResult ?? null,
      wordAttempts: completed?.wordAttempts ?? 0,
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

  const requestedDay = Math.min(Math.max(dayNumber ?? progress.currentJourneyDay, 1), TOTAL_READINGS);
  const selectedDay = requestedDay > progress.availableJourneyDay ? progress.currentJourneyDay : requestedDay;
  const calendar = buildCalendar(progress, completedRows);
  const mission = await getJourneyMission(selectedDay, { forceFallback: true });

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
  xpOverride?: number,
  result?: DailyChallengeResult
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
      status: isDayCompleted
        ? "completed"
        : getDayStatus(dayNumber, {
            completedDays: progress.completedDays,
            highestUnlockedDay: progress.availableJourneyDay,
            currentMissionDay: progress.currentJourneyDay
          }),
      completedDate: isDayCompleted ? today : existing?.completedDate ?? "",
      xpEarned: Number(existing?.xpEarned ?? 0) + xpEarned,
      wordAttemptsHistory: part === "word" ? result?.word?.attemptsHistory ?? existing?.wordAttemptsHistory ?? [] : existing?.wordAttemptsHistory,
      wordResult: part === "word"
        ? {
            solved: Boolean(result?.word?.solved),
            correctWord: result?.word?.correctWord
          }
        : existing?.wordResult,
      wordAttempts: part === "word" ? result?.word?.attempts ?? existing?.wordAttempts ?? 0 : existing?.wordAttempts
    }
  ];
  saveState(state);

  const nextProgress = buildProgress(playerKey, state);
  const nextDay = nextProgress.missedDays[0] ?? dayNumber;
  return getJourneyDay(playerKey, nextDay);
}
