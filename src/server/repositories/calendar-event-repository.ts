import { prisma } from "@/lib/prisma";
import { CreateCalendarEventInput, UpdateCalendarEventInput } from "@/server/validators/calendar-validator";

export const calendarEventRepository = {
  async create(userId: string, data: CreateCalendarEventInput) {
    return prisma.calendarEvent.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        eventType: data.eventType,
        color: data.color || "blue",
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location || null,
        isCompleted: data.isCompleted || false,
        applicationId: data.applicationId || null,
      },
    });
  },

  async findByUserIdAndMonth(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
            vacancy: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });
  },

  async findById(eventId: string) {
    return prisma.calendarEvent.findUnique({
      where: { id: eventId },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
            vacancy: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  },

  async updateById(eventId: string, userId: string, data: UpdateCalendarEventInput) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw new Error("Event not found or unauthorized");
    }

    return prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        color: data.color,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isCompleted: data.isCompleted,
      },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
            vacancy: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
  },

  async deleteById(eventId: string, userId: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw new Error("Event not found or unauthorized");
    }

    if (event.eventType === "INTERVIEW") {
      throw new Error("Cannot delete interview events directly");
    }

    return prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  },

  async findByApplicationId(applicationId: string) {
    return prisma.calendarEvent.findUnique({
      where: {
        applicationId,
      },
    });
  },

  async createOrUpdateInterviewEvent(
    userId: string,
    applicationId: string,
    candidateName: string,
    vacancyTitle: string,
    startTime: Date,
    endTime: Date,
    notes?: string
  ) {
    const existing = await this.findByApplicationId(applicationId);

    if (existing) {
      return prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          startTime,
          endTime,
          description: notes || null,
        },
      });
    }

    return prisma.calendarEvent.create({
      data: {
        userId,
        title: `Interview: ${candidateName} - ${vacancyTitle}`,
        description: notes || null,
        eventType: "INTERVIEW",
        color: "blue",
        startTime,
        endTime,
        applicationId,
      },
    });
  },
};
