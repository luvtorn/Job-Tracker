'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Loader, Type, Palette } from 'lucide-react';
import { DateTimePicker } from './date-time-picker';
import { useTranslations } from 'next-intl';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    eventType: 'MEETING' | 'DEADLINE' | 'FOLLOW_UP' | 'NOTE';
    color: string;
    startTime: Date;
    endTime: Date;
  }) => Promise<void>;
  prefilledStart?: Date;
  prefilledEnd?: Date;
  initialData?: {
    title: string;
    description?: string;
    eventType: 'MEETING' | 'DEADLINE' | 'FOLLOW_UP' | 'NOTE';
    color: string;
    startTime: Date;
    endTime: Date;
  };
}

export function CreateEventModal({
  isOpen,
  onClose,
  onSubmit,
  prefilledStart,
  prefilledEnd,
  initialData,
}: CreateEventModalProps) {
  const t = useTranslations('calendarUi');
  const common = useTranslations('common');
  const isEditing = Boolean(initialData);
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [eventType, setEventType] = useState<'MEETING' | 'DEADLINE' | 'FOLLOW_UP' | 'NOTE'>(initialData?.eventType ?? 'MEETING');
  const [color, setColor] = useState(initialData?.color ?? 'blue');
  const [startTime, setStartTime] = useState<Date | undefined>(initialData?.startTime ?? prefilledStart);
  const [endTime, setEndTime] = useState<Date | undefined>(initialData?.endTime ?? prefilledEnd);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(t('titleRequired'));
      return;
    }

    const finalStartTime = startTime || prefilledStart || new Date();
    const finalEndTime = endTime || prefilledEnd || new Date(finalStartTime.getTime() + 60 * 60 * 1000);

    if (finalEndTime <= finalStartTime) {
      setError(t('endAfterStart'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await onSubmit({
        title,
        description: description || undefined,
        eventType,
        color,
        startTime: finalStartTime,
        endTime: finalEndTime,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : t(isEditing ? 'updateFailed' : 'createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const colors = [
    { value: 'blue', label: t('blue'), bg: 'bg-blue-500' },
    { value: 'green', label: t('green'), bg: 'bg-green-500' },
    { value: 'yellow', label: t('yellow'), bg: 'bg-yellow-500' },
    { value: 'red', label: t('red'), bg: 'bg-red-500' },
    { value: 'purple', label: t('purple'), bg: 'bg-purple-500' },
    { value: 'gray', label: t('gray'), bg: 'bg-gray-500' },
  ];

  const eventTypes: Array<{ value: typeof eventType; label: string; icon: string }> = [
    { value: 'MEETING', label: t('meeting'), icon: '📅' },
    { value: 'DEADLINE', label: t('deadline'), icon: '⏰' },
    { value: 'FOLLOW_UP', label: t('followUp'), icon: '↩️' },
    { value: 'NOTE', label: t('note'), icon: '📝' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl max-w-md w-full mx-4 shadow-xl my-8"
      >
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-neutral-900">{t(isEditing ? 'editEvent' : 'createEvent')}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label={common('close')}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                <Type size={16} />
                {t('title')} *
              </div>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              {t('eventType')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setEventType(type.value)}
                  disabled={isLoading}
                  className={`p-2 rounded-lg border-2 transition-all disabled:opacity-50 text-center ${
                    eventType === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-lg">{type.icon}</div>
                  <div className="text-xs font-medium text-neutral-700 mt-1">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              {t('description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-neutral-100 disabled:cursor-not-allowed"
            />
          </div>

          <DateTimePicker
            startDate={startTime || prefilledStart}
            endDate={endTime || prefilledEnd}
            onStartChange={setStartTime}
            onEndChange={setEndTime}
            isOptional={true}
          />

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-2">
              <div className="flex items-center gap-2">
                <Palette size={16} />
                {t('color')}
              </div>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  disabled={isLoading}
                  className={`w-10 h-10 rounded-lg border-2 transition-all disabled:opacity-50 ${
                    color === c.value
                      ? `${c.bg} border-neutral-900 shadow-md`
                      : `${c.bg} border-neutral-200 opacity-60 hover:opacity-100`
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
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
                  {t(isEditing ? 'saving' : 'creating')}
                </>
              ) : (
                t(isEditing ? 'saveChanges' : 'createEvent')
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
