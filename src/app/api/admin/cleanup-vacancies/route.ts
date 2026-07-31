import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { env } from "@/server/config/env";
import { handleApiError } from '@/server/errors/application-error';
import { enforceAuthRateLimit } from '@/server/security/request-security';
import { maintenanceService } from '@/server/services/maintenance-service';

export async function POST(request: NextRequest) {
  try {
    await enforceAuthRateLimit(request, 'admin-cleanup');
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

    const deleted = await maintenanceService.cleanupExpiredData();

    return NextResponse.json(
      {
        success: true,
        message: "Expired data cleanup completed",
        deletedCount: deleted.vacancies + deleted.documentUploads,
        deleted,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to cleanup vacancies');
  }
}
