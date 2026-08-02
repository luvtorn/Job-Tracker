import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRole } from '@/server/middleware/role-auth';
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { chatService } from '@/server/services/chat-service';
import { applicationIdSchema } from '@/server/validators/application-validator';
import { messagesQuerySchema, sendMessageSchema } from '@/server/validators/chat-validator';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = await requireRole('SEEKER', 'RECRUITER');
    const applicationId = applicationIdSchema.parse((await params).id);
    const query = messagesQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json({ success: true, thread: await chatService.getThread(user.id, applicationId, query) });
  } catch (error) {
    return handleApiError(error, 'Failed to load conversation');
  }
}

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const user = await requireRole('SEEKER', 'RECRUITER');
    await enforceAuthRateLimit(request, 'chat-message', user.id);
    const applicationId = applicationIdSchema.parse((await params).id);
    const input = sendMessageSchema.parse(await request.json());
    const result = await chatService.sendMessage(user.id, applicationId, input);
    return NextResponse.json({ success: true, ...result }, { status: result.created ? 201 : 200 });
  } catch (error) {
    return handleApiError(error, 'Failed to send message');
  }
}
