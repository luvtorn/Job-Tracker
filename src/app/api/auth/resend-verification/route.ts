import { NextRequest, NextResponse } from 'next/server';
import { getRequestLocale } from '@/i18n/server';
import { authService } from '@/server/services/auth-service';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { handleApiError } from '@/server/errors/application-error';
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'resend-verification');
    const user = await requireAuthenticatedUser({ allowUnverified: true });
    const result = await authService.resendVerification(user.id, await getRequestLocale());
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return handleApiError(error, 'Failed to resend verification email');
  }
}
