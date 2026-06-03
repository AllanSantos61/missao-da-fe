"use client";

import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";
import type { UserProgress } from "@/types/dailyProgress";

export type CurrentUserIdentity = {
  identityType: "auth" | "visitor";
  primaryUserId: string;
  localUserId: string;
  authUserId: string | null;
  email: string | null;
  playerName: string;
};

export function getCurrentUserIdentity(progress: UserProgress, user?: User | null): CurrentUserIdentity {
  const localUserId = progress.localUserId || progress.anonymousUserId;
  const authUserId = user?.id ?? null;
  return {
    identityType: authUserId ? "auth" : "visitor",
    primaryUserId: authUserId ?? localUserId,
    localUserId,
    authUserId,
    email: user?.email ?? null,
    playerName: progress.playerName || "visitante"
  };
}

export async function getCurrentAuthUser() {
  if (!supabaseClient) return null;
  const { data, error } = await supabaseClient.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabaseClient) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error) throw error;
  return data.user;
}

export async function registerWithEmail(email: string, password: string) {
  if (!supabaseClient) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabaseClient.auth.signUp({
    email: email.trim(),
    password
  });
  if (error) throw error;
  return data.user;
}

export async function sendPasswordReset(email: string) {
  if (!supabaseClient) throw new Error("Supabase não está configurado.");
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (!supabaseClient) throw new Error("Supabase não está configurado.");
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
}

async function updateByLocalUserId(table: string, localUserId: string, payload: Record<string, unknown>) {
  if (!supabaseClient || !localUserId) return;
  const { error } = await supabaseClient.from(table).update(payload).eq("local_user_id", localUserId);
  if (error) console.info(`[Auth] Não foi possível vincular ${table}.`, error);
}

export async function linkExistingProgressToAuth(progress: UserProgress, user: User | null) {
  if (!supabaseClient || !user) return;
  const localUserId = progress.localUserId || progress.anonymousUserId;
  const payload = {
    auth_user_id: user.id,
    local_user_id: localUserId,
    user_id: user.id,
    player_name: progress.playerName || "visitante",
    email: user.email ?? null
  };

  await supabaseClient
    .from("profiles")
    .upsert(
      {
        ...payload,
        total_xp: progress.totalXP,
        weekly_xp: progress.weeklyXP,
        current_streak: progress.currentStreak,
        best_streak: progress.bestStreak
      },
      { onConflict: "auth_user_id" }
    )
    .then(({ error }) => {
      if (error) console.info("[Auth] Não foi possível vincular profile.", error);
    });

  await Promise.all([
    updateByLocalUserId("user_journey_progress", localUserId, payload),
    updateByLocalUserId("user_journey_day_status", localUserId, payload),
    updateByLocalUserId("daily_results", localUserId, payload),
    updateByLocalUserId("public_results", localUserId, payload)
  ]);
}
