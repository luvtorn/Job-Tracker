import { TopBar } from "@/components/TopBar";
import { ApplicationsList } from "@/features/applications/components/applications-list";

export default function ApplicationsPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">My Applications</h1>
          <p className="text-neutral-600 mt-2">Track your job applications and their status</p>
        </div>

        <ApplicationsList />
      </main>
    </div>
  );
}
