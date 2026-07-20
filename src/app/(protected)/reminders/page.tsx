'use client';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { RemindersWorkspace } from '@/features/workspace/components/reminders-workspace';
export default function RemindersPage() { const t = useTranslations('pages'); return <div><TopBar/><main className="p-6"><header className="mb-8"><h1 className="text-3xl font-bold text-neutral-900">{t('remindersTitle')}</h1><p className="mt-2 text-neutral-600">{t('remindersDescription')}</p></header><RemindersWorkspace/></main></div>; }
