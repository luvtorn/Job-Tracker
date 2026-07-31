'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, ExternalLink, Eye, FileWarning, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

type DocumentPreviewDialogProps = {
  documentId: string;
  filename: string;
  triggerLabel: string;
  triggerAriaLabel: string;
};

export function DocumentPreviewDialog({
  documentId,
  filename,
  triggerLabel,
  triggerAriaLabel,
}: DocumentPreviewDialogProps) {
  const t = useTranslations('documents');
  const commonT = useTranslations('common');
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      setHasError(false);
      setPreviewUrl(null);

      try {
        const response = await fetch(`/api/documents/${documentId}/content`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok || response.headers.get('content-type') !== 'application/pdf') {
          throw new Error('Document preview is unavailable');
        }

        objectUrl = URL.createObjectURL(await response.blob());
        if (!controller.signal.aborted) setPreviewUrl(objectUrl);
      } catch {
        if (!controller.signal.aborted) setHasError(true);
      }
    };

    void loadPreview();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={triggerAriaLabel}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Eye size={16} />
          {triggerLabel}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-neutral-950/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[90vh] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl focus:outline-none">
          <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-semibold text-neutral-900">
                {t('securePreview')}
              </Dialog.Title>
              <Dialog.Description className="truncate text-sm text-neutral-500">
                {filename}
              </Dialog.Description>
            </div>
            <a
              href={`/api/documents/${documentId}/content`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('open')}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">{t('open')}</span>
            </a>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('close')}
                className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 bg-neutral-100 p-2 sm:p-4">
            {!previewUrl && !hasError && (
              <div className="flex h-full items-center justify-center" role="status">
                <Loader2 className="animate-spin text-primary-600" size={28} />
                <span className="sr-only">{commonT('loading')}</span>
              </div>
            )}
            {hasError && (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <FileWarning className="text-amber-600" size={40} />
                <p className="mt-3 font-semibold text-neutral-900">{t('unavailable')}</p>
                <p className="mt-1 text-sm text-neutral-600">{t('fallback')}</p>
                <a
                  href={`/api/documents/${documentId}/download`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <Download size={16} />
                  {t('download')}
                </a>
              </div>
            )}
            {previewUrl && (
              <iframe
                src={previewUrl}
                title={`${t('securePreview')}: ${filename}`}
                className="h-full w-full rounded-lg border-0 bg-white"
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
