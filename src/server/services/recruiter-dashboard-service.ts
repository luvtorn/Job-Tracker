import { prisma } from "@/lib/prisma";

interface RecruiterMetrics {
  totalVacancies: number;
  publishedVacancies: number;
  totalCandidates: number;
  pendingReview: number;
  interviewStage: number;
}

interface VacancyWithCandidates {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  totalCandidates: number;
  applied: number;
  interviewing: number;
  offers: number;
  accepted: number;
  rejected: number;
}

interface RecentApplication {
  id: string;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
  vacancy: {
    id: string;
    title: string;
    company: string | null;
  };
}

export class RecruiterDashboardService {
  async getRecruiterMetrics(recruiterId: string): Promise<RecruiterMetrics> {
    // Get total and published vacancies
    const vacancies = await prisma.vacancy.findMany({
      where: { recruiterId },
      select: { id: true, status: true },
    });

    const totalVacancies = vacancies.length;
    const publishedVacancies = vacancies.filter((v) => v.status === "PUBLISHED").length;

    // Get all applications for recruiter's vacancies
    const vacancyIds = vacancies.map((v) => v.id);

    const applications = await prisma.application.findMany({
      where: {
        vacancyId: {
          in: vacancyIds,
        },
      },
      select: { status: true },
    });

    const totalCandidates = applications.length;
    const pendingReview = applications.filter((a) => a.status === "APPLIED").length;
    const interviewStage = applications.filter((a) => a.status === "INTERVIEWING").length;

    return {
      totalVacancies,
      publishedVacancies,
      totalCandidates,
      pendingReview,
      interviewStage,
    };
  }

  async getRecruiterVacanciesWithCandidates(recruiterId: string): Promise<VacancyWithCandidates[]> {
    const vacancies = await prisma.vacancy.findMany({
      where: { recruiterId, status: "PUBLISHED" },
      include: {
        applications: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return vacancies.map((vacancy) => {
      const statuses = vacancy.applications.reduce(
        (acc, app) => {
          acc[app.status.toLowerCase()] = (acc[app.status.toLowerCase()] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        id: vacancy.id,
        title: vacancy.title,
        company: vacancy.company || "",
        location: vacancy.location || "",
        status: vacancy.status,
        totalCandidates: vacancy.applications.length,
        applied: statuses.applied || 0,
        interviewing: statuses.interviewing || 0,
        offers: statuses.offers || 0,
        accepted: statuses.accepted || 0,
        rejected: statuses.rejected || 0,
      };
    });
  }

  async getRecentApplications(recruiterId: string, limit: number = 10): Promise<RecentApplication[]> {
    const vacancies = await prisma.vacancy.findMany({
      where: { recruiterId },
      select: { id: true },
    });

    const vacancyIds = vacancies.map((v) => v.id);

    const applications = await prisma.application.findMany({
      where: {
        vacancyId: {
          in: vacancyIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
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
            company: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return applications;
  }

  async getCandidatesByStage(
    recruiterId: string
  ): Promise<{ stage: string; count: number }[]> {
    const vacancies = await prisma.vacancy.findMany({
      where: { recruiterId },
      select: { id: true },
    });

    const vacancyIds = vacancies.map((v) => v.id);

    const applications = await prisma.application.findMany({
      where: {
        vacancyId: {
          in: vacancyIds,
        },
      },
      select: { status: true },
    });

    const stages = applications.reduce(
      (acc, app) => {
        const stageIndex = acc.findIndex((s) => s.stage === app.status);
        if (stageIndex > -1) {
          acc[stageIndex].count += 1;
        }
        return acc;
      },
      [
        { stage: "APPLIED", count: 0 },
        { stage: "INTERVIEWING", count: 0 },
        { stage: "OFFERS", count: 0 },
        { stage: "ACCEPTED", count: 0 },
      ]
    );

    return stages.filter((s) => s.count > 0);
  }
}

export const recruiterDashboardService = new RecruiterDashboardService();
