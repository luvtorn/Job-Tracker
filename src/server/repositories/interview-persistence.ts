import type { ApplicationStatus, InterviewMeetingType } from "@prisma/client";

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
  eventId: string;
  meetingType: InterviewMeetingType;
  meetingUrl: string | null;
  sendCalendarInvite: boolean;
  googleEventId: string | null;
  googleConferenceRequestId: string | null;
  syncState: "NOT_REQUIRED" | "PENDING";
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
        id: input.eventId,
        userId: input.recruiterId,
        applicationId: input.applicationId,
        title: input.eventTitle,
        description,
        eventType: "INTERVIEW" as const,
        color: "blue",
        startTime: input.eventStart,
        endTime: input.eventEnd,
        meetingType: input.meetingType,
        meetingUrl: input.meetingUrl,
        sendCalendarInvite: input.sendCalendarInvite,
        googleEventId: input.googleEventId,
        googleConferenceRequestId: input.googleConferenceRequestId,
        syncState: input.syncState,
      },
      update: {
        title: input.eventTitle,
        description,
        startTime: input.eventStart,
        endTime: input.eventEnd,
        meetingType: input.meetingType,
        meetingUrl: input.meetingUrl,
        sendCalendarInvite: input.sendCalendarInvite,
        googleEventId: input.googleEventId,
        googleConferenceRequestId: input.googleConferenceRequestId,
        syncState: input.syncState,
        syncErrorCode: null,
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
