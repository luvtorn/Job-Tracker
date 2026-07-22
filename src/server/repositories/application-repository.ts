import { ApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildInterviewCleanup, buildInterviewPersistence, type InterviewPersistenceInput } from "@/server/repositories/interview-persistence";

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
  updateStatusAndClearInterview(id: string, status: ApplicationStatus) {
    return prisma.$transaction(async (transaction) => {
      const persistence = buildInterviewCleanup(id, status);
      const application = await transaction.application.update(persistence.application);
      await transaction.calendarEvent.deleteMany(persistence.calendarEvent);
      return application;
    });
  },
  async scheduleInterview(input: InterviewPersistenceInput) {
    return prisma.$transaction(async (transaction) => {
      const persistence = buildInterviewPersistence(input);
      const application = await transaction.application.update(persistence.application);
      await transaction.calendarEvent.upsert(persistence.calendarEvent);
      return application;
    });
  },
  cancelInterview(applicationId: string, nextStatus: "APPLIED" | "INTERVIEWING") {
    return prisma.$transaction(async (transaction) => {
      const persistence = buildInterviewCleanup(applicationId, nextStatus);
      const application = await transaction.application.update(persistence.application);
      await transaction.calendarEvent.deleteMany(persistence.calendarEvent);
      return application;
    });
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
