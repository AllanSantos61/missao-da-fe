import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type UserRouteContext = {
  params: {
    userId: string;
  };
};

export async function POST(_request: Request, { params }: UserRouteContext) {
  try {
    requireAdminSession();
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 500 });

    const userId = decodeURIComponent(params.userId);
    await Promise.all([
      supabase.from("user_journey_day_status").delete().eq("user_id", userId),
      supabase
        .from("user_journey_progress")
        .update({
          journey_start_date: new Date().toISOString().slice(0, 10),
          current_journey_day: 1,
          highest_unlocked_day: 1,
          completed_days: 0,
          current_streak: 0,
          best_streak: 0,
          last_completed_date: null,
          last_access_date: null
        })
        .eq("user_id", userId)
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
