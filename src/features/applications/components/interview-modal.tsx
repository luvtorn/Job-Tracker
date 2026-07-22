'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface InterviewModalProps {
  isOpen: boolean;
  candidateName: string;
  vacancyTitle: string;
  onClose: () => void;
  onSubmit: (data: { interviewDate: string; interviewTime: string; interviewNotes?: string }) => Promise<void>;
}

export function InterviewModal({
  isOpen,
  candidateName,
  vacancyTitle,
  onClose,
  onSubmit,
}: InterviewModalProps) {
  const t = useTranslations('interview');
  const common = useTranslations('common');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit({
        interviewDate,
        interviewTime,
        interviewNotes: interviewNotes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl max-w-md w-full mx-4 shadow-xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">{t('schedule')}</h2>
          <button
            onClick={onClose}
            aria-label={common('close')}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-neutral-900">{candidateName}</p>
            <p className="text-sm text-neutral-600">{vacancyTitle}</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {t('date')}
              </div>
            </label>
            <input
              type="date"
              min={minDate}
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {t('time')}
              </div>
            </label>
            <input
              type="time"
              value={interviewTime}
              onChange={(e) => setInterviewTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              {t('notes')}
            </label>
            <textarea
              value={interviewNotes}
              onChange={(e) => setInterviewNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium disabled:opacity-50"
            >
              {common('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {isLoading ? t('scheduling') : t('schedule')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
