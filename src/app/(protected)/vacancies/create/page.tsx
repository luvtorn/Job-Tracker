import { TopBar } from "@/components/TopBar";
import { CreateVacancyForm } from "@/features/vacancies/components/create-vacancy-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function CreateVacancyPage() {
  const t = await getTranslations("vacancyUi");
  return (
    <div className="h-full">
      <TopBar />
      <main className="p-6">
        <div className="mb-8">
          <Link
            href="/vacancies"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            <ArrowLeft size={18} />
            {t("back")}
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900">{t("createTitle")}</h1>
          <p className="text-neutral-600 mt-2">{t("createDescription")}</p>
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 p-8">
          <CreateVacancyForm />
        </div>
      </main>
    </div>
  );
}
