'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, ExternalLink, FileWarning, Loader2, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from 'next-intl';

export type PreviewDocument = { id: string; originalFilename: string };

type Props = { document: PreviewDocument | null; onClose: () => void };

export function DocumentPreviewDialog({ document, onClose }: Props) {
  const [objectUrl, setObjectUrl] = useState('');
  const [error, setError] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();
  const t = useTranslations('documents');

  useEffect(() => {
    if (!document) return;
    const controller = new AbortController();
    let createdUrl = '';
    closeRef.current?.focus();

    const load = async () => {
      try {
        const response = await fetch(`/api/documents/${document.id}/content`, { signal: controller.signal });
        if (!response.ok) throw new Error(t('loadFailed'));
        const blob = await response.blob();
        createdUrl = URL.createObjectURL(blob);
        if (document.originalFilename.toLowerCase().endsWith('.docx')) {
          const { renderAsync } = await import('docx-preview');
          if (!contentRef.current) return;
          contentRef.current.replaceChildren();
          await renderAsync(blob, contentRef.current, undefined, { inWrapper: true, breakPages: true });
        }
        setObjectUrl(createdUrl);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        const message = loadError instanceof Error ? loadError.message : t('loadFailed');
        setError(message);
        showToast(message, 'error');
      }
    };
    void load();
    return () => {
      controller.abort();
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [document, showToast, t]);

  useEffect(() => {
    if (!document) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = contentRef.current?.closest('[role="dialog"]')?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && globalThis.document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && globalThis.document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    globalThis.document.addEventListener('keydown', onKeyDown);
    return () => globalThis.document.removeEventListener('keydown', onKeyDown);
  }, [document, onClose]);

  const downloadUrl = document ? `/api/documents/${document.id}/content?disposition=attachment` : '';
  const isPdf = document?.originalFilename.toLowerCase().endsWith('.pdf');

  return <AnimatePresence>{document && <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 p-0 backdrop-blur-sm sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <motion.div role="dialog" aria-modal="true" aria-label={`Preview ${document.originalFilename}`} initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }} className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[90vh] sm:max-w-5xl sm:rounded-2xl">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5"><div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-neutral-900">{document.originalFilename}</h2><p className="text-xs text-neutral-500">{t('securePreview')}</p></div><a href={downloadUrl} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"><Download size={16} /><span className="hidden sm:inline">{t('download')}</span></a>{objectUrl && <a href={objectUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-neutral-200 p-2 text-neutral-700 hover:bg-neutral-50" aria-label={t('open')}><ExternalLink size={18} /></a>}<button ref={closeRef} onClick={onClose} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100" aria-label={t('close')}><X size={20} /></button></header>
      <div className="relative flex-1 overflow-auto bg-neutral-100 p-2 sm:p-5">
        {!objectUrl && !error && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-primary-600" size={30} /></div>}
        {error && <div className="flex h-full items-center justify-center"><div className="max-w-sm rounded-xl bg-white p-6 text-center shadow-sm"><FileWarning className="mx-auto text-amber-500" size={34} /><p className="mt-3 font-semibold text-neutral-900">{t('unavailable')}</p><p className="mt-1 text-sm text-neutral-600">{t('fallback')}</p></div></div>}
        {isPdf && objectUrl && <iframe title={document.originalFilename} src={objectUrl} className="h-full min-h-[70vh] w-full rounded-lg bg-white" />}
        {!isPdf && <div ref={contentRef} className="docx-preview mx-auto min-h-full max-w-4xl overflow-hidden bg-white shadow-sm" />}
      </div>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
