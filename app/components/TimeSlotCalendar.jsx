'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './useTheme';

const TIME_SLOTS = [
  '10:00', '10:30', '10:45', '11:00', '11:30', '11:45',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

export default function TimeSlotCalendar({
  availableSlots = [],
  isLoading = false,
  onSlotSelect,
  onSlotDeselect,
  selectedSlots = new Set(), // Set of "date_time" strings
  mode = 'single', // 'single' for booking, 'multi' for blocking
  showPrice = true,
  price = 0,
}) {
  const theme = useTheme();
  const isLight = theme === 'light';
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Get week dates (Monday to Sunday)
  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Get available times for a specific date
  const getAvailableTimesForDate = (dateStr) => {
    const slot = availableSlots.find(s => s.date === dateStr);
    return slot ? slot.times : [];
  };

  // Get time range summary for a date
  const getTimeRangeSummary = (times) => {
    if (times.length === 0) return null;
    const sortedTimes = [...times].sort();
    const first = sortedTimes[0];
    const last = sortedTimes[sortedTimes.length - 1];
    return { first, last, count: times.length };
  };

  // Toggle day expansion
  const toggleDay = (dateStr, event) => {
    // Blur the button to remove focus ring after toggle
    if (event?.currentTarget) {
      event.currentTarget.blur();
    }
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  // Expand all days
  const expandAllDays = () => {
    const allDates = getWeekDates().map(date => date.toISOString().split('T')[0]);
    setExpandedDays(new Set(allDates));
  };

  // Collapse all days
  const collapseAllDays = () => {
    setExpandedDays(new Set());
  };

  // Format week range for display
  const formatWeekRange = () => {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const startMonth = start.toLocaleDateString('sv-SE', { month: 'short' });
    const endMonth = end.toLocaleDateString('sv-SE', { month: 'short' });
    const startDay = start.getDate();
    const endDay = end.getDate();
    
    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${startMonth.toUpperCase()}`;
    }
    return `${startDay} ${startMonth.toUpperCase()} - ${endDay} ${endMonth.toUpperCase()}`;
  };

  // Get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  // Handle slot click
  const handleSlotClick = (dateStr, time) => {
    const slotKey = `${dateStr}_${time}`;
    const isSelected = selectedSlots.has(slotKey);
    
    if (isSelected) {
      if (onSlotDeselect) {
        onSlotDeselect(dateStr, time);
      }
    } else {
      if (onSlotSelect) {
        onSlotSelect(dateStr, time);
      }
    }
  };

  // Select all slots for a day
  const selectAllForDay = (dateStr, availableTimes) => {
    availableTimes.forEach(time => {
      const slotKey = `${dateStr}_${time}`;
      if (!selectedSlots.has(slotKey) && onSlotSelect) {
        onSlotSelect(dateStr, time);
      }
    });
  };

  // Deselect all slots for a day
  const deselectAllForDay = (dateStr, availableTimes) => {
    availableTimes.forEach(time => {
      const slotKey = `${dateStr}_${time}`;
      if (selectedSlots.has(slotKey) && onSlotDeselect) {
        onSlotDeselect(dateStr, time);
      }
    });
  };

  // Check if all slots for a day are selected
  const areAllSlotsSelectedForDay = (dateStr, availableTimes) => {
    return availableTimes.every(time => selectedSlots.has(`${dateStr}_${time}`));
  };

  const textColor = isLight ? 'text-gray-900' : 'text-white';
  const cardBg = isLight ? 'bg-gray-50' : 'bg-gray-800';
  const borderColor = isLight ? 'border-gray-200' : 'border-gray-700';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
        <p className={`mt-4 text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          Laddar tillgängliga tider...
        </p>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className={`py-12 text-center ${isLight ? 'bg-gray-50' : 'bg-gray-800/50'} rounded-lg`} role="status">
        <p className={`text-base font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
          Inga tillgängliga tider just nu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation Header */}
      <div className={`flex items-center justify-between p-4 rounded-lg ${isLight ? 'bg-white border border-gray-200' : 'bg-gray-800 border border-gray-700'}`}>
        <button
          type="button"
          onClick={goToPreviousWeek}
          aria-label="Gå till föregående vecka"
          className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLight
              ? 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900'
              : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white'
          }`}
        >
          <span className="hidden sm:inline">← Tidigare</span>
          <span className="sm:hidden">←</span>
        </button>
        <div className="text-center flex-1 px-4">
          <div className={`font-bold text-base sm:text-lg ${textColor}`}>
            {formatWeekRange()}
          </div>
          <div className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            Vecka {getWeekNumber(currentWeekStart)}
          </div>
        </div>
        <button
          type="button"
          onClick={goToNextWeek}
          aria-label="Gå till nästa vecka"
          className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isLight
              ? 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900'
              : 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white'
          }`}
        >
          <span className="hidden sm:inline">Senare →</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>

      {/* Expand/Collapse Controls */}
      {availableSlots.length > 0 && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={expandAllDays}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLight
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Expandera alla
          </button>
          <button
            type="button"
            onClick={collapseAllDays}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLight
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            Dölj alla
          </button>
        </div>
      )}

      {/* Calendar: Day Cards with Collapsible Times */}
      <div className="space-y-3">
        {getWeekDates()
          .map((date, dayIndex) => {
            const dateStr = date.toISOString().split('T')[0];
            const availableTimes = getAvailableTimesForDate(dateStr);
            return { date, dayIndex, dateStr, availableTimes };
          })
          .filter(({ availableTimes }) => availableTimes.length > 0)
          .map(({ date, dayIndex, dateStr, availableTimes }) => {
            const dayName = date.toLocaleDateString('sv-SE', { weekday: 'long' });
            const dayNameShort = date.toLocaleDateString('sv-SE', { weekday: 'short' });
            const dayNum = date.getDate();
            const monthName = date.toLocaleDateString('sv-SE', { month: 'short' });
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isExpanded = expandedDays.has(dateStr);
            const timeSummary = getTimeRangeSummary(availableTimes);
            const allSelected = areAllSlotsSelectedForDay(dateStr, availableTimes);
            
            return (
              <div
                key={dayIndex}
                className={`rounded-xl border-2 transition-all ${
                  isToday
                    ? isLight
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-blue-600 bg-blue-900/20'
                    : isLight
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-700 bg-gray-800'
                }`}
              >
                {/* Day Header - Clickable to expand/collapse */}
                <div className={`p-4 border-b ${isLight ? 'border-gray-200' : 'border-gray-700'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={(e) => toggleDay(dateStr, e)}
                      className="flex-1 text-left focus:outline-none rounded-lg p-2 -m-2"
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Dölj' : 'Visa'} tider för ${dayName} ${dayNum} ${monthName}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`text-sm font-semibold uppercase ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span className="hidden sm:inline">{dayName}</span>
                            <span className="sm:hidden">{dayNameShort}</span>
                          </div>
                          <div className={`text-xl font-bold mt-1 ${textColor}`}>
                            {dayNum} {monthName}
                          </div>
                          {timeSummary && (
                            <div className={`text-sm mt-2 font-medium ${
                              isLight ? 'text-gray-600' : 'text-gray-300'
                            }`}>
                              {timeSummary.count} tillgängliga tider: {timeSummary.first} - {timeSummary.last}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          {isToday && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              isLight
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-blue-900/50 text-blue-300'
                            }`}>
                              Idag
                            </span>
                          )}
                          <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''} ${
                              isLight ? 'text-gray-400' : 'text-gray-500'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                    {/* Select All for Day button - only in multi mode */}
                    {mode === 'multi' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (allSelected) {
                            deselectAllForDay(dateStr, availableTimes);
                          } else {
                            selectAllForDay(dateStr, availableTimes);
                          }
                        }}
                        className={`flex-shrink-0 min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          allSelected
                            ? isLight
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                            : isLight
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        aria-label={allSelected ? `Avmarkera alla tider för ${dayName}` : `Markera alla tider för ${dayName}`}
                      >
                        {allSelected ? 'Avmarkera alla' : 'Markera alla'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Time Slots for this Day - Collapsible */}
                {isExpanded && (
                  <div className="p-4 animate-[fadeIn_0.3s_ease-in]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {TIME_SLOTS.map((time) => {
                        const isAvailable = availableTimes.includes(time);
                        if (!isAvailable) return null;
                        
                        const slotKey = `${dateStr}_${time}`;
                        const isSelected = selectedSlots.has(slotKey);
                        
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => handleSlotClick(dateStr, time)}
                            aria-label={`${isSelected ? 'Avmarkera' : 'Markera'} ${time} den ${formatDateShort(dateStr)}`}
                            aria-pressed={isSelected}
                            className={`min-h-[60px] sm:min-h-[70px] rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isSelected
                                ? isLight
                                  ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-400'
                                  : 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-400'
                                : isLight
                                ? 'bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-800 border-2 border-green-300 hover:border-green-400 hover:shadow-md'
                                : 'bg-green-900/30 hover:bg-green-900/40 active:bg-green-900/50 text-green-200 border-2 border-green-600 hover:border-green-500 hover:shadow-md'
                            }`}
                          >
                            <div className="text-sm font-bold">{time}</div>
                            {showPrice && (
                              <div className="text-xs mt-1 opacity-90">
                                {price.toLocaleString('sv-SE')} kr
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

