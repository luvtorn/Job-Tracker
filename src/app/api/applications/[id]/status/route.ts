import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { applicationWorkflowService } from '@/server/services/application-workflow-service';
import { applicationIdSchema, updateApplicationStatusSchema } from '@/server/validators/application-validator';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await requireRecruiter();
    const applicationId = applicationIdSchema.parse((await params).id);
    const { status } = updateApplicationStatusSchema.parse(await request.json());
    const application = await applicationWorkflowService.updateStatus(user.id, applicationId, status);
    return NextResponse.json({ success: true, application });
  } catch (error) {
    return handleApiError(error, 'Failed to update application status');
  }
}
