import { TopBar } from "@/components/TopBar";
import { CandidatesList } from "@/features/candidates/components/candidates-list";

export default function CandidatesPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Candidates</h1>
          <p className="text-neutral-600 mt-2">View all candidates who applied to your vacancies</p>
        </div>

        <CandidatesList />
      </main>
    </div>
  );
}
