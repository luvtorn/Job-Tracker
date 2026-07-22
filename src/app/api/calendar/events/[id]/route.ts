import { NextRequest, NextResponse } from "next/server";
import { calendarEventService } from "@/server/services/calendar-event-service";
import { calendarEventIdSchema, updateCustomCalendarEventSchema } from "@/server/validators/calendar-validator";
import { handleApiError } from "@/server/errors/application-error";
import { requireCalendarUser } from '@/server/middleware/role-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireCalendarUser();
    const id = calendarEventIdSchema.parse((await params).id);
    const input = updateCustomCalendarEventSchema.parse(await request.json());
    const event = await calendarEventService.updateEvent(id, user.id, input);

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
    const user = await requireCalendarUser();
    const id = calendarEventIdSchema.parse((await params).id);
    await calendarEventService.deleteEvent(id, user.id);

    return NextResponse.json(
      { success: true, message: "Event deleted" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to delete calendar event");
  }
}
