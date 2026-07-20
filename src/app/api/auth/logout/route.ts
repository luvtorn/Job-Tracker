import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/server/services/auth-service";
import { clearAuthCookies } from "@/server/auth/auth-cookies";
import { handleApiError } from "@/server/errors/application-error";

export async function POST() {
  try {
    const refreshToken = (await cookies()).get("refreshToken")?.value;
    await authService.logout(refreshToken);
    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return handleApiError(error, "Failed to log out");
  }
}
