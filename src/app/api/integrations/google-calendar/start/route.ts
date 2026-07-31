import { NextResponse } from 'next/server';
import { setGoogleCalendarOAuthCookie } from '@/server/auth/google-calendar-oauth-cookies';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { googleCalendarOAuthService } from '@/server/services/google-calendar-oauth-service';

export async function GET(request: Request) {
  try {
    await enforceAuthRateLimit(request, 'google-calendar-connect');
    const user = await requireRecruiter();
    const authorization = googleCalendarOAuthService.createAuthorization(user.id);
    const response = NextResponse.redirect(authorization.url);
    setGoogleCalendarOAuthCookie(response, authorization.flowToken);
    return response;
  } catch (error) {
    return handleApiError(error, 'Failed to start Google Calendar authorization');
  }
}
