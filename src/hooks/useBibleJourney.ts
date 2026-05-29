"use client";

import { useCallback, useEffect, useState } from "react";
import { completeJourneyDay, getJourneyDay } from "@/services/bibleJourneyService";
import type { CurrentReadingState } from "@/types/bibleJourney";

export function useBibleJourney(playerName: string) {
  const [journey, setJourney] = useState<CurrentReadingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadJourney = useCallback(async (dayNumber?: number) => {
    setIsLoading(true);
    const state = await getJourneyDay(playerName, dayNumber);
    setJourney(state);
    setIsLoading(false);
  }, [playerName]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  const completeReading = useCallback(async (dayNumber?: number) => {
    setIsCompleting(true);
    const state = await completeJourneyDay(playerName, dayNumber ?? journey?.selectedDay ?? 1);
    setJourney(state);
    setIsCompleting(false);
    return state;
  }, [journey?.selectedDay, playerName]);

  return {
    journey,
    isLoading,
    isCompleting,
    reloadJourney: loadJourney,
    selectJourneyDay: loadJourney,
    completeReading
  };
}
