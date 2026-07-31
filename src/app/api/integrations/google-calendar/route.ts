import { NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { googleCalendarConnectionService } from '@/server/services/google-calendar-connection-service';

export async function GET() {
  try {
    const user = await requireRecruiter();
    return NextResponse.json(await googleCalendarConnectionService.status(user.id));
  } catch (error) {
    return handleApiError(error, 'Failed to get Google Calendar status');
  }
}

export async function DELETE() {
  try {
    const user = await requireRecruiter();
    await googleCalendarConnectionService.disconnect(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'Failed to disconnect Google Calendar');
  }
}
