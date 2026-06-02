import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export function adminSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function adminError(error: string, status = 500, details?: unknown) {
  return NextResponse.json({ success: false, error, details }, { status });
}

export function requireAdminApi() {
  requireAdminSession();
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error("Supabase admin não configurado. Verifique SUPABASE_SERVICE_ROLE_KEY no servidor.");
  }
  return supabase;
}

export function getAdminErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro administrativo inesperado.";
  if (message === "Unauthorized") return adminError("Não autorizado.", 401);
  return adminError(message, 500);
}
