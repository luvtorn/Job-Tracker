import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/server/middleware/auth";
import { scheduleInterviewSchema } from "@/server/validators/vacancy-validator";
import { notificationService } from "@/server/services/notification-service";
import { sseSubscriptionService } from "@/server/services/sse-subscription-service";
import { calendarEventService } from "@/server/services/calendar-event-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyAuth();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = scheduleInterviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { vacancy: true, user: true },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    if (application.vacancy.recruiterId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        interviewDate: new Date(validated.data.interviewDate),
        interviewTime: validated.data.interviewTime,
        interviewNotes: validated.data.interviewNotes || null,
      },
      include: { vacancy: true, user: true },
    });

    const candidateName = `${updated.user.firstName} ${updated.user.lastName}`;
    const vacancyTitle = updated.vacancy.title;

    try {
      await calendarEventService.createInterviewEvent(
        application.vacancy.recruiterId,
        id,
        candidateName,
        vacancyTitle,
        new Date(validated.data.interviewDate),
        validated.data.interviewTime,
        validated.data.interviewNotes
      );
    } catch (calendarError) {
      console.error("Failed to create calendar event:", calendarError);
    }

    const interviewDateStr = new Date(validated.data.interviewDate).toLocaleDateString();
    const message = `Interview scheduled for ${interviewDateStr} at ${validated.data.interviewTime}`;

    try {
      await notificationService.createNotification({
        type: "INTERVIEW_SCHEDULED",
        userId: application.userId,
        title: "Interview Scheduled",
        message,
        applicationId: application.id,
        vacancyId: application.vacancyId,
      });

      const unreadCount = await notificationService.getUnreadCount(application.userId);
      sseSubscriptionService.notifyUser(
        application.userId,
        {
          id: "",
          type: "INTERVIEW_SCHEDULED",
          title: "Interview Scheduled",
          message,
          isRead: false,
          userId: application.userId,
          applicationId: application.id,
          vacancyId: application.vacancyId,
          createdAt: new Date(),
        } as any,
        unreadCount
      );
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Interview scheduled successfully",
        application: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to schedule interview:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
