'use client';

import React, { useMemo } from 'react';
import { Globe, Clock, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import {
  getTimezoneInfo,
  calculateTimezoneOverlap,
  formatInTimezone,
  getCurrentTimeInTimezone,
  COMMON_TIMEZONES,
  createTimezoneTimeline,
} from '@/lib/timezone';
import type { TimezoneOverlap } from '@/types';

// Time Zone Display Component
interface TimeZoneDisplayProps {
  timezone: string;
  showOffset?: boolean;
  showTime?: boolean;
  showIcon?: boolean;
  format?: '12h' | '24h';
  className?: string;
}

const TimeZoneDisplay: React.FC<TimeZoneDisplayProps> = ({
  timezone,
  showOffset = true,
  showTime = true,
  showIcon = true,
  format = '12h',
  className,
}) => {
  const info = getTimezoneInfo(timezone);
  const currentTime = getCurrentTimeInTimezone(timezone);
  const hour = currentTime.getHours();
  
  const TimeIcon = hour >= 6 && hour < 12 ? Sunrise
    : hour >= 12 && hour < 18 ? Sun
    : hour >= 18 && hour < 21 ? Sunset
    : Moon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && (
        <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
          <TimeIcon className="h-4 w-4" />
        </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {timezone.split('/').pop()?.replace('_', ' ')}
          </span>
          {showOffset && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {info.offsetString}
            </span>
          )}
        </div>
        {showTime && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatInTimezone(new Date(), timezone, format === '12h' ? 'h:mm a' : 'HH:mm')}
          </p>
        )}
      </div>
    </div>
  );
};

TimeZoneDisplay.displayName = 'TimeZoneDisplay';

// Time Zone Overlap Visualizer
interface TimeZoneOverlapVisualizerProps {
  timezones: string[];
  workingHoursStart?: number;
  workingHoursEnd?: number;
  referenceTimezone?: string;
  className?: string;
}

const TimeZoneOverlapVisualizer: React.FC<TimeZoneOverlapVisualizerProps> = ({
  timezones,
  workingHoursStart = 9,
  workingHoursEnd = 17,
  referenceTimezone,
  className,
}) => {
  const refTz = referenceTimezone || timezones[0] || 'UTC';
  
  const timeline = useMemo(
    () => createTimezoneTimeline(refTz, timezones.filter(tz => tz !== refTz)),
    [refTz, timezones]
  );

  const overlaps = useMemo(() => {
    const result: Record<string, TimezoneOverlap> = {};
    timezones.forEach(tz => {
      if (tz !== refTz) {
        result[tz] = calculateTimezoneOverlap(refTz, tz, workingHoursStart, workingHoursEnd);
      }
    });
    return result;
  }, [refTz, timezones, workingHoursStart, workingHoursEnd]);

  const qualityColors: Record<TimezoneOverlap['quality'], string> = {
    excellent: 'bg-success-500',
    good: 'bg-brand-500',
    fair: 'bg-warning-500',
    poor: 'bg-error-500',
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-neutral-500" />
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Time Zone Overlap
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {Object.entries(qualityColors).map(([quality, color]) => (
            <div key={quality} className="flex items-center gap-1">
              <div className={cn('w-2 h-2 rounded-full', color)} />
              <span className="text-neutral-500 dark:text-neutral-400 capitalize">{quality}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
        {/* Hours Header */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
          <div className="w-32 p-2 text-xs font-medium text-neutral-500 border-r border-neutral-200 dark:border-neutral-800">
            Timezone
          </div>
          <div className="flex-1 flex">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                key={hour}
                className={cn(
                  'flex-1 p-1 text-center text-[10px] text-neutral-400',
                  'border-r border-neutral-100 dark:border-neutral-800 last:border-r-0',
                  hour >= workingHoursStart && hour < workingHoursEnd && 'bg-brand-50/50 dark:bg-brand-950/30'
                )}
              >
                {hour}
              </div>
            ))}
          </div>
        </div>

        {/* Timezone Rows */}
        {[refTz, ...timezones.filter(tz => tz !== refTz)].map((tz, tzIndex) => {
          const tzInfo = getTimezoneInfo(tz);
          const isReference = tz === refTz;
          const overlap = overlaps[tz];

          return (
            <div
              key={tz}
              className={cn(
                'flex border-b border-neutral-200 dark:border-neutral-800 last:border-b-0',
                isReference && 'bg-brand-50/30 dark:bg-brand-950/20'
              )}
            >
              <div className="w-32 p-2 border-r border-neutral-200 dark:border-neutral-800">
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div className="cursor-help">
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {tz.split('/').pop()?.replace('_', ' ')}
                          {isReference && (
                            <span className="ml-1 text-brand-500 text-[10px]">•</span>
                          )}
                        </p>
                        <p className="text-[10px] text-neutral-500">
                          {tzInfo.offsetString}
                        </p>
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="z-50 px-3 py-2 text-xs bg-neutral-900 text-white rounded-lg"
                        sideOffset={5}
                      >
                        <p className="font-medium">{tz}</p>
                        {overlap && (
                          <p className="mt-1 text-neutral-400">
                            {overlap.overlapHours}h overlap ({overlap.quality})
                          </p>
                        )}
                        <Tooltip.Arrow className="fill-neutral-900" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
              <div className="flex-1 flex">
                {timeline.map(({ hour, times }) => {
                  const tzTime = times.find(t => t.timezone === tz);
                  const tzHour = tzTime?.hour ?? hour;
                  const isWorkingHour = tzHour >= workingHoursStart && tzHour < workingHoursEnd;
                  const isOverlapHour = !isReference && isWorkingHour && 
                    timeline[hour]?.times.find(t => t.timezone === refTz)?.isWorkingHour;

                  return (
                    <div
                      key={hour}
                      className={cn(
                        'flex-1 h-8',
                        'border-r border-neutral-100 dark:border-neutral-800 last:border-r-0',
                        isWorkingHour && 'bg-success-100/50 dark:bg-success-900/20',
                        isOverlapHour && overlap && qualityColors[overlap.quality].replace('bg-', 'bg-opacity-30 ')
                      )}
                      title={`${tzHour}:00 ${isWorkingHour ? '(Working hours)' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overlap Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(overlaps).map(([tz, overlap]) => (
          <div
            key={tz}
            className={cn(
              'p-3 rounded-lg border',
              'border-neutral-200 dark:border-neutral-800',
              'bg-white dark:bg-neutral-900'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {tz.split('/').pop()?.replace('_', ' ')}
              </span>
              <div className={cn('w-2 h-2 rounded-full', qualityColors[overlap.quality])} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {overlap.overlapHours}h
              </span>
              <span className="text-xs text-neutral-500 capitalize">
                {overlap.quality}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

TimeZoneOverlapVisualizer.displayName = 'TimeZoneOverlapVisualizer';

// Timezone Selector
interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full pl-10 pr-4 py-2.5',
          'bg-white dark:bg-neutral-900',
          'border border-neutral-300 dark:border-neutral-700',
          'rounded-lg text-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand-500'
        )}
      >
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz.name} value={tz.name}>
            {tz.label} (UTC{tz.offset >= 0 ? '+' : ''}{tz.offset})
          </option>
        ))}
      </select>
    </div>
  );
};

TimezoneSelector.displayName = 'TimezoneSelector';

export { TimeZoneDisplay, TimeZoneOverlapVisualizer, TimezoneSelector };
