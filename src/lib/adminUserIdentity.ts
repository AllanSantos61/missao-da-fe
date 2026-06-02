export type AdminUserIdentityInput = {
  profileId?: string | null;
  localUserId?: string | null;
  userId?: string | null;
};

export type AdminUserIdentity = {
  profileId: string | null;
  localUserId: string | null;
  userId: string | null;
  keyType: "profileId" | "localUserId" | "userId";
  key: string;
};

function clean(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveAdminUserKey(input: AdminUserIdentityInput): AdminUserIdentity {
  const profileId = clean(input.profileId);
  const localUserId = clean(input.localUserId);
  const userId = clean(input.userId);

  if (profileId) return { profileId, localUserId, userId, keyType: "profileId", key: profileId };
  if (localUserId) return { profileId, localUserId, userId, keyType: "localUserId", key: localUserId };
  if (userId) return { profileId, localUserId, userId, keyType: "userId", key: userId };

  throw new Error("Usuário sem identificador administrativo.");
}
