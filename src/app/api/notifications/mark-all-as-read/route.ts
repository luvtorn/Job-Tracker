import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { notificationService } from '@/server/services/notification-service';

export async function PATCH(_request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await notificationService.markAllAsRead(user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'All notifications marked as read',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
