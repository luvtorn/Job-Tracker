import { NextRequest, NextResponse } from "next/server";
import { vacancyService } from "@/server/services/vacancy-service";
import { verifyAuth } from "@/server/middleware/auth";
import { handleApiError } from "@/server/errors/application-error";
import { updateVacancySchema } from "@/server/validators/vacancy-validator";

async function getOwnedRecruiterVacancy(id: string) {
  const user = await verifyAuth();
  if (!user) {
    return { response: NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "RECRUITER") {
    return { response: NextResponse.json({ success: false, message: "Only recruiters can manage vacancies" }, { status: 403 }) };
  }

  const vacancy = await vacancyService.getVacancyById(id, user.id);
  if (!vacancy) {
    return { response: NextResponse.json({ success: false, message: "Vacancy not found" }, { status: 404 }) };
  }

  return { vacancy };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await getOwnedRecruiterVacancy(id);
    if ("response" in result) return result.response;
    return NextResponse.json({ success: true, vacancy: result.vacancy });
  } catch (error) {
    return handleApiError(error, "Failed to fetch vacancy");
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const result = await getOwnedRecruiterVacancy(id);
    if ("response" in result) return result.response;

    const data = updateVacancySchema.parse(await request.json());
    const vacancy = await vacancyService.updateVacancy(id, data);
    return NextResponse.json({ success: true, message: "Vacancy updated successfully", vacancy });
  } catch (error) {
    return handleApiError(error, "Failed to update vacancy");
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const result = await getOwnedRecruiterVacancy(id);
    if ("response" in result) return result.response;

    await vacancyService.deleteVacancy(id);

    return NextResponse.json(
      {
        success: true,
        message: "Vacancy deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, "Failed to delete vacancy");
  }
}
