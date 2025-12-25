'use client';

import React, { useState, useCallback } from 'react';
import { Clock, Plus, Trash2, Copy, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TimezoneSelector } from './timezone-visualizer';
import type { DayOfWeek, TimeSlot, AvailabilitySchedule } from '@/types';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

interface DaySchedule {
  day: DayOfWeek;
  enabled: boolean;
  slots: TimeSlot[];
}

interface AvailabilitySchedulerProps {
  value: {
    timezone: string;
    schedule: DaySchedule[];
  };
  onChange: (value: AvailabilitySchedulerProps['value']) => void;
  readOnly?: boolean;
  showTimezone?: boolean;
  compact?: boolean;
  className?: string;
}

const DEFAULT_SLOT: TimeSlot = { start: '09:00', end: '17:00' };

const AvailabilityScheduler: React.FC<AvailabilitySchedulerProps> = ({
  value,
  onChange,
  readOnly = false,
  showTimezone = true,
  compact = false,
  className,
}) => {
  const [copiedDay, setCopiedDay] = useState<DaySchedule | null>(null);

  const updateTimezone = useCallback((timezone: string) => {
    onChange({ ...value, timezone });
  }, [value, onChange]);

  const toggleDay = useCallback((day: DayOfWeek) => {
    if (readOnly) return;
    
    const newSchedule = value.schedule.map((d) => {
      if (d.day === day) {
        return {
          ...d,
          enabled: !d.enabled,
          slots: !d.enabled && d.slots.length === 0 ? [DEFAULT_SLOT] : d.slots,
        };
      }
      return d;
    });
    onChange({ ...value, schedule: newSchedule });
  }, [value, onChange, readOnly]);

  const addSlot = useCallback((day: DayOfWeek) => {
    if (readOnly) return;

    const daySchedule = value.schedule.find((d) => d.day === day);
    const lastSlot = daySchedule?.slots[daySchedule.slots.length - 1];
    const newSlot: TimeSlot = lastSlot
      ? { start: lastSlot.end, end: '18:00' }
      : DEFAULT_SLOT;

    const newSchedule = value.schedule.map((d) => {
      if (d.day === day) {
        return { ...d, slots: [...d.slots, newSlot] };
      }
      return d;
    });
    onChange({ ...value, schedule: newSchedule });
  }, [value, onChange, readOnly]);

  const removeSlot = useCallback((day: DayOfWeek, index: number) => {
    if (readOnly) return;

    const newSchedule = value.schedule.map((d) => {
      if (d.day === day) {
        const newSlots = d.slots.filter((_, i) => i !== index);
        return {
          ...d,
          slots: newSlots,
          enabled: newSlots.length > 0 ? d.enabled : false,
        };
      }
      return d;
    });
    onChange({ ...value, schedule: newSchedule });
  }, [value, onChange, readOnly]);

  const updateSlot = useCallback((
    day: DayOfWeek,
    index: number,
    field: 'start' | 'end',
    time: string
  ) => {
    if (readOnly) return;

    const newSchedule = value.schedule.map((d) => {
      if (d.day === day) {
        const newSlots = d.slots.map((slot, i) => {
          if (i === index) {
            return { ...slot, [field]: time };
          }
          return slot;
        });
        return { ...d, slots: newSlots };
      }
      return d;
    });
    onChange({ ...value, schedule: newSchedule });
  }, [value, onChange, readOnly]);

  const copyDay = useCallback((day: DayOfWeek) => {
    const daySchedule = value.schedule.find((d) => d.day === day);
    if (daySchedule) {
      setCopiedDay(daySchedule);
    }
  }, [value.schedule]);

  const pasteToDay = useCallback((day: DayOfWeek) => {
    if (!copiedDay || readOnly) return;

    const newSchedule = value.schedule.map((d) => {
      if (d.day === day) {
        return { ...d, enabled: copiedDay.enabled, slots: [...copiedDay.slots] };
      }
      return d;
    });
    onChange({ ...value, schedule: newSchedule });
  }, [copiedDay, value, onChange, readOnly]);

  const calculateTotalHours = useCallback(() => {
    let total = 0;
    value.schedule.forEach((day) => {
      if (day.enabled) {
        day.slots.forEach((slot) => {
          const [startH, startM] = slot.start.split(':').map(Number);
          const [endH, endM] = slot.end.split(':').map(Number);
          total += (endH * 60 + endM - startH * 60 - startM) / 60;
        });
      }
    });
    return total.toFixed(1);
  }, [value.schedule]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-neutral-500" />
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Weekly Availability
          </h3>
          <Badge variant="info" size="sm">
            {calculateTotalHours()}h / week
          </Badge>
        </div>
        {copiedDay && !readOnly && (
          <Badge variant="success" size="sm">
            Schedule copied
          </Badge>
        )}
      </div>

      {/* Timezone Selector */}
      {showTimezone && (
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 text-neutral-400" />
          {readOnly ? (
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {value.timezone}
            </span>
          ) : (
            <TimezoneSelector
              value={value.timezone}
              onChange={updateTimezone}
              className="flex-1 max-w-xs"
            />
          )}
        </div>
      )}

      {/* Schedule Grid */}
      <div className={cn(
        'border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden',
        'divide-y divide-neutral-200 dark:divide-neutral-800'
      )}>
        {value.schedule.map((daySchedule) => (
          <div
            key={daySchedule.day}
            className={cn(
              'flex items-start gap-4 p-4',
              !daySchedule.enabled && 'bg-neutral-50 dark:bg-neutral-900/50'
            )}
          >
            {/* Day Toggle */}
            <div className="flex items-center gap-3 w-24">
              <button
                onClick={() => toggleDay(daySchedule.day)}
                disabled={readOnly}
                className={cn(
                  'w-10 h-6 rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                  daySchedule.enabled
                    ? 'bg-brand-600'
                    : 'bg-neutral-200 dark:bg-neutral-700',
                  readOnly && 'cursor-not-allowed opacity-60'
                )}
              >
                <span
                  className={cn(
                    'block w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                    daySchedule.enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                  )}
                />
              </button>
              <span
                className={cn(
                  'text-sm font-medium',
                  daySchedule.enabled
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-400 dark:text-neutral-500'
                )}
              >
                {compact ? DAY_LABELS[daySchedule.day] : DAY_FULL_LABELS[daySchedule.day]}
              </span>
            </div>

            {/* Time Slots */}
            <div className="flex-1 space-y-2">
              {daySchedule.enabled ? (
                <>
                  {daySchedule.slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateSlot(daySchedule.day, index, 'start', e.target.value)}
                        disabled={readOnly}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-md',
                          'bg-white dark:bg-neutral-800',
                          'border border-neutral-300 dark:border-neutral-700',
                          'focus:outline-none focus:ring-2 focus:ring-brand-500',
                          readOnly && 'cursor-not-allowed opacity-60'
                        )}
                      />
                      <span className="text-neutral-400">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateSlot(daySchedule.day, index, 'end', e.target.value)}
                        disabled={readOnly}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-md',
                          'bg-white dark:bg-neutral-800',
                          'border border-neutral-300 dark:border-neutral-700',
                          'focus:outline-none focus:ring-2 focus:ring-brand-500',
                          readOnly && 'cursor-not-allowed opacity-60'
                        )}
                      />
                      {!readOnly && daySchedule.slots.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeSlot(daySchedule.day, index)}
                          className="text-neutral-400 hover:text-error-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addSlot(daySchedule.day)}
                      className="text-brand-600 dark:text-brand-400"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add time slot
                    </Button>
                  )}
                </>
              ) : (
                <span className="text-sm text-neutral-400 dark:text-neutral-500">
                  Unavailable
                </span>
              )}
            </div>

            {/* Actions */}
            {!readOnly && daySchedule.enabled && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => copyDay(daySchedule.day)}
                  title="Copy schedule"
                  className="text-neutral-400"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {copiedDay && copiedDay.day !== daySchedule.day && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => pasteToDay(daySchedule.day)}
                    className="text-brand-600"
                  >
                    Paste
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

AvailabilityScheduler.displayName = 'AvailabilityScheduler';

export { AvailabilityScheduler };
