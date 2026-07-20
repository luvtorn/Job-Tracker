import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { CreateVacancyForm } from "@/features/vacancies/components/create-vacancy-form";

export default async function EditVacancyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <Link href="/vacancies" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4">
            <ArrowLeft size={18} />
            Back to Vacancies
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900">Edit Vacancy</h1>
          <p className="text-neutral-600 mt-2">Update this job opening&apos;s details</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-8">
          <CreateVacancyForm vacancyId={id} />
        </div>
      </main>
    </div>
  );
}
