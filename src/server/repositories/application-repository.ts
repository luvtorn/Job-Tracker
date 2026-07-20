import { ApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const applicationRepository = {
  findPublishedVacancy(id: string) {
    return prisma.vacancy.findFirst({ where: { id, status: "PUBLISHED", archivedAt: null } });
  },
  findByUserAndVacancy(userId: string, vacancyId: string) {
    return prisma.application.findUnique({ where: { userId_vacancyId: { userId, vacancyId } } });
  },
  create(userId: string, vacancyId: string) {
    return prisma.$transaction(async (transaction) => {
      const documents = await transaction.document.findMany({ where: { userId, isCurrent: true } });
      return transaction.application.create({
        data: {
          userId, vacancyId, status: "APPLIED",
          documents: { create: documents.map((document) => ({ documentId: document.id, type: document.type })) },
        },
      });
    });
  },
  findByUser(userId: string, status?: ApplicationStatus) {
    return prisma.application.findMany({
      where: { userId, ...(status ? { status } : {}) },
      include: {
        vacancy: { select: { id: true, title: true, company: true, location: true, position: true, salaryMin: true, salaryMax: true, currency: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  findStatsByUser(userId: string) {
    return prisma.application.findMany({ where: { userId }, select: { status: true, createdAt: true }, orderBy: { createdAt: "asc" } });
  },
  findWithRelations(id: string) {
    return prisma.application.findUnique({ where: { id }, include: { vacancy: true, user: true } });
  },
  findCandidateProfile(id: string, recruiterId: string) {
    return prisma.application.findFirst({
      where: { id, vacancy: { recruiterId } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true } },
        vacancy: { select: { id: true, title: true, company: true } },
        documents: { include: { document: { select: { id: true, type: true, originalFilename: true, createdAt: true } } } },
      },
    });
  },
  updateStatus(id: string, status: ApplicationStatus) {
    return prisma.application.update({
      where: { id },
      data: { status },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
    });
  },
  async scheduleInterview(input: {
    applicationId: string;
    interviewDate: Date;
    interviewTime: string;
    interviewNotes?: string;
    eventStart: Date;
    eventEnd: Date;
    eventTitle: string;
    recruiterId: string;
    setInterviewing: boolean;
  }) {
    return prisma.$transaction(async (transaction) => {
      const application = await transaction.application.update({
        where: { id: input.applicationId },
        data: {
          interviewDate: input.interviewDate,
          interviewTime: input.interviewTime,
          interviewNotes: input.interviewNotes || null,
          ...(input.setInterviewing ? { status: "INTERVIEWING" as const } : {}),
        },
        include: { vacancy: true, user: true },
      });
      await transaction.calendarEvent.upsert({
        where: { applicationId: input.applicationId },
        create: {
          userId: input.recruiterId,
          applicationId: input.applicationId,
          title: input.eventTitle,
          description: input.interviewNotes || null,
          eventType: "INTERVIEW",
          color: "blue",
          startTime: input.eventStart,
          endTime: input.eventEnd,
        },
        update: {
          description: input.interviewNotes || null,
          startTime: input.eventStart,
          endTime: input.eventEnd,
        },
      });
      return application;
    });
  },
  deleteInterviewEvent(applicationId: string) {
    return prisma.calendarEvent.deleteMany({ where: { applicationId } });
  },
  findRecruiterInterviews(recruiterId: string, startDate: Date, endDate: Date) {
    return prisma.application.findMany({
      where: { vacancy: { recruiterId }, status: "INTERVIEWING", interviewDate: { gte: startDate, lte: endDate } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        vacancy: { select: { id: true, title: true } },
      },
      orderBy: { interviewDate: "asc" },
    });
  },
};

export const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
