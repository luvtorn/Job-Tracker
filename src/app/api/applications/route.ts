import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { applicationService } from "@/server/services/application-service";
import { notificationService } from "@/server/services/notification-service";
import { sseSubscriptionService } from "@/server/services/sse-subscription-service";
import { applicationQuerySchema, createApplicationSchema } from "@/server/validators/application-validator";
import { handleApiError } from "@/server/errors/application-error";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const { vacancyId } = createApplicationSchema.parse(await request.json());
    const { application, vacancy } = await applicationService.create(user, vacancyId);

    try {
      const notification = await notificationService.createNotification({
        type: "NEW_APPLICATION",
        userId: vacancy.recruiterId,
        title: "New Application",
        message: `You received a new application for "${vacancy.title}" position`,
        applicationId: application.id,
        vacancyId: vacancy.id,
      });
      const unreadCount = await notificationService.getUnreadCount(vacancy.recruiterId);
      sseSubscriptionService.notifyUser(vacancy.recruiterId, notification, unreadCount);
    } catch (error) {
      console.error("Failed to create application notification", error);
    }

    return NextResponse.json({ success: true, message: "Application submitted successfully", application }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create application");
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    const { status } = applicationQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const applications = await applicationService.list(user.id, status);
    return NextResponse.json({ success: true, applications }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to fetch applications");
  }
}
