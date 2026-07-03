import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getUserByEmail } from "@/server/repositories/user-repository";

interface JWTPayload {
  email?: string;
}

export async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.decode(token) as JWTPayload | null;

    if (!decoded || !decoded.email) {
      return null;
    }

    const user = await getUserByEmail(decoded.email);

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}
