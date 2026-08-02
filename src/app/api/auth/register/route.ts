import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/server/validators/auth-validator";
import { authService } from "@/server/services/auth-service";
import { handleApiError } from "@/server/errors/application-error";
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { setAuthCookies } from '@/server/auth/auth-cookies';
import { getRequestLocale } from '@/i18n/server';
import { getSessionMetadata } from '@/server/security/session-metadata';

export async function POST(request: NextRequest) {
  try {
    const input = registerSchema.parse(await request.json());
    await enforceAuthRateLimit(request, 'register', input.email);
    const result = await authService.register(
      input,
      await getRequestLocale(),
      getSessionMetadata(request),
    );
    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: result.user,
        emailSent: result.emailSent,
      },
      { status: 201 },
    );
    setAuthCookies(response, result.tokens);
    return response;
  } catch (error) {
    return handleApiError(error, "Failed to register user");
  }
}
