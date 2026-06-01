import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { setAdminSessionCookie } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const { username, password } = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json({ error: "Informe usuário e senha." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin não configurado." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("username, password_hash")
    .eq("username", username)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: "Não foi possível validar o acesso." }, { status: 500 });
  }

  const admin = data?.[0] as { username: string; password_hash: string } | undefined;
  const valid = admin ? await bcrypt.compare(password, admin.password_hash) : false;

  if (!admin || !valid) {
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }

  setAdminSessionCookie(admin.username);
  return NextResponse.json({ ok: true });
}
