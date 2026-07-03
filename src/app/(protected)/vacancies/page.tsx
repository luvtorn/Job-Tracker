import { TopBar } from "@/components/TopBar";
import { VacanciesList } from "@/features/vacancies/components/vacancies-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function VacanciesPage() {
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Vacancies</h1>
            <p className="text-neutral-600 mt-2">
              Create and manage your job vacancies
            </p>
          </div>
          <Link
            href="/vacancies/create"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Create Vacancy
          </Link>
        </div>

        <VacanciesList />
      </main>
    </div>
  );
}
