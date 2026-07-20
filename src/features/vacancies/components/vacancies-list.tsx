'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, CheckCircle2, Loader, RotateCcw, Search, Trash2, Edit2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/components/ui/toast';
import { useLocale, useTranslations } from 'next-intl';

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
  closedAt?: string | null;
  archivedAt?: string | null;
}

type Scope = 'active' | 'archived';
type StatusFilter = 'ALL' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
type VacancyAction =
  | { type: 'delete'; vacancy: Vacancy }
  | { type: 'status'; vacancy: Vacancy; nextStatus: 'PUBLISHED' | 'CLOSED' | 'ARCHIVED' };

export function VacanciesList() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState<Scope>('active');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'publishedAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pendingAction, setPendingAction] = useState<VacancyAction | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { showToast } = useToast();
  const t = useTranslations('vacancies');
  const locale = useLocale();

  useEffect(() => {
    const loadVacancies = async () => {
      try {
        setIsLoading(true);
        setError('');
        const params = new URLSearchParams({ scope, sortBy, sortDirection });
        if (status !== 'ALL') params.set('status', status);
        if (search.trim()) params.set('search', search.trim());
        const response = await fetch(`/api/vacancies?${params}`);
        if (!response.ok) throw new Error('Failed to fetch vacancies');
        const data = await response.json();
        setVacancies(data.vacancies || []);
      } catch (err) {
        console.error('Failed to fetch vacancies:', err);
        setError(t('loadFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadVacancies();
  }, [scope, status, search, sortBy, sortDirection, t]);

  const executeDelete = async (vacancyId: string) => {
    try {
      const response = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete vacancy');
      }

      setVacancies((currentVacancies) => currentVacancies.filter((vacancy) => vacancy.id !== vacancyId));
      showToast(t('deleted'), 'success');
      setPendingAction(null);
    } catch (err) {
      console.error('Failed to delete vacancy:', err);
      showToast(t('deleteFailed'), 'error');
    }
  };

  const executeStatusChange = async (vacancy: Vacancy, nextStatus: 'PUBLISHED' | 'CLOSED' | 'ARCHIVED') => {
    try {
      const response = await fetch(`/api/vacancies/${vacancy.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update vacancy status');
      setVacancies((currentVacancies) => currentVacancies.map((vacancy) => (
        vacancy.id === data.vacancy.id ? { ...vacancy, ...data.vacancy } : vacancy
      )));
      showToast(t('updated'), 'success');
      setPendingAction(null);
    } catch (statusError) {
      console.error('Failed to update vacancy status:', statusError);
      showToast(t('updateFailed'), 'error');
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsActionLoading(true);
    if (pendingAction.type === 'delete') {
      await executeDelete(pendingAction.vacancy.id);
    } else {
      await executeStatusChange(pendingAction.vacancy, pendingAction.nextStatus);
    }
    setIsActionLoading(false);
  };

  const getDialogContent = () => {
    if (!pendingAction) return null;
    if (pendingAction.type === 'delete') {
      return { title: 'Delete vacancy?', description: `This permanently removes “${pendingAction.vacancy.title}” and its applications. This action cannot be undone.`, confirmLabel: 'Delete', variant: 'destructive' as const };
    }
    const action = pendingAction.nextStatus === 'ARCHIVED' ? 'Archive' : pendingAction.nextStatus === 'CLOSED' ? 'Close' : 'Publish';
    const description = pendingAction.nextStatus === 'ARCHIVED'
      ? `“${pendingAction.vacancy.title}” will be removed from public jobs.`
      : pendingAction.nextStatus === 'CLOSED'
        ? `“${pendingAction.vacancy.title}” will stop accepting new applications.`
        : `“${pendingAction.vacancy.title}” will become visible in public jobs again.`;
    return { title: `${action} vacancy?`, description, confirmLabel: action, variant: 'default' as const };
  };

  const dialogContent = getDialogContent();

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
          {(['active', 'archived'] as const).map((nextScope) => (
            <button key={nextScope} onClick={() => { setScope(nextScope); setStatus('ALL'); }} className={`rounded-lg px-3 py-2 text-sm font-medium ${scope === nextScope ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>
              {t(nextScope)}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1"><Search size={18} className="absolute left-3 top-2.5 text-neutral-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search')} className="w-full rounded-lg border border-neutral-200 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>
          <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <option value="ALL">{t('allStatuses')}</option><option value="PUBLISHED">{t('published')}</option><option value="CLOSED">{t('closed')}</option><option value="ARCHIVED">{t('archived')}</option>
          </select>
          <select value={`${sortBy}:${sortDirection}`} onChange={(event) => { const [nextSortBy, nextSortDirection] = event.target.value.split(':') as ['createdAt' | 'publishedAt', 'asc' | 'desc']; setSortBy(nextSortBy); setSortDirection(nextSortDirection); }} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <option value="createdAt:desc">Newest created</option><option value="createdAt:asc">Oldest created</option><option value="publishedAt:desc">Newest published</option><option value="publishedAt:asc">Oldest published</option>
          </select>
        </div>
      </div>

      {vacancies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
          {search || status !== 'ALL' || scope === 'archived'
            ? t('noMatch')
            : t('empty')}
        </div>
      ) : vacancies.map((vacancy) => (
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
                aria-label={`Edit ${vacancy.title}`}
              >
                <Edit2 size={18} />
              </Link>
              {vacancy.status === 'PUBLISHED' && (
                <button onClick={() => setPendingAction({ type: 'status', vacancy, nextStatus: 'CLOSED' })} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors" aria-label={`Close ${vacancy.title}`}><XCircle size={18} /></button>
              )}
              {(vacancy.status === 'PUBLISHED' || vacancy.status === 'CLOSED') && (
                <button
                  onClick={() => setPendingAction({ type: 'status', vacancy, nextStatus: 'ARCHIVED' })}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  aria-label={`Archive ${vacancy.title}`}
                >
                  <Archive size={18} />
                </button>
              )}
              {vacancy.status === 'ARCHIVED' && (
                <button onClick={() => setPendingAction({ type: 'status', vacancy, nextStatus: 'PUBLISHED' })} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" aria-label={`Reactivate ${vacancy.title}`}><RotateCcw size={18} /></button>
              )}
              {vacancy.status === 'CLOSED' && (
                <button onClick={() => setPendingAction({ type: 'status', vacancy, nextStatus: 'PUBLISHED' })} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" aria-label={`Publish ${vacancy.title}`}><CheckCircle2 size={18} /></button>
              )}
              <button
                onClick={() => setPendingAction({ type: 'delete', vacancy })}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label={`Delete ${vacancy.title}`}
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
                : vacancy.status === 'ARCHIVED'
                  ? 'bg-neutral-100 text-neutral-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {vacancy.status}
            </span>
          </div>

          <div className="text-xs text-neutral-500">
            {t('created', { date: new Date(vacancy.createdAt).toLocaleDateString(locale) })}
          </div>
        </div>
      ))}
      {dialogContent && <ConfirmationDialog isOpen onClose={() => setPendingAction(null)} onConfirm={() => void confirmAction()} isLoading={isActionLoading} {...dialogContent} />}
    </motion.div>
  );
}
