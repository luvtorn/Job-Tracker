'use client';

import { DashboardMetrics } from './dashboard-metrics';
import { DashboardCharts } from './dashboard-charts';
import { UpcomingInterviews } from './upcoming-interviews';
import { RecentActivity } from './recent-activity';
import { QuickActions } from './quick-actions';
import { QuickStats } from '../quick-stats';
import { RemindersWorkspace } from '@/features/workspace/components/reminders-workspace';

export function SeekerDashboard() {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Overview</h2>
        <QuickStats />
      </section>

      {/* Key Metrics */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Your Metrics</h2>
        <DashboardMetrics />
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Quick Actions</h2>
        <QuickActions />
      </section>

      {/* Charts and Interviews Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Analytics</h2>
          <DashboardCharts />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Upcoming Interviews</h2>
            <UpcomingInterviews />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Due reminders</h2>
            <RemindersWorkspace compact />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Recent Activity</h2>
        <RecentActivity />
      </section>
    </div>
  );
}
