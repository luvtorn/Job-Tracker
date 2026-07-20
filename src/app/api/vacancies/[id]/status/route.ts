import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { vacancyService } from "@/server/services/vacancy-service";
import { updateVacancyStatusSchema } from "@/server/validators/vacancy-validator";
import { handleApiError } from "@/server/errors/application-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can manage vacancies" },
        { status: 403 }
      );
    }

    const validated = updateVacancyStatusSchema.parse(await request.json());

    const vacancy = await vacancyService.getVacancyById(id, user.id);

    if (!vacancy) {
      return NextResponse.json(
        { success: false, message: "Vacancy not found" },
        { status: 404 }
      );
    }

    const updated = await vacancyService.changeVacancyStatus(vacancy, validated.status);

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
