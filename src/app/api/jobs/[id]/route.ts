import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vacancy = await prisma.vacancy.findUnique({
      where: { id },
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
        status: true,
      },
    });

    if (!vacancy || vacancy.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, message: "Vacancy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, vacancy },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch vacancy:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
