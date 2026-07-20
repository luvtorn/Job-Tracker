import { DocumentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const documentRepository = {
  findCurrentByUser(userId: string) {
    return prisma.document.findMany({ where: { userId, isCurrent: true }, orderBy: { createdAt: 'desc' } });
  },
  replaceCurrent(userId: string, type: DocumentType, data: { originalFilename: string; publicId: string }) {
    return prisma.$transaction(async (transaction) => {
      await transaction.document.updateMany({ where: { userId, type, isCurrent: true }, data: { isCurrent: false } });
      return transaction.document.create({ data: { userId, type, ...data } });
    });
  },
  findOwned(id: string, userId: string) {
    return prisma.document.findFirst({ where: { id, userId } });
  },
  deactivate(id: string, userId: string) {
    return prisma.document.updateMany({ where: { id, userId }, data: { isCurrent: false } });
  },
  findForRecruiter(id: string, recruiterId: string) {
    return prisma.document.findFirst({
      where: { id, applications: { some: { application: { vacancy: { recruiterId } } } } },
    });
  },
};
