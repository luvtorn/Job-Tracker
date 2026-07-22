'use client';

import { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, Clock, Handshake, UserCheck, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RecruiterVacancyStatistics } from './recruiter-vacancy-statistics';
import { useLocale, useTranslations } from 'next-intl';

type Period = '30' | '90' | 'all';
type RecruiterStatisticsData = {
  summary: { total: number; pending: number; interviewing: number; offers: number; hired: number };
  statusDistribution: Array<{ status: string; name: string; value: number; fill: string }>;
  applicationsOverTime: Array<{ label: string; count: number }>;
  vacancies: Array<{
    id: string; title: string; status: string; total: number; pending: number;
    interviewing: number; offers: number; hired: number; rejected: number; hireRate: number;
  }>;
};

export function RecruiterStatistics() {
  const t = useTranslations('statisticsUi');
  const common = useTranslations('common');
  const statusT = useTranslations('statuses');
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>('30');
  const [data, setData] = useState<RecruiterStatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/recruiter/statistics?period=${period}`);
      const result = await response.json();
      if (!response.ok) throw new Error(t('loadFailed'));
      setData(result);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : t('loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [period, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetching is synchronized with the selected reporting period.
    void fetchStatistics();
  }, [fetchStatistics]);

  if (isLoading && !data) {
    return <div className="h-80 animate-pulse rounded-xl bg-neutral-200" />;
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p>{error}</p>
        <button onClick={() => void fetchStatistics()} className="mt-3 font-medium underline">{common('tryAgain')}</button>
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    { label: t('applicationsReceived'), value: data.summary.total, icon: Users },
    { label: t('pendingReview'), value: data.summary.pending, icon: Clock },
    { label: t('currentInterviews'), value: data.summary.interviewing, icon: BriefcaseBusiness },
    { label: t('offers'), value: data.summary.offers, icon: Handshake },
    { label: t('hires'), value: data.summary.hired, icon: UserCheck },
  ];
  const visibleDistribution = data.statusDistribution.filter((item) => item.value > 0).map((item) => ({
    ...item,
    name: statusT(item.status.toLowerCase() as 'applied' | 'interviewing' | 'offer' | 'accepted' | 'rejected' | 'withdrawn'),
  }));
  const periods: Array<{ value: Period; label: string }> = [
    { value: '30', label: t('days30') },
    { value: '90', label: t('days90') },
    { value: 'all', label: t('allTime') },
  ];
  const timeline = data.applicationsOverTime.map((item) => ({
    ...item,
    label: new Intl.DateTimeFormat(locale, item.label.length === 7 ? { month: 'short', year: 'numeric', timeZone: 'UTC' } : { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.label}${item.label.length === 7 ? '-01' : ''}T00:00:00Z`)),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
          {periods.map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${period === item.value ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {isLoading && <span className="text-sm text-neutral-500">{t('updating')}</span>}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <Icon className="mb-3 text-primary-600" size={22} />
            <p className="text-3xl font-bold text-neutral-900">{value}</p>
            <p className="mt-1 text-sm text-neutral-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{t('statusDistribution')}</h2>
          {visibleDistribution.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={visibleDistribution} dataKey="value" nameKey="name" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                  {visibleDistribution.map((item) => <Cell key={item.status} fill={item.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex h-[300px] items-center justify-center text-neutral-500">{t('noApplicationsPeriod')}</div>}
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{t('applicationsOverTime')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeline} margin={{ left: 0, right: 10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" angle={-35} textAnchor="end" fontSize={11} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <RecruiterVacancyStatistics vacancies={data.vacancies} />
    </div>
  );
}
