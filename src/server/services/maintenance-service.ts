import { documentService } from '@/server/services/document-service';
import { vacancyService } from '@/server/services/vacancy-service';

export const maintenanceService = {
  async cleanupExpiredData() {
    const [vacancies, documentUploads] = await Promise.all([
      vacancyService.deleteExpiredVacancies(),
      documentService.cleanupExpiredUploads(),
    ]);
    return { vacancies, documentUploads };
  },
};
