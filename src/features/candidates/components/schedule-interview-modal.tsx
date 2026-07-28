'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, AlertCircle, Loader } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  candidateName: string;
  vacancyTitle: string;
  initialData?: {
    interviewDate: string;
    interviewTime: string;
    interviewNotes?: string;
    meetingType?: MeetingType;
    meetingUrl?: string;
    sendCalendarInvite?: boolean;
  };
  onClose: () => void;
  onSubmit: (data: InterviewFormData) => Promise<void>;
}

export type MeetingType = 'NONE' | 'MANUAL_GOOGLE_MEET' | 'GOOGLE_MEET';
export type InterviewFormData = {
  interviewDate: string;
  interviewTime: string;
  scheduledAt: string;
  interviewNotes?: string;
  meetingType: MeetingType;
  manualMeetingUrl?: string;
  sendCalendarInvite: boolean;
};

export function ScheduleInterviewModal({
  isOpen,
  candidateName,
  vacancyTitle,
  initialData,
  onClose,
  onSubmit,
}: ScheduleInterviewModalProps) {
  const t = useTranslations('interview');
  const calendarT = useTranslations('calendarIntegration');
  const common = useTranslations('common');
  const [interviewDate, setInterviewDate] = useState(initialData?.interviewDate ?? '');
  const [interviewTime, setInterviewTime] = useState(initialData?.interviewTime ?? '');
  const [interviewNotes, setInterviewNotes] = useState(initialData?.interviewNotes ?? '');
  const [meetingType, setMeetingType] = useState<MeetingType>(initialData?.meetingType ?? 'NONE');
  const [manualMeetingUrl, setManualMeetingUrl] = useState(
    initialData?.meetingType === 'MANUAL_GOOGLE_MEET' ? initialData.meetingUrl ?? '' : '',
  );
  const [sendCalendarInvite, setSendCalendarInvite] = useState(initialData?.sendCalendarInvite ?? false);
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void fetch('/api/integrations/google-calendar')
      .then((response) => response.ok ? response.json() : { connected: false })
      .then((data: { connected?: boolean }) => {
        if (active) setCalendarConnected(Boolean(data.connected));
      })
      .catch(() => {
        if (active) setCalendarConnected(false);
      });
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!interviewDate || !interviewTime) {
      setError(t('required'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const scheduledAt = new Date(`${interviewDate}T${interviewTime}:00`);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        setError(t('futureRequired'));
        return;
      }
      if (
        meetingType === 'MANUAL_GOOGLE_MEET'
        && !/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?.*)?$/.test(manualMeetingUrl)
      ) {
        setError(calendarT('invalidMeetUrl'));
        return;
      }
      if (meetingType === 'GOOGLE_MEET' && !calendarConnected) {
        setError(calendarT('calendarRequired'));
        return;
      }
      await onSubmit({
        interviewDate,
        interviewTime,
        scheduledAt: scheduledAt.toISOString(),
        interviewNotes: interviewNotes || undefined,
        meetingType,
        manualMeetingUrl: meetingType === 'MANUAL_GOOGLE_MEET' ? manualMeetingUrl : undefined,
        sendCalendarInvite: meetingType === 'GOOGLE_MEET' && sendCalendarInvite,
      });
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white mx-4 shadow-xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-900">{initialData ? t('reschedule') : t('schedule')}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label={common('close')}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-neutral-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-neutral-900">{candidateName}</p>
            <p className="text-sm text-neutral-600">{vacancyTitle}</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-sm text-red-700"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {t('date')} *
              </div>
            </label>
            <input
              type="date"
              min={minDate}
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="meeting-type" className="mb-2 block text-sm font-medium text-neutral-900">
              {calendarT('meetingType')}
            </label>
            <select
              id="meeting-type"
              value={meetingType}
              onChange={(event) => setMeetingType(event.target.value as MeetingType)}
              disabled={isLoading}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="NONE">{calendarT('noVideo')}</option>
              <option value="MANUAL_GOOGLE_MEET">{calendarT('manualMeet')}</option>
              <option value="GOOGLE_MEET" disabled={calendarConnected === false}>
                {calendarT('automaticMeet')}
              </option>
            </select>
            {calendarConnected === false && (
              <p className="mt-2 text-xs text-amber-700">
                {calendarT('calendarRequired')}{' '}
                <a href="/settings#google-calendar" className="font-semibold underline">{calendarT('openSettings')}</a>
              </p>
            )}
          </div>

          {meetingType === 'MANUAL_GOOGLE_MEET' && (
            <div>
              <label htmlFor="manual-meet-url" className="mb-2 block text-sm font-medium text-neutral-900">
                {calendarT('manualUrl')}
              </label>
              <input
                id="manual-meet-url"
                type="url"
                value={manualMeetingUrl}
                onChange={(event) => setManualMeetingUrl(event.target.value)}
                placeholder={calendarT('manualUrlPlaceholder')}
                required
                disabled={isLoading}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {meetingType === 'GOOGLE_MEET' && (
            <label className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3">
              <input
                type="checkbox"
                checked={sendCalendarInvite}
                onChange={(event) => setSendCalendarInvite(event.target.checked)}
                disabled={isLoading}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">{calendarT('sendInvite')}</span>
                <span className="mt-1 block text-xs text-neutral-600">{calendarT('sendInviteDescription')}</span>
              </span>
            </label>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              <div className="flex items-center gap-2">
                <Clock size={16} />
                {t('time')} *
              </div>
            </label>
            <input
              type="time"
              value={interviewTime}
              onChange={(e) => setInterviewTime(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
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
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {common('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {t('scheduling')}
                </>
              ) : (
                initialData ? t('reschedule') : t('schedule')
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
