import { adminError, adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

type UserRouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: UserRouteContext) {
  try {
    const supabase = requireAdminApi();
    const userId = decodeURIComponent(params.id);
    if (!userId) return adminError("Informe o id do usuário.", 400);

    const [progress, days, profile] = await Promise.all([
      supabase.from("user_journey_progress").select("*").or(`user_id.eq.${userId},local_user_id.eq.${userId}`).limit(1),
      supabase.from("user_journey_day_status").select("*").or(`user_id.eq.${userId},local_user_id.eq.${userId}`).order("day_number", { ascending: true }),
      supabase.from("profiles").select("*").or(`user_id.eq.${userId},local_user_id.eq.${userId}`).limit(1)
    ]);

    if (progress.error) throw progress.error;
    if (days.error) throw days.error;
    if (profile.error) throw profile.error;

    return adminSuccess({
      user: progress.data?.[0] ?? profile.data?.[0] ?? null,
      profile: profile.data?.[0] ?? null,
      days: days.data ?? []
    });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: UserRouteContext) {
  try {
    const supabase = requireAdminApi();
    const userId = decodeURIComponent(params.id);
    if (!userId) return adminError("Informe o id do usuário.", 400);

    console.info("[Admin] Delete user", { userId });
    const tables = ["profiles", "user_journey_progress", "user_journey_day_status", "daily_results", "public_results", "app_events"];
    for (const table of tables) {
      for (const column of ["user_id", "local_user_id"] as const) {
        const { error } = await supabase.from(table).delete().eq(column, userId);
        if (error && error.code !== "42P01" && error.code !== "42703") throw error;
      }
    }

    return adminSuccess({ deleted: true });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
