import { TopBar } from "@/components/TopBar";

export default function StatisticsPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Statistics</h1>
          <p className="text-neutral-600 mt-2">View your vacancy performance and analytics</p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">Statistics will appear here once you have vacancies.</p>
        </div>
      </main>
    </div>
  );
}
