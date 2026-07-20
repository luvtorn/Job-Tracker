import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { forbidden, badRequest, handleApiError } from '@/server/errors/application-error';
import { documentService } from '@/server/services/document-service';
import { documentTypeSchema } from '@/server/validators/document-validator';

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
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) throw badRequest('No file provided');
    const type = documentTypeSchema.parse(formData.get('type'));
    const document = await documentService.upload(user.id, type, file);
    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to upload document');
  }
}
