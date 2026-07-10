import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { vacancyService } from "@/server/services/vacancy-service";
import { updateVacancyStatusSchema } from "@/server/validators/vacancy-validator";

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

    const body = await request.json();
    const validated = updateVacancyStatusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    const vacancy = await vacancyService.getVacancyById(id, user.id);

    if (!vacancy) {
      return NextResponse.json(
        { success: false, message: "Vacancy not found" },
        { status: 404 }
      );
    }

    let updated;

    if (validated.data.status === "ARCHIVED") {
      updated = await vacancyService.archiveVacancy(id);
    } else if (validated.data.status === "CLOSED") {
      updated = await vacancyService.closeVacancy(id);
    } else if (validated.data.status === "PUBLISHED") {
      if (vacancy.archivedAt) {
        updated = await vacancyService.reactivateVacancy(id);
      } else {
        updated = vacancy;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Vacancy status updated",
        vacancy: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update vacancy status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
