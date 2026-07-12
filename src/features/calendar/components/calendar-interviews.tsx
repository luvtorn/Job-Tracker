'use client';

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Loader, Plus } from 'lucide-react';
import { ScheduleInterviewModal } from '@/features/candidates/components/schedule-interview-modal';
import { InterviewSidePanel } from './interview-side-panel';
import { CreateEventModal } from './create-event-modal';
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

  useEffect(() => {
    fetchData();
  }, [date]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const [interviewRes, eventsRes] = await Promise.all([
        fetch(`/api/recruiter/interviews?month=${month}&year=${year}`),
        fetch(`/api/calendar/events?month=${month}&year=${year}`),
      ]);

      if (!interviewRes.ok || !eventsRes.ok) {
        console.error('Interviews response:', interviewRes.status, interviewRes.statusText);
        console.error('Events response:', eventsRes.status, eventsRes.statusText);

        if (!eventsRes.ok) {
          const errData = await eventsRes.json().catch(() => ({}));
          console.error('Events error:', errData);

          if (eventsRes.status === 401) {
            setError('Not authorized to view calendar');
            return;
          }
        }

        if (!interviewRes.ok) {
          const errData = await interviewRes.json().catch(() => ({}));
          console.error('Interviews error:', errData);
        }

        throw new Error('Failed to fetch calendar data');
      }

      const interviewData = await interviewRes.json();
      const eventsData = await eventsRes.json();
      const interviews: Interview[] = interviewData.interviews || [];
      const calendarEvents: CalendarEventData[] = eventsData.events || [];

      const interviewEvents: CalendarEvent[] = interviews.map((interview) => {
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
          type: 'interview',
        };
      });

      const customEvents: CalendarEvent[] = calendarEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        resource: event,
        type: 'event',
      }));

      setEvents([...interviewEvents, ...customEvents]);
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleDeleteEvent = async (eventId: string) => {
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

  if (error && events.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  const EventComponent = (props: any) => {
    const event = props.event;
    const isInterview = event.type === 'interview';
    const resource = event.resource;

    return (
      <div className="p-1 text-xs">
        <div className="font-medium truncate">{resource.candidateName || resource.title}</div>
        {isInterview && (
          <div className="text-gray-600 truncate text-xs">{resource.interviewTime}</div>
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
          isOpen={showEditModal}
          candidateName={selectedInterview.candidateName}
          vacancyTitle={selectedInterview.vacancyTitle}
          onClose={() => setShowEditModal(false)}
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
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
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
