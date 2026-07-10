'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Archive, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface VacancyWithCandidates {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  totalCandidates: number;
  applied: number;
  interviewing: number;
  offers: number;
  accepted: number;
  rejected: number;
  archivedAt?: string | null;
}

interface VacancyOverviewProps {
  vacancies: VacancyWithCandidates[];
}

export function VacancyOverview({ vacancies: initialVacancies }: VacancyOverviewProps) {
  const [vacancies, setVacancies] = useState<VacancyWithCandidates[]>(initialVacancies);
  const [actionLoading, setActionLoading] = useState(false);

  const handleArchive = async (vacancyId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vacancies/${vacancyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (!response.ok) throw new Error('Failed to archive vacancy');
      setVacancies((prev) =>
        prev.map((v) => (v.id === vacancyId ? { ...v, archivedAt: new Date().toISOString() } : v))
      );
    } catch (error) {
      console.error('Failed to archive vacancy:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (vacancyId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vacancies/${vacancyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      });

      if (!response.ok) throw new Error('Failed to reactivate vacancy');
      setVacancies((prev) =>
        prev.map((v) => (v.id === vacancyId ? { ...v, archivedAt: null } : v))
      );
    } catch (error) {
      console.error('Failed to reactivate vacancy:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (vacancyId: string) => {
    if (!confirm('Are you sure you want to delete this vacancy?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete vacancy');
      setVacancies((prev) => prev.filter((v) => v.id !== vacancyId));
    } catch (error) {
      console.error('Failed to delete vacancy:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (vacancies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <Briefcase size={40} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-neutral-600 font-medium">No active vacancies</p>
        <p className="text-sm text-neutral-500 mt-1">Create your first job posting to start recruiting</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.05 }}
    >
      {vacancies.map((vacancy, idx) => (
        <motion.div
          key={vacancy.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white rounded-lg border border-neutral-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">{vacancy.title}</h3>
            <p className="text-sm text-neutral-600 mt-1">{vacancy.company}</p>
            {vacancy.location && (
              <p className="text-sm text-neutral-500 mt-1">{vacancy.location}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-t border-b border-neutral-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{vacancy.totalCandidates}</div>
              <p className="text-xs text-neutral-600 mt-1">Total</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{vacancy.interviewing}</div>
              <p className="text-xs text-neutral-600 mt-1">Interviews</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{vacancy.accepted}</div>
              <p className="text-xs text-neutral-600 mt-1">Accepted</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/vacancies/${vacancy.id}/candidates`}
              className="w-full px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium text-center"
            >
              View Candidates
            </Link>

            <div className="flex gap-2">
              {!vacancy.archivedAt ? (
                <button
                  onClick={() => handleArchive(vacancy.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Archive size={14} />
                  Archive
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(vacancy.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  Reactivate
                </button>
              )}

              <button
                onClick={() => handleDelete(vacancy.id)}
                disabled={actionLoading}
                className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
