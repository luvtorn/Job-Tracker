import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';
import { sseSubscriptionService } from '@/server/services/sse-subscription-service';
import { notificationIdSchema, updateNotificationSchema } from '@/server/validators/notification-validator';
import { handleApiError } from '@/server/errors/application-error';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    updateNotificationSchema.parse(await request.json());
    const id = notificationIdSchema.parse((await params).id);
    await notificationService.markAsRead(user.id, id);
    const unreadCount = await notificationService.getUnreadCount(user.id);
    sseSubscriptionService.sendUnreadCount(user.id, unreadCount);
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return handleApiError(error, 'Failed to update notification');
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const id = notificationIdSchema.parse((await params).id);
    await notificationService.deleteNotification(user.id, id);
    const unreadCount = await notificationService.getUnreadCount(user.id);
    sseSubscriptionService.sendUnreadCount(user.id, unreadCount);
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return handleApiError(error, 'Failed to delete notification');
  }
}
