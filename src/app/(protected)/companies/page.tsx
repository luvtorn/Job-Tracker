'use client';
import { useTranslations } from 'next-intl';
import { TopBar } from '@/components/TopBar';
import { CompaniesWorkspace } from '@/features/workspace/components/companies-workspace';
export default function CompaniesPage() { const t = useTranslations('pages'); return <div><TopBar/><main className="p-6"><header className="mb-8"><h1 className="text-3xl font-bold text-neutral-900">{t('companiesTitle')}</h1><p className="mt-2 text-neutral-600">{t('companiesDescription')}</p></header><CompaniesWorkspace/></main></div>; }
