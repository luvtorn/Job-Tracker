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

    const previousDate = application.interviewDate;
    const previousTime = application.interviewTime;

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

    // Check if date/time changed
    const newDateStr = new Date(validated.data.interviewDate).toISOString().split('T')[0];
    const prevDateStr = previousDate ? new Date(previousDate).toISOString().split('T')[0] : null;
    const dateChanged = newDateStr !== prevDateStr || validated.data.interviewTime !== previousTime;

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

    // Send notification if date/time changed
    if (dateChanged) {
      const newDateStr = new Date(validated.data.interviewDate).toLocaleDateString();
      const message = `Your interview has been rescheduled to ${newDateStr} at ${validated.data.interviewTime}`;

      try {
        const notification = await notificationService.createNotification({
          type: "INTERVIEW_SCHEDULED",
          userId: application.userId,
          title: "Interview Rescheduled",
          message,
          applicationId: application.id,
          vacancyId: application.vacancyId,
        });

        const unreadCount = await notificationService.getUnreadCount(application.userId);
        sseSubscriptionService.notifyUser(
          application.userId,
          notification,
          unreadCount
        );
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
      }
    }

    const interviewDateStr = new Date(validated.data.interviewDate).toLocaleDateString();
    const message = `Interview scheduled for ${interviewDateStr} at ${validated.data.interviewTime}`;

    try {
      const notification = await notificationService.createNotification({
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
        notification,
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
