import { calendarEventRepository } from "@/server/repositories/calendar-event-repository";
import { createCalendarEventSchema, updateCalendarEventSchema, CreateCalendarEventInput, UpdateCalendarEventInput } from "@/server/validators/calendar-validator";
import { forbidden, notFound } from "@/server/errors/application-error";

export const calendarEventService = {
  async createEvent(userId: string, data: CreateCalendarEventInput) {
    const validated = createCalendarEventSchema.parse(data);
    return calendarEventRepository.create(userId, validated);
  },

  async getEventsForMonth(
    userId: string,
    role: "SEEKER" | "RECRUITER",
    month: number,
    year: number,
  ) {
    return calendarEventRepository.findByUserIdAndMonth(userId, role, month, year);
  },

  async updateEvent(eventId: string, userId: string, data: UpdateCalendarEventInput) {
    const event = await calendarEventRepository.findOwnedById(eventId, userId);
    if (!event) throw notFound("Event not found");
    if (event.eventType === "INTERVIEW") throw forbidden("Interview events cannot be edited directly");
    const validated = updateCalendarEventSchema.parse(data);
    return calendarEventRepository.updateById(eventId, userId, validated);
  },

  async deleteEvent(eventId: string, userId: string) {
    const event = await calendarEventRepository.findOwnedById(eventId, userId);
    if (!event) throw notFound("Event not found");
    if (event.eventType === "INTERVIEW") throw forbidden("Interview events cannot be deleted directly");
    return calendarEventRepository.deleteById(eventId, userId);
  },

};
