import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth } from "@/server/middleware/auth";
import { applicationService } from "@/server/services/application-service";
import { handleApiError } from "@/server/errors/application-error";

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  year: z.coerce.number().int().min(2000).max(2200).default(new Date().getFullYear()),
});

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (user.role !== "RECRUITER") return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    const { month, year } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const interviews = await applicationService.getRecruiterInterviews(user.id, month, year);
    return NextResponse.json({ success: true, interviews }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to fetch interviews");
  }
}
