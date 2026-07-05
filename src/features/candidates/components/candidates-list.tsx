'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, ChevronDown, Mail, Calendar } from 'lucide-react';
import Image from 'next/image';

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

export function CandidatesList() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string>('');
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string>('');

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    if (selectedVacancyId) {
      fetchCandidates();
    } else {
      setCandidates([]);
    }
  }, [selectedVacancyId]);

  const fetchVacancies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vacancies');

      if (!response.ok) {
        throw new Error('Failed to fetch vacancies');
      }

      const data = await response.json();
      const vacs = data.vacancies || [];
      setVacancies(vacs);
      if (vacs.length > 0) {
        setSelectedVacancyId(vacs[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch vacancies:', err);
      setError('Failed to load vacancies');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/vacancies/${selectedVacancyId}/candidates`);

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const data = await response.json();
      setCandidates(data.applications || []);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
      setError('Failed to load candidates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      setIsUpdating(candidateId);
      const response = await fetch(`/api/applications/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setCandidates(
        candidates.map((c) =>
          c.id === candidateId ? { ...c, status: newStatus } : c
        )
      );
      setOpenDropdown('');
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update candidate status');
    } finally {
      setIsUpdating('');
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
        <p className="text-neutral-600">No vacancies yet. Create your first vacancy to get started.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Vacancy Selector */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Select Vacancy
        </label>
        <select
          value={selectedVacancyId}
          onChange={(e) => setSelectedVacancyId(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {vacancies.map((vacancy) => (
            <option key={vacancy.id} value={vacancy.id}>
              {vacancy.title} - {vacancy.company}
            </option>
          ))}
        </select>
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={24} />
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-600">
            No candidates have applied for this position yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {candidate.user.avatarUrl ? (
                      <Image
                        src={candidate.user.avatarUrl}
                        alt={`${candidate.user.firstName} ${candidate.user.lastName}`}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
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
                    <div className="flex items-center gap-4 text-sm text-neutral-600 mt-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Mail size={14} />
                        {candidate.user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        Applied {new Date(candidate.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === candidate.id ? '' : candidate.id)
                    }
                    disabled={isUpdating === candidate.id}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                      statusColors[candidate.status].badge
                    } ${statusColors[candidate.status].text} hover:shadow-md disabled:opacity-50`}
                  >
                    {candidate.status}
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
                      className="absolute right-0 top-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 min-w-48"
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
                          {status}
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
