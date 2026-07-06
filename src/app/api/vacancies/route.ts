import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { vacancyService } from "@/server/services/vacancy-service";
import { z } from "zod";

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

const createVacancySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  position: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  currency: z.string().default("USD"),
});

export async function POST(request: Request) {
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
        { success: false, message: "Only recruiters can create vacancies" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = createVacancySchema.parse(body);

    const vacancy = await vacancyService.createVacancy(
      decoded.userId,
      data,
    );

    return NextResponse.json(
      {
        success: true,
        vacancy,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid request", errors: error.issues },
        { status: 400 },
      );
    }

    console.error("Failed to create vacancy:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
