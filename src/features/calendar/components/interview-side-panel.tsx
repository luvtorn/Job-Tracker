'use client';

import { motion } from 'framer-motion';
import { X, Mail, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface Interview {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidateAvatar?: string;
  vacancyTitle: string;
  vacancyId: string;
  interviewDate: string;
  interviewTime: string;
  interviewNotes?: string;
  status: string;
  company?: string;
}

interface InterviewSidePanelProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isLoading?: boolean;
  isRecruiter: boolean;
}

export function InterviewSidePanel({
  interview,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  isLoading,
  isRecruiter,
}: InterviewSidePanelProps) {
  if (!isOpen || !interview) return null;

  const interviewDateTime = new Date(`${interview.interviewDate}T${interview.interviewTime}`);
  const formattedDate = interviewDateTime.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = interviewDateTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.3 }}
      className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white border-l-4 border-l-blue-600 shadow-lg z-50 overflow-y-auto lg:static lg:w-auto lg:h-auto lg:border-l lg:border-l-neutral-200 lg:shadow-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-white sticky top-0 z-10 lg:static">
        <h2 className="text-lg font-semibold text-neutral-900">Interview Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-100 rounded-lg transition-colors lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Candidate Info */}
        {isRecruiter && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {interview.candidateAvatar ? (
              <Image
                src={interview.candidateAvatar}
                alt={interview.candidateName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {interview.candidateName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-neutral-900">{interview.candidateName}</p>
              <p className="text-sm text-neutral-600">{interview.candidateEmail}</p>
            </div>
          </div>

          <a
            href={`mailto:${interview.candidateEmail}`}
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Mail size={14} />
            Send email
          </a>
        </div>
        )}

        {/* Divider */}
        {isRecruiter && <div className="h-px bg-neutral-200" />}

        {/* Vacancy Info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
            Position
          </p>
          <a
            href={`/jobs/${interview.vacancyId}`}
            className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            {interview.vacancyTitle}
          </a>
          {!isRecruiter && interview.company && (
            <p className="text-sm text-neutral-600">
              <span className="font-medium">Company:</span> {interview.company}
            </p>
          )}
        </div>

        {/* Interview Schedule */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
            Interview Schedule
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-neutral-500 flex-shrink-0" />
              <span className="text-neutral-900">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock size={16} className="text-neutral-500 flex-shrink-0" />
              <span className="text-neutral-900">{formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {interview.interviewNotes && (
          <>
            <div className="h-px bg-neutral-200" />
            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                Notes
              </p>
              <p className="text-sm text-neutral-700 p-3 bg-neutral-50 rounded-lg border border-neutral-200 italic">
                {interview.interviewNotes}
              </p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="h-px bg-neutral-200" />
        <div className="space-y-3">
          {isRecruiter && (
            <>
              <button
                onClick={onEdit}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit2 size={16} />
                Edit Interview
              </button>
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} />
                Remove Interview
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}
