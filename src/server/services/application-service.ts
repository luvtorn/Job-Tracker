import { ApplicationStatus } from "@prisma/client";
import { applicationRepository, isUniqueConstraintError } from "@/server/repositories/application-repository";
import { conflict, forbidden, notFound } from "@/server/errors/application-error";

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
  async scheduleInterview(recruiterId: string, applicationId: string, data: { interviewDate: string; interviewTime: string; interviewNotes?: string }) {
    const existing = await applicationRepository.findWithRelations(applicationId);
    if (!existing) throw notFound("Application not found");
    if (existing.vacancy.recruiterId !== recruiterId) throw forbidden();

    const wasScheduled = Boolean(existing.interviewDate && existing.interviewTime);
    const [year, month, day] = data.interviewDate.split("-").map(Number);
    const [hours, minutes] = data.interviewTime.split(":").map(Number);
    const interviewDate = new Date(year, month - 1, day);
    const eventStart = new Date(year, month - 1, day, hours, minutes);
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
    const candidateName = `${existing.user.firstName ?? ""} ${existing.user.lastName ?? ""}`.trim() || existing.user.email;
    const application = await applicationRepository.scheduleInterview({
      applicationId,
      interviewDate,
      interviewTime: data.interviewTime,
      interviewNotes: data.interviewNotes,
      eventStart,
      eventEnd,
      eventTitle: `Interview: ${candidateName} - ${existing.vacancy.title}`,
      recruiterId,
      setInterviewing: !wasScheduled,
    });
    return { application, wasScheduled };
  },
  async updateStatus(recruiterId: string, applicationId: string, status: ApplicationStatus) {
    const existing = await applicationRepository.findWithRelations(applicationId);
    if (!existing) throw notFound("Application not found");
    if (existing.vacancy.recruiterId !== recruiterId) throw forbidden();
    const application = await applicationRepository.updateStatus(applicationId, status);
    if (existing.status === "INTERVIEWING" && status !== "INTERVIEWING") {
      await applicationRepository.deleteInterviewEvent(applicationId);
    }
    return { application, existing };
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
