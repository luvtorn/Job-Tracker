import { NextResponse } from "next/server";
import { vacancyService } from "@/server/services/vacancy-service";
import { createVacancySchema, vacanciesQuerySchema } from "@/server/validators/vacancy-validator";
import { handleApiError } from "@/server/errors/application-error";
import { requireRecruiter } from '@/server/middleware/role-auth';

export async function GET(request: Request) {
  try {
    const user = await requireRecruiter();

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
    const user = await requireRecruiter();

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
