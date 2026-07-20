import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { calendarEventService } from "@/server/services/calendar-event-service";
import { updateCustomCalendarEventSchema } from "@/server/validators/calendar-validator";
import { handleApiError } from "@/server/errors/application-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth();
    if (!user || (user.role !== "RECRUITER" && user.role !== "SEEKER")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateCustomCalendarEventSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: validated.error.flatten() },
        { status: 400 }
      );
    }

    const event = await calendarEventService.updateEvent(id, user.id, validated.data);

    return NextResponse.json(
      { success: true, event },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to update calendar event");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth();
    if (!user || (user.role !== "RECRUITER" && user.role !== "SEEKER")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    await calendarEventService.deleteEvent(id, user.id);

    return NextResponse.json(
      { success: true, message: "Event deleted" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to delete calendar event");
  }
}
