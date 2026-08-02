import { NextRequest, NextResponse } from 'next/server';
import { clearOAuthRegistrationCookie, getOAuthRegistrationCookie } from '@/server/auth/oauth-cookies';
import { setAuthCookies } from '@/server/auth/auth-cookies';
import { handleApiError, unauthorized } from '@/server/errors/application-error';
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { authService } from '@/server/services/auth-service';
import { oauthService } from '@/server/services/oauth-service';
import { completeOAuthRegistrationSchema } from '@/server/validators/auth-validator';
import { getSessionMetadata } from '@/server/security/session-metadata';

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRateLimit(request, 'oauth-registration');
    const intentToken = getOAuthRegistrationCookie(request);
    if (!intentToken) throw unauthorized('OAuth registration expired');
    const identity = oauthService.readRegistrationIntent(intentToken);
    const input = completeOAuthRegistrationSchema.parse(await request.json());
    const result = await authService.completeOAuthRegistration(
      identity,
      input,
      getSessionMetadata(request),
    );
    const response = NextResponse.json({ success: true, user: result.user }, { status: 201 });
    clearOAuthRegistrationCookie(response);
    setAuthCookies(response, result.tokens);
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to complete OAuth registration');
  }
}
