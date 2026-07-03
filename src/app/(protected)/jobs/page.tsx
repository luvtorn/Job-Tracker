import { TopBar } from "@/components/TopBar";
import { JobsList } from "@/features/jobs/components/jobs-list";

export default function JobsPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Find Jobs</h1>
          <p className="text-neutral-600 mt-2">Browse and apply to open positions</p>
        </div>

        <JobsList />
      </main>
    </div>
  );
}
