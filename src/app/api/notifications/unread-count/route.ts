import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';

export async function GET(_request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const unreadCount = await notificationService.getUnreadCount(user.id);

    return NextResponse.json(
      {
        success: true,
        unreadCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
