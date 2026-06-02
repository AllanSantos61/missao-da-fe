import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { getAdminDashboardData } from "@/services/adminDashboardService";

export async function GET() {
  try {
    requireAdminSession();
    const data = await getAdminDashboardData();
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }
}
