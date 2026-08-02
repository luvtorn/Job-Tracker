'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { MessagesWorkspace } from '@/features/chat/components/messages-workspace';

export default function MessagesPage() {
  const t = useTranslations('chatUi');
  return <div className="min-h-screen bg-neutral-50"><TopBar /><main className="p-4 sm:p-6 lg:p-8"><div className="mb-6"><h1 className="text-3xl font-bold text-neutral-900">{t('title')}</h1><p className="mt-2 text-neutral-600">{t('description')}</p></div><Suspense fallback={<div className="h-[560px] animate-pulse rounded-2xl bg-white" />}><MessagesWorkspace /></Suspense></main></div>;
}
