'use client';

import { useEffect, useState } from 'react';
import { Download, Eye, FileText, Loader2, Upload } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { DocumentPreviewDialog } from '@/components/ui/document-preview-dialog';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

type DocumentType = 'RESUME' | 'COVER_LETTER';
type ProfileDocument = { id: string; type: DocumentType; originalFilename: string; createdAt: string };

export function CareerDocuments() {
  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingType, setLoadingType] = useState<DocumentType | null>(null);
  const [documentToRemove, setDocumentToRemove] = useState<ProfileDocument | null>(null);
  const [documentToPreview, setDocumentToPreview] = useState<ProfileDocument | null>(null);
  const { showToast } = useToast();
  const t = useTranslations('profileUi');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/documents');
        if (response.ok) setDocuments((await response.json()).documents || []);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const upload = async (type: DocumentType, file?: File) => {
    if (!file) return;
    setLoadingType(type);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('type', type);
      const response = await fetch('/api/documents', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(t('uploadFailed'));
      setDocuments((current) => [data.document, ...current.filter((document) => document.type !== type)]);
      showToast(t('uploaded', { document: type === 'RESUME' ? t('resume') : t('coverLetter') }), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('uploadFailed'), 'error');
    } finally {
      setLoadingType(null);
    }
  };

  const remove = async () => {
    if (!documentToRemove) return;
    setLoadingType(documentToRemove.type);
    try {
      const response = await fetch(`/api/documents/${documentToRemove.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(t('removeFailed'));
      setDocuments((current) => current.filter((document) => document.id !== documentToRemove.id));
      setDocumentToRemove(null);
      showToast(t('removed'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('removeFailed'), 'error');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h3 className="text-lg font-semibold text-neutral-900">{t('careerDocuments')}</h3>
      <p className="mt-1 text-sm text-neutral-600">{t('documentsHelp')}</p>
      {isLoading ? <div className="mt-6 grid gap-4 sm:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl border border-neutral-200 bg-neutral-50" />)}</div> :
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(['RESUME', 'COVER_LETTER'] as const).map((type) => {
          const document = documents.find((item) => item.type === type);
          const label = type === 'RESUME' ? t('resume') : t('coverLetter');
          return (
            <div key={type} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-start gap-3"><FileText className="text-primary-600" size={22} /><div className="min-w-0"><p className="font-semibold text-neutral-900">{label}</p><p className="truncate text-sm text-neutral-500">{document?.originalFilename || t('notUploaded')}</p></div></div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="col-span-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 sm:col-span-1">
                  {loadingType === type ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {document ? t('replace') : t('upload')}
                  <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" disabled={loadingType !== null} onChange={(event) => void upload(type, event.target.files?.[0])} />
                </label>
                {document && <button onClick={() => setDocumentToPreview(document)} className="inline-flex min-w-0 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50" aria-label={t('previewLabel', { document: label })}><Eye size={16} />{t('preview')}</button>}
                {document && <a href={`/api/documents/${document.id}/content?disposition=attachment`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50" aria-label={t('downloadLabel', { document: label })}><Download size={16} />{t('download')}</a>}
                {document && <button onClick={() => setDocumentToRemove(document)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">{t('remove')}</button>}
              </div>
            </div>
          );
        })}
      </div>}
      <ConfirmationDialog isOpen={Boolean(documentToRemove)} title={t('removeTitle')} description={t('removeDescription')} confirmLabel={t('remove')} variant="destructive" isLoading={loadingType !== null} onClose={() => setDocumentToRemove(null)} onConfirm={() => void remove()} />
      <DocumentPreviewDialog key={documentToPreview?.id ?? 'closed'} document={documentToPreview} onClose={() => setDocumentToPreview(null)} />
    </div>
  );
}
