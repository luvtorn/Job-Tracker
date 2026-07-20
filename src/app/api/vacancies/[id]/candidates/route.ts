import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { vacancyService } from "@/server/services/vacancy-service";
import { handleApiError } from "@/server/errors/application-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: vacancyId } = await params;

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
