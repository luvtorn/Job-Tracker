import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { forbidden, handleApiError } from '@/server/errors/application-error';
import { documentService } from '@/server/services/document-service';
import { documentUploadIntentSchema } from '@/server/validators/document-validator';
import { enforceUploadRateLimit } from '@/server/security/request-security';

export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SEEKER') throw forbidden('Only seekers can manage documents');
    return NextResponse.json({ success: true, documents: await documentService.list(user.id) });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch documents');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SEEKER') throw forbidden('Only seekers can manage documents');
    await enforceUploadRateLimit(request, user.id);
    const input = documentUploadIntentSchema.parse(await request.json());
    const intent = await documentService.createUploadIntent(user.id, input);
    return NextResponse.json({ success: true, ...intent }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to upload document');
  }
}
