import jwt from "jsonwebtoken";
import { env } from "@/server/config/env";

export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: "SEEKER" | "RECRUITER" | "ADMIN";
};

export function verifyAccessToken(token: string, secret = env.jwtSecret): AccessTokenPayload {
  const payload = jwt.verify(token, secret);
  if (
    typeof payload === "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    !["SEEKER", "RECRUITER", "ADMIN"].includes(String(payload.role))
  ) {
    throw new Error("Invalid access token payload");
  }
  return { userId: payload.userId, email: payload.email, role: payload.role as AccessTokenPayload["role"] };
}
