import { createHash, randomBytes } from "crypto";

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateRefreshToken() {
  return randomBytes(32).toString("hex");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

type StoredRefreshSession<User> = {
  user: User;
  expiresAt: Date;
};

type RotateRefreshToken<User> = (
  currentHash: string,
  nextHash: string,
) => Promise<StoredRefreshSession<User> | null>;

export async function rotateRefreshSession<User>(
  refreshToken: string,
  rotateToken: RotateRefreshToken<User>,
) {
  const nextToken = generateRefreshToken();
  const session = await rotateToken(
    hashRefreshToken(refreshToken),
    hashRefreshToken(nextToken),
  );

  if (!session) return null;

  return {
    ...session,
    refreshToken: nextToken,
  };
}
