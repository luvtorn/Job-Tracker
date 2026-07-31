import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/server/services/auth-service";
import { clearAuthCookies } from "@/server/auth/auth-cookies";
import { handleApiError } from "@/server/errors/application-error";

export async function POST() {
  const refreshToken = (await cookies()).get("refreshToken")?.value;
  try {
    await authService.logout(refreshToken);
  } catch (error) {
    handleApiError(error, "Session revocation failed during logout");
  }
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  clearAuthCookies(response);
  return response;
}
