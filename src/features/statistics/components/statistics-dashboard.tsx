'use client';

import { useAuth } from '@/features/auth/context/auth-context';
import { RecruiterStatistics } from './recruiter-statistics';
import { StatisticsCharts } from './statistics-charts';

export function StatisticsDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="h-80 animate-pulse rounded-xl bg-neutral-200" />;
  const isRecruiter = user?.role === 'RECRUITER';

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">
          {isRecruiter ? 'Recruitment Statistics' : 'Application Statistics'}
        </h1>
        <p className="mt-2 text-neutral-600">
          {isRecruiter
            ? 'Monitor incoming applications and current candidate outcomes'
            : 'Track your job search progress and performance metrics'}
        </p>
      </div>
      {isRecruiter ? <RecruiterStatistics /> : <StatisticsCharts />}
    </>
  );
}
