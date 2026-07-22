'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { Mail, Calendar } from 'lucide-react';
import { InterviewModal } from '@/features/applications/components/interview-modal';

interface RecentApplication {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  vacancy: {
    id: string;
    title: string;
    company: string;
  };
}

interface RecentApplicationsProps {
  applications: RecentApplication[];
}

const statusColors: Record<string, string> = {
  APPLIED: 'bg-blue-50 text-blue-700 border-blue-200',
  INTERVIEWING: 'bg-purple-50 text-purple-700 border-purple-200',
  OFFER: 'bg-green-50 text-green-700 border-green-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

export function RecentApplications({ applications: initialApplications }: RecentApplicationsProps) {
  const dashboardT = useTranslations('dashboard');
  const candidateT = useTranslations('candidates');
  const statusT = useTranslations('statuses');
  const interviewT = useTranslations('interview');
  const locale = useLocale();
  const [applications, setApplications] = useState<RecentApplication[]>(initialApplications);
  const [selectedApp, setSelectedApp] = useState<RecentApplication | null>(null);

  const handleScheduleInterview = async (data: {
    interviewDate: string;
    interviewTime: string;
    scheduledAt: string;
    interviewNotes?: string;
  }) => {
    if (!selectedApp) return;

    const response = await fetch(`/api/applications/${selectedApp.id}/interview`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || interviewT('failed'));
    }

    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedApp.id ? { ...app, status: 'INTERVIEWING' } : app
      )
    );
    setSelectedApp(null);
  };

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
        <Mail size={32} className="mx-auto text-neutral-400 mb-3" />
        <p className="text-neutral-600">{dashboardT('noApplications')}</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
      >
        {applications.map((app, idx) => {
          const colorClass = statusColors[app.status] || 'bg-neutral-50 text-neutral-700 border-neutral-200';
          const candidateName = `${app.user.firstName} ${app.user.lastName}`;

          return (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {app.user.avatarUrl ? (
                      <Image
                        src={app.user.avatarUrl}
                        alt={candidateName}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-semibold">
                        {app.user.firstName.charAt(0)}{app.user.lastName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-neutral-900">{candidateName}</h4>
                      <p className="text-sm text-neutral-600">{app.vacancy.title}</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    {candidateT('appliedOn', { date: new Date(app.createdAt).toLocaleDateString(locale) })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'APPLIED' && (
                    <button
                      onClick={() => setSelectedApp(app)}
                      className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                      title={interviewT('schedule')}
                    >
                      <Calendar size={16} className="text-primary-600" />
                    </button>
                  )}
                  <div className={`px-3 py-1 rounded-lg border text-sm font-medium whitespace-nowrap ${colorClass}`}>
                    {statusT(app.status.toLowerCase() as 'applied' | 'interviewing' | 'offer' | 'accepted' | 'rejected' | 'withdrawn')}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {selectedApp && (
        <InterviewModal
          isOpen={!!selectedApp}
          candidateName={`${selectedApp.user.firstName} ${selectedApp.user.lastName}`}
          vacancyTitle={selectedApp.vacancy.title}
          onClose={() => setSelectedApp(null)}
          onSubmit={handleScheduleInterview}
        />
      )}
    </>
  );
}
