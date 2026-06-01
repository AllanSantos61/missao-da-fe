import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    requireAdminSession();
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ users: [] });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    let query = supabase
      .from("profiles")
      .select("user_id, player_name, total_xp, weekly_xp, current_streak, best_streak, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) query = query.ilike("player_name", `%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ users: [] });
    return NextResponse.json({ users: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
