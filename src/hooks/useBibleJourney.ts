"use client";

import { useCallback, useEffect, useState } from "react";
import { completeJourneyDay, completeJourneyPart, getJourneyDay } from "@/services/bibleJourneyService";
import type { CurrentReadingState } from "@/types/bibleJourney";

export function useBibleJourney(userId: string, playerName: string) {
  const [journey, setJourney] = useState<CurrentReadingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadJourney = useCallback(async (dayNumber?: number) => {
    setIsLoading(true);
    const state = await getJourneyDay(userId, playerName, dayNumber);
    setJourney(state);
    setIsLoading(false);
  }, [playerName, userId]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  const completeReading = useCallback(async (dayNumber?: number) => {
    setIsCompleting(true);
    const state = await completeJourneyDay(userId, playerName, dayNumber ?? journey?.selectedDay ?? 1);
    setJourney(state);
    setIsCompleting(false);
    return state;
  }, [journey?.selectedDay, playerName, userId]);

  return {
    journey,
    isLoading,
    isCompleting,
    reloadJourney: loadJourney,
    selectJourneyDay: loadJourney,
    completeReading,
    completeJourneyPart: async (dayNumber: number, part: "reading" | "quiz" | "word", xp?: number) => {
      setIsCompleting(true);
      const state = await completeJourneyPart(userId, playerName, dayNumber, part, xp);
      setJourney(state);
      setIsCompleting(false);
      return state;
    }
  };
}
