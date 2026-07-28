import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/server/validators/auth-validator";
import { authService } from "@/server/services/auth-service";
import { handleApiError } from "@/server/errors/application-error";
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { setAuthCookies } from '@/server/auth/auth-cookies';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'register');
    const result = await authService.register(registerSchema.parse(await request.json()));
    const response = NextResponse.json(
      { success: true, message: "Account created successfully", user: result.user },
      { status: 201 },
    );
    setAuthCookies(response, result.tokens);
    return response;
  } catch (error) {
    return handleApiError(error, "Failed to register user");
  }
}
