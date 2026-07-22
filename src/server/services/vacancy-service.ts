import { vacancyRepository } from "@/server/repositories/vacancy-repository";
import { CreateVacancyInput } from "@/server/validators/vacancy-validator";
import { conflict, notFound } from "@/server/errors/application-error";
import {
  assertVacancyStatusTransition,
  getVacancyLifecycleUpdate,
  ManagedVacancyStatus,
} from "@/server/services/vacancy-lifecycle";

export class VacancyService {
  async createVacancy(recruiterId: string, data: CreateVacancyInput) {
    return vacancyRepository.create(recruiterId, {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        position: data.position,
        company: data.company,
        location: data.location,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        currency: data.currency,
        publishedAt: new Date(),
        status: "PUBLISHED",
    });
  }

  async getVacanciesByRecruiter(
    recruiterId: string,
    filters: Parameters<typeof vacancyRepository.findByRecruiter>[1],
  ) {
    return vacancyRepository.findByRecruiter(recruiterId, filters);
  }

  async getVacancyById(vacancyId: string, recruiterId: string) {
    const vacancy = await vacancyRepository.findOwnedById(vacancyId, recruiterId);
    if (!vacancy) throw notFound('Vacancy not found');
    return vacancy;
  }

  async updateVacancy(recruiterId: string, vacancyId: string, data: Partial<CreateVacancyInput>) {
    await this.getVacancyById(vacancyId, recruiterId);
    return vacancyRepository.update(vacancyId, data);
  }

  async deleteVacancy(recruiterId: string, vacancyId: string) {
    await this.getVacancyById(vacancyId, recruiterId);
    return vacancyRepository.delete(vacancyId);
  }

  async archiveVacancy(vacancyId: string) {
    return vacancyRepository.update(vacancyId, getVacancyLifecycleUpdate("ARCHIVED"));
  }

  async reactivateVacancy(vacancyId: string) {
    return vacancyRepository.update(vacancyId, getVacancyLifecycleUpdate("PUBLISHED"));
  }

  async closeVacancy(vacancyId: string) {
    return vacancyRepository.update(vacancyId, getVacancyLifecycleUpdate("CLOSED"));
  }

  async deleteExpiredVacancies() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const deleted = await vacancyRepository.deleteArchivedBefore(sevenDaysAgo);

    return deleted.count;
  }

  async changeVacancyStatus(
    recruiterId: string,
    vacancyId: string,
    nextStatus: ManagedVacancyStatus,
  ) {
    const vacancy = await this.getVacancyById(vacancyId, recruiterId);
    if (vacancy.status === "DRAFT") {
      throw conflict("Draft vacancies cannot be managed through this endpoint");
    }
    assertVacancyStatusTransition(vacancy.status, nextStatus);
    return vacancyRepository.update(vacancy.id, getVacancyLifecycleUpdate(nextStatus));
  }

  async getCandidates(vacancyId: string, recruiterId: string) {
    const vacancy = await vacancyRepository.findCandidates(vacancyId, recruiterId);
    if (!vacancy) throw notFound("Vacancy not found");
    return vacancy.applications;
  }
}

export const vacancyService = new VacancyService();
