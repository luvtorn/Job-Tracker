import { createHash, randomUUID } from "node:crypto";
import { ApplicationStatus } from "@prisma/client";
import { applicationRepository, isUniqueConstraintError } from "@/server/repositories/application-repository";
import { conflict, forbidden, notFound } from "@/server/errors/application-error";
import { googleCalendarRepository } from "@/server/repositories/google-calendar-repository";
import { googleCalendarSyncService } from "@/server/services/google-calendar-sync-service";
import type { ScheduleInterviewInput } from "@/server/validators/vacancy-validator";

export const applicationService = {
  async create(user: { id: string; role: string }, vacancyId: string) {
    if (user.role !== "SEEKER") throw forbidden("Only seekers can apply for positions");
    const vacancy = await applicationRepository.findPublishedVacancy(vacancyId);
    if (!vacancy) throw notFound("Vacancy not found");
    if (await applicationRepository.findByUserAndVacancy(user.id, vacancyId)) {
      throw conflict("You have already applied for this position");
    }
    try {
      return { application: await applicationRepository.create(user.id, vacancyId), vacancy };
    } catch (error) {
      if (isUniqueConstraintError(error)) throw conflict("You have already applied for this position");
      throw error;
    }
  },
  list(userId: string, status?: ApplicationStatus) {
    return applicationRepository.findByUser(userId, status);
  },
  getStats(userId: string) {
    return applicationRepository.findStatsByUser(userId);
  },
  async getCandidateProfile(recruiterId: string, applicationId: string) {
    const application = await applicationRepository.findCandidateProfile(applicationId, recruiterId);
    if (!application) throw notFound('Candidate profile not found');
    return application;
  },
  async scheduleInterview(recruiterId: string, applicationId: string, data: ScheduleInterviewInput) {
    const existing = await applicationRepository.findWithRelations(applicationId);
    if (!existing) throw notFound("Application not found");
    if (existing.vacancy.recruiterId !== recruiterId) throw forbidden();
    if (data.meetingType === "GOOGLE_MEET") {
      const connection = await googleCalendarRepository.findConnection(recruiterId);
      if (!connection || connection.revokedAt) throw conflict("Google Calendar is not connected");
    }

    const wasScheduled = Boolean(existing.interviewDate && existing.interviewTime);
    const interviewDate = new Date(`${data.interviewDate}T00:00:00.000Z`);
    const eventStart = new Date(data.scheduledAt);
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
    const candidateName = `${existing.user.firstName ?? ""} ${existing.user.lastName ?? ""}`.trim() || existing.user.email;
    const eventId = existing.calendarEvent?.id ?? randomUUID();
    const googleEventId = data.meetingType === "GOOGLE_MEET"
      ? existing.calendarEvent?.googleEventId
        ?? createHash("sha256").update(eventId).digest("hex").slice(0, 32)
      : null;
    const syncState = data.meetingType === "GOOGLE_MEET"
      || Boolean(existing.calendarEvent?.googleEventId)
      ? "PENDING" as const
      : "NOT_REQUIRED" as const;
    const result = await applicationRepository.scheduleInterview({
      applicationId,
      interviewDate,
      interviewTime: data.interviewTime,
      interviewNotes: data.interviewNotes,
      eventStart,
      eventEnd,
      eventTitle: `Interview: ${candidateName} - ${existing.vacancy.title}`,
      recruiterId,
      setInterviewing: !wasScheduled,
      eventId,
      meetingType: data.meetingType,
      meetingUrl: data.meetingType === "MANUAL_GOOGLE_MEET"
        ? data.manualMeetingUrl ?? null
        : data.meetingType === "GOOGLE_MEET"
          ? existing.calendarEvent?.meetingUrl ?? null
          : null,
      sendCalendarInvite: data.meetingType === "GOOGLE_MEET" && data.sendCalendarInvite,
      googleEventId,
      googleConferenceRequestId: data.meetingType === "GOOGLE_MEET"
        ? existing.calendarEvent?.googleConferenceRequestId ?? randomUUID().replace(/-/g, "")
        : null,
      syncState,
    });
    if (result.syncJobId) await googleCalendarSyncService.processJob(result.syncJobId);
    return { application: result.application, wasScheduled };
  },
  async updateStatus(recruiterId: string, applicationId: string, status: ApplicationStatus) {
    const existing = await applicationRepository.findWithRelations(applicationId);
    if (!existing) throw notFound("Application not found");
    if (existing.vacancy.recruiterId !== recruiterId) throw forbidden();
    let application;
    if (existing.status === "INTERVIEWING" && status !== "INTERVIEWING") {
      const result = await applicationRepository.updateStatusAndClearInterview(applicationId, status);
      application = result.application;
      if (result.syncJobId) await googleCalendarSyncService.processJob(result.syncJobId);
    } else {
      application = await applicationRepository.updateStatus(applicationId, status);
    }
    return { application, existing };
  },
  async cancelInterview(
    recruiterId: string,
    applicationId: string,
    nextStatus: "APPLIED" | "INTERVIEWING",
  ) {
    const existing = await applicationRepository.findWithRelations(applicationId);
    if (!existing) throw notFound("Application not found");
    if (existing.vacancy.recruiterId !== recruiterId) throw forbidden();
    const result = await applicationRepository.cancelInterview(applicationId, nextStatus);
    if (result.syncJobId) await googleCalendarSyncService.processJob(result.syncJobId);
    return result.application;
  },
  async getRecruiterInterviews(recruiterId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const applications = await applicationRepository.findRecruiterInterviews(recruiterId, startDate, endDate);
    return applications.map((application) => ({
      id: application.id,
      candidateName: `${application.user.firstName ?? ""} ${application.user.lastName ?? ""}`.trim(),
      candidateEmail: application.user.email,
      candidateAvatar: application.user.avatarUrl,
      vacancyTitle: application.vacancy.title,
      vacancyId: application.vacancy.id,
      interviewDate: application.interviewDate?.toISOString().split("T")[0] || "",
      interviewTime: application.interviewTime || "",
      interviewNotes: application.interviewNotes,
      status: application.status,
    }));
  },
};
