import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { updateApplicationStatusSchema } from "@/server/validators/application-validator";
import { applicationService } from "@/server/services/application-service";
import { notificationService } from "@/server/services/notification-service";
import { sseSubscriptionService } from "@/server/services/sse-subscription-service";
import { handleApiError } from "@/server/errors/application-error";

const statusMessages: Record<string, string> = {
  INTERVIEWING: "Your application has been moved to the interviewing stage",
  REJECTED: "Your application has been rejected",
  OFFER: "You've received an offer!",
  ACCEPTED: "Your application has been accepted",
  WITHDRAWN: "Your application has been withdrawn",
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    if (user.role !== "RECRUITER") return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    const { status } = updateApplicationStatusSchema.parse(await request.json());
    const { application, existing } = await applicationService.updateStatus(user.id, (await params).id, status);

    try {
      const notification = await notificationService.createNotification({
        type: "APPLICATION_STATUS_CHANGED",
        userId: existing.userId,
        title: `Application Status: ${status}`,
        message: statusMessages[status] || `Your application status has been updated to ${status}`,
        applicationId: existing.id,
        vacancyId: existing.vacancyId,
      });
      const unreadCount = await notificationService.getUnreadCount(existing.userId);
      sseSubscriptionService.notifyUser(existing.userId, notification, unreadCount);
    } catch (error) {
      console.error("Failed to create status notification", error);
    }
    return NextResponse.json({ success: true, message: "Application status updated", application }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to update application status");
  }
}
