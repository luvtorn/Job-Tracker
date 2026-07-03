import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { vacancyService } from "@/server/services/vacancy-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.decode(token) as { userId?: string; role?: string } | null;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (decoded.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can delete vacancies" },
        { status: 403 }
      );
    }

    const vacancyId = params.id;

    // Verify that the vacancy belongs to this recruiter
    const vacancy = await vacancyService.getVacancyById(vacancyId, decoded.userId);

    if (!vacancy) {
      return NextResponse.json(
        { success: false, message: "Vacancy not found" },
        { status: 404 }
      );
    }

    await vacancyService.deleteVacancy(vacancyId, decoded.userId);

    return NextResponse.json(
      {
        success: true,
        message: "Vacancy deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete vacancy:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
