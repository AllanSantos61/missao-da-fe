"use client";

import { useCallback, useEffect, useState } from "react";
import { completeJourneyDay, completeJourneyPart, getJourneyDay } from "@/services/bibleJourneyService";
import { saveSyncDiagnostics } from "@/services/clientStorageSync";
import * as localBibleJourneyService from "@/services/localBibleJourneyService";
import type { CurrentReadingState } from "@/types/bibleJourney";
import type { DailyChallengeResult } from "@/types/dailyProgress";
import { getTodayKey } from "@/utils/dateUtils";

const LOAD_TIMEOUT_MS = 3000;
const SYNC_ERROR_VISIBLE_MS = 8000;

type SyncStatus = "ok" | "syncing" | "error" | "offline" | "unknown";

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

function createEmergencyJourneyState(playerName: string, dayNumber = 1): CurrentReadingState {
  const today = getTodayKey();
  const safeDay = Math.min(365, Math.max(1, Number.isFinite(dayNumber) ? Math.round(dayNumber) : 1));
  return {
    reading: {
      orderIndex: safeDay,
      testament: "novo_testamento",
      book: "Mateus",
      chapterStart: 1,
      verseStart: 1,
      chapterEnd: 1,
      verseEnd: null,
      reference: "Mateus 1",
      title: "Início da Jornada da Fé",
      content: null,
      estimatedMinutes: 10,
      xpReward: 40
    },
    selectedDay: safeDay,
    mission: {
      dayNumber: safeDay,
      title: "Início da Jornada da Fé",
      bibleReference: "Mateus 1",
      bibleBook: "Mateus",
      chapterStart: 1,
      verseStart: 1,
      chapterEnd: 1,
      verseEnd: null,
      estimatedMinutes: 10,
      faithWord: "Jesus",
      normalizedFaithWord: "JESUS",
      readingXp: 40,
      quizXp: 45,
      wordXp: 35,
      quizQuestions: [],
      source: "local"
    },
    progress: {
      playerName: playerName || "visitante",
      journeyStartDate: today,
      currentJourneyDay: 1,
      availableJourneyDay: 1,
      completedDays: [],
      missedDays: [1],
      availableDays: [1],
      lastAccessDate: today,
      lastCompletedDate: null,
      currentStreak: 0,
      bestStreak: 0,
      totalXp: 0,
      completedReadings: 0,
      totalReadings: 365,
      pendingCount: 1
    },
    calendar: Array.from({ length: 365 }, (_, index) => ({
      dayNumber: index + 1,
      status: index === 0 ? "available" : "locked",
      readingCompleted: false,
      quizCompleted: false,
      wordCompleted: false,
      wordAttemptsHistory: [],
      wordResult: null,
      wordAttempts: 0,
      xpEarned: 0,
      completedDate: null
    })),
    source: "local",
    notice: "Sua jornada foi iniciada localmente. Você pode continuar normalmente."
  };
}

function saveDiagnostics(state: CurrentReadingState, lastSyncAt: string | null, status: SyncStatus) {
  const syncedAt = state.source === "supabase" ? new Date().toISOString() : lastSyncAt;
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("unknown");
  const [syncErrorActive, setSyncErrorActive] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const clearSyncError = useCallback((reason: string, syncedAt?: string | null) => {
    console.log("[Sync] Limpando erro de sincronização", {
      reason,
      syncStatus: "ok",
      isOffline: !isOnline(),
      syncError: false,
      pendingSync: false,
      lastSyncAt: syncedAt ?? lastSyncAt
    });
    setSyncStatus(isOnline() ? "ok" : "offline");
    setSyncErrorActive(false);
    setPendingSync(false);
    setFallbackNotice("");
  }, [lastSyncAt]);

  const markSyncFailure = useCallback((reason: string, state?: CurrentReadingState | null, error?: unknown) => {
    const online = isOnline();
    const nextStatus: SyncStatus = online ? "error" : "offline";
    console.log("[Sync] Falha ativa de sincronização", {
      reason,
      error,
      syncStatus: nextStatus,
      isOffline: !online,
      syncError: online,
      pendingSync: online,
      lastSyncAt,
      source: state?.source ?? "desconhecida"
    });
    setSyncStatus(nextStatus);
    setSyncErrorActive(online);
    setPendingSync(online);
    setFallbackNotice(online ? "sync-error" : "");
  }, [lastSyncAt]);

  const applyState = useCallback((state: CurrentReadingState, options?: { syncFailed?: boolean; reason?: string; error?: unknown }) => {
    setJourney(state);

    if (state.source === "supabase") {
      const syncedAt = saveDiagnostics(state, lastSyncAt, "ok");
      if (syncedAt) setLastSyncAt(syncedAt);
      clearSyncError("dados carregados do banco com sucesso", syncedAt);
      console.log("[Sync] Fonte de dados exibida", {
        source: "banco",
        syncStatus: "ok",
        isOffline: !isOnline(),
        syncError: false,
        pendingSync: false,
        lastSyncAt: syncedAt,
        version: versionFromState(state)
      });
      return;
    }

    const status: SyncStatus = options?.syncFailed ? (isOnline() ? "error" : "offline") : isOnline() ? "ok" : "offline";
    const syncedAt = saveDiagnostics(state, lastSyncAt, status);
    if (options?.syncFailed) {
      markSyncFailure(options.reason ?? "fallback local após falha", state, options.error);
    } else {
      setSyncStatus(status);
      setSyncErrorActive(false);
      setPendingSync(false);
      setFallbackNotice("");
    }

    console.log("[Sync] Fonte de dados exibida", {
      source: "local",
      syncStatus: status,
      isOffline: !isOnline(),
      syncError: Boolean(options?.syncFailed && isOnline()),
      pendingSync: Boolean(options?.syncFailed && isOnline()),
      lastSyncAt: syncedAt,
      version: versionFromState(state),
      reason: options?.reason ?? "cache local sem erro ativo"
    });
  }, [clearSyncError, lastSyncAt, markSyncFailure]);

  const loadJourney = useCallback(async (dayNumber?: number) => {
    const safeUserId = userId || "anonymous";
    const safePlayerName = playerName || "visitante";
    setIsLoading(true);
    setSyncStatus(isOnline() ? "syncing" : "offline");
    setPendingSync(isOnline());
    console.log("[Sync] Iniciando busca da jornada", {
      syncStatus: isOnline() ? "syncing" : "offline",
      isOffline: !isOnline(),
      syncError: false,
      pendingSync: isOnline(),
      lastSyncAt,
      dayNumber
    });

    try {
      const state = await withTimeout(
        getJourneyDay(safeUserId, safePlayerName, dayNumber, legacyUserId),
        LOAD_TIMEOUT_MS,
        "Journey loading timeout"
      );
      applyState(state);
    } catch (error) {
      let fallbackState: CurrentReadingState;
      try {
        fallbackState = await localBibleJourneyService.getJourneyDay(safeUserId, dayNumber);
      } catch (localError) {
        console.log("[App] Local journey fallback failed; creating emergency Day 1 state", localError);
        fallbackState = createEmergencyJourneyState(safePlayerName, dayNumber ?? 1);
      }
      applyState(fallbackState, {
        syncFailed: true,
        reason: "falha ao buscar jornada no banco",
        error
      });
    } finally {
      setIsLoading(false);
    }
  }, [applyState, lastSyncAt, legacyUserId, playerName, userId]);

  useEffect(() => {
    void loadJourney();
  }, [loadJourney]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleOnline() {
      console.log("[Sync] Navegador online; tentando ressincronizar", {
        syncStatus,
        isOffline: false,
        syncError: syncErrorActive,
        pendingSync,
        lastSyncAt
      });
      if (journey?.source === "supabase") {
        clearSyncError("navegador online e fonte atual já é banco");
        return;
      }
      void loadJourney(journey?.selectedDay);
    }

    function handleOffline() {
      console.log("[Sync] Navegador offline", {
        syncStatus: "offline",
        isOffline: true,
        syncError: false,
        pendingSync: false,
        lastSyncAt
      });
      setSyncStatus("offline");
      setSyncErrorActive(false);
      setPendingSync(false);
      setFallbackNotice("");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [clearSyncError, journey?.selectedDay, journey?.source, lastSyncAt, loadJourney, pendingSync, syncErrorActive, syncStatus]);

  useEffect(() => {
    if (journey?.source === "supabase" && isOnline()) {
      clearSyncError("estado atual veio do banco");
    }
  }, [clearSyncError, journey?.source]);

  useEffect(() => {
    if (!syncErrorActive) return;
    const timeout = window.setTimeout(() => {
      clearSyncError("erro ativo expirou sem nova falha");
    }, SYNC_ERROR_VISIBLE_MS);
    return () => window.clearTimeout(timeout);
  }, [clearSyncError, syncErrorActive]);

  const completeReading = useCallback(async (dayNumber?: number) => {
    const safeUserId = userId || "anonymous";
    const safePlayerName = playerName || "visitante";
    const targetDay = dayNumber ?? journey?.selectedDay ?? 1;
    setIsCompleting(true);
    setSyncStatus(isOnline() ? "syncing" : "offline");
    setPendingSync(isOnline());
    saveSyncDiagnostics({
      source: journey?.source === "supabase" ? "Banco" : "Local",
      lastSyncAt,
      status: "syncing",
      localVersion: journey ? versionFromState(journey) : "pendente",
      remoteVersion: journey?.source === "supabase" ? versionFromState(journey) : "pendente"
    });

    try {
      const state = await withTimeout(
        completeJourneyDay(safeUserId, safePlayerName, targetDay, legacyUserId),
        LOAD_TIMEOUT_MS,
        "Journey completion timeout"
      );
      applyState(state);
      return state;
    } catch (error) {
      const state = await localBibleJourneyService.completeJourneyDay(safeUserId, targetDay);
      applyState(state, {
        syncFailed: true,
        reason: "falha ao salvar leitura no banco",
        error
      });
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
    setPendingSync(isOnline());
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
      const state = await localBibleJourneyService.completeJourneyPart(safeUserId, dayNumber, part, xp, result);
      applyState(state, {
        syncFailed: true,
        reason: `falha ao salvar etapa ${part} no banco`,
        error
      });
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
    syncErrorActive,
    pendingSync,
    lastSyncAt,
    reloadJourney: loadJourney,
    selectJourneyDay: loadJourney,
    completeReading,
    completeJourneyPart: completeJourneyPartHandler
  };
}
