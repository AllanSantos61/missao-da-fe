import { adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

type UserRouteContext = {
  params: {
    userId: string;
  };
};

export async function POST(_request: Request, { params }: UserRouteContext) {
  try {
    const supabase = requireAdminApi();
    const userId = decodeURIComponent(params.userId);
    console.info("[Admin] Reset user progress", { userId });
    const today = new Date().toISOString().slice(0, 10);

    for (const column of ["user_id", "local_user_id"] as const) {
      const deleteDays = await supabase.from("user_journey_day_status").delete().eq(column, userId);
      if (deleteDays.error) throw deleteDays.error;

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
      if (resetProgress.error) throw resetProgress.error;
    }

    return adminSuccess({ reset: true });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
