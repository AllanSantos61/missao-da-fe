import { adminSuccess, getAdminErrorResponse, requireAdminApi } from "@/lib/adminApi";

const TEST_PATTERNS = ["%teste%", "%test%", "%admin_test%", "%demo%"];

async function deleteTestRows(table: string) {
  const supabase = requireAdminApi();
  let deleted = 0;

  for (const pattern of TEST_PATTERNS) {
    for (const column of ["player_name", "user_id", "local_user_id"] as const) {
      const { count, error } = await supabase.from(table).delete({ count: "exact" }).ilike(column, pattern);
      if (error && error.code !== "42P01" && error.code !== "42703") throw error;
      deleted += count ?? 0;
    }
  }

  return deleted;
}

export async function POST() {
  try {
    console.info("[Admin] Clear test data");
    const tables = ["profiles", "user_journey_progress", "user_journey_day_status", "daily_results", "public_results", "app_events"];
    const result: Record<string, number> = {};

    for (const table of tables) {
      result[table] = await deleteTestRows(table);
    }

    return adminSuccess({ cleared: true, tables: result });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
