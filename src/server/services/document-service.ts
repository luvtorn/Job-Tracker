import { randomUUID } from 'node:crypto';
import { DocumentScanStatus, DocumentType } from '@prisma/client';
import { fileTypeFromBuffer } from 'file-type';
import { z } from 'zod';
import { cloudinary } from '@/server/config/cloudinary';
import { env } from '@/server/config/env';
import {
  ApplicationError,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from '@/server/errors/application-error';
import { documentRepository } from '@/server/repositories/document-repository';
import {
  hasDocumentSizeMismatch,
  isReportedDocumentTooLarge,
  MAX_DOCUMENT_SIZE,
  readDocumentContent,
} from '@/server/services/document-content';
import {
  cloudinaryScanWebhookSchema,
  type DocumentUploadIntentInput,
} from '@/server/validators/document-validator';

const UPLOAD_INTENT_TTL_MS = 10 * 60 * 1000;
const ALLOWED_FILE_TYPES = new Map([
  ['application/pdf', 'pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
]);

const cloudinaryResourceSchema = z.object({
  public_id: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  format: z.string().min(1),
  moderation: z.array(z.object({
    kind: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
  })).optional(),
});

const getDocumentContentType = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  throw badRequest('Unsupported document format');
};

const destroyAsset = (publicId: string) =>
  cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    invalidate: true,
  });

const getModerationStatus = (
  moderation: z.infer<typeof cloudinaryResourceSchema>['moderation'],
) => moderation?.find((entry) =>
  entry.kind === 'perception_point' || entry.kind === 'metascan')?.status;

export const documentService = {
  list(userId: string) {
    return documentRepository.findCurrentByUser(userId);
  },

  async createUploadIntent(userId: string, input: DocumentUploadIntentInput) {
    const expectedExtension = ALLOWED_FILE_TYPES.get(input.contentType);
    const actualExtension = input.originalFilename.split('.').pop()?.toLowerCase();
    if (!expectedExtension || actualExtension !== expectedExtension) {
      throw badRequest('File extension does not match its type');
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `job-tracker/documents/${userId}/${randomUUID()}.${expectedExtension}`;
    const notificationUrl = `${env.appUrl}/api/integrations/cloudinary/malware-scan`;
    const uploadParameters = {
      timestamp,
      public_id: publicId,
      type: 'authenticated',
      moderation: 'perception_point',
      notification_url: notificationUrl,
    };
    const document = await documentRepository.createUploadIntent({
      userId,
      type: input.type as DocumentType,
      originalFilename: input.originalFilename,
      publicId,
      uploadExpiresAt: new Date(Date.now() + UPLOAD_INTENT_TTL_MS),
    });

    return {
      document,
      upload: {
        url: `https://api.cloudinary.com/v1_1/${encodeURIComponent(env.cloudinaryCloudName)}/raw/upload`,
        fields: {
          ...uploadParameters,
          api_key: env.cloudinaryApiKey,
          signature: cloudinary.utils.api_sign_request(
            uploadParameters,
            env.cloudinaryApiSecret,
          ),
        },
      },
    };
  },

  async completeUpload(userId: string, id: string) {
    const document = await documentRepository.findOwned(id, userId);
    if (!document) throw notFound('Document upload not found');
    if (document.scanStatus !== DocumentScanStatus.PENDING_UPLOAD) {
      if (document.scanStatus === DocumentScanStatus.SCANNING
        || document.scanStatus === DocumentScanStatus.CLEAN) {
        return document;
      }
      throw conflict('Document upload is no longer active');
    }
    if (!document.uploadExpiresAt || document.uploadExpiresAt <= new Date()) {
      await documentRepository.markFailed(id, userId);
      throw badRequest('Document upload expired');
    }

    try {
      const resource = cloudinaryResourceSchema.parse(
        await cloudinary.api.resource(document.publicId, {
          resource_type: 'raw',
          type: 'authenticated',
          moderations: true,
        }),
      );
      if (isReportedDocumentTooLarge(resource.bytes)) {
        await destroyAsset(document.publicId);
        await documentRepository.markRejected(document.publicId);
        throw badRequest('File size must be less than 10MB');
      }

      const downloadUrl = cloudinary.utils.private_download_url(
        document.publicId,
        resource.format,
        {
          resource_type: 'raw',
          type: 'authenticated',
          expires_at: Math.floor(Date.now() / 1000) + 60,
        },
      );
      const response = await fetch(downloadUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error('Uploaded document is unavailable');
      const content = await readDocumentContent(response);
      if (!content) {
        await destroyAsset(document.publicId);
        await documentRepository.markRejected(document.publicId);
        throw badRequest('File size must be less than 10MB');
      }
      if (hasDocumentSizeMismatch(content.byteLength, resource.bytes)) {
        throw new Error('Uploaded document size mismatch');
      }
      const detected = await fileTypeFromBuffer(content);
      const expectedContentType = getDocumentContentType(document.originalFilename);
      if (!detected || detected.mime !== expectedContentType) {
        await destroyAsset(document.publicId);
        await documentRepository.markRejected(document.publicId);
        throw badRequest('Document content does not match its file type');
      }

      await documentRepository.markScanning(id, userId);
      const moderationStatus = getModerationStatus(resource.moderation);
      if (moderationStatus === 'approved') {
        return await documentRepository.markClean(document.publicId);
      }
      if (moderationStatus === 'rejected') {
        await destroyAsset(document.publicId);
        await documentRepository.markRejected(document.publicId);
      }
      return documentRepository.findOwned(id, userId);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      await documentRepository.markFailed(id, userId);
      throw error;
    }
  },

  async handleScanWebhook(rawBody: string, timestamp: number, signature: string) {
    const valid = cloudinary.utils.verifyNotificationSignature(
      rawBody,
      timestamp,
      signature,
      5 * 60,
    );
    if (!valid) throw forbidden('Invalid Cloudinary notification signature');
    const payload = cloudinaryScanWebhookSchema.parse(JSON.parse(rawBody));
    const status = payload.moderation_status
      ?? payload.moderation?.find((entry) =>
        entry.kind === 'perception_point' || entry.kind === 'metascan')?.status;
    if (status === 'approved') {
      await documentRepository.markClean(payload.public_id);
    } else if (status === 'rejected') {
      await documentRepository.markRejected(payload.public_id);
      await destroyAsset(payload.public_id);
    }
  },

  async remove(userId: string, id: string) {
    const removed = await documentRepository.removeFromProfile(id, userId);
    if (!removed) throw notFound('Document not found');
    if (removed.destroyAsset) {
      await destroyAsset(removed.publicId).catch(() => undefined);
    }
  },

  async getContent(user: { id: string; role: string }, id: string) {
    const document = user.role === 'RECRUITER'
      ? await documentRepository.findForRecruiter(id, user.id)
      : await documentRepository.findOwned(id, user.id);
    if (!document || document.scanStatus !== DocumentScanStatus.CLEAN) {
      throw forbidden('You cannot access this document');
    }

    const format = document.originalFilename.split('.').pop()?.toLowerCase() || '';
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    const url = cloudinary.utils.private_download_url(document.publicId, format, {
      resource_type: 'raw',
      type: 'authenticated',
      expires_at: expiresAt,
    });
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw notFound('Document content is unavailable');
    const content = new Uint8Array(await response.arrayBuffer());
    if (content.byteLength > MAX_DOCUMENT_SIZE) {
      throw badRequest('Document exceeds the download limit');
    }

    return {
      content,
      contentType: getDocumentContentType(document.originalFilename),
      filename: document.originalFilename,
    };
  },

  async cleanupExpiredUploads() {
    const expired = await documentRepository.findExpiredUploads();
    let deleted = 0;
    for (const document of expired) {
      await destroyAsset(document.publicId).catch(() => undefined);
      deleted += (await documentRepository.deleteExpiredUpload(document.id)).count;
    }
    return deleted;
  },
};
