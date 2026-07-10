import { NextRequest, NextResponse } from "next/server";
import { vacancyService } from "@/server/services/vacancy-service";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token !== process.env.ADMIN_API_KEY) {
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
    console.error("Failed to cleanup vacancies:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
