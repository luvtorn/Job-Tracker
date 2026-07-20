import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { handleApiError } from '@/server/errors/application-error';
import { documentService } from '@/server/services/document-service';
import { documentIdSchema, documentDispositionSchema } from '@/server/validators/document-validator';
import { createContentDisposition } from '@/server/utils/content-disposition';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const disposition = documentDispositionSchema.parse(request.nextUrl.searchParams.get('disposition') ?? 'inline');
    const document = await documentService.getContent(user, documentIdSchema.parse(id));

    return new NextResponse(document.content, {
      headers: {
        'Content-Type': document.contentType,
        'Content-Disposition': createContentDisposition(disposition, document.filename),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleApiError(error, 'Failed to access document content');
  }
}
