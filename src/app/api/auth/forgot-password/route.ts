import { NextRequest, NextResponse } from 'next/server';
import { getRequestLocale } from '@/i18n/server';
import { authService } from '@/server/services/auth-service';
import { emailSchema } from '@/server/validators/auth-validator';
import { handleApiError } from '@/server/errors/application-error';
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'forgot-password');
    const { email } = emailSchema.parse(await request.json());
    await authService.requestPasswordReset(email, await getRequestLocale());
    return NextResponse.json({
      success: true,
      message: 'If the account exists, a reset email has been sent',
    });
  } catch (error) {
    return handleApiError(error, 'Failed to request password reset');
  }
}
