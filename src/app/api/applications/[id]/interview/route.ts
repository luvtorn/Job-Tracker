import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireRecruiter } from '@/server/middleware/role-auth';
import { applicationService } from '@/server/services/application-service';
import { applicationWorkflowService } from '@/server/services/application-workflow-service';
import { applicationIdSchema, cancelInterviewSchema } from '@/server/validators/application-validator';
import { scheduleInterviewSchema } from '@/server/validators/vacancy-validator';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const user = await requireRecruiter();
    const applicationId = applicationIdSchema.parse((await params).id);
    const data = scheduleInterviewSchema.parse(await request.json());
    const application = await applicationWorkflowService.scheduleInterview(user.id, applicationId, data);
    return NextResponse.json({ success: true, application });
  } catch (error) {
    return handleApiError(error, 'Failed to schedule interview');
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await requireRecruiter();
    const applicationId = applicationIdSchema.parse((await params).id);
    const { nextStatus } = cancelInterviewSchema.parse(await request.json());
    const application = await applicationService.cancelInterview(user.id, applicationId, nextStatus);
    return NextResponse.json({ success: true, application });
  } catch (error) {
    return handleApiError(error, 'Failed to cancel interview');
  }
}
