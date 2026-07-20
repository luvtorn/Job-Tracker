import { NextRequest, NextResponse } from "next/server";
import { jobsService } from "@/server/services/jobs-service";
import { resourceIdSchema } from "@/server/validators/jobs-validator";
import { handleApiError } from "@/server/errors/application-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vacancy = await jobsService.getById(resourceIdSchema.parse((await params).id));

    return NextResponse.json(
      { success: true, vacancy },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch vacancy");
  }
}
