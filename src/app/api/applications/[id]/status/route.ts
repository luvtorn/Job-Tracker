import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/server/middleware/auth";
import { updateApplicationStatusSchema } from "@/server/validators/application-validator";
import { notificationService } from "@/server/services/notification-service";
import { sseSubscriptionService } from "@/server/services/sse-subscription-service";
import { calendarEventService } from "@/server/services/calendar-event-service";
import { calendarEventRepository } from "@/server/repositories/calendar-event-repository";

const statusMessages: Record<string, string> = {
  INTERVIEWING: "Your application has been moved to the interviewing stage",
  REJECTED: "Your application has been rejected",
  OFFER: "You've received an offer!",
  ACCEPTED: "Your application has been accepted",
  WITHDRAWN: "Your application has been withdrawn",
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;
    const body = await request.json();

    const validation = updateApplicationStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status",
        },
        { status: 400 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { vacancy: true },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    if (application.vacancy.recruiterId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: validation.data.status },
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
      },
    });

    const statusMessage = statusMessages[validation.data.status] || `Your application status has been updated to ${validation.data.status}`;

    // Handle calendar event when status changes to/from INTERVIEWING
    if (validation.data.status === 'INTERVIEWING' && application.interviewDate) {
      // Status changed to INTERVIEWING - create calendar event
      try {
        const candidateName = `${updatedApplication.user.firstName} ${updatedApplication.user.lastName}`.trim();
        await calendarEventService.createInterviewEvent(
          application.vacancy.recruiterId,
          applicationId,
          candidateName,
          application.vacancy.title,
          application.interviewDate,
          application.interviewTime || '10:00',
          application.interviewNotes || undefined
        );
      } catch (calendarError) {
        console.error('Failed to create calendar event:', calendarError);
      }
    } else if (application.status === 'INTERVIEWING' && validation.data.status !== 'INTERVIEWING') {
      // Status changed from INTERVIEWING to something else - delete calendar event
      try {
        const existingEvent = await calendarEventRepository.findByApplicationId(applicationId);
        if (existingEvent) {
          await calendarEventRepository.deleteById(existingEvent.id, application.vacancy.recruiterId);
        }
      } catch (calendarError) {
        console.error('Failed to delete calendar event:', calendarError);
      }
    }

    try {
      const notification = await notificationService.createNotification({
        type: "APPLICATION_STATUS_CHANGED",
        userId: application.userId,
        title: `Application Status: ${validation.data.status}`,
        message: statusMessage,
        applicationId: application.id,
        vacancyId: application.vacancyId,
      });

      const unreadCount = await notificationService.getUnreadCount(application.userId);
      sseSubscriptionService.notifyUser(application.userId, notification, unreadCount);
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Application status updated",
        application: updatedApplication,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update application status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
