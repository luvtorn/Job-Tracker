import { prisma } from "@/lib/prisma";

export const recruiterStatisticsRepository = {
  findVacanciesWithApplications(recruiterId: string, since: Date | null) {
    return prisma.vacancy.findMany({
      where: { recruiterId },
      select: {
        id: true,
        title: true,
        status: true,
        applications: {
          where: since ? { createdAt: { gte: since } } : undefined,
          select: { status: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },
};
