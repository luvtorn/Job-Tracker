import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/server/middleware/auth";
import { notificationService } from "@/server/services/notification-service";
import { sseSubscriptionService } from "@/server/services/sse-subscription-service";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { vacancyId } = await request.json();

    if (!vacancyId) {
      return NextResponse.json(
        { success: false, message: "Vacancy ID is required" },
        { status: 400 },
      );
    }

    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!vacancy || vacancy.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, message: "Vacancy not found" },
        { status: 404 },
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
        {
          success: false,
          message: "You have already applied for this position",
        },
        { status: 400 },
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        vacancyId,
        status: "APPLIED",
      },
    });

    try {
      await notificationService.createNotification({
        type: "NEW_APPLICATION",
        userId: vacancy.recruiterId,
        title: "New Application",
        message: `You received a new application for "${vacancy.title}" position`,
        applicationId: application.id,
        vacancyId: vacancy.id,
      });

      const unreadCount = await notificationService.getUnreadCount(vacancy.recruiterId);
      sseSubscriptionService.notifyUser(vacancy.recruiterId, {
        id: '',
        type: "NEW_APPLICATION",
        title: "New Application",
        message: `You received a new application for "${vacancy.title}" position`,
        isRead: false,
        userId: vacancy.recruiterId,
        applicationId: application.id,
        vacancyId: vacancy.id,
        createdAt: new Date(),
      } as any, unreadCount);
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        application,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create application:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    type ApplicationWhere = { userId: string; status?: string };
    const where: ApplicationWhere = { userId: user.id };
    if (status) {
      where.status = status as any;
    }

    const applications = await prisma.application.findMany({
      where: where as any,
      include: {
        vacancy: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            position: true,
            salaryMin: true,
            salaryMax: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, applications }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
