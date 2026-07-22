'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, ChevronDown, Mail, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ScheduleInterviewModal } from './schedule-interview-modal';
import { useLocale, useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/toast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

interface Candidate {
  id: string;
  status: string;
  createdAt: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewNotes?: string;
  user: User;
}

interface Vacancy {
  id: string;
  title: string;
  company: string;
  position: string;
}

const statusColors: Record<string, { bg: string; text: string; badge: string }> = {
  APPLIED: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
  INTERVIEWING: { bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100' },
  OFFER: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100' },
  ACCEPTED: { bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100' },
  WITHDRAWN: { bg: 'bg-neutral-50', text: 'text-neutral-700', badge: 'bg-neutral-100' },
};

const statusOptions = ['APPLIED', 'INTERVIEWING', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'];

interface SelectedCandidate {
  candidateId: string;
  name: string;
  vacancyTitle: string;
}

export function CandidatesList() {
  const t = useTranslations('candidates');
  const statusT = useTranslations('statuses');
  const locale = useLocale();
  const { showToast } = useToast();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string>('');
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string>('');
  const [statusError, setStatusError] = useState<{ candidateId: string; message: string } | null>(null);
  const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState<SelectedCandidate | null>(null);
  const [showInterviewsPanel, setShowInterviewsPanel] = useState(false);
  const [view, setView] = useState<'list' | 'board'>('board');
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  const [dragTargetStatus, setDragTargetStatus] = useState<string | null>(null);

  const statusLabel = (status: string) => statusT(status.toLowerCase() as 'applied' | 'interviewing' | 'offer' | 'accepted' | 'rejected' | 'withdrawn');

  useEffect(() => {
    const loadVacancies = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/vacancies');
        if (!response.ok) throw new Error('Failed to fetch vacancies');

        const data = await response.json();
        const availableVacancies: Vacancy[] = data.vacancies || [];
        setVacancies(availableVacancies);
        if (availableVacancies.length > 0) setSelectedVacancyId(availableVacancies[0].id);
      } catch (err) {
        console.error('Failed to fetch vacancies:', err);
        setError('Failed to load vacancies');
      } finally {
        setIsLoading(false);
      }
    };

    void loadVacancies();
  }, []);

  useEffect(() => {
    if (!selectedVacancyId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Clearing data when no vacancy is selected.
      setCandidates([]);
      return;
    }

    const loadCandidates = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/vacancies/${selectedVacancyId}/candidates`);
        if (!response.ok) throw new Error('Failed to fetch candidates');
        const data = await response.json();
        setCandidates(data.applications || []);
      } catch (err) {
        console.error('Failed to fetch candidates:', err);
        setError('Failed to load candidates');
      } finally {
        setIsLoading(false);
      }
    };

    void loadCandidates();
  }, [selectedVacancyId]);

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate || candidate.status === newStatus || isUpdating === candidateId) return;

    if (newStatus === 'INTERVIEWING') {
      setSelectedCandidateForInterview({
        candidateId,
        name: `${candidate.user.firstName} ${candidate.user.lastName}`,
        vacancyTitle: vacancies.find(v => v.id === selectedVacancyId)?.title || '',
      });
      setOpenDropdown('');
      return;
    }

    const previousStatus = candidate.status;
    try {
      setIsUpdating(candidateId);
      setStatusError(null);
      setCandidates((current) => current.map((item) => item.id === candidateId ? { ...item, status: newStatus } : item));
      setOpenDropdown('');

      const response = await fetch(`/api/applications/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('updateFailed'));
      }
      showToast(t('updated'), 'success');
    } catch (err) {
      console.error('Failed to update status:', err);
      const message = err instanceof Error ? err.message : t('updateFailed');
      setCandidates((current) => current.map((item) => item.id === candidateId ? { ...item, status: previousStatus } : item));
      setStatusError({ candidateId, message });
      showToast(message, 'error');
    } finally {
      setIsUpdating('');
    }
  };

  const handleScheduleInterview = async (data: {
    interviewDate: string;
    interviewTime: string;
    interviewNotes?: string;
  }) => {
    const candidateId = selectedCandidateForInterview?.candidateId;
    if (!candidateId) return;

    try {
      const interviewRes = await fetch(
        `/api/applications/${candidateId}/interview`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!interviewRes.ok) {
        const err = await interviewRes.json();
        throw new Error(err.message || t('scheduleFailed'));
      }

      setCandidates((current) =>
        current.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                status: 'INTERVIEWING',
              }
            : c
        )
      );

      setSelectedCandidateForInterview(null);
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      setStatusError({
        candidateId: selectedCandidateForInterview?.candidateId || '',
        message: err instanceof Error ? err.message : t('genericError'),
      });
    }
  };

  if (isLoading && vacancies.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={24} />
      </div>
    );
  }

  if (error && vacancies.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (vacancies.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
        <p className="text-neutral-600">{t('noVacancies')}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-4 sm:space-y-6">
      {/* Schedule Interview Modal */}
      {selectedCandidateForInterview && (
        <ScheduleInterviewModal
          isOpen={!!selectedCandidateForInterview}
          candidateName={selectedCandidateForInterview.name}
          vacancyTitle={selectedCandidateForInterview.vacancyTitle}
          onClose={() => setSelectedCandidateForInterview(null)}
          onSubmit={handleScheduleInterview}
        />
      )}

      {/* Interviews Summary Panel */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <button
          onClick={() => setShowInterviewsPanel(!showInterviewsPanel)}
          className="flex w-full items-center justify-between gap-3 text-left font-medium text-neutral-900 transition-colors hover:text-blue-600"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Clock size={18} className="shrink-0" />
            {t('scheduledInterviews', { count: candidates.filter(c => c.status === 'INTERVIEWING' && c.interviewDate).length })}
          </div>
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform ${showInterviewsPanel ? 'rotate-180' : ''}`}
          />
        </button>

        {showInterviewsPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3 max-h-96 overflow-y-auto"
          >
            {candidates.filter(c => c.status === 'INTERVIEWING' && c.interviewDate).length === 0 ? (
              <p className="text-sm text-neutral-500 italic">{t('noInterviews')}</p>
            ) : (
              candidates
                .filter(c => c.status === 'INTERVIEWING' && c.interviewDate)
                .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime())
                .map((candidate) => (
                  <div key={candidate.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 truncate">
                          {candidate.user.firstName} {candidate.user.lastName}
                        </p>
                        <p className="text-sm text-neutral-600 truncate">{candidate.user.email}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-purple-700">
                      <Calendar size={14} />
                      {new Date(candidate.interviewDate!).toLocaleDateString(locale)} {t('at')} {candidate.interviewTime}
                    </div>
                    {candidate.interviewNotes && (
                      <p className="mt-2 text-xs text-purple-700 p-2 bg-white rounded border-l-2 border-purple-300 italic">
                        📝 {candidate.interviewNotes}
                      </p>
                    )}
                  </div>
                ))
            )}
          </motion.div>
        )}
      </div>

      {/* Vacancy Selector */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 sm:p-6">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="block text-sm font-medium text-neutral-700">{t('selectVacancy')}</label>
          <div className="grid w-full grid-cols-2 rounded-lg bg-neutral-100 p-1 sm:inline-flex sm:w-auto" role="group">
            {(['board', 'list'] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} aria-pressed={view === item} className={`rounded-md px-3 py-2 text-sm font-medium sm:py-1.5 ${view === item ? 'bg-white text-primary-700 shadow-sm' : 'text-neutral-600'}`}>{t(item)}</button>)}
          </div>
        </div>
        <select
          value={selectedVacancyId}
          onChange={(e) => setSelectedVacancyId(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:px-4 sm:text-base"
        >
          {vacancies.map((vacancy) => (
            <option key={vacancy.id} value={vacancy.id}>
              {vacancy.title} - {vacancy.company}
            </option>
          ))}
        </select>
      </div>

      {/* Candidates List */}
      {statusError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
        >
          {statusError.message}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={24} />
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">
            {t('noCandidates')}
          </p>
        </div>
      ) : view === 'board' ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          <div className="flex snap-x snap-mandatory gap-3 lg:grid lg:min-w-[1200px] lg:grid-cols-6 lg:gap-4">
            {statusOptions.map((status) => {
              const columnCandidates = candidates.filter((candidate) => candidate.status === status);
              return (
                <section
                  key={status}
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnter={() => setDragTargetStatus(status)}
                  onDrop={(event) => { event.preventDefault(); const candidateId = event.dataTransfer.getData('text/plain'); setDragTargetStatus(null); setDraggedCandidateId(null); if (candidateId) void handleStatusChange(candidateId, status); }}
                  className={`min-h-72 w-[82vw] max-w-[320px] shrink-0 snap-start rounded-xl border p-3 transition-all sm:w-[300px] lg:w-auto lg:max-w-none ${statusColors[status].bg} ${dragTargetStatus === status ? 'border-primary-500 ring-2 ring-primary-200 shadow-md' : 'border-neutral-200'}`}
                  aria-label={t('moveTo', { status: statusLabel(status) })}
                >
                  <div className="mb-3 flex items-center justify-between gap-2"><h3 className={`text-sm font-semibold ${statusColors[status].text}`}>{statusLabel(status)}</h3><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-neutral-600">{columnCandidates.length}</span></div>
                  <div className="space-y-3">
                    {columnCandidates.map((candidate) => (
                      <motion.div key={candidate.id} layout transition={{ layout: { duration: 0.18, ease: 'easeOut' } }}>
                      <article draggable={isUpdating !== candidate.id} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', candidate.id); setDraggedCandidateId(candidate.id); }} onDragEnd={() => { setDraggedCandidateId(null); setDragTargetStatus(null); }} className={`relative cursor-grab rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-opacity active:cursor-grabbing ${draggedCandidateId === candidate.id ? 'opacity-40' : 'opacity-100'} ${isUpdating === candidate.id ? 'pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-2.5">
                          {candidate.user.avatarUrl ? <Image src={candidate.user.avatarUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-semibold text-white">{candidate.user.firstName.charAt(0)}{candidate.user.lastName.charAt(0)}</div>}
                          <div className="min-w-0"><p className="truncate font-semibold text-neutral-900">{candidate.user.firstName} {candidate.user.lastName}</p><p className="truncate text-xs text-neutral-500">{candidate.user.email}</p></div>
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">{t('appliedOn', { date: new Date(candidate.createdAt).toLocaleDateString(locale) })}</p>
                        <label className="sr-only" htmlFor={`candidate-status-${candidate.id}`}>{t('moveTo', { status: statusLabel(candidate.status) })}</label>
                        <select id={`candidate-status-${candidate.id}`} value={candidate.status} disabled={isUpdating === candidate.id} onChange={(event) => void handleStatusChange(candidate.id, event.target.value)} className="mt-3 w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700">
                          {statusOptions.map((option) => <option key={option} value={option}>{statusLabel(option)}</option>)}
                        </select>
                        <Link href={`/candidates/${candidate.id}`} className="mt-3 inline-flex text-xs font-semibold text-primary-700 hover:underline">{t('viewProfile')}</Link>
                        {isUpdating === candidate.id && <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70"><Loader size={18} className="animate-spin text-primary-600" /></div>}
                      </article>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {candidate.user.avatarUrl ? (
                      <Image
                        src={candidate.user.avatarUrl}
                        alt={`${candidate.user.firstName} ${candidate.user.lastName}`}
                        width={56}
                        height={56}
                        className="h-12 w-12 rounded-lg object-cover sm:h-14 sm:w-14"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 text-base font-semibold text-white sm:h-14 sm:w-14 sm:text-lg">
                        {candidate.user.firstName.charAt(0)}
                        {candidate.user.lastName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Candidate Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {candidate.user.firstName} {candidate.user.lastName}
                    </h3>
                    <div className="mt-2 flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        {candidate.user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {t('appliedOn', { date: new Date(candidate.createdAt).toLocaleDateString(locale) })}
                      </div>
                    </div>

                    {candidate.status === 'INTERVIEWING' && candidate.interviewDate && (
                      <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-200">
                        <p className="text-xs font-semibold text-purple-700">{t('interviewScheduled')}</p>
                        <p className="text-sm text-purple-900 mt-1">
                          {new Date(candidate.interviewDate).toLocaleDateString(locale)} {t('at')} {candidate.interviewTime}
                        </p>
                        {candidate.interviewNotes && (
                          <p className="text-xs text-purple-700 mt-2 italic">
                            📝 {candidate.interviewNotes}
                          </p>
                        )}
                      </div>
                    )}
                    <Link href={`/candidates/${candidate.id}`} className="mt-3 inline-flex rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100">{t('viewProfile')}</Link>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="relative w-full sm:w-auto">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === candidate.id ? '' : candidate.id)
                    }
                    disabled={isUpdating === candidate.id}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-4 py-2 font-medium transition-all sm:w-auto sm:justify-start ${
                      statusColors[candidate.status].badge
                    } ${statusColors[candidate.status].text} hover:shadow-md disabled:opacity-50`}
                  >
                    {statusLabel(candidate.status)}
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${
                        openDropdown === candidate.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {openDropdown === candidate.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute left-0 right-0 top-full z-10 mt-2 min-w-48 rounded-lg border border-neutral-200 bg-white shadow-lg sm:left-auto"
                    >
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(candidate.id, status)}
                          disabled={isUpdating === candidate.id || status === candidate.status}
                          className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-2 ${
                            status === candidate.status
                              ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                              : 'hover:bg-neutral-50'
                          } ${status !== 'WITHDRAWN' && status !== statusOptions[statusOptions.length - 1] ? 'border-b border-neutral-100' : ''}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${statusColors[status].text}`} />
                          {statusLabel(status)}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
