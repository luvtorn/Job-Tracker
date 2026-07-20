import { NextRequest, NextResponse } from "next/server";
import { jobsService } from "@/server/services/jobs-service";
import { jobsQuerySchema } from "@/server/validators/jobs-validator";
import { handleApiError } from "@/server/errors/application-error";

export async function GET(request: NextRequest) {
  try {
    const input = jobsQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const result = await jobsService.list(input);

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch vacancies");
  }
}
