"use client";

import { useCallback, useEffect, useState } from "react";
import { completeCurrentReading, getCurrentReading } from "@/services/bibleJourneyService";
import type { CurrentReadingState } from "@/types/bibleJourney";

export function useBibleJourney(playerName: string) {
  const [journey, setJourney] = useState<CurrentReadingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  const loadJourney = useCallback(async () => {
    setIsLoading(true);
    const state = await getCurrentReading(playerName);
    setJourney(state);
    setIsLoading(false);
  }, [playerName]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  const completeReading = useCallback(async () => {
    setIsCompleting(true);
    const state = await completeCurrentReading(playerName);
    setJourney(state);
    setIsCompleting(false);
    return state;
  }, [playerName]);

  return {
    journey,
    isLoading,
    isCompleting,
    reloadJourney: loadJourney,
    completeReading
  };
}
