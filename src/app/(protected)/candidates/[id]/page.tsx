import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { CandidateProfile } from '@/features/candidates/components/candidate-profile';
import { getTranslations } from 'next-intl/server';

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('candidates');
  return <div className="h-full"><TopBar /><main className="min-w-0 p-4 sm:p-6"><Link href="/candidates" className="mb-5 inline-flex items-center gap-2 font-medium text-primary-600"><ArrowLeft size={18} />{t('back')}</Link><CandidateProfile applicationId={id} /></main></div>;
}
