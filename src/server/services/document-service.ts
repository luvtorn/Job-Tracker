import { UploadApiResponse } from 'cloudinary';
import { DocumentType } from '@prisma/client';
import { cloudinary } from '@/server/config/cloudinary';
import { badRequest, forbidden, notFound } from '@/server/errors/application-error';
import { documentRepository } from '@/server/repositories/document-repository';

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const getDocumentContentType = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  throw badRequest('Unsupported document format');
};

export const documentService = {
  list(userId: string) {
    return documentRepository.findCurrentByUser(userId);
  },
  async upload(userId: string, type: DocumentType, file: File) {
    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) throw badRequest('Only PDF and DOCX files are allowed');
    if (file.size > MAX_DOCUMENT_SIZE) throw badRequest('File size must be less than 10MB');
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'job-tracker/documents', resource_type: 'raw', type: 'authenticated', use_filename: true },
        (error, result) => error || !result ? reject(error ?? new Error('Upload failed')) : resolve(result),
      );
      stream.end(buffer);
    });
    return documentRepository.replaceCurrent(userId, type, {
      originalFilename: file.name,
      publicId: uploaded.public_id,
    });
  },
  async remove(userId: string, id: string) {
    const document = await documentRepository.findOwned(id, userId);
    if (!document) throw notFound('Document not found');
    await documentRepository.deactivate(id, userId);
  },
  async getContent(user: { id: string; role: string }, id: string) {
    const document = user.role === 'RECRUITER'
      ? await documentRepository.findForRecruiter(id, user.id)
      : await documentRepository.findOwned(id, user.id);
    if (!document) throw forbidden('You cannot access this document');

    const format = document.originalFilename.split('.').pop()?.toLowerCase() || '';
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    const url = cloudinary.utils.private_download_url(document.publicId, format, {
      resource_type: 'raw', type: 'authenticated', expires_at: expiresAt,
    });
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw notFound('Document content is unavailable');

    return {
      content: new Uint8Array(await response.arrayBuffer()),
      contentType: getDocumentContentType(document.originalFilename),
      filename: document.originalFilename,
    };
  },
};
