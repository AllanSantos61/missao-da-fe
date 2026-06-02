"use client";

import { useCallback, useEffect, useState } from "react";
import { completeJourneyDay, completeJourneyPart, getJourneyDay } from "@/services/bibleJourneyService";
import { saveSyncDiagnostics } from "@/services/clientStorageSync";
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

function isOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

function versionFromState(state: CurrentReadingState) {
  return `${state.progress.completedReadings}/${state.progress.totalReadings}:xp-${state.progress.totalXp}:day-${state.progress.currentJourneyDay}`;
}

function recordSync(state: CurrentReadingState, lastSyncAt: string | null, statusOverride?: "ok" | "error" | "offline") {
  const syncedAt = state.source === "supabase" ? new Date().toISOString() : lastSyncAt;
  const status = statusOverride ?? (state.source === "supabase" ? "ok" : isOnline() ? "error" : "offline");
  saveSyncDiagnostics({
    source: state.source === "supabase" ? "Banco" : "Local",
    lastSyncAt: syncedAt,
    status,
    localVersion: versionFromState(state),
    remoteVersion: state.source === "supabase" ? versionFromState(state) : "indisponível"
  });
  return syncedAt;
}

export function useBibleJourney(userId: string, playerName: string, legacyUserId?: string) {
  const [journey, setJourney] = useState<CurrentReadingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [syncStatus, setSyncStatus] = useState<"ok" | "syncing" | "error" | "offline" | "unknown">("unknown");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const applyState = useCallback((state: CurrentReadingState, forceStatus?: "ok" | "error" | "offline") => {
    setJourney(state);
    const syncedAt = recordSync(state, lastSyncAt, forceStatus);
    if (syncedAt) setLastSyncAt(syncedAt);

    if (state.source === "supabase") {
      setSyncStatus("ok");
      setFallbackNotice("");
      console.log("[Sync] Sincronização concluída", {
        source: "banco",
        status: "ok",
        selectedDay: state.selectedDay,
        version: versionFromState(state)
      });
    } else {
      const nextStatus = isOnline() ? "error" : "offline";
      setSyncStatus(nextStatus);
      setFallbackNotice(nextStatus === "error" ? "sync-error" : "");
      console.log("[Sync] Usando fonte local", {
        source: "local",
        status: nextStatus,
        selectedDay: state.selectedDay,
        version: versionFromState(state)
      });
    }
  }, [lastSyncAt]);

  const loadJourney = useCallback(async (dayNumber?: number) => {
    const safeUserId = userId || "anonymous";
    const safePlayerName = playerName || "visitante";
    setIsLoading(true);
    setSyncStatus(isOnline() ? "syncing" : "offline");
    console.log("[App] Loading started");
    try {
      const state = await withTimeout(
        getJourneyDay(safeUserId, safePlayerName, dayNumber, legacyUserId),
        LOAD_TIMEOUT_MS,
        "Journey loading timeout"
      );
      applyState(state);
    } catch (error) {
      console.log("[Sync] Banco indisponível; carregando cache local", {
        error,
        userId: safeUserId,
        dayNumber,
        online: isOnline()
      });
      const fallbackState = await localBibleJourneyService.getJourneyDay(safeUserId, dayNumber);
      applyState(fallbackState, isOnline() ? "error" : "offline");
    } finally {
      setIsLoading(false);
      console.log("[App] Loading finished");
    }
  }, [applyState, legacyUserId, playerName, userId]);

  useEffect(() => {
    loadJourney();
  }, [loadJourney]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleOnline() {
      console.log("[Sync] Navegador online; tentando ressincronizar");
      if (journey?.source === "supabase") {
        setSyncStatus("ok");
        setFallbackNotice("");
        return;
      }
      void loadJourney(journey?.selectedDay);
    }

    function handleOffline() {
      console.log("[Sync] Navegador offline");
      setSyncStatus("offline");
      setFallbackNotice("");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [journey?.selectedDay, journey?.source, loadJourney]);

  useEffect(() => {
    if (journey?.source === "supabase" && isOnline()) {
      console.log("[Sync] Fonte atual é banco; limpando erro de sincronização preso");
      setSyncStatus("ok");
      setFallbackNotice("");
    }
  }, [journey?.source]);

  const completeReading = useCallback(async (dayNumber?: number) => {
    const safeUserId = userId || "anonymous";
    const safePlayerName = playerName || "visitante";
    setIsCompleting(true);
    setSyncStatus(isOnline() ? "syncing" : "offline");
    saveSyncDiagnostics({
      source: journey?.source === "supabase" ? "Banco" : "Local",
      lastSyncAt,
      status: "syncing",
      localVersion: journey ? versionFromState(journey) : "pendente",
      remoteVersion: journey?.source === "supabase" ? versionFromState(journey) : "pendente"
    });
    try {
      const state = await withTimeout(
        completeJourneyDay(safeUserId, safePlayerName, dayNumber ?? journey?.selectedDay ?? 1, legacyUserId),
        LOAD_TIMEOUT_MS,
        "Journey completion timeout"
      );
      applyState(state);
      return state;
    } catch (error) {
      console.log("[Sync] Falha ao concluir leitura no banco; usando cache local", {
        error,
        userId: safeUserId,
        dayNumber: dayNumber ?? journey?.selectedDay ?? 1,
        online: isOnline()
      });
      const state = await localBibleJourneyService.completeJourneyDay(safeUserId, dayNumber ?? journey?.selectedDay ?? 1);
      applyState(state, isOnline() ? "error" : "offline");
      return state;
    } finally {
      setIsCompleting(false);
    }
  }, [applyState, journey, lastSyncAt, legacyUserId, playerName, userId]);

  const completeJourneyPartHandler = useCallback(async (
    dayNumber: number,
    part: "reading" | "quiz" | "word",
    xp?: number,
    result?: DailyChallengeResult
  ) => {
    const safeUserId = userId || "anonymous";
    const safePlayerName = playerName || "visitante";
    setIsCompleting(true);
    setSyncStatus(isOnline() ? "syncing" : "offline");
    saveSyncDiagnostics({
      source: journey?.source === "supabase" ? "Banco" : "Local",
      lastSyncAt,
      status: "syncing",
      localVersion: journey ? versionFromState(journey) : "pendente",
      remoteVersion: journey?.source === "supabase" ? versionFromState(journey) : "pendente"
    });
    try {
      const state = await withTimeout(
        completeJourneyPart(safeUserId, safePlayerName, dayNumber, part, xp, result, legacyUserId),
        LOAD_TIMEOUT_MS,
        "Journey part completion timeout"
      );
      applyState(state);
      return state;
    } catch (error) {
      console.log("[Sync] Falha ao concluir etapa no banco; usando cache local", {
        error,
        userId: safeUserId,
        dayNumber,
        part,
        online: isOnline()
      });
      const state = await localBibleJourneyService.completeJourneyPart(safeUserId, dayNumber, part, xp, result);
      applyState(state, isOnline() ? "error" : "offline");
      return state;
    } finally {
      setIsCompleting(false);
    }
  }, [applyState, journey, lastSyncAt, legacyUserId, playerName, userId]);

  return {
    journey,
    isLoading,
    isCompleting,
    fallbackNotice,
    syncStatus,
    reloadJourney: loadJourney,
    selectJourneyDay: loadJourney,
    completeReading,
    completeJourneyPart: completeJourneyPartHandler
  };
}
