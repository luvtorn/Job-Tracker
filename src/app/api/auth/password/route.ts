import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, setAuthCookies } from '@/server/auth/auth-cookies';
import { handleApiError, unauthorized } from '@/server/errors/application-error';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { getSessionMetadata } from '@/server/security/session-metadata';
import { authService } from '@/server/services/auth-service';
import { changePasswordSchema } from '@/server/validators/auth-validator';

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser();
    await enforceAuthRateLimit(request, 'change-password', user.id);
    const refreshToken = (await cookies()).get('refreshToken')?.value;
    if (!refreshToken) throw unauthorized('Invalid session');
    const input = changePasswordSchema.parse(await request.json());
    const result = await authService.changePassword(
      user.id,
      input,
      refreshToken,
      getSessionMetadata(request),
    );
    const response = NextResponse.json({ success: true, user: result.user });
    setAuthCookies(response, result.tokens);
    return response;
  } catch (error) {
    const response = handleApiError(error, 'Failed to change password');
    if (response.status === 401) clearAuthCookies(response);
    return response;
  }
}
