import { NextResponse } from "next/server";
import { vacancyService } from "@/server/services/vacancy-service";
import { createVacancySchema, vacanciesQuerySchema } from "@/server/validators/vacancy-validator";
import { verifyAuth } from "@/server/middleware/auth";
import { handleApiError } from "@/server/errors/application-error";

export async function GET(request: Request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can view vacancies" },
        { status: 403 },
      );
    }

    const filters = vacanciesQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const vacancies = await vacancyService.getVacanciesByRecruiter(user.id, filters);

    return NextResponse.json(
      {
        success: true,
        vacancies,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch vacancies");
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can create vacancies" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = createVacancySchema.parse(body);

    const vacancy = await vacancyService.createVacancy(
      user.id,
      data,
    );

    return NextResponse.json(
      {
        success: true,
        vacancy,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Failed to create vacancy");
  }
}
