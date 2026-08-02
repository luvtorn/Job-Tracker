import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRole } from '@/server/middleware/role-auth';
import { chatService } from '@/server/services/chat-service';
import { applicationIdSchema } from '@/server/validators/application-validator';
import { markMessagesReadSchema } from '@/server/validators/chat-validator';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await requireRole('SEEKER', 'RECRUITER');
    const applicationId = applicationIdSchema.parse((await params).id);
    const { lastMessageId } = markMessagesReadSchema.parse(await request.json());
    const unreadCount = await chatService.markRead(user.id, applicationId, lastMessageId);
    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    return handleApiError(error, 'Failed to mark conversation as read');
  }
}
