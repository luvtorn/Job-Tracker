import { TopBar } from "@/components/TopBar";

export default function CandidatesPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Candidates</h1>
          <p className="text-neutral-600 mt-2">View all candidates who applied to your vacancies</p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">No candidates yet.</p>
        </div>
      </main>
    </div>
  );
}
