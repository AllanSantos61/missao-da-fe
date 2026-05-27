import { fallbackNewTestamentReadings } from "@/data/newTestamentReadings";
import type {
  BibleProgress,
  BibleReading,
  CurrentReadingState,
  ReadingCalendarDay
} from "@/types/bibleJourney";
import { addDays, getDaysBetweenExclusive, getLastNDays } from "@/utils/bibleJourneyDate";
import { getTodayKey } from "@/utils/dateUtils";

const STORAGE_KEY = "missaoDaFeBibleJourney";
const TOTAL_READINGS = 365;
const READING_XP = 40;

type LocalBibleJourneyState = {
  progressByPlayer: Record<string, BibleProgress>;
  calendarByPlayer: Record<string, Record<string, ReadingCalendarDay>>;
  historyByPlayer: Record<string, number[]>;
};

function getPlayerKey(playerName: string) {
  return playerName.trim() || "visitante";
}

function getInitialProgress(playerName: string): BibleProgress {
  return {
    playerName: getPlayerKey(playerName),
    currentReadingIndex: 1,
    completedReadings: 0,
    totalReadings: TOTAL_READINGS,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    missedDays: 0
  };
}

function getInitialState(): LocalBibleJourneyState {
  return {
    progressByPlayer: {},
    calendarByPlayer: {},
    historyByPlayer: {}
  };
}

function readState(): LocalBibleJourneyState {
  if (typeof window === "undefined") return getInitialState();

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "") as LocalBibleJourneyState;
  } catch {
    return getInitialState();
  }
}

function saveState(state: LocalBibleJourneyState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getReadingByIndex(index: number): BibleReading {
  return (
    fallbackNewTestamentReadings.find((reading) => reading.orderIndex === index) ?? {
      ...fallbackNewTestamentReadings[fallbackNewTestamentReadings.length - 1],
      orderIndex: index,
      reference: `Novo Testamento ${index}`,
      title: `Leitura ${index} da Jornada`,
      content:
        "Conteudo temporario para MVP. Cadastre esta leitura em bible_readings com texto licenciado ou resumo autorizado."
    }
  );
}

function getCalendarList(calendar: Record<string, ReadingCalendarDay>) {
  return getLastNDays(30).map((date) => calendar[date] ?? { date, status: "pending", xpEarned: 0 });
}

export function checkMissedDays(playerName: string) {
  const playerKey = getPlayerKey(playerName);
  const state = readState();
  const progress = state.progressByPlayer[playerKey] ?? getInitialProgress(playerKey);
  const calendar = state.calendarByPlayer[playerKey] ?? {};
  const today = getTodayKey();

  if (!progress.lastCompletedDate) {
    state.progressByPlayer[playerKey] = progress;
    state.calendarByPlayer[playerKey] = calendar;
    saveState(state);
    return { progress, calendar, missedDaysSinceLastVisit: 0 };
  }

  const missedDates = getDaysBetweenExclusive(progress.lastCompletedDate, today);

  missedDates.forEach((date) => {
    calendar[date] = {
      date,
      status: "missed",
      readingIndex: progress.currentReadingIndex,
      xpEarned: 0
    };
  });

  const nextProgress = missedDates.length
    ? {
        ...progress,
        currentStreak: 0,
        missedDays: progress.missedDays + missedDates.length
      }
    : progress;

  state.progressByPlayer[playerKey] = nextProgress;
  state.calendarByPlayer[playerKey] = calendar;
  saveState(state);

  return { progress: nextProgress, calendar, missedDaysSinceLastVisit: missedDates.length };
}

export async function getCurrentReading(playerName: string): Promise<CurrentReadingState> {
  const playerKey = getPlayerKey(playerName);
  const { progress, calendar, missedDaysSinceLastVisit } = checkMissedDays(playerKey);

  return {
    reading: getReadingByIndex(progress.currentReadingIndex),
    progress,
    calendar: getCalendarList(calendar),
    missedDaysSinceLastVisit,
    source: "local"
  };
}

export async function completeCurrentReading(playerName: string): Promise<CurrentReadingState> {
  const playerKey = getPlayerKey(playerName);
  const state = readState();
  const checked = checkMissedDays(playerKey);
  const progress = checked.progress;
  const calendar = state.calendarByPlayer[playerKey] ?? checked.calendar ?? {};
  const history = state.historyByPlayer[playerKey] ?? [];
  const today = getTodayKey();

  if (history.includes(progress.currentReadingIndex)) {
    return getCurrentReading(playerKey);
  }

  calendar[today] = {
    date: today,
    status: "completed",
    readingIndex: progress.currentReadingIndex,
    xpEarned: READING_XP
  };

  const nextStreak = progress.lastCompletedDate === addDays(today, -1) ? progress.currentStreak + 1 : 1;
  const nextProgress: BibleProgress = {
    ...progress,
    currentReadingIndex: progress.currentReadingIndex + 1,
    completedReadings: progress.completedReadings + 1,
    currentStreak: nextStreak,
    bestStreak: Math.max(progress.bestStreak, nextStreak),
    lastCompletedDate: today
  };

  state.progressByPlayer[playerKey] = nextProgress;
  state.calendarByPlayer[playerKey] = calendar;
  state.historyByPlayer[playerKey] = [...history, progress.currentReadingIndex];
  saveState(state);

  return {
    reading: getReadingByIndex(nextProgress.currentReadingIndex),
    progress: nextProgress,
    calendar: getCalendarList(calendar),
    missedDaysSinceLastVisit: 0,
    source: "local"
  };
}

export const readingXP = READING_XP;
