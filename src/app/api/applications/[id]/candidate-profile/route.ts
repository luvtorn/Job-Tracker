import { NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { applicationService } from '@/server/services/application-service';
import { applicationIdSchema } from '@/server/validators/application-validator';
import { requireRecruiter } from '@/server/middleware/role-auth';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRecruiter();
    const applicationId = applicationIdSchema.parse((await params).id);
    const application = await applicationService.getCandidateProfile(user.id, applicationId);
    return NextResponse.json({ success: true, application });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch candidate profile');
  }
}
