'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Archive, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';

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
  const [vacancyToDelete, setVacancyToDelete] = useState<VacancyWithCandidates | null>(null);
  const { showToast } = useToast();
  const t = useTranslations('dashboard');
  const common = useTranslations('common');

  const handleArchive = async (vacancyId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vacancies/${vacancyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (!response.ok) throw new Error(t('archiveFailed'));
      setVacancies((prev) =>
        prev.map((v) => (v.id === vacancyId ? { ...v, archivedAt: new Date().toISOString() } : v))
      );
    } catch (error) {
      console.error('Failed to archive vacancy:', error);
      showToast(t('archiveFailed'), 'error');
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

      if (!response.ok) throw new Error(t('reactivateFailed'));
      setVacancies((prev) =>
        prev.map((v) => (v.id === vacancyId ? { ...v, archivedAt: null } : v))
      );
    } catch (error) {
      console.error('Failed to reactivate vacancy:', error);
      showToast(t('reactivateFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vacancyToDelete) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/vacancies/${vacancyToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(t('vacancyDeleteFailed'));
      setVacancies((prev) => prev.filter((vacancy) => vacancy.id !== vacancyToDelete.id));
      setVacancyToDelete(null);
      showToast(t('vacancyDeleted'), 'success');
    } catch (error) {
      console.error('Failed to delete vacancy:', error);
      showToast(t('vacancyDeleteFailed'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (vacancies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <Briefcase size={40} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-neutral-600 font-medium">{t('noVacancies')}</p>
        <p className="text-sm text-neutral-500 mt-1">{t('createVacancyHint')}</p>
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
              <p className="text-xs text-neutral-600 mt-1">{t('total')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{vacancy.interviewing}</div>
              <p className="text-xs text-neutral-600 mt-1">{t('interviews')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{vacancy.accepted}</div>
              <p className="text-xs text-neutral-600 mt-1">{t('accepted')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/candidates?vacancyId=${encodeURIComponent(vacancy.id)}`}
              className="w-full px-3 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium text-center"
            >
              {t('viewCandidates')}
            </Link>

            <div className="flex gap-2">
              {!vacancy.archivedAt ? (
                <button
                  onClick={() => handleArchive(vacancy.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Archive size={14} />
                  {t('archive')}
                </button>
              ) : (
                <button
                  onClick={() => handleReactivate(vacancy.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <RotateCcw size={14} />
                  {t('reactivate')}
                </button>
              )}

              <button
                onClick={() => setVacancyToDelete(vacancy)}
                disabled={actionLoading}
                className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
      {vacancyToDelete && (
        <ConfirmationDialog
          isOpen
          title={t('deleteVacancyTitle')}
          description={t('deleteVacancyDescription', { title: vacancyToDelete.title })}
          confirmLabel={common('delete')}
          variant="destructive"
          isLoading={actionLoading}
          onClose={() => setVacancyToDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </motion.div>
  );
}
