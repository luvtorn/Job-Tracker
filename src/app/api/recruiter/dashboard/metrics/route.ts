import { NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { recruiterDashboardService } from "@/server/services/recruiter-dashboard-service";

export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can access this endpoint" },
        { status: 403 }
      );
    }

    const metrics = await recruiterDashboardService.getRecruiterMetrics(user.id);
    const vacancies = await recruiterDashboardService.getRecruiterVacanciesWithCandidates(user.id);
    const recentApplications = await recruiterDashboardService.getRecentApplications(user.id, 10);
    const candidatesByStage = await recruiterDashboardService.getCandidatesByStage(user.id);

    return NextResponse.json(
      {
        success: true,
        metrics,
        vacancies,
        recentApplications,
        candidatesByStage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch recruiter dashboard data:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
