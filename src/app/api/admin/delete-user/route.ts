import { adminSuccess, getAdminErrorResponse } from "@/lib/adminApi";
import { deleteAdminUser } from "@/lib/adminUserActions";
import type { AdminUserIdentityInput } from "@/lib/adminUserIdentity";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AdminUserIdentityInput;
    console.info("[Admin] Delete user", body);
    const resolved = await deleteAdminUser(body);
    return adminSuccess({ deleted: true, resolved });
  } catch (error) {
    return getAdminErrorResponse(error);
  }
}
