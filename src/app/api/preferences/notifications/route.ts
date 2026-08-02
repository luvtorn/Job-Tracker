import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRole } from '@/server/middleware/role-auth';
import { chatPreferencesService } from '@/server/services/chat-preferences-service';
import { chatNotificationPreferencesSchema } from '@/server/validators/chat-validator';

export async function GET() {
  try {
    const user = await requireRole('SEEKER', 'RECRUITER');
    const preferences = await chatPreferencesService.get(user.id);
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    return handleApiError(error, 'Failed to load notification preferences');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole('SEEKER', 'RECRUITER');
    const input = chatNotificationPreferencesSchema.parse(await request.json());
    const preferences = await chatPreferencesService.update(user.id, input.chatEmailNotifications);
    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    return handleApiError(error, 'Failed to update notification preferences');
  }
}
