import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/server/errors/application-error';
import { requireSeeker } from '@/server/middleware/seeker-auth';
import { applicationService } from '@/server/services/application-service';
import { applicationWorkflowService } from '@/server/services/application-workflow-service';
import { applicationQuerySchema, createApplicationSchema } from '@/server/validators/application-validator';

export async function POST(request: NextRequest) {
  try {
    const user = await requireSeeker();
    const { vacancyId } = createApplicationSchema.parse(await request.json());
    const application = await applicationWorkflowService.create(user, vacancyId);
    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to create application');
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireSeeker();
    const { status } = applicationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const applications = await applicationService.list(user.id, status);
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    return handleApiError(error, 'Failed to fetch applications');
  }
}
