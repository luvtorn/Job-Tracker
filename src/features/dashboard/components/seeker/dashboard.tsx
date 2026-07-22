'use client';

import { DashboardMetrics } from './dashboard-metrics';
import { DashboardCharts } from './dashboard-charts';
import { UpcomingInterviews } from './upcoming-interviews';
import { RecentActivity } from './recent-activity';
import { QuickActions } from './quick-actions';
import { QuickStats } from '../quick-stats';
import { RemindersWorkspace } from '@/features/workspace/components/reminders-workspace';
import { useTranslations } from 'next-intl';

export function SeekerDashboard() {
  const t = useTranslations('dashboard');
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('quickOverview')}</h2>
        <QuickStats />
      </section>

      {/* Key Metrics */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('metrics')}</h2>
        <DashboardMetrics />
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('quickActions')}</h2>
        <QuickActions />
      </section>

      {/* Charts and Interviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('analytics')}</h2>
          <DashboardCharts />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('upcomingInterviews')}</h2>
            <UpcomingInterviews />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('dueReminders')}</h2>
            <RemindersWorkspace compact />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">{t('recentActivity')}</h2>
        <RecentActivity />
      </section>
    </div>
  );
}
