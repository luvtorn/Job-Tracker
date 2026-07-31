import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { googleCalendarSyncService } from '@/server/services/google-calendar-sync-service';
import { retryCalendarSyncSchema } from '@/server/validators/google-calendar-validator';
import { enforceAuthRateLimit } from '@/server/security/request-security';

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRateLimit(request, 'google-calendar-sync-retry');
    const user = await requireRecruiter();
    const { eventId } = retryCalendarSyncSchema.parse(await request.json());
    await googleCalendarSyncService.retryEvent(user.id, eventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to retry Google Calendar sync');
  }
}
