import { NextRequest, NextResponse } from "next/server";
import { calendarEventService } from "@/server/services/calendar-event-service";
import { calendarMonthQuerySchema, createCustomCalendarEventSchema } from "@/server/validators/calendar-validator";
import { handleApiError } from "@/server/errors/application-error";
import { requireCalendarUser } from '@/server/middleware/role-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireCalendarUser();
    const input = createCustomCalendarEventSchema.parse(await request.json());
    const event = await calendarEventService.createEvent(user.id, input);

    return NextResponse.json(
      { success: true, event },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to create calendar event");
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireCalendarUser();
    const query = calendarMonthQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();
    const events = await calendarEventService.getEventsForMonth(user.id, user.role, month, year);

    return NextResponse.json(
      { success: true, events },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch calendar events");
  }
}
