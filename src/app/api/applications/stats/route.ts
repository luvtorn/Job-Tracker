import { NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { seekerStatisticsService } from "@/server/services/seeker-statistics-service";
import { handleApiError } from "@/server/errors/application-error";

export async function GET() {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const statistics = await seekerStatisticsService.getStatistics(user.id);
    return NextResponse.json({ success: true, ...statistics }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to fetch application statistics");
  }
}
