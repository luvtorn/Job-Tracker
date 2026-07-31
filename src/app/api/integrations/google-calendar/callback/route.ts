import { NextRequest, NextResponse } from 'next/server';
import {
  clearGoogleCalendarOAuthCookie,
  getGoogleCalendarOAuthCookie,
} from '@/server/auth/google-calendar-oauth-cookies';
import { handleApiError, unauthorized } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { googleCalendarConnectionService } from '@/server/services/google-calendar-connection-service';
import { googleCalendarOAuthService } from '@/server/services/google-calendar-oauth-service';
import { googleCalendarCallbackQuerySchema } from '@/server/validators/google-calendar-validator';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRecruiter();
    const query = googleCalendarCallbackQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const flowToken = getGoogleCalendarOAuthCookie(request);
    if (!flowToken) throw unauthorized('Google Calendar session expired');
    const flow = googleCalendarOAuthService.readFlow(flowToken);
    if (flow.userId !== user.id || flow.state !== query.state) {
      throw unauthorized('Invalid Google Calendar state');
    }
    const authorization = await googleCalendarOAuthService.exchange(query.code, flow.verifier);
    await googleCalendarConnectionService.connect(user.id, authorization);
    const response = NextResponse.redirect(new URL('/settings?calendarConnected=1', request.url));
    clearGoogleCalendarOAuthCookie(response);
    return response;
  } catch (error) {
    handleApiError(error, 'Google Calendar callback failed');
    const response = NextResponse.redirect(new URL('/settings?calendarError=1', request.url));
    clearGoogleCalendarOAuthCookie(response);
    return response;
  }
}
