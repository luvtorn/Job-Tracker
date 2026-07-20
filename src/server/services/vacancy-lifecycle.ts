import { Prisma, VacancyStatus } from "@prisma/client";
import { conflict } from "@/server/errors/application-error";

export type ManagedVacancyStatus = Extract<VacancyStatus, "PUBLISHED" | "CLOSED" | "ARCHIVED">;

const allowedTransitions: Record<ManagedVacancyStatus, ManagedVacancyStatus[]> = {
  PUBLISHED: ["CLOSED", "ARCHIVED"],
  CLOSED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: ["PUBLISHED"],
};

export function assertVacancyStatusTransition(
  currentStatus: ManagedVacancyStatus,
  nextStatus: ManagedVacancyStatus,
) {
  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    throw conflict(`Cannot change a ${currentStatus.toLowerCase()} vacancy to ${nextStatus.toLowerCase()}`);
  }
}

export function getVacancyLifecycleUpdate(
  status: ManagedVacancyStatus,
  now = new Date(),
): Prisma.VacancyUpdateInput {
  if (status === "ARCHIVED") return { status, archivedAt: now };
  if (status === "CLOSED") return { status, closedAt: now };
  return { status, archivedAt: null, closedAt: null, publishedAt: now };
}
