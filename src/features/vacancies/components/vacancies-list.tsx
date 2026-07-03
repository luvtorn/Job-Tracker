'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

export function VacanciesList() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vacancies');

      if (!response.ok) {
        throw new Error('Failed to fetch vacancies');
      }

      const data = await response.json();
      setVacancies(data.vacancies || []);
    } catch (err) {
      console.error('Failed to fetch vacancies:', err);
      setError('Failed to load vacancies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (vacancyId: string) => {
    if (!confirm('Are you sure you want to delete this vacancy?')) return;

    try {
      const response = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete vacancy');
      }

      setVacancies(vacancies.filter((v) => v.id !== vacancyId));
    } catch (err) {
      console.error('Failed to delete vacancy:', err);
      alert('Failed to delete vacancy');
    }
  };

  if (isLoading) {
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

  if (vacancies.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
        <p className="text-neutral-600">No vacancies yet. Create your first vacancy to get started.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {vacancies.map((vacancy) => (
        <div
          key={vacancy.id}
          className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900">{vacancy.title}</h3>
              <p className="text-neutral-600">{vacancy.company}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/vacancies/${vacancy.id}/edit`}
                className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
              </Link>
              <button
                onClick={() => handleDelete(vacancy.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
            <span>📍 {vacancy.location}</span>
            {vacancy.salaryMin && (
              <span>
                💰 {vacancy.salaryMin.toLocaleString()} - {vacancy.salaryMax?.toLocaleString() || 'N/A'} {vacancy.currency}
              </span>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              vacancy.status === 'PUBLISHED'
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {vacancy.status}
            </span>
          </div>

          <div className="text-xs text-neutral-500">
            Created {new Date(vacancy.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
