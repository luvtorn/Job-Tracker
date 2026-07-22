import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/server/validators/auth-validator";
import { authService } from "@/server/services/auth-service";
import { handleApiError } from "@/server/errors/application-error";
import { setAuthCookies } from "@/server/auth/auth-cookies";
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'login');
    const result = await authService.login(loginSchema.parse(await request.json()));
    const response = NextResponse.json(
      { success: true, message: "Login successful", user: result.user },
      { status: 200 },
    );
    setAuthCookies(response, result.tokens);
    return response;
  } catch (error) {
    return handleApiError(error, "Failed to log in");
  }
}
