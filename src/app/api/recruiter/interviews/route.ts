import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/server/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();

    if (!user || user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const applications = await prisma.application.findMany({
      where: {
        vacancy: {
          recruiterId: user.id,
        },
        status: "INTERVIEWING",
        interviewDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        vacancy: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        interviewDate: "asc",
      },
    });

    const interviews = applications.map((app) => ({
      id: app.id,
      candidateName: `${app.user.firstName} ${app.user.lastName}`,
      candidateEmail: app.user.email,
      candidateAvatar: app.user.avatarUrl,
      vacancyTitle: app.vacancy.title,
      vacancyId: app.vacancy.id,
      interviewDate: app.interviewDate?.toISOString().split("T")[0] || "",
      interviewTime: app.interviewTime || "",
      interviewNotes: app.interviewNotes,
      status: app.status,
    }));

    return NextResponse.json(
      { success: true, interviews },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
