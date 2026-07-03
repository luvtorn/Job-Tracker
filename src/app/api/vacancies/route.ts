import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { vacancyService } from "@/server/services/vacancy-service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.decode(token) as {
      userId?: string;
      role?: string;
    } | null;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 },
      );
    }

    if (decoded.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Only recruiters can view vacancies" },
        { status: 403 },
      );
    }

    const vacancies = await vacancyService.getVacanciesByRecruiter(
      decoded.userId,
    );

    return NextResponse.json(
      {
        success: true,
        vacancies,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch vacancies:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
