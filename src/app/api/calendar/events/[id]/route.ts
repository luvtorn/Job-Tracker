import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/server/middleware/auth";
import { calendarEventService } from "@/server/services/calendar-event-service";
import { updateCalendarEventSchema } from "@/server/validators/calendar-validator";

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

    const { id } = await params;
    const body = await request.json();
    const validated = updateCalendarEventSchema.safeParse(body);

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
  } catch (error: any) {
    console.error("Failed to update calendar event:", error);

    if (error.message?.includes("not found") || error.message?.includes("unauthorized")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const { id } = await params;
    await calendarEventService.deleteEvent(id, user.id);

    return NextResponse.json(
      { success: true, message: "Event deleted" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to delete calendar event:", error);

    if (error.message?.includes("not found") || error.message?.includes("unauthorized")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    if (error.message?.includes("Cannot delete interview")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
