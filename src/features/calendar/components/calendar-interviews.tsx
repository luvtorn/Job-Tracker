'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, pl, ru } from 'date-fns/locale';
import { Loader, Plus, AlertTriangle } from 'lucide-react';
import { ScheduleInterviewModal } from '@/features/candidates/components/schedule-interview-modal';
import { InterviewSidePanel } from './interview-side-panel';
import { CreateEventModal } from './create-event-modal';
import { useAuth } from '@/features/auth/context/auth-context';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-custom.css';
import { useLocale } from 'next-intl';
import type { AppLocale } from '@/i18n/config';

const locales = {
  en: enUS,
  pl,
  ru,
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
  company?: string;
}

interface CalendarEventData {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  color: string;
  startTime: string;
  endTime: string;
  location?: string;
  reminder?: number;
  isCompleted: boolean;
  applicationId?: string;
  isReminder?: boolean;
  application?: {
    id: string;
    status: string;
    user?: {
      firstName?: string | null;
      lastName?: string | null;
      email?: string;
      avatarUrl?: string | null;
    };
    vacancy?: {
      id: string;
      title: string;
      company?: string | null;
    };
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Interview | CalendarEventData;
  type: 'interview' | 'event';
}

export function CalendarInterviews() {
  const locale = useLocale() as AppLocale;
  const { user } = useAuth();
  const isRecruiter = user?.role === 'RECRUITER';
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [showDeleteInterviewModal, setShowDeleteInterviewModal] = useState(false);
  const [deletingInterviewId, setDeletingInterviewId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const [eventsRes, remindersRes] = await Promise.all([
        fetch(`/api/calendar/events?month=${month}&year=${year}`),
        isRecruiter ? Promise.resolve(null) : fetch('/api/reminders'),
      ]);

      if (!eventsRes.ok) {
        console.error('Events response:', eventsRes.status, eventsRes.statusText);

        if (eventsRes.status === 401) {
          setError('Not authorized to view calendar');
          return;
        }

        throw new Error('Failed to fetch calendar data');
      }

      const eventsData = await eventsRes.json();
      const calendarEvents: CalendarEventData[] = eventsData.events || [];
      if (remindersRes?.ok) {
        const reminderData = await remindersRes.json();
        for (const reminder of reminderData.reminders || []) {
          const start = new Date(reminder.dueAt);
          if (start.getMonth() + 1 !== month || start.getFullYear() !== year) continue;
          calendarEvents.push({ id: reminder.id, title: reminder.title, description: reminder.application?.vacancy?.title, eventType: 'REMINDER', color: reminder.group === 'overdue' ? 'red' : reminder.completedAt ? 'gray' : 'yellow', startTime: reminder.dueAt, endTime: new Date(start.getTime() + 30 * 60 * 1000).toISOString(), isCompleted: Boolean(reminder.completedAt), isReminder: true });
        }
      }

      // Both interviews and custom events come from the same API
      // Calendar events include application data for interviews
      const allEvents: CalendarEvent[] = calendarEvents.map((event) => {
        const isInterview = event.eventType === 'INTERVIEW';

        // For interview events, build the Interview resource
        const interviewResource: Interview = isInterview && event.applicationId ? {
          id: event.applicationId,
          candidateName: event.application?.user ?
            `${event.application.user.firstName} ${event.application.user.lastName}` : 'Unknown',
          candidateEmail: event.application?.user?.email || '',
          candidateAvatar: event.application?.user?.avatarUrl || undefined,
          vacancyTitle: event.application?.vacancy?.title || event.title,
          vacancyId: event.application?.vacancy?.id || '',
          interviewDate: format(new Date(event.startTime), 'yyyy-MM-dd'),
          interviewTime: new Date(event.startTime).toTimeString().slice(0, 5),
          interviewNotes: event.description || '',
          status: event.application?.status || 'INTERVIEWING',
          company: event.application?.vacancy?.company || undefined,
        } : {} as Interview;

        return {
          id: event.id,
          title: event.title,
          start: new Date(event.startTime),
          end: new Date(event.endTime),
          resource: isInterview ? interviewResource : event,
          type: isInterview ? 'interview' : 'event',
        };
      });

      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [date, isRecruiter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetching is synchronized with the visible calendar month.
    void fetchData();
  }, [fetchData]);

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'interview') {
      setSelectedInterview(event.resource as Interview);
      setSelectedEvent(null);
    } else {
      setSelectedEvent(event.resource as CalendarEventData);
      setSelectedInterview(null);
    }
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setShowCreateEventModal(true);
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
      setEditingInterviewId(null);
      setSelectedInterview(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to update interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to update interview');
    }
  };

  const handleCreateEvent = async (data: {
    title: string;
    description?: string;
    eventType: 'MEETING' | 'DEADLINE' | 'FOLLOW_UP' | 'NOTE';
    color: string;
    startTime: Date;
    endTime: Date;
  }) => {
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create event');
      }

      setShowCreateEventModal(false);
      setSelectedSlot(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventType?: string) => {
    // If it's an interview event, show confirmation modal
    if (eventType === 'INTERVIEW') {
      setDeletingInterviewId(eventId);
      setShowDeleteInterviewModal(true);
      return;
    }

    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete event');
      }

      setSelectedEvent(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const handleConfirmDeleteInterview = async () => {
    if (!deletingInterviewId || !selectedInterview) return;

    try {
      // Change status to APPLIED
      const res = await fetch(`/api/applications/${selectedInterview.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPLIED' }),
      });

      if (!res.ok) {
        throw new Error('Failed to change status');
      }

      setShowDeleteInterviewModal(false);
      setDeletingInterviewId(null);
      setSelectedInterview(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to change status:', err);
      setError(err instanceof Error ? err.message : 'Failed to change status');
    }
  };

  if (error && events.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  const EventComponent = (props: { event: CalendarEvent }) => {
    const event = props.event;
    const isInterview = event.type === 'interview';
    const title = isInterview
      ? (isRecruiter
          ? (event.resource as Interview).candidateName
          : (event.resource as Interview).vacancyTitle)
      : (event.resource as CalendarEventData).title;
    const interviewTime = isInterview
      ? (event.resource as Interview).interviewTime
      : null;

    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{title}</div>
        {isInterview && (
          <div className="text-gray-600 truncate text-xs">{interviewTime}</div>
        )}
      </div>
    );
  };

  const eventPropGetter = (event: CalendarEvent) => {
    if (event.type === 'interview') {
      return {
        style: {
          backgroundColor: '#2563eb',
          color: 'white',
        },
      };
    }

    const eventData = event.resource as CalendarEventData;

    const colorMap: Record<string, string> = {
      'blue': '#2563eb',
      'green': '#16a34a',
      'yellow': '#eab308',
      'red': '#dc2626',
      'purple': '#9333ea',
      'gray': '#4b5563',
    };
    const bgColor = colorMap[eventData.color] || '#2563eb';

    return {
      style: {
        backgroundColor: bgColor,
        color: 'white',
      },
    };
  };

  return (
    <>
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => {
          setShowCreateEventModal(false);
          setSelectedSlot(null);
        }}
        onSubmit={handleCreateEvent}
        prefilledStart={selectedSlot?.start}
        prefilledEnd={selectedSlot?.end}
      />

      {selectedInterview && (
        <ScheduleInterviewModal
          key={selectedInterview.id}
          isOpen={showEditModal}
          candidateName={selectedInterview.candidateName}
          vacancyTitle={selectedInterview.vacancyTitle}
          initialData={{
            interviewDate: selectedInterview.interviewDate,
            interviewTime: selectedInterview.interviewTime,
            interviewNotes: selectedInterview.interviewNotes,
          }}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleScheduleInterview}
        />
      )}

      {/* Delete Interview Confirmation Modal */}
      {showDeleteInterviewModal && selectedInterview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="text-yellow-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">Remove Interview?</h3>
            </div>
            <p className="text-neutral-600 mb-6">
              This will change <strong>{selectedInterview.candidateName}</strong>&apos;s status from INTERVIEWING back to APPLIED.
              The calendar event will be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDeleteInterview}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Yes, Change Status
              </button>
              <button
                onClick={() => {
                  setShowDeleteInterviewModal(false);
                  setDeletingInterviewId(null);
                }}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-blue-600" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 bg-white rounded-lg border border-neutral-200 p-6">
              <Calendar
                localizer={localizer}
                culture={locale}
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
                eventPropGetter={eventPropGetter}
                components={{
                  event: EventComponent,
                }}
              />
            </div>

            <div className="lg:col-span-1 space-y-4">
              {selectedInterview ? (
                <InterviewSidePanel
                  interview={selectedInterview}
                  isOpen={true}
                  onClose={() => setSelectedInterview(null)}
                  onEdit={handleEditInterview}
                  onDelete={() => {
                    setDeletingInterviewId(selectedInterview.id);
                    setShowDeleteInterviewModal(true);
                  }}
                  isRecruiter={isRecruiter}
                />
              ) : selectedEvent ? (
                <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2">{selectedEvent.title}</h3>
                    <div className="space-y-2 text-sm text-neutral-600">
                      <div>
                        <span className="font-medium">Type:</span> {selectedEvent.eventType}
                      </div>
                      {selectedEvent.description && (
                        <div>
                          <span className="font-medium">Description:</span> {selectedEvent.description}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Start:</span>{' '}
                        {new Date(selectedEvent.startTime).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">End:</span>{' '}
                        {new Date(selectedEvent.endTime).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id, selectedEvent.eventType)}
                      disabled={selectedEvent.isReminder}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:hidden"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
                  <Plus className="mx-auto mb-2 text-neutral-400" size={24} />
                  <p className="text-sm text-neutral-600">
                    Click on an event to view details or select a time slot to create a new event
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
