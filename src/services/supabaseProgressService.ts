import type { ChallengeId, DailyChallengeResult, UserProgress } from "@/types/dailyProgress";
import { supabaseClient } from "@/lib/supabaseClient";

export async function getUserProgress() {
  void supabaseClient;
  throw new Error("Supabase progress service is not implemented in this MVP.");
}

export async function saveUserProgress(_progress: UserProgress) {
  throw new Error("Supabase progress service is not implemented in this MVP.");
}

export async function updatePlayerName(_progress: UserProgress, _playerName: string) {
  throw new Error("Supabase progress service is not implemented in this MVP.");
}

export async function addXP(_progress: UserProgress, _xp: number) {
  throw new Error("Supabase progress service is not implemented in this MVP.");
}

export async function getWeeklyRanking() {
  throw new Error("Supabase progress service is not implemented in this MVP.");
}

export async function completeChallenge(
  _progress: UserProgress,
  _challengeId: ChallengeId,
  _result: DailyChallengeResult
) {
  throw new Error("Supabase progress service is not implemented in this MVP.");
}

export async function hasCompletedChallengeToday(_progress: UserProgress, _challengeId: ChallengeId) {
  throw new Error("Supabase progress service is not implemented in this MVP.");
}

export async function getTodayProgress(_progress: UserProgress) {
  throw new Error("Supabase progress service is not implemented in this MVP.");
}
