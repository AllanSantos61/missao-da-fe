import { adminSuccess, getAdminErrorResponse } from "@/lib/adminApi";
import { resetAdminUserProgress } from "@/lib/adminUserActions";
import type { AdminUserIdentityInput } from "@/lib/adminUserIdentity";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminUserIdentityInput;
    console.info("[Admin] Reset user progress", body);
    const resolved = await resetAdminUserProgress(body);
    return adminSuccess({ reset: true, resolved });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
