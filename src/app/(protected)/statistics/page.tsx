import { TopBar } from "@/components/TopBar";
import { StatisticsCharts } from "@/features/statistics/components/statistics-charts";

export default function StatisticsPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6 bg-neutral-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Application Statistics</h1>
          <p className="text-neutral-600 mt-2">Track your job search progress and performance metrics</p>
        </div>

        <StatisticsCharts />
      </main>
    </div>
  );
}
