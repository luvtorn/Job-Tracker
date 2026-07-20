import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/server/middleware/auth";
import { recruiterStatisticsService } from "@/server/services/recruiter-statistics-service";

const periodSchema = z.enum(["30", "90", "all"]);

export async function GET(request: NextRequest) {
  const user = await verifyAuth();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "RECRUITER") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const validation = periodSchema.safeParse(request.nextUrl.searchParams.get("period") ?? "30");
  if (!validation.success) {
    return NextResponse.json({ success: false, message: "Invalid period" }, { status: 400 });
  }

  try {
    const statistics = await recruiterStatisticsService.getStatistics(user.id, validation.data);
    return NextResponse.json({ success: true, ...statistics });
  } catch (error) {
    console.error("Failed to fetch recruiter statistics:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
