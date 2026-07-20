import { prisma } from "@/lib/prisma";

export const recruiterDashboardRepository = {
  findVacancySummaries(recruiterId: string) {
    return prisma.vacancy.findMany({ where: { recruiterId }, select: { id: true, status: true } });
  },
  findApplicationStatuses(vacancyIds: string[]) {
    return prisma.application.findMany({ where: { vacancyId: { in: vacancyIds } }, select: { status: true } });
  },
  findPublishedVacanciesWithApplications(recruiterId: string) {
    return prisma.vacancy.findMany({
      where: { recruiterId, status: "PUBLISHED" },
      include: { applications: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
  findRecentApplications(vacancyIds: string[], limit: number) {
    return prisma.application.findMany({
      where: { vacancyId: { in: vacancyIds } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        vacancy: { select: { id: true, title: true, company: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  },
};
