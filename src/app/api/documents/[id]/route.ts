import { NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { forbidden, handleApiError } from '@/server/errors/application-error';
import { documentService } from '@/server/services/document-service';
import { documentIdSchema } from '@/server/validators/document-validator';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SEEKER') throw forbidden('Only seekers can manage documents');
    const { id } = await params;
    await documentService.remove(user.id, documentIdSchema.parse(id));
    return NextResponse.json({ success: true, message: 'Document removed' });
  } catch (error) {
    return handleApiError(error, 'Failed to remove document');
  }
}
