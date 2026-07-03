import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/server/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { vacancyId } = await request.json();

    if (!vacancyId) {
      return NextResponse.json(
        { success: false, message: "Vacancy ID is required" },
        { status: 400 }
      );
    }

    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!vacancy || vacancy.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, message: "Vacancy not found" },
        { status: 404 }
      );
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_vacancyId: {
          userId: user.id,
          vacancyId,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: "You have already applied for this position" },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        vacancyId,
        status: "APPLIED",
      },
    });

    return NextResponse.json(
      { success: true, message: "Application submitted successfully", application },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create application:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const applications = await prisma.application.findMany({
      where: { userId: user.id },
      include: {
        vacancy: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { success: true, applications },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
