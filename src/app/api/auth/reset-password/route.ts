import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/server/auth/auth-cookies';
import { authService } from '@/server/services/auth-service';
import { resetPasswordSchema } from '@/server/validators/auth-validator';
import { handleApiError } from '@/server/errors/application-error';
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'reset-password');
    const { token, password } = resetPasswordSchema.parse(await request.json());
    await authService.resetPassword(token, password);
    const response = NextResponse.json({ success: true });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to reset password');
  }
}
