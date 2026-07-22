import { NextResponse } from "next/server";
import { seekerStatisticsService } from "@/server/services/seeker-statistics-service";
import { handleApiError } from "@/server/errors/application-error";
import { requireSeeker } from '@/server/middleware/seeker-auth';

export async function GET() {
  try {
    const user = await requireSeeker();
    const statistics = await seekerStatisticsService.getStatistics(user.id);
    return NextResponse.json({ success: true, ...statistics }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to fetch application statistics");
  }
}
