import { requireAdminApi } from "@/lib/adminApi";
import { AdminUserIdentityInput, resolveAdminUserKey } from "@/lib/adminUserIdentity";

const RELATED_TABLES = ["daily_results", "user_journey_progress", "user_journey_day_status", "app_events", "public_results"] as const;

async function deleteWhere(table: string, column: string, value: string) {
  const supabase = requireAdminApi();
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error && error.code !== "42P01" && error.code !== "42703") throw error;
}

async function updateWhere(table: string, column: string, value: string, payload: Record<string, unknown>) {
  const supabase = requireAdminApi();
  const { error } = await supabase.from(table).update(payload).eq(column, value);
  if (error && error.code !== "42P01" && error.code !== "42703") throw error;
}

async function updateRelated(identity: AdminUserIdentityInput, table: string, payload: Record<string, unknown>) {
  const resolved = resolveAdminUserKey(identity);
  if (resolved.localUserId) {
    await updateWhere(table, "local_user_id", resolved.localUserId, payload);
    return;
  }
  if (resolved.userId) {
    await updateWhere(table, "user_id", resolved.userId, payload);
  }
}

async function deleteRelated(identity: AdminUserIdentityInput, table: string) {
  const resolved = resolveAdminUserKey(identity);
  if (resolved.localUserId) {
    await deleteWhere(table, "local_user_id", resolved.localUserId);
    return;
  }
  if (resolved.userId) {
    await deleteWhere(table, "user_id", resolved.userId);
  }
}

export async function deleteAdminUser(identity: AdminUserIdentityInput) {
  const supabase = requireAdminApi();
  const resolved = resolveAdminUserKey(identity);

  if (resolved.localUserId) {
    await deleteWhere("profiles", "local_user_id", resolved.localUserId);
    for (const table of RELATED_TABLES) await deleteRelated(resolved, table);
    return resolved;
  }

  if (resolved.userId) {
    await deleteWhere("profiles", "user_id", resolved.userId);
    for (const table of RELATED_TABLES) await deleteRelated(resolved, table);
    return resolved;
  }

  if (resolved.profileId) {
    const { error } = await supabase.from("profiles").delete().eq("id", resolved.profileId);
    if (error) throw error;
  }

  return resolved;
}

export async function resetAdminUserXp(identity: AdminUserIdentityInput, weeklyOnly = false) {
  const supabase = requireAdminApi();
  const resolved = resolveAdminUserKey(identity);
  const xpPayload = weeklyOnly ? { weekly_xp: 0 } : { total_xp: 0, weekly_xp: 0 };

  if (resolved.profileId) {
    const profileById = await supabase.from("profiles").update(xpPayload).eq("id", resolved.profileId);
    if (profileById.error && profileById.error.code !== "42703") throw profileById.error;
  } else if (resolved.localUserId) {
    await updateWhere("profiles", "local_user_id", resolved.localUserId, xpPayload);
  } else if (resolved.userId) {
    await updateWhere("profiles", "user_id", resolved.userId, xpPayload);
  }

  await updateRelated(resolved, "user_journey_progress", xpPayload);
  if (!weeklyOnly) {
    await updateRelated(resolved, "daily_results", { xp_earned: 0 });
    await updateRelated(resolved, "user_journey_day_status", { total_xp_earned: 0 });
  }

  return resolved;
}

export async function resetAdminUserProgress(identity: AdminUserIdentityInput) {
  const resolved = resolveAdminUserKey(identity);
  const today = new Date().toISOString().slice(0, 10);

  await deleteRelated(resolved, "user_journey_day_status");
  await deleteRelated(resolved, "daily_results");
  await updateRelated(resolved, "user_journey_progress", {
    journey_start_date: today,
    current_journey_day: 1,
    highest_unlocked_day: 1,
    completed_days: 0,
    current_streak: 0,
    best_streak: 0,
    last_completed_date: null,
    last_access_date: today,
    total_xp: 0,
    weekly_xp: 0,
    updated_at: new Date().toISOString()
  });

  if (resolved.profileId || resolved.localUserId || resolved.userId) {
    await resetAdminUserXp(resolved, false);
  }

  return resolved;
}
