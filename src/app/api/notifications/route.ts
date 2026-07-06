import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';
import { notificationsQuerySchema } from '@/server/validators/notification-validator';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const validation = notificationsQuerySchema.safeParse({
      limit,
      offset,
    });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid query parameters' },
        { status: 400 }
      );
    }

    const notifications = await notificationService.getUserNotifications(
      user.id,
      validation.data.limit,
      validation.data.offset
    );

    const total = await notificationService.getUnreadCount(user.id);

    return NextResponse.json(
      {
        success: true,
        notifications,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
