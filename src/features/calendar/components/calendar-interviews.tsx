'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { InterviewSidePanel } from './interview-side-panel';
import { ScheduleInterviewModal } from '@/features/candidates/components/schedule-interview-modal';

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
}

export function CalendarInterviews() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);

  useEffect(() => {
    fetchInterviews();
  }, [currentDate]);

  const fetchInterviews = async () => {
    try {
      setIsLoading(true);
      setError('');

      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const response = await fetch(
        `/api/recruiter/interviews?month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }

      const data = await response.json();
      setInterviews(data.interviews || []);
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setError('Failed to load interviews');
    } finally {
      setIsLoading(false);
    }
  };

  const interviewDates = interviews.map(i => {
    const date = new Date(i.interviewDate);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  });

  const getInterviewsForDate = (date: Date) => {
    return interviews.filter(i => {
      const interviewDate = new Date(i.interviewDate);
      return (
        interviewDate.getFullYear() === date.getFullYear() &&
        interviewDate.getMonth() === date.getMonth() &&
        interviewDate.getDate() === date.getDate()
      );
    });
  };

  const selectedDateInterviews = getInterviewsForDate(selectedDate);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleSelectInterview = (interview: Interview) => {
    setSelectedInterview(interview);
  };

  const handleEditInterview = () => {
    if (selectedInterview) {
      setEditingInterviewId(selectedInterview.id);
      setShowEditModal(true);
    }
  };

  const handleScheduleInterview = async (data: {
    interviewDate: string;
    interviewTime: string;
    interviewNotes?: string;
  }) => {
    if (!editingInterviewId) return;

    try {
      const interviewRes = await fetch(
        `/api/applications/${editingInterviewId}/interview`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!interviewRes.ok) {
        throw new Error('Failed to update interview');
      }

      setShowEditModal(false);
      setEditingInterviewId(null);
      setSelectedInterview(null);
      fetchInterviews();
    } catch (err) {
      console.error('Failed to update interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to update interview');
    }
  };

  if (error && interviews.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Edit Modal */}
      {selectedInterview && (
        <ScheduleInterviewModal
          isOpen={showEditModal}
          candidateName={selectedInterview.candidateName}
          vacancyTitle={selectedInterview.vacancyTitle}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleScheduleInterview}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            {/* Header with navigation */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                {currentDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="animate-spin text-blue-600" size={24} />
              </div>
            ) : (
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                  }}
                  disabled={(date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const interviewDateStrs = interviews.map(i => i.interviewDate);
                    return !interviewDateStrs.includes(dateStr);
                  }}
                  modifiers={{
                    hasInterview: interviewDates,
                  }}
                  modifiersClassNames={{
                    hasInterview: 'bg-blue-100 font-bold text-blue-900',
                  }}
                  className="rounded-md border"
                />
              </div>
            )}
          </div>
        </div>

        {/* Side Panel Section */}
        <div className="lg:col-span-1">
          {selectedDateInterviews.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
              <p className="text-neutral-600 text-sm">
                No interviews scheduled for this day
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {selectedDateInterviews.map((interview) => (
                <button
                  key={interview.id}
                  onClick={() => handleSelectInterview(interview)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedInterview?.id === interview.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-neutral-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-neutral-900 text-sm truncate">
                    {interview.candidateName}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {interview.interviewTime}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {interview.vacancyTitle}
                  </p>
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Interview Side Panel */}
      <InterviewSidePanel
        interview={selectedInterview}
        isOpen={!!selectedInterview}
        onClose={() => setSelectedInterview(null)}
        onEdit={handleEditInterview}
      />
    </>
  );
}
