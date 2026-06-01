import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const allowedTables = {
  journey: "journey_days",
  questions: "journey_quiz_questions"
} as const;

export async function GET(request: Request) {
  try {
    requireAdminSession();
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ rows: [] });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") === "questions" ? "questions" : "journey";
    const day = Number(searchParams.get("day") ?? "1");

    const table = allowedTables[type];
    const query = supabase
      .from(table)
      .select("*")
      .eq("day_number", Number.isFinite(day) ? day : 1)
      .order(type === "questions" ? "question_order" : "day_number", { ascending: true })
      .limit(10);

    const { data, error } = await query;
    if (error) return NextResponse.json({ rows: [] });
    return NextResponse.json({ rows: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    requireAdminSession();
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 500 });

    const body = (await request.json()) as {
      type?: "journey" | "questions";
      id?: string;
      values?: Record<string, unknown>;
    };
    const type = body.type === "questions" ? "questions" : "journey";
    if (!body.id || !body.values) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    const allowedFields =
      type === "journey"
        ? ["title", "bible_reference", "faith_word", "normalized_faith_word", "estimated_minutes"]
        : ["question", "option_a", "option_b", "option_c", "correct_option", "explanation"];
    const values = Object.fromEntries(Object.entries(body.values).filter(([key]) => allowedFields.includes(key)));

    const { error } = await supabase.from(allowedTables[type]).update(values).eq("id", body.id);
    if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
}
