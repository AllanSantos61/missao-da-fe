import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type AdminUserRow = {
  user_id: string | null;
  player_name: string | null;
  total_xp: number | null;
  weekly_xp: number | null;
  current_streak: number | null;
  best_streak: number | null;
  created_at: string | null;
};

function normalizeUsers(rows: AdminUserRow[]) {
  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = row.user_id || row.player_name || row.created_at;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchUsersFromTable(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  table: "user_journey_progress" | "profiles",
  search?: string
) {
  let query = supabase
    .from(table)
    .select("user_id, player_name, total_xp, weekly_xp, current_streak, best_streak, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) query = query.ilike("player_name", `%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.info(`[Admin] Não foi possível listar usuários em ${table}.`, error.message);
    return [] as AdminUserRow[];
  }

  return (data ?? []) as AdminUserRow[];
}

export async function GET(request: Request) {
  try {
    requireAdminSession();
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ users: [] });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const [journeyUsers, profileUsers] = await Promise.all([
      fetchUsersFromTable(supabase, "user_journey_progress", search),
      fetchUsersFromTable(supabase, "profiles", search)
    ]);

    return NextResponse.json({
      users: normalizeUsers([...journeyUsers, ...profileUsers])
    });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
