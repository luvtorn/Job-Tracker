import { DocumentScanStatus, DocumentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const documentRepository = {
  findCurrentByUser(userId: string) {
    return prisma.document.findMany({
      where: {
        userId,
        OR: [
          { isCurrent: true, scanStatus: DocumentScanStatus.CLEAN },
          {
            scanStatus: {
              in: [
                DocumentScanStatus.PENDING_UPLOAD,
                DocumentScanStatus.SCANNING,
                DocumentScanStatus.FAILED,
                DocumentScanStatus.REJECTED,
              ],
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  createUploadIntent(data: {
    userId: string;
    type: DocumentType;
    originalFilename: string;
    publicId: string;
    uploadExpiresAt: Date;
  }) {
    return prisma.document.create({
      data: {
        ...data,
        isCurrent: false,
        scanStatus: DocumentScanStatus.PENDING_UPLOAD,
      },
    });
  },

  findOwned(id: string, userId: string) {
    return prisma.document.findFirst({ where: { id, userId } });
  },

  markScanning(id: string, userId: string) {
    return prisma.document.updateMany({
      where: {
        id,
        userId,
        scanStatus: DocumentScanStatus.PENDING_UPLOAD,
      },
      data: {
        scanStatus: DocumentScanStatus.SCANNING,
        uploadExpiresAt: null,
      },
    });
  },

  async markClean(publicId: string) {
    return prisma.$transaction(async (transaction) => {
      const document = await transaction.document.findUnique({
        where: { publicId },
      });
      if (!document || document.scanStatus === DocumentScanStatus.CLEAN) {
        return document;
      }
      if (document.scanStatus !== DocumentScanStatus.SCANNING) return null;
      await transaction.document.updateMany({
        where: {
          userId: document.userId,
          type: document.type,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });
      return transaction.document.update({
        where: { id: document.id },
        data: {
          scanStatus: DocumentScanStatus.CLEAN,
          isCurrent: true,
          uploadExpiresAt: null,
        },
      });
    });
  },

  markRejected(publicId: string) {
    return prisma.document.updateMany({
      where: {
        publicId,
        scanStatus: {
          in: [
            DocumentScanStatus.PENDING_UPLOAD,
            DocumentScanStatus.SCANNING,
          ],
        },
      },
      data: {
        scanStatus: DocumentScanStatus.REJECTED,
        isCurrent: false,
        uploadExpiresAt: null,
      },
    });
  },

  markFailed(id: string, userId: string) {
    return prisma.document.updateMany({
      where: { id, userId },
      data: {
        scanStatus: DocumentScanStatus.FAILED,
        isCurrent: false,
        uploadExpiresAt: null,
      },
    });
  },

  async removeFromProfile(id: string, userId: string) {
    return prisma.$transaction(async (transaction) => {
      const document = await transaction.document.findFirst({
        where: { id, userId },
        select: { publicId: true },
      });
      if (!document) return null;

      const deleted = await transaction.document.deleteMany({
        where: {
          id,
          userId,
          applications: { none: {} },
        },
      });
      if (deleted.count === 1) {
        return { publicId: document.publicId, destroyAsset: true };
      }

      const deactivated = await transaction.document.updateMany({
        where: { id, userId },
        data: { isCurrent: false },
      });
      if (deactivated.count === 1) {
        return { publicId: document.publicId, destroyAsset: false };
      }

      return null;
    });
  },

  findForRecruiter(id: string, recruiterId: string) {
    return prisma.document.findFirst({
      where: {
        id,
        scanStatus: DocumentScanStatus.CLEAN,
        applications: {
          some: { application: { vacancy: { recruiterId } } },
        },
      },
    });
  },

  findExpiredUploads(now = new Date()) {
    return prisma.document.findMany({
      where: {
        scanStatus: DocumentScanStatus.PENDING_UPLOAD,
        uploadExpiresAt: { lte: now },
      },
      select: { id: true, publicId: true },
      take: 100,
    });
  },

  deleteExpiredUpload(id: string, now = new Date()) {
    return prisma.document.deleteMany({
      where: {
        id,
        scanStatus: DocumentScanStatus.PENDING_UPLOAD,
        uploadExpiresAt: { lte: now },
      },
    });
  },
};
