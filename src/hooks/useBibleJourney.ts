"use client";

import { useCallback, useEffect, useState } from "react";
import { completeJourneyDay, completeJourneyPart, getJourneyDay } from "@/services/bibleJourneyService";
import * as localBibleJourneyService from "@/services/localBibleJourneyService";
import type { CurrentReadingState } from "@/types/bibleJourney";
import type { DailyChallengeResult } from "@/types/dailyProgress";

const LOAD_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

export function useBibleJourney(userId: string, playerName: string, legacyUserId?: string) {
  const [journey, setJourney] = useState<CurrentReadingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState("");

  const loadJourney = useCallback(async (dayNumber?: number) => {
    const safeUserId = userId || "anonymous";
    const safePlayerName = playerName || "visitante";
    setIsLoading(true);
    console.log("[App] Loading started");
    try {
      const state = await withTimeout(
        getJourneyDay(safeUserId, safePlayerName, dayNumber, legacyUserId),
        LOAD_TIMEOUT_MS,
        "Journey loading timeout"
      );
      setJourney(state);
      if (state.source === "supabase") {
        setFallbackNotice("");
        console.log("[App] Supabase success");
      } else {
        setFallbackNotice("Conexão online instável. Jornada local carregada com segurança.");
        console.log("[App] Supabase failed, using fallback");
      }
    } catch (error) {
      console.log("[App] Supabase failed, using fallback", error);
      const fallbackState = await localBibleJourneyService.getJourneyDay(safeUserId, dayNumber);
      setJourney(fallbackState);
      setFallbackNotice("Conexão online instável. Jornada local carregada com segurança.");
    } finally {
      setIsLoading(false);
      console.log("[App] Loading finished");
    }
  }, [legacyUserId, playerName, userId]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  const completeReading = useCallback(async (dayNumber?: number) => {
    const safeUserId = userId || "anonymous";
    const safePlayerName = playerName || "visitante";
    setIsCompleting(true);
    try {
      const state = await withTimeout(
        completeJourneyDay(safeUserId, safePlayerName, dayNumber ?? journey?.selectedDay ?? 1, legacyUserId),
        LOAD_TIMEOUT_MS,
        "Journey completion timeout"
      );
      setJourney(state);
      setFallbackNotice("");
      return state;
    } catch (error) {
      console.log("[App] Supabase failed, using fallback", error);
      const state = await localBibleJourneyService.completeJourneyDay(safeUserId, dayNumber ?? journey?.selectedDay ?? 1);
      setJourney(state);
      setFallbackNotice("Leitura salva localmente. Vamos sincronizar quando possível.");
      return state;
    } finally {
      setIsCompleting(false);
    }
  }, [journey?.selectedDay, legacyUserId, playerName, userId]);

  return {
    journey,
    isLoading,
    isCompleting,
    fallbackNotice,
    reloadJourney: loadJourney,
    selectJourneyDay: loadJourney,
    completeReading,
    completeJourneyPart: async (dayNumber: number, part: "reading" | "quiz" | "word", xp?: number, result?: DailyChallengeResult) => {
      const safeUserId = userId || "anonymous";
      const safePlayerName = playerName || "visitante";
      setIsCompleting(true);
      try {
        const state = await withTimeout(
          completeJourneyPart(safeUserId, safePlayerName, dayNumber, part, xp, result, legacyUserId),
          LOAD_TIMEOUT_MS,
          "Journey part completion timeout"
        );
        setJourney(state);
        setFallbackNotice("");
        return state;
      } catch (error) {
        console.log("[App] Supabase failed, using fallback", error);
        const state = await localBibleJourneyService.completeJourneyPart(safeUserId, dayNumber, part, xp, result);
        setJourney(state);
        setFallbackNotice("Missão salva localmente. Vamos sincronizar quando possível.");
        return state;
      } finally {
        setIsCompleting(false);
      }
    }
  };
}
