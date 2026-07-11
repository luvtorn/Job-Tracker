'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, MapPin, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  position?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
}

interface Application {
  id: string;
  status: string;
  createdAt: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewNotes?: string;
  vacancy: Vacancy;
}

const statusColors: Record<string, { badge: string; text: string; icon: string }> = {
  APPLIED: { badge: 'bg-blue-100', text: 'text-blue-700', icon: '📝' },
  INTERVIEWING: { badge: 'bg-purple-100', text: 'text-purple-700', icon: '🎤' },
  OFFER: { badge: 'bg-green-100', text: 'text-green-700', icon: '🎉' },
  ACCEPTED: { badge: 'bg-emerald-100', text: 'text-emerald-700', icon: '✅' },
  REJECTED: { badge: 'bg-red-100', text: 'text-red-700', icon: '❌' },
  WITHDRAWN: { badge: 'bg-neutral-100', text: 'text-neutral-700', icon: '⏸️' },
};

const tabs = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'INTERVIEWING', label: 'Interviewing', icon: '🎤' },
  { id: 'OFFER', label: 'Offers', icon: '🎉' },
  { id: 'REJECTED', label: 'Rejected', icon: '❌' },
];

export function ApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/applications');

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApplications =
    activeTab === 'all'
      ? applications
      : applications.filter((app) => app.status === activeTab);

  const tabCounts = {
    all: applications.length,
    INTERVIEWING: applications.filter((a) => a.status === 'INTERVIEWING').length,
    OFFER: applications.filter((a) => a.status === 'OFFER').length,
    REJECTED: applications.filter((a) => a.status === 'REJECTED').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600" size={24} />
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

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
        <p className="text-xl text-neutral-600 font-medium mb-2">No applications yet</p>
        <p className="text-neutral-500">Start applying to job vacancies to track your progress here.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Tabs */}
      <div className="bg-white rounded-lg border border-neutral-200 p-2 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1 bg-white bg-opacity-30 px-2 py-0.5 rounded text-xs font-semibold">
                {tabCounts[tab.id as keyof typeof tabCounts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
          <p className="text-neutral-600">
            No applications in this category yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApplications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group"
            >
              <Link href={`/jobs/${application.vacancy.id}`}>
                <div className="bg-white border border-neutral-200 rounded-lg p-6 hover:shadow-lg hover:border-blue-300 transition-all h-full cursor-pointer">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {application.vacancy.title}
                      </h3>
                      <p className="text-neutral-600 text-sm mt-1">
                        {application.vacancy.company}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 ${
                        statusColors[application.status].badge
                      } ${statusColors[application.status].text}`}
                    >
                      {statusColors[application.status].icon} {application.status}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin size={16} className="flex-shrink-0" />
                      <span>{application.vacancy.location}</span>
                    </div>

                    {application.vacancy.salaryMin && (
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <DollarSign size={16} className="flex-shrink-0" />
                        <span>
                          {application.vacancy.salaryMin.toLocaleString()} -{' '}
                          {application.vacancy.salaryMax?.toLocaleString() || 'N/A'}{' '}
                          {application.vacancy.currency}
                        </span>
                      </div>
                    )}

                    {application.vacancy.position && (
                      <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {application.vacancy.position}
                      </div>
                    )}

                    {application.status === 'INTERVIEWING' && application.interviewDate && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-xs font-semibold text-purple-700">Interview Scheduled</p>
                        <p className="text-sm text-purple-900 mt-1">
                          📅 {new Date(application.interviewDate).toLocaleDateString()} at {application.interviewTime}
                        </p>
                        {application.interviewNotes && (
                          <p className="text-xs text-purple-700 mt-2 p-2 bg-white rounded border-l-2 border-purple-300 italic">
                            📝 {application.interviewNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {application.status === 'INTERVIEWING' && !application.interviewDate && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-700 italic">Interview being scheduled...</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100 text-xs text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      Applied {new Date(application.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
