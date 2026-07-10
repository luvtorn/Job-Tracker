'use client';

import { useRecruiterDashboard } from '@/hooks/use-recruiter-dashboard';
import { RecruiterMetrics } from './recruiter-metrics';
import { VacancyOverview } from './vacancy-overview';
import { RecentApplications } from './recent-applications';
import { CandidatesByStage } from './candidates-by-stage';
import { Loader } from 'lucide-react';

export function RecruiterDashboard() {
  const { data, isLoading, error } = useRecruiterDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Failed to load dashboard data</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Overview</h2>
        <RecruiterMetrics metrics={data.metrics} />
      </section>

      {/* Vacancies and Applications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Active Vacancies</h2>
          <VacancyOverview vacancies={data.vacancies} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Recent Applications</h2>
          <RecentApplications applications={data.recentApplications} />
        </div>
      </div>

      {/* Candidate Pipeline */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Recruitment Pipeline</h2>
        <CandidatesByStage candidates={data.candidatesByStage} />
      </section>
    </div>
  );
}
