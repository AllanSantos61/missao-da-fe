import { adminError, adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

async function resetByColumn(column: "user_id" | "local_user_id", userId: string) {
  const supabase = requireAdminApi();
  const today = new Date().toISOString().slice(0, 10);

  const deleteDays = await supabase.from("user_journey_day_status").delete().eq(column, userId);
  if (deleteDays.error && deleteDays.error.code !== "42703") throw deleteDays.error;

  const resetProgress = await supabase
    .from("user_journey_progress")
    .update({
      journey_start_date: today,
      current_journey_day: 1,
      highest_unlocked_day: 1,
      completed_days: 0,
      current_streak: 0,
      last_completed_date: null,
      last_access_date: today,
      updated_at: new Date().toISOString()
    })
    .eq(column, userId);
  if (resetProgress.error && resetProgress.error.code !== "42703") throw resetProgress.error;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId?: string };
    const userId = body.userId?.trim();
    if (!userId) return adminError("Informe o userId para resetar o progresso.", 400);

    console.info("[Admin] Reset user progress", { userId });
    await resetByColumn("user_id", userId);
    await resetByColumn("local_user_id", userId);

    return adminSuccess({ reset: true });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
