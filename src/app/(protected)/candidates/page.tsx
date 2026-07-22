import { getTranslations } from 'next-intl/server';
import { TopBar } from "@/components/TopBar";
import { CandidatesList } from "@/features/candidates/components/candidates-list";

type CandidatesPageProps = {
  searchParams: Promise<{ vacancyId?: string | string[] }>;
};

export default async function CandidatesPage({ searchParams }: CandidatesPageProps) {
  const t = await getTranslations('pages');
  const { vacancyId } = await searchParams;
  const initialVacancyId = typeof vacancyId === 'string' ? vacancyId : undefined;
  return (
    <div className="h-full">
      <TopBar />
      <main className="min-w-0 p-4 sm:p-6">
        <div className="mb-5 sm:mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">{t('candidatesTitle')}</h1>
          <p className="text-neutral-600 mt-2">{t('candidatesDescription')}</p>
        </div>

        <CandidatesList initialVacancyId={initialVacancyId} />
      </main>
    </div>
  );
}
