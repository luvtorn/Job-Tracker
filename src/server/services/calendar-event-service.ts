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

  async createInterviewEvent(
    userId: string,
    applicationId: string,
    candidateName: string,
    vacancyTitle: string,
    interviewDate: Date,
    interviewTime: string,
    notes?: string
  ) {
    const [hours, minutes] = interviewTime.split(":").map(Number);
    const startTime = new Date(interviewDate);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hours + 1, minutes, 0, 0);

    return calendarEventRepository.createOrUpdateInterviewEvent(
      userId,
      applicationId,
      candidateName,
      vacancyTitle,
      startTime,
      endTime,
      notes
    );
  },

  async getEventById(eventId: string) {
    return calendarEventRepository.findById(eventId);
  },
};
