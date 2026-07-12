import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { calendarEventService } from "@/server/services/calendar-event-service";
import { createCalendarEventSchema } from "@/server/validators/calendar-validator";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user || user.role !== "RECRUITER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = createCalendarEventSchema.safeParse(body);

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
    console.error("Failed to create calendar event:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
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

    if (user.role !== "RECRUITER") {
      console.log("GET /api/calendar/events: User is not a recruiter", user.role);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    console.log("GET /api/calendar/events: Fetching for user", user.id, "month:", month, "year:", year);
    const events = await calendarEventService.getEventsForMonth(user.id, month, year);
    console.log("GET /api/calendar/events: Got events:", events?.length || 0);

    return NextResponse.json(
      { success: true, events },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch calendar events:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
