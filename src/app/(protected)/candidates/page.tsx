'use client';
import { useTranslations } from 'next-intl';
import { TopBar } from "@/components/TopBar";
import { CandidatesList } from "@/features/candidates/components/candidates-list";

export default function CandidatesPage() {
  const t = useTranslations('pages');
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">{t('candidatesTitle')}</h1>
          <p className="text-neutral-600 mt-2">{t('candidatesDescription')}</p>
        </div>

        <CandidatesList />
      </main>
    </div>
  );
}
