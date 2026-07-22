import { NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireAuthenticatedUser } from '@/server/middleware/role-auth';
import { notificationService } from '@/server/services/notification-service';

export async function GET() {
  try {
    const user = await requireAuthenticatedUser();
    const unreadCount = await notificationService.getUnreadCount(user.id);
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch unread count');
  }
}
