import { getTodayKey } from "@/utils/dateUtils";

export const TOTAL_JOURNEY_DAYS = 365;

export const journeyMilestones: Record<number, { title: string; message: string }> = {
  7: { title: "Primeira semana de missão", message: "Você deu os primeiros passos com fidelidade." },
  30: { title: "Hábito da Palavra", message: "Você chegou ao Dia 30. Sua fidelidade está virando hábito." },
  50: { title: "Caminho firme", message: "A constância já começou a moldar sua jornada." },
  100: { title: "Cem dias de fé", message: "Cem dias de missão: uma bela história com Deus." },
  180: { title: "Metade da jornada", message: "Você atravessou uma grande parte do caminho." },
  365: { title: "Novo Testamento concluído", message: "Uma jornada inteira pela Palavra." }
};

export type JourneyBaseDayStatus = "completed" | "available" | "pending" | "locked";
export type JourneyVisualDayStatus = JourneyBaseDayStatus | "milestone";

export type JourneyStateInput = {
  journeyStartDate: string | null;
  completedDays: number[];
  streak?: number;
  todayKey?: string;
};

export type JourneyState = {
  journeyStartDate: string | null;
  daysSinceStart: number;
  highestUnlockedDay: number;
  completedDays: number[];
  pendingDays: number[];
  currentMissionDay: number;
  nextAvailableDay: number | null;
  isTodayMissionCompleted: boolean;
  nextUnlockAt: Date;
  streak: number;
};

function parseLocalDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

export function getDaysSinceJourneyStart(journeyStartDate: string | null, todayKey = getTodayKey()) {
  if (!journeyStartDate) return 0;
  const start = parseLocalDate(journeyStartDate);
  const today = parseLocalDate(todayKey);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
}

export function getNextLocalMidnight() {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight;
}

export function normalizeCompletedDays(completedDays: number[]) {
  return Array.from(
    new Set(
      completedDays
        .map((day) => Math.round(Number(day)))
        .filter((day) => Number.isFinite(day) && day >= 1 && day <= TOTAL_JOURNEY_DAYS)
    )
  ).sort((a, b) => a - b);
}

export function getJourneyState(input: JourneyStateInput): JourneyState {
  const completedDays = normalizeCompletedDays(input.completedDays);
  const daysSinceStart = getDaysSinceJourneyStart(input.journeyStartDate, input.todayKey);
  const highestUnlockedDay = Math.min(daysSinceStart + 1, TOTAL_JOURNEY_DAYS);
  const pendingDays = Array.from({ length: highestUnlockedDay }, (_, index) => index + 1).filter(
    (dayNumber) => !completedDays.includes(dayNumber)
  );
  const currentMissionDay = pendingDays[0] ?? highestUnlockedDay;
  const isTodayMissionCompleted = pendingDays.length === 0 && completedDays.includes(currentMissionDay);
  const nextAvailableDay =
    isTodayMissionCompleted && highestUnlockedDay < TOTAL_JOURNEY_DAYS ? highestUnlockedDay + 1 : null;

  return {
    journeyStartDate: input.journeyStartDate,
    daysSinceStart,
    highestUnlockedDay,
    completedDays,
    pendingDays,
    currentMissionDay,
    nextAvailableDay,
    isTodayMissionCompleted,
    nextUnlockAt: getNextLocalMidnight(),
    streak: Math.max(0, Math.round(Number(input.streak ?? 0)))
  };
}

export function getDayStatus(dayNumber: number, state: Pick<JourneyState, "completedDays" | "highestUnlockedDay" | "currentMissionDay">): JourneyBaseDayStatus {
  if (state.completedDays.includes(dayNumber)) return "completed";
  if (dayNumber > state.highestUnlockedDay) return "locked";
  if (dayNumber === state.currentMissionDay) return "available";
  return "pending";
}

export function getVisualDayStatus(dayNumber: number, state: Pick<JourneyState, "completedDays" | "highestUnlockedDay" | "currentMissionDay">): JourneyVisualDayStatus {
  const status = getDayStatus(dayNumber, state);
  if (status === "completed" || status === "available") return status;
  return journeyMilestones[dayNumber as keyof typeof journeyMilestones] ? "milestone" : status;
}
