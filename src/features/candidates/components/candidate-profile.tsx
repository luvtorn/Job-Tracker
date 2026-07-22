'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Download, Eye, FileText, Loader2, Mail } from 'lucide-react';
import { DocumentPreviewDialog, PreviewDocument } from '@/components/ui/document-preview-dialog';

type CandidateProfileData = {
  id: string;
  status: string;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null; email: string; avatarUrl: string | null; createdAt: string };
  vacancy: { title: string; company: string | null };
  documents: Array<{ type: 'RESUME' | 'COVER_LETTER'; document: { id: string; originalFilename: string; createdAt: string } }>;
};

export function CandidateProfile({ applicationId }: { applicationId: string }) {
  const t = useTranslations('candidates');
  const documentT = useTranslations('documents');
  const locale = useLocale();
  const [data, setData] = useState<CandidateProfileData | null>(null);
  const [error, setError] = useState('');
  const [documentToPreview, setDocumentToPreview] = useState<PreviewDocument | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/applications/${applicationId}/candidate-profile`);
      const result = await response.json();
      if (!response.ok) {
        setError(result.message || t('profileLoadFailed'));
        return;
      }
      setData(result.application);
    };
    void load();
  }, [applicationId, t]);

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div>;
  if (!data) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary-600" /></div>;

  const name = `${data.user.firstName ?? ''} ${data.user.lastName ?? ''}`.trim() || data.user.email;

  return <div className="space-y-4 sm:space-y-6">
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        {data.user.avatarUrl ? <Image src={data.user.avatarUrl} alt={name} width={80} height={80} className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-xl font-bold text-primary-700 sm:h-20 sm:w-20 sm:text-2xl">{name.slice(0, 1)}</div>}
        <div className="min-w-0"><h2 className="break-words text-xl font-bold text-neutral-900 sm:text-2xl">{name}</h2><p className="mt-1 flex min-w-0 items-center gap-2 text-neutral-600"><Mail size={16} className="shrink-0" /><span className="break-all">{data.user.email}</span></p><p className="mt-2 text-sm text-neutral-500">{t('appliedFor', { vacancy: data.vacancy.title, date: new Date(data.createdAt).toLocaleDateString(locale) })}</p></div>
      </div>
    </section>
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-neutral-900">{t('applicationDocuments')}</h3>
      <div className="mt-4 space-y-3">{data.documents.length === 0 ? <p className="rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">{t('noDocuments')}</p> : data.documents.map(({ type, document }) => <div key={type} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><FileText className="shrink-0 text-primary-600" /><div className="min-w-0"><p className="font-medium text-neutral-900">{type === 'RESUME' ? t('resume') : t('coverLetter')}</p><p className="truncate text-sm text-neutral-500">{document.originalFilename}</p></div></div><div className="grid grid-cols-2 gap-2 sm:flex"><button onClick={() => setDocumentToPreview(document)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"><Eye size={16} />{t('preview')}</button><a href={`/api/documents/${document.id}/content?disposition=attachment`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"><Download size={16} />{documentT('download')}</a></div></div>)}</div>
    </section>
    <DocumentPreviewDialog key={documentToPreview?.id ?? 'closed'} document={documentToPreview} onClose={() => setDocumentToPreview(null)} />
  </div>;
}
