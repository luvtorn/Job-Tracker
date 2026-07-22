type VacancyStatistics = {
  id: string;
  title: string;
  status: string;
  total: number;
  pending: number;
  interviewing: number;
  offers: number;
  hired: number;
  rejected: number;
  hireRate: number;
};

export function RecruiterVacancyStatistics({ vacancies }: { vacancies: VacancyStatistics[] }) {
  const t = useTranslations('statisticsUi');
  const vacancyT = useTranslations('vacancies');
  const headers = [t('total'), t('pending'), t('interviewing'), t('offers'), t('hired'), t('rejected'), t('hireRate')];
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{t('byVacancy')}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="pb-3 font-medium">{t('vacancy')}</th>
              {headers.map((label) => (
                <th key={label} className="pb-3 text-center font-medium">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vacancies.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-neutral-500">
                  {t('noVacancies')}
                </td>
              </tr>
            )}
            {vacancies.map((vacancy) => (
              <tr key={vacancy.id} className="border-b border-neutral-100 last:border-0">
                <td className="py-4">
                  <p className="font-medium text-neutral-900">{vacancy.title}</p>
                  <p className="text-xs text-neutral-500">{vacancy.status === 'PUBLISHED' ? vacancyT('published') : vacancy.status === 'CLOSED' ? vacancyT('closed') : vacancyT('archived')}</p>
                </td>
                <td className="py-4 text-center">{vacancy.total}</td>
                <td className="py-4 text-center">{vacancy.pending}</td>
                <td className="py-4 text-center">{vacancy.interviewing}</td>
                <td className="py-4 text-center">{vacancy.offers}</td>
                <td className="py-4 text-center">{vacancy.hired}</td>
                <td className="py-4 text-center">{vacancy.rejected}</td>
                <td className="py-4 text-center font-medium">{vacancy.hireRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
import { useTranslations } from 'next-intl';
