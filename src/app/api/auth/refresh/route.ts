import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/server/services/auth-service";
import { setAuthCookies } from "@/server/auth/auth-cookies";
import { handleApiError, unauthorized } from "@/server/errors/application-error";

export async function POST() {
  try {
    const refreshToken = (await cookies()).get("refreshToken")?.value;
    if (!refreshToken) throw unauthorized("Invalid session");
    const result = await authService.refresh(refreshToken);
    const response = NextResponse.json({ success: true, user: result.user });
    setAuthCookies(response, result.tokens);
    return response;
  } catch (error) {
    return handleApiError(error, "Failed to refresh session");
  }
}
