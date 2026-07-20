import { cookies } from "next/headers";
import { getUserById } from "@/server/repositories/user-repository";
import { verifyAccessToken } from "@/server/services/access-token-service";

export async function verifyAuth() {
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

    if (!user || user.deletedAt) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}
