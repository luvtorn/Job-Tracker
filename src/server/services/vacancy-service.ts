import { prisma } from "@/lib/prisma";
import { CreateVacancyInput } from "@/server/validators/vacancy-validator";

export class VacancyService {
  async createVacancy(recruiterId: string, data: CreateVacancyInput) {
    return prisma.vacancy.create({
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        position: data.position,
        company: data.company,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        recruiterId,
        publishedAt: new Date(),
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        status: true,
        createdAt: true,
        publishedAt: true,
      },
    });
  }

  async getVacanciesByRecruiter(recruiterId: string) {
    return prisma.vacancy.findMany({
      where: { recruiterId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        status: true,
        createdAt: true,
        publishedAt: true,
      },
    });
  }

  async getVacancyById(vacancyId: string, recruiterId: string) {
    return prisma.vacancy.findFirst({
      where: {
        id: vacancyId,
        recruiterId,
      },
    });
  }

  async updateVacancy(vacancyId: string, data: Partial<CreateVacancyInput>) {
    return prisma.vacancy.update({
      where: {
        id: vacancyId,
      },
      data: {
        ...data,
      },
    });
  }

  async deleteVacancy(vacancyId: string) {
    return prisma.vacancy.delete({
      where: {
        id: vacancyId,
      },
    });
  }

  async archiveVacancy(vacancyId: string) {
    return prisma.vacancy.update({
      where: { id: vacancyId },
      data: { archivedAt: new Date() },
    });
  }

  async reactivateVacancy(vacancyId: string) {
    return prisma.vacancy.update({
      where: { id: vacancyId },
      data: {
        archivedAt: null,
        createdAt: new Date(),
      },
    });
  }

  async closeVacancy(vacancyId: string) {
    return prisma.vacancy.update({
      where: { id: vacancyId },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
      },
    });
  }

  async deleteExpiredVacancies() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deleted = await prisma.vacancy.deleteMany({
      where: {
        archivedAt: {
          lt: sevenDaysAgo,
        },
      },
    });

    return deleted.count;
  }
}

export const vacancyService = new VacancyService();
