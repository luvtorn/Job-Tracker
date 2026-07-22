import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/server/services/auth-service";
import { setAuthCookies } from "@/server/auth/auth-cookies";
import { handleApiError, unauthorized } from "@/server/errors/application-error";
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'refresh');
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
