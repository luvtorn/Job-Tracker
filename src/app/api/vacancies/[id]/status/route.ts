import { NextRequest, NextResponse } from "next/server";
import { vacancyService } from "@/server/services/vacancy-service";
import { updateVacancyStatusSchema } from "@/server/validators/vacancy-validator";
import { handleApiError } from "@/server/errors/application-error";
import { resourceIdSchema } from '@/server/validators/jobs-validator';
import { requireRecruiter } from '@/server/middleware/role-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = resourceIdSchema.parse((await params).id);
    const user = await requireRecruiter();

    const validated = updateVacancyStatusSchema.parse(await request.json());

    const updated = await vacancyService.changeVacancyStatus(user.id, id, validated.status);

    return NextResponse.json(
      {
        success: true,
        message: "Vacancy status updated",
        vacancy: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to update vacancy status");
  }
}
