import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/services/auth-service';
import { authTokenSchema } from '@/server/validators/auth-validator';
import { handleApiError } from '@/server/errors/application-error';
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    enforceAuthRateLimit(request, 'verify-email');
    const { token } = authTokenSchema.parse(await request.json());
    const user = await authService.verifyEmail(token);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return handleApiError(error, 'Failed to verify email');
  }
}
