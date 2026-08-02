import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRole } from '@/server/middleware/role-auth';
import { chatService } from '@/server/services/chat-service';
import { chatsQuerySchema } from '@/server/validators/chat-validator';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole('SEEKER', 'RECRUITER');
    const query = chatsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json({ success: true, ...(await chatService.listChats(user.id, query)) });
  } catch (error) {
    return handleApiError(error, 'Failed to list chats');
  }
}
