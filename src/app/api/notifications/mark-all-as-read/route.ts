import { NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';
import { sseSubscriptionService } from '@/server/services/sse-subscription-service';
import { handleApiError } from '@/server/errors/application-error';

export async function PATCH() {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    await notificationService.markAllAsRead(user.id);
    sseSubscriptionService.sendUnreadCount(user.id, 0);
    return NextResponse.json({ success: true, unreadCount: 0 });
  } catch (error) {
    return handleApiError(error, 'Failed to mark all notifications as read');
  }
}
