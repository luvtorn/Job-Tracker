import { NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRole } from '@/server/middleware/role-auth';
import { chatService } from '@/server/services/chat-service';

export async function GET() {
  try {
    const user = await requireRole('SEEKER', 'RECRUITER');
    return NextResponse.json({ success: true, unreadCount: await chatService.getUnreadCount(user.id) });
  } catch (error) {
    return handleApiError(error, 'Failed to load chat unread count');
  }
}
