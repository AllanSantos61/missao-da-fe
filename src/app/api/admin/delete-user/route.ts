import { adminError, adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

async function deleteFromTable(table: string, column: string, value: string) {
  const supabase = requireAdminApi();
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error && error.code !== "42P01" && error.code !== "42703") throw error;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userId?: string };
    const userId = body.userId?.trim();
    if (!userId) return adminError("Informe o userId para apagar o usuário.", 400);

    console.info("[Admin] Delete user", { userId });
    const tables = ["profiles", "user_journey_progress", "user_journey_day_status", "daily_results", "public_results", "app_events"];
    for (const table of tables) {
      await deleteFromTable(table, "user_id", userId);
      await deleteFromTable(table, "local_user_id", userId);
    }

    return adminSuccess({ deleted: true });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
