import { TopBar } from "@/components/TopBar";
import { StatisticsDashboard } from "@/features/statistics/components/statistics-dashboard";

export default function StatisticsPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6 bg-neutral-50 min-h-screen">
        <StatisticsDashboard />
      </main>
    </div>
  );
}
