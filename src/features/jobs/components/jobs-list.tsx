"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader, Search, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';

interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string;
  position?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  createdAt: string;
  publishedAt?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function JobsList() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const t = useTranslations('jobs');
  const locale = useLocale();

  useEffect(() => {
    const loadVacancies = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
        });

        if (searchQuery) params.append("search", searchQuery);
        if (locationFilter) params.append("location", locationFilter);

        const response = await fetch(`/api/jobs?${params}`);
        if (!response.ok) throw new Error("Failed to fetch vacancies");

        const data = await response.json();
        setVacancies(data.vacancies || []);
        setPagination(data.pagination);
      } catch (err) {
        console.error("Failed to fetch vacancies:", err);
        setError(t('loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadVacancies();
  }, [searchQuery, locationFilter, currentPage, t]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  if (isLoading && vacancies.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-primary-600" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="relative">
            <MapPin
              className="absolute left-3 top-3 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder={t('location')}
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('searchButton')}
          </button>
        </div>
      </form>

      {/* Vacancies List */}
      {vacancies.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">
            {t('empty')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {vacancies.map((vacancy) => (
            <Link
              key={vacancy.id}
              href={`/jobs/${vacancy.id}`}
              className="block bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md hover:border-primary-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 hover:text-primary-600">
                    {vacancy.title}
                  </h3>
                  <p className="text-neutral-600">{vacancy.company}</p>
                </div>
              </div>

              <p className="text-neutral-600 text-sm mb-4 line-clamp-2 w-36 truncate">
                {vacancy.description}
              </p>

              <div className="flex items-center gap-4 text-sm text-neutral-600 flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  {vacancy.location}
                </div>

                {vacancy.salaryMin && (
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} />
                    {vacancy.salaryMin.toLocaleString(locale)} -{" "}
                    {vacancy.salaryMax?.toLocaleString(locale) || t('notAvailable')}{" "}
                    {vacancy.currency}
                  </div>
                )}

                {vacancy.position && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                    {vacancy.position}
                  </span>
                )}
              </div>

              <div className="text-xs text-neutral-500 mt-3">
                {t('posted', { date: new Date(vacancy.publishedAt || vacancy.createdAt).toLocaleDateString(locale) })}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('previous')}
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded-lg ${
                  currentPage === page
                    ? "bg-primary-600 text-white"
                    : "border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            onClick={() =>
              setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
            }
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('next')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
