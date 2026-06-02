import { adminSuccess, getAdminErrorResponse } from "@/lib/adminApi";
import { resetAdminUserXp } from "@/lib/adminUserActions";
import type { AdminUserIdentityInput } from "@/lib/adminUserIdentity";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminUserIdentityInput;
    console.info("[Admin] Reset weekly ranking", body);
    const resolved = await resetAdminUserXp(body, true);
    return adminSuccess({ reset: "weekly", resolved });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
