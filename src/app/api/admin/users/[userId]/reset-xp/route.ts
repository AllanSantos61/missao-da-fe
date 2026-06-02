import { adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

type UserRouteContext = {
  params: {
    userId: string;
  };
};

export async function POST(request: Request, { params }: UserRouteContext) {
  try {
    const supabase = requireAdminApi();
    const userId = decodeURIComponent(params.userId);
    const { searchParams } = new URL(request.url);
    const weeklyOnly = searchParams.get("weeklyOnly") === "true";
    console.info("[Admin] Reset XP", { userId, weeklyOnly });
    const xpPayload = weeklyOnly ? { weekly_xp: 0 } : { total_xp: 0, weekly_xp: 0 };

    for (const column of ["user_id", "local_user_id"] as const) {
      const profile = await supabase.from("profiles").update(xpPayload).eq(column, userId);
      if (profile.error) throw profile.error;
      const progress = await supabase.from("user_journey_progress").update(xpPayload).eq(column, userId);
      if (progress.error) throw progress.error;
      if (!weeklyOnly) {
        const days = await supabase.from("user_journey_day_status").update({ total_xp_earned: 0 }).eq(column, userId);
        if (days.error) throw days.error;
      }
    }

    return adminSuccess({ reset: weeklyOnly ? "weekly" : "all" });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
