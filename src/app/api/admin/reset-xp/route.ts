import { adminError, adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

async function resetXpByColumn(column: "user_id" | "local_user_id", userId: string, weeklyOnly: boolean) {
  const supabase = requireAdminApi();
  const xpPayload = weeklyOnly ? { weekly_xp: 0 } : { total_xp: 0, weekly_xp: 0 };

  const profile = await supabase.from("profiles").update(xpPayload).eq(column, userId);
  if (profile.error && profile.error.code !== "42703") throw profile.error;

  const progress = await supabase.from("user_journey_progress").update(xpPayload).eq(column, userId);
  if (progress.error && progress.error.code !== "42703") throw progress.error;

  if (!weeklyOnly) {
    const days = await supabase.from("user_journey_day_status").update({ total_xp_earned: 0 }).eq(column, userId);
    if (days.error && days.error.code !== "42703") throw days.error;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId?: string; weeklyOnly?: boolean };
    const userId = body.userId?.trim();
    const weeklyOnly = body.weeklyOnly === true;
    if (!userId) return adminError("Informe o userId para resetar XP.", 400);

    console.info("[Admin] Reset XP", { userId, weeklyOnly });
    await resetXpByColumn("user_id", userId, weeklyOnly);
    await resetXpByColumn("local_user_id", userId, weeklyOnly);

    return adminSuccess({ reset: weeklyOnly ? "weekly" : "all" });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
