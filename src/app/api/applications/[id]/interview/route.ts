import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { scheduleInterviewSchema } from "@/server/validators/vacancy-validator";
import { applicationService } from "@/server/services/application-service";
import { notificationService } from "@/server/services/notification-service";
import { sseSubscriptionService } from "@/server/services/sse-subscription-service";
import { handleApiError } from "@/server/errors/application-error";
import { cancelInterviewSchema } from "@/server/validators/application-validator";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const data = scheduleInterviewSchema.parse(await request.json());
    const { application, wasScheduled } = await applicationService.scheduleInterview(user.id, (await params).id, data);

    const date = new Date(`${data.interviewDate}T00:00:00`).toLocaleDateString();
    const title = wasScheduled ? "Interview Rescheduled" : "Interview Scheduled";
    const message = wasScheduled
      ? `Your interview for "${application.vacancy.title}" at ${application.vacancy.company} has been rescheduled to ${date} at ${data.interviewTime}`
      : `Interview for "${application.vacancy.title}" at ${application.vacancy.company} scheduled for ${date} at ${data.interviewTime}`;
    try {
      const notification = await notificationService.createNotification({
        type: "INTERVIEW_SCHEDULED",
        userId: application.userId,
        title,
        message,
        metadata: {
          kind: 'INTERVIEW_SCHEDULED',
          vacancyTitle: application.vacancy.title,
          company: application.vacancy.company,
          interviewDate: data.interviewDate,
          interviewTime: data.interviewTime,
          rescheduled: wasScheduled,
        },
        applicationId: application.id,
        vacancyId: application.vacancyId,
      });
      const unreadCount = await notificationService.getUnreadCount(application.userId);
      sseSubscriptionService.notifyUser(application.userId, notification, unreadCount);
    } catch (error) {
      console.error("Failed to create interview notification", error);
    }

    return NextResponse.json({ success: true, message: "Interview scheduled successfully", application }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to schedule interview");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const data = cancelInterviewSchema.parse(await request.json());
    const application = await applicationService.cancelInterview(user.id, (await params).id, data.nextStatus);
    return NextResponse.json({ success: true, application }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to cancel interview");
  }
}
