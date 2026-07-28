import { cookies } from "next/headers";
import { getUserById } from "@/server/repositories/user-repository";
import { verifyAccessToken } from "@/server/services/access-token-service";

export async function verifyAuth(options: { allowUnverified?: boolean } = {}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return null;
    }

    const decoded = verifyAccessToken(token);

    if (!decoded.userId) {
      return null;
    }

    const user = await getUserById(decoded.userId);

    if (!user || user.deletedAt || (!options.allowUnverified && !user.emailVerified)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
