import { TopBar } from "@/components/TopBar";
import { QuickStats } from "@/features/dashboard/components/quick-stats";

export default function DashboardPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
          <p className="text-neutral-600">Welcome back! 👋</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Your Application Stats</h2>
          <QuickStats />
        </div>
      </main>
    </div>
  );
}
