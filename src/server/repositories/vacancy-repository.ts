import { Prisma, VacancyStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const vacancyListSelect = {
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
  closedAt: true,
  archivedAt: true,
} satisfies Prisma.VacancySelect;

export const vacancyRepository = {
  create(recruiterId: string, data: Omit<Prisma.VacancyUncheckedCreateInput, "recruiterId">) {
    return prisma.vacancy.create({ data: { ...data, recruiterId }, select: vacancyListSelect });
  },
  findByRecruiter(
    recruiterId: string,
    filters: {
      scope: "active" | "archived" | "all";
      status?: VacancyStatus;
      search?: string;
      sortBy: "createdAt" | "publishedAt";
      sortDirection: "asc" | "desc";
    },
  ) {
    const where: Prisma.VacancyWhereInput = {
      recruiterId,
      ...(filters.scope === "active" ? { status: { in: ["PUBLISHED", "CLOSED"] } } : {}),
      ...(filters.scope === "archived" ? { status: "ARCHIVED" } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? {
        OR: ["title", "company"].map((field) => ({
          [field]: { contains: filters.search, mode: "insensitive" as const },
        })),
      } : {}),
    };
    return prisma.vacancy.findMany({
      where,
      orderBy: { [filters.sortBy]: filters.sortDirection },
      select: vacancyListSelect,
    });
  },
  findOwnedById(id: string, recruiterId: string) {
    return prisma.vacancy.findFirst({ where: { id, recruiterId } });
  },
  update(id: string, data: Prisma.VacancyUpdateInput) {
    return prisma.vacancy.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.vacancy.delete({ where: { id } });
  },
  deleteArchivedBefore(date: Date) {
    return prisma.vacancy.deleteMany({ where: { status: "ARCHIVED", archivedAt: { lt: date } } });
  },
  findPublished(args: { search?: string; location?: string; skip: number; take: number }) {
    const where: Prisma.VacancyWhereInput = {
      status: "PUBLISHED",
      archivedAt: null,
      ...(args.search ? { OR: ["title", "company", "description"].map((field) => ({ [field]: { contains: args.search, mode: "insensitive" as const } })) } : {}),
      ...(args.location ? { location: { contains: args.location, mode: "insensitive" } } : {}),
    };
    const select = {
      id: true, title: true, company: true, location: true, description: true,
      requirements: true, position: true, salaryMin: true, salaryMax: true,
      currency: true, createdAt: true, publishedAt: true,
    } satisfies Prisma.VacancySelect;
    return Promise.all([
      prisma.vacancy.findMany({ where, select, orderBy: { publishedAt: "desc" }, skip: args.skip, take: args.take }),
      prisma.vacancy.count({ where }),
    ]);
  },
  findPublishedById(id: string) {
    return prisma.vacancy.findFirst({
      where: { id, status: "PUBLISHED", archivedAt: null },
      select: {
        id: true, title: true, company: true, location: true, description: true,
        requirements: true, position: true, salaryMin: true, salaryMax: true,
        currency: true, createdAt: true, publishedAt: true, status: true,
      },
    });
  },
  findCandidates(id: string, recruiterId: string) {
    return prisma.vacancy.findFirst({
      where: { id, recruiterId },
      include: {
        applications: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  },
};

export type VacancyLifecycleStatus = Extract<VacancyStatus, "PUBLISHED" | "CLOSED" | "ARCHIVED">;
