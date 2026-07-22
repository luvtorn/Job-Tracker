import { NextRequest, NextResponse } from "next/server";
import { vacancyService } from "@/server/services/vacancy-service";
import { handleApiError } from "@/server/errors/application-error";
import { resourceIdSchema } from '@/server/validators/jobs-validator';
import { requireRecruiter } from '@/server/middleware/role-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRecruiter();

    const vacancyId = resourceIdSchema.parse((await params).id);

    const applications = await vacancyService.getCandidates(vacancyId, user.id);

    return NextResponse.json(
      {
        success: true,
        applications: applications.map((app) => ({
          id: app.id,
          status: app.status,
          createdAt: app.createdAt,
          interviewDate: app.interviewDate,
          interviewTime: app.interviewTime,
          interviewNotes: app.interviewNotes,
          user: app.user,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch candidates");
  }
}
