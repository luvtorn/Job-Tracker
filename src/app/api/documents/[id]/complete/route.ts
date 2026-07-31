import { NextResponse } from 'next/server';
import { forbidden, handleApiError } from '@/server/errors/application-error';
import { verifyAuth } from '@/server/middleware/auth';
import { documentService } from '@/server/services/document-service';
import { documentIdSchema } from '@/server/validators/document-validator';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      );
    }
    if (user.role !== 'SEEKER') throw forbidden('Only seekers can manage documents');
    const { id } = await params;
    const document = await documentService.completeUpload(
      user.id,
      documentIdSchema.parse(id),
    );
    return NextResponse.json({ success: true, document });
  } catch (error) {
    return handleApiError(error, 'Failed to complete document upload');
  }
}
