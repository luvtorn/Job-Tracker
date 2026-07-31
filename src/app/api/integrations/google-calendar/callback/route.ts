import { NextRequest, NextResponse } from 'next/server';
import {
  clearGoogleCalendarOAuthCookie,
  getGoogleCalendarOAuthCookie,
} from '@/server/auth/google-calendar-oauth-cookies';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { googleCalendarConnectionService } from '@/server/services/google-calendar-connection-service';
import {
  createGoogleCalendarConnectionError,
  getGoogleCalendarConnectionErrorCode,
  googleCalendarOAuthService,
} from '@/server/services/google-calendar-oauth-service';
import { googleCalendarCallbackQuerySchema } from '@/server/validators/google-calendar-validator';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRecruiter();
    let query: ReturnType<typeof googleCalendarCallbackQuerySchema.parse>;
    try {
      query = googleCalendarCallbackQuerySchema.parse(
        Object.fromEntries(request.nextUrl.searchParams),
      );
    } catch {
      throw createGoogleCalendarConnectionError('invalid_callback');
    }
    const flowToken = getGoogleCalendarOAuthCookie(request);
    if (!flowToken) throw createGoogleCalendarConnectionError('session_expired');
    const flow = googleCalendarOAuthService.readFlow(flowToken);
    if (flow.userId !== user.id || flow.state !== query.state) {
      throw createGoogleCalendarConnectionError('state_mismatch');
    }
    if ('error' in query) {
      throw createGoogleCalendarConnectionError(
        query.error === 'access_denied' ? 'access_denied' : 'provider_error',
      );
    }
    const authorization = await googleCalendarOAuthService.exchange(query.code, flow.verifier);
    try {
      await googleCalendarConnectionService.connect(user.id, authorization);
    } catch {
      throw createGoogleCalendarConnectionError('connection_save_failed');
    }
    const response = NextResponse.redirect(new URL('/settings?calendarConnected=1', request.url));
    clearGoogleCalendarOAuthCookie(response);
    return response;
  } catch (error) {
    const code = getGoogleCalendarConnectionErrorCode(error);
    handleApiError(error, `Google Calendar callback failed [${code}]`);
    const errorUrl = new URL('/settings', request.url);
    errorUrl.searchParams.set('calendarError', code);
    const response = NextResponse.redirect(errorUrl);
    clearGoogleCalendarOAuthCookie(response);
    return response;
  }
}
