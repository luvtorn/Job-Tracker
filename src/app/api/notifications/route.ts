import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';
import { notificationsQuerySchema } from '@/server/validators/notification-validator';
import { handleApiError } from '@/server/errors/application-error';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const query = notificationsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const [notifications, unreadCount] = await Promise.all([
      notificationService.getUserNotifications(user.id, query.limit, query.offset),
      notificationService.getUnreadCount(user.id),
    ]);
    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch notifications');
  }
}
