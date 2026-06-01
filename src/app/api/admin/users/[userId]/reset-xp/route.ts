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
      supabase.from("profiles").update({ total_xp: 0, weekly_xp: 0 }).eq("user_id", userId),
      supabase.from("user_journey_progress").update({ total_xp: 0, weekly_xp: 0 }).eq("user_id", userId),
      supabase.from("user_journey_day_status").update({ total_xp_earned: 0 }).eq("user_id", userId)
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
