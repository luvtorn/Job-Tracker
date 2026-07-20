import { NextResponse } from 'next/server';
import { verifyAuth } from '@/server/middleware/auth';
import { forbidden, handleApiError } from '@/server/errors/application-error';
import { applicationService } from '@/server/services/application-service';
import { documentIdSchema } from '@/server/validators/document-validator';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'RECRUITER') throw forbidden('Only recruiters can view candidate profiles');
    const { id } = await params;
    const application = await applicationService.getCandidateProfile(user.id, documentIdSchema.parse(id));
    return NextResponse.json({ success: true, application });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch candidate profile');
  }
}
