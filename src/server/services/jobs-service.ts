import { vacancyRepository } from "@/server/repositories/vacancy-repository";
import { notFound } from "@/server/errors/application-error";

export const jobsService = {
  async list(input: { page: number; limit: number; search?: string; location?: string }) {
    const [vacancies, total] = await vacancyRepository.findPublished({
      search: input.search,
      location: input.location,
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });
    return { vacancies, pagination: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) } };
  },
  async getById(id: string) {
    const vacancy = await vacancyRepository.findPublishedById(id);
    if (!vacancy) throw notFound("Vacancy not found");
    return vacancy;
  },
};
