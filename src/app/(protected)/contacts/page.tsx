'use client';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { ContactsWorkspace } from '@/features/workspace/components/contacts-workspace';
export default function ContactsPage() { const t = useTranslations('pages'); return <div><TopBar/><main className="p-6"><header className="mb-8"><h1 className="text-3xl font-bold text-neutral-900">{t('contactsTitle')}</h1><p className="mt-2 text-neutral-600">{t('contactsDescription')}</p></header><ContactsWorkspace/></main></div>; }
