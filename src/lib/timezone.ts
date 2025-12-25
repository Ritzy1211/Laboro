import { format, formatDistanceToNow, parseISO, isValid, differenceInMinutes } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { TimezoneInfo, TimezoneOverlap } from '@/types';

/**
 * Common timezone definitions with metadata
 */
export const COMMON_TIMEZONES = [
  { name: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -8 },
  { name: 'America/Denver', label: 'Mountain Time (MT)', offset: -7 },
  { name: 'America/Chicago', label: 'Central Time (CT)', offset: -6 },
  { name: 'America/New_York', label: 'Eastern Time (ET)', offset: -5 },
  { name: 'America/Sao_Paulo', label: 'Brasília Time (BRT)', offset: -3 },
  { name: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 0 },
  { name: 'Europe/Paris', label: 'Central European Time (CET)', offset: 1 },
  { name: 'Europe/Berlin', label: 'Central European Time (CET)', offset: 1 },
  { name: 'Europe/Moscow', label: 'Moscow Time (MSK)', offset: 3 },
  { name: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: 4 },
  { name: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 5.5 },
  { name: 'Asia/Bangkok', label: 'Indochina Time (ICT)', offset: 7 },
  { name: 'Asia/Singapore', label: 'Singapore Time (SGT)', offset: 8 },
  { name: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 8 },
  { name: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 9 },
  { name: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 11 },
  { name: 'Pacific/Auckland', label: 'New Zealand Time (NZT)', offset: 13 },
] as const;

/**
 * Get the user's browser timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get detailed timezone information
 */
export function getTimezoneInfo(timezone: string): TimezoneInfo {
  const now = new Date();
  const zonedTime = toZonedTime(now, timezone);
  
  // Calculate offset in minutes
  const offsetMinutes = differenceInMinutes(zonedTime, now);
  const offsetHours = offsetMinutes / 60;
  
  // Format offset string
  const sign = offsetHours >= 0 ? '+' : '-';
  const absHours = Math.floor(Math.abs(offsetHours));
  const minutes = Math.abs(offsetMinutes) % 60;
  const offsetString = `UTC${sign}${absHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Get abbreviation
  const abbreviation = formatInTimeZone(now, timezone, 'zzz');
  
  // Check for DST (simplified check)
  const janOffset = differenceInMinutes(toZonedTime(new Date(now.getFullYear(), 0, 1), timezone), new Date(now.getFullYear(), 0, 1));
  const julOffset = differenceInMinutes(toZonedTime(new Date(now.getFullYear(), 6, 1), timezone), new Date(now.getFullYear(), 6, 1));
  const isDST = offsetMinutes !== Math.min(janOffset, julOffset);
  
  return {
    name: timezone,
    offset: offsetHours,
    offsetString,
    abbreviation,
    isDST,
  };
}

/**
 * Format a date in a specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  formatStr: string = 'PPpp'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return formatInTimeZone(dateObj, timezone, formatStr);
}

/**
 * Convert a date from one timezone to another
 */
export function convertTimezone(
  date: Date | string,
  fromTimezone: string,
  toTimezone: string
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const utcDate = fromZonedTime(dateObj, fromTimezone);
  return toZonedTime(utcDate, toTimezone);
}

/**
 * Get the current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return toZonedTime(new Date(), timezone);
}

/**
 * Format time with timezone abbreviation
 */
export function formatTimeWithZone(
  date: Date | string,
  timezone: string,
  use24Hour: boolean = false
): string {
  const formatStr = use24Hour ? 'HH:mm zzz' : 'h:mm a zzz';
  return formatInTimezone(date, timezone, formatStr);
}

/**
 * Calculate working hours overlap between two timezones
 */
export function calculateTimezoneOverlap(
  timezone1: string,
  timezone2: string,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): TimezoneOverlap {
  const tz1Info = getTimezoneInfo(timezone1);
  const tz2Info = getTimezoneInfo(timezone2);
  
  const offsetDiff = Math.abs(tz1Info.offset - tz2Info.offset);
  
  // Calculate overlap
  const workingHours = workingHoursEnd - workingHoursStart;
  const overlapHours = Math.max(0, workingHours - offsetDiff);
  
  // Determine quality
  let quality: TimezoneOverlap['quality'];
  if (overlapHours >= 6) quality = 'excellent';
  else if (overlapHours >= 4) quality = 'good';
  else if (overlapHours >= 2) quality = 'fair';
  else quality = 'poor';
  
  // Calculate overlap window
  const startHour = Math.max(workingHoursStart, workingHoursStart + (tz2Info.offset - tz1Info.offset));
  const endHour = Math.min(workingHoursEnd, workingHoursEnd + (tz2Info.offset - tz1Info.offset));
  
  return {
    startHour: Math.round(startHour),
    endHour: Math.round(endHour),
    overlapHours: Math.round(overlapHours),
    quality,
  };
}

/**
 * Get overlapping hours for multiple timezones
 */
export function getMultiTimezoneOverlap(
  timezones: string[],
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): { start: number; end: number; hours: number } | null {
  if (timezones.length < 2) return null;
  
  const infos = timezones.map(getTimezoneInfo);
  const offsets = infos.map((i) => i.offset);
  
  const minOffset = Math.min(...offsets);
  const maxOffset = Math.max(...offsets);
  const totalDiff = maxOffset - minOffset;
  
  const overlapHours = Math.max(0, (workingHoursEnd - workingHoursStart) - totalDiff);
  
  if (overlapHours <= 0) return null;
  
  return {
    start: workingHoursStart + totalDiff / 2,
    end: workingHoursEnd - totalDiff / 2,
    hours: overlapHours,
  };
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date for display
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'PPP'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return format(dateObj, formatStr);
}

/**
 * Format a time for display
 */
export function formatTime(
  date: Date | string,
  use24Hour: boolean = false
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid time';
  return format(dateObj, use24Hour ? 'HH:mm' : 'h:mm a');
}

/**
 * Check if a time slot is within working hours
 */
export function isWithinWorkingHours(
  date: Date,
  timezone: string,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): boolean {
  const zonedTime = toZonedTime(date, timezone);
  const hour = zonedTime.getHours();
  return hour >= workingHoursStart && hour < workingHoursEnd;
}

/**
 * Get the next available working hour
 */
export function getNextWorkingHour(
  timezone: string,
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17
): Date {
  const now = getCurrentTimeInTimezone(timezone);
  const hour = now.getHours();
  
  if (hour < workingHoursStart) {
    now.setHours(workingHoursStart, 0, 0, 0);
  } else if (hour >= workingHoursEnd) {
    now.setDate(now.getDate() + 1);
    now.setHours(workingHoursStart, 0, 0, 0);
  }
  
  // Skip weekends
  const day = now.getDay();
  if (day === 0) now.setDate(now.getDate() + 1);
  if (day === 6) now.setDate(now.getDate() + 2);
  
  return fromZonedTime(now, timezone);
}

/**
 * Create a 24-hour timeline with timezone markers
 */
export function createTimezoneTimeline(
  referenceTimezone: string,
  compareTimezones: string[]
): { hour: number; times: { timezone: string; hour: number; isWorkingHour: boolean }[] }[] {
  const timeline = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const times = [referenceTimezone, ...compareTimezones].map((tz) => {
      const refInfo = getTimezoneInfo(referenceTimezone);
      const tzInfo = getTimezoneInfo(tz);
      const offsetDiff = tzInfo.offset - refInfo.offset;
      const tzHour = (hour + offsetDiff + 24) % 24;
      
      return {
        timezone: tz,
        hour: tzHour,
        isWorkingHour: tzHour >= 9 && tzHour < 17,
      };
    });
    
    timeline.push({ hour, times });
  }
  
  return timeline;
}
