'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Loader, Plus } from 'lucide-react';
import { ScheduleInterviewModal } from '@/features/candidates/components/schedule-interview-modal';
import { InterviewSidePanel } from './interview-side-panel';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-custom.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Interview;
}

export function CalendarInterviews() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    fetchInterviews();
  }, [date]);

  const fetchInterviews = async () => {
    try {
      setIsLoading(true);
      setError('');

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const response = await fetch(
        `/api/recruiter/interviews?month=${month}&year=${year}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch interviews');
      }

      const data = await response.json();
      const interviews: Interview[] = data.interviews || [];

      const calendarEvents: CalendarEvent[] = interviews.map((interview) => {
        const [hours, minutes] = interview.interviewTime.split(':').map(Number);
        const startDate = new Date(interview.interviewDate);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(hours + 1, minutes, 0, 0);

        return {
          id: interview.id,
          title: `${interview.candidateName} - ${interview.vacancyTitle}`,
          start: startDate,
          end: endDate,
          resource: interview,
        };
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
      setError('Failed to load interviews');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedInterview(event.resource);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setShowScheduleModal(true);
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
    const interviewId = editingInterviewId || selectedInterview?.id;
    if (!interviewId) return;

    try {
      const interviewRes = await fetch(
        `/api/applications/${interviewId}/interview`,
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
      setShowScheduleModal(false);
      setEditingInterviewId(null);
      setSelectedInterview(null);
      setSelectedSlot(null);
      fetchInterviews();
    } catch (err) {
      console.error('Failed to update interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to update interview');
    }
  };

  if (error && events.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  const EventComponent = (props: any) => (
    <div className="p-1 text-xs">
      <div className="font-medium truncate">{props.event.resource.candidateName}</div>
      <div className="text-gray-600 truncate text-xs">{props.event.resource.interviewTime}</div>
    </div>
  );

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

      {/* Schedule Modal for new event */}
      {selectedSlot && (
        <ScheduleInterviewModal
          isOpen={showScheduleModal}
          candidateName=""
          vacancyTitle="New Interview"
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedSlot(null);
          }}
          onSubmit={handleScheduleInterview}
        />
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-blue-600" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Calendar Section */}
            <div className="lg:col-span-3 bg-white rounded-lg border border-neutral-200 p-6">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                popup
                eventPropGetter={(_event) => ({
                  className: 'bg-blue-600 text-white hover:bg-blue-700',
                })}
                components={{
                  event: EventComponent,
                }}
              />
            </div>

            {/* Interview Details */}
            <div className="lg:col-span-1 space-y-4">
              {selectedInterview ? (
                <InterviewSidePanel
                  interview={selectedInterview}
                  isOpen={true}
                  onClose={() => setSelectedInterview(null)}
                  onEdit={handleEditInterview}
                />
              ) : (
                <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
                  <Plus className="mx-auto mb-2 text-neutral-400" size={24} />
                  <p className="text-sm text-neutral-600">
                    Click on an event to view details or select a date to create a new interview
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
