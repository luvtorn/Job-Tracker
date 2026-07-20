'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';

interface DateTimePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartChange: (date: Date) => void;
  onEndChange: (date: Date) => void;
  isOptional?: boolean;
}

export function DateTimePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  isOptional = true,
}: DateTimePickerProps) {
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const locale = useLocale();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = (selectedDate: Date | undefined, onChange: (date: Date) => void) => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    const monthName = currentMonth.toLocaleString(locale, { month: 'long', year: 'numeric' });

    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-lg">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }
              className="p-1 hover:bg-neutral-100 rounded"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-semibold text-neutral-900">{monthName}</span>
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }
              className="p-1 hover:bg-neutral-100 rounded"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-xs font-medium text-neutral-600 py-1">
                {day}
              </div>
            ))}

            {days.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (day) {
                    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    if (selectedDate) {
                      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
                    }
                    onChange(newDate);
                    setShowStartCalendar(false);
                    setShowEndCalendar(false);
                  }
                }}
                className={`p-2 rounded text-sm transition-colors ${
                  day
                    ? selectedDate &&
                      day === selectedDate.getDate() &&
                      currentMonth.getMonth() === selectedDate.getMonth() &&
                      currentMonth.getFullYear() === selectedDate.getFullYear()
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'hover:bg-blue-100 text-neutral-900'
                    : ''
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="text-xs font-medium text-neutral-700 mb-2">Время</div>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="23"
              value={selectedDate?.getHours() || 0}
              onChange={(e) => {
                const newDate = new Date(selectedDate || new Date());
                newDate.setHours(parseInt(e.target.value) || 0);
                onChange(newDate);
              }}
              className="w-12 px-2 py-1 border border-neutral-300 rounded text-sm text-center"
              placeholder="HH"
            />
            <span className="text-neutral-600">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={String(selectedDate?.getMinutes() || 0).padStart(2, '0')}
              onChange={(e) => {
                const newDate = new Date(selectedDate || new Date());
                newDate.setMinutes(parseInt(e.target.value) || 0);
                onChange(newDate);
              }}
              className="w-12 px-2 py-1 border border-neutral-300 rounded text-sm text-center"
              placeholder="MM"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-2">
          {isOptional ? 'Start Date & Time (Optional)' : 'Start Date & Time *'}
        </label>
        <div className="relative">
          <button
            onClick={() => setShowStartCalendar(!showStartCalendar)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-left bg-white hover:bg-neutral-50 transition-colors"
          >
            {startDate
              ? startDate.toLocaleString(locale, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : isOptional
                ? 'Not set'
                : 'Select date and time'}
          </button>
          {showStartCalendar && (
            <div className="absolute top-full left-0 mt-2 z-40">
              {renderCalendar(startDate, onStartChange)}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-900 mb-2">
          {isOptional ? 'End Date & Time (Optional)' : 'End Date & Time *'}
        </label>
        <div className="relative">
          <button
            onClick={() => setShowEndCalendar(!showEndCalendar)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-left bg-white hover:bg-neutral-50 transition-colors"
          >
            {endDate
              ? endDate.toLocaleString(locale, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : isOptional
                ? 'Not set'
                : 'Select date and time'}
          </button>
          {showEndCalendar && (
            <div className="absolute top-full left-0 mt-2 z-40">
              {renderCalendar(endDate, onEndChange)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
