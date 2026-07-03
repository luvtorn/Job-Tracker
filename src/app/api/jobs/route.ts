import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const location = searchParams.get("location");

    const skip = (page - 1) * limit;

    const where: any = {
      status: "PUBLISHED",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    const [vacancies, total] = await Promise.all([
      prisma.vacancy.findMany({
        where,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          description: true,
          requirements: true,
          position: true,
          salaryMin: true,
          salaryMax: true,
          currency: true,
          createdAt: true,
          publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.vacancy.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        vacancies,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch vacancies:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
