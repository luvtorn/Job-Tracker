import { NextRequest, NextResponse } from "next/server";
import { vacancyService } from "@/server/services/vacancy-service";
import { timingSafeEqual } from "crypto";
import { env } from "@/server/config/env";
import { handleApiError } from '@/server/errors/application-error';

export async function POST(request: NextRequest) {
  try {
    let adminApiKey: string;
    try {
      adminApiKey = env.adminApiKey;
    } catch {
      return NextResponse.json(
        { success: false, message: "Admin cleanup is not configured" },
        { status: 503 },
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const provided = Buffer.from(token);
    const expected = Buffer.from(adminApiKey);

    if (!token || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const deleted = await vacancyService.deleteExpiredVacancies();

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${deleted} expired vacancies`,
        deletedCount: deleted,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to cleanup vacancies');
  }
}
