import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applicationService } from "@/server/services/application-service";
import { handleApiError } from "@/server/errors/application-error";
import { requireRecruiter } from '@/server/middleware/role-auth';

const querySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).default(new Date().getMonth() + 1),
  year: z.coerce.number().int().min(2000).max(2200).default(new Date().getFullYear()),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireRecruiter();
    const { month, year } = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const interviews = await applicationService.getRecruiterInterviews(user.id, month, year);
    return NextResponse.json({ success: true, interviews }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to fetch interviews");
  }
}
