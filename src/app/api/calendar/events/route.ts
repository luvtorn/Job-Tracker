import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { calendarEventService } from "@/server/services/calendar-event-service";
import { createCustomCalendarEventSchema } from "@/server/validators/calendar-validator";
import { handleApiError } from "@/server/errors/application-error";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user || (user.role !== "RECRUITER" && user.role !== "SEEKER")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createCustomCalendarEventSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input", errors: validated.error.flatten() },
        { status: 400 }
      );
    }

    const event = await calendarEventService.createEvent(user.id, validated.data);

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
    const user = await verifyAuth();
    if (!user) {
      console.log("GET /api/calendar/events: User not authenticated");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "RECRUITER" && user.role !== "SEEKER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    console.log("GET /api/calendar/events: Fetching for user", user.id, "month:", month, "year:", year);
    const events = await calendarEventService.getEventsForMonth(user.id, user.role, month, year);
    console.log("GET /api/calendar/events: Got events:", events?.length || 0);

    return NextResponse.json(
      { success: true, events },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch calendar events");
  }
}
