import type { ApplicationStatus } from "@prisma/client";

export type InterviewPersistenceInput = {
  applicationId: string;
  interviewDate: Date;
  interviewTime: string;
  interviewNotes?: string;
  eventStart: Date;
  eventEnd: Date;
  eventTitle: string;
  recruiterId: string;
  setInterviewing: boolean;
};

export function buildInterviewPersistence(input: InterviewPersistenceInput) {
  const description = input.interviewNotes || null;
  return {
    application: {
      where: { id: input.applicationId },
      data: {
        interviewDate: input.interviewDate,
        interviewTime: input.interviewTime,
        interviewNotes: description,
        ...(input.setInterviewing ? { status: "INTERVIEWING" as const } : {}),
      },
      include: { vacancy: true, user: true },
    },
    calendarEvent: {
      where: { applicationId: input.applicationId },
      create: {
        userId: input.recruiterId,
        applicationId: input.applicationId,
        title: input.eventTitle,
        description,
        eventType: "INTERVIEW" as const,
        color: "blue",
        startTime: input.eventStart,
        endTime: input.eventEnd,
      },
      update: {
        title: input.eventTitle,
        description,
        startTime: input.eventStart,
        endTime: input.eventEnd,
      },
    },
  };
}

export function buildInterviewCleanup(applicationId: string, status: ApplicationStatus) {
  return {
    application: {
      where: { id: applicationId },
      data: { status, interviewDate: null, interviewTime: null, interviewNotes: null },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
    },
    calendarEvent: { where: { applicationId } },
  };
}
