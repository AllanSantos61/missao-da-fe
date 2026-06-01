"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CurrentReadingState } from "@/types/bibleJourney";
import type { ChallengeId, DayHistory } from "@/types/dailyProgress";

export type MissionStepId = ChallengeId | "result";

export type TodayMissionState = {
  journeyStartDate: string | null;
  todayDate: string;
  daysSinceStart: number;
  highestUnlockedDay: number;
  selectedDay: number;
  currentMissionDay: number;
  journeyDay: number;
  completedDays: number[];
  pendingDays: number[];
  availableDays: number[];
  lockedDays: number[];
  readingCompleted: boolean;
  quizCompleted: boolean;
  wordCompleted: boolean;
  completedCount: number;
  totalSteps: 3;
  isMissionCompleted: boolean;
  nextPendingStep: ChallengeId | null;
  currentStep: MissionStepId;
  canContinueToday: boolean;
  todayMissionStatus: "pending" | "completed";
  primaryActionLabel: string;
  nextMissionCountdown: string;
  secondsUntilNextMission: number;
  getMissionStatus: (dayNumber: number) => DayMissionStatus;
};

export type DayMissionStatus = {
  dayNumber: number;
  readingCompleted: boolean;
  quizCompleted: boolean;
  wordCompleted: boolean;
  nextStep: "reading" | "quiz" | "word" | "completed";
};

const missionStepOrder: ChallengeId[] = ["gospel", "quiz", "word"];

function getTodayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysSinceStart(startDateKey: string | null, todayKey: string) {
  if (!startDateKey) return 0;
  const start = new Date(`${startDateKey}T12:00:00`);
  const today = new Date(`${todayKey}T12:00:00`);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function getSecondsUntilNextLocalMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function getPrimaryMissionAction(nextPendingStep: ChallengeId | null, isMissionCompleted: boolean) {
  if (isMissionCompleted) return "Ver resultado";
  if (nextPendingStep === "gospel") return "Começar leitura";
  if (nextPendingStep === "quiz") return "Responder quiz";
  if (nextPendingStep === "word") return "Descobrir Palavra";
  return "Aguardar próxima missão";
}

function normalizeMissionStatus(params: {
  dayNumber: number;
  readingCompleted?: boolean;
  quizCompleted?: boolean;
  wordCompleted?: boolean;
}): DayMissionStatus {
  const wordCompleted = Boolean(params.wordCompleted);
  const quizCompleted = Boolean(params.quizCompleted || wordCompleted);
  const readingCompleted = Boolean(params.readingCompleted || quizCompleted || wordCompleted);
  const nextStep = !readingCompleted
    ? "reading"
    : !quizCompleted
      ? "quiz"
      : !wordCompleted
        ? "word"
        : "completed";

  const status = {
    dayNumber: params.dayNumber,
    readingCompleted,
    quizCompleted,
    wordCompleted,
    nextStep
  } satisfies DayMissionStatus;

  console.log(status);
  return status;
}

export function useJourneyMissionState(journey: CurrentReadingState | null, todayHistory?: DayHistory | null): TodayMissionState {
  const [secondsUntilNextMission, setSecondsUntilNextMission] = useState(getSecondsUntilNextLocalMidnight);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsUntilNextMission(getSecondsUntilNextLocalMidnight());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const getMissionStatus = useCallback((dayNumber: number): DayMissionStatus => {
    const missionDayStatus = journey?.calendar.find((day) => day.dayNumber === dayNumber);
    return normalizeMissionStatus({
      dayNumber,
      readingCompleted: missionDayStatus?.readingCompleted || (!missionDayStatus && Boolean(todayHistory?.results.gospel)),
      quizCompleted: missionDayStatus?.quizCompleted || (!missionDayStatus && Boolean(todayHistory?.results.quiz)),
      wordCompleted: missionDayStatus?.wordCompleted || (!missionDayStatus && Boolean(todayHistory?.results.word))
    });
  }, [journey?.calendar, todayHistory]);

  return useMemo(() => {
    const todayDate = getTodayKey();
    const journeyStartDate = journey?.progress.journeyStartDate ?? null;
    const daysSinceStart = getDaysSinceStart(journeyStartDate, todayDate);
    const highestUnlockedDay = journey?.progress.availableJourneyDay ?? Math.min(daysSinceStart + 1, 365);
    const completedDays = journey?.progress.completedDays ?? [];
    const calendar = journey?.calendar ?? [];
    const pendingDays = Array.from({ length: highestUnlockedDay }, (_, index) => index + 1).filter(
      (dayNumber) => !completedDays.includes(dayNumber)
    );
    const currentMissionDay = pendingDays[0] ?? highestUnlockedDay;
    const selectedDay = journey?.selectedDay ?? currentMissionDay;
    const missionStatus = getMissionStatus(currentMissionDay);
    const readingCompleted = missionStatus.readingCompleted;
    const quizCompleted = missionStatus.quizCompleted;
    const wordCompleted = missionStatus.wordCompleted;
    const completedCount = [readingCompleted, quizCompleted, wordCompleted].filter(Boolean).length;
    const nextPendingStep =
      missionStepOrder.find((step) => {
        if (step === "gospel") return !readingCompleted;
        if (step === "quiz") return !quizCompleted;
        return !wordCompleted;
      }) ?? null;
    const isMissionCompleted = readingCompleted && quizCompleted && wordCompleted;
    const currentStep: MissionStepId = isMissionCompleted ? "result" : nextPendingStep ?? "result";
    const availableDays = pendingDays;
    const lockedDays = Array.from({ length: 365 - highestUnlockedDay }, (_, index) => highestUnlockedDay + index + 1);

    return {
      journeyStartDate,
      todayDate,
      daysSinceStart,
      highestUnlockedDay,
      selectedDay,
      currentMissionDay,
      journeyDay: currentMissionDay,
      completedDays,
      pendingDays,
      availableDays,
      lockedDays,
      readingCompleted,
      quizCompleted,
      wordCompleted,
      completedCount,
      totalSteps: 3,
      isMissionCompleted,
      nextPendingStep,
      currentStep,
      canContinueToday: !isMissionCompleted && Boolean(nextPendingStep),
      todayMissionStatus: isMissionCompleted ? "completed" : "pending",
      primaryActionLabel: getPrimaryMissionAction(nextPendingStep, isMissionCompleted),
      nextMissionCountdown: formatCountdown(secondsUntilNextMission),
      secondsUntilNextMission,
      getMissionStatus
    };
  }, [getMissionStatus, journey, secondsUntilNextMission]);
}
