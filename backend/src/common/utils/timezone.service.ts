import { Injectable } from '@nestjs/common';
import { DateTime, IANAZone, Duration } from 'luxon';

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailabilityWindow {
  dayOfWeek: number; // 0-6, 0 = Sunday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

@Injectable()
export class TimezoneService {
  private readonly defaultTimezone = 'UTC';

  /**
   * Convert a date from one timezone to another
   */
  convertTimezone(date: Date, fromTz: string, toTz: string): Date {
    const dt = DateTime.fromJSDate(date, { zone: fromTz });
    return dt.setZone(toTz).toJSDate();
  }

  /**
   * Get current time in a specific timezone
   */
  nowInTimezone(timezone: string): DateTime {
    return DateTime.now().setZone(timezone);
  }

  /**
   * Check if a timezone is valid
   */
  isValidTimezone(timezone: string): boolean {
    return IANAZone.isValidZone(timezone);
  }

  /**
   * Get the UTC offset for a timezone at a specific time
   */
  getUtcOffset(timezone: string, date: Date = new Date()): number {
    const dt = DateTime.fromJSDate(date, { zone: timezone });
    return dt.offset; // Returns offset in minutes
  }

  /**
   * Convert availability windows to UTC time slots for a specific date range
   */
  convertAvailabilityToUtc(
    windows: AvailabilityWindow[],
    startDate: Date,
    endDate: Date,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = DateTime.fromJSDate(startDate);
    const end = DateTime.fromJSDate(endDate);

    let current = start;
    while (current <= end) {
      for (const window of windows) {
        if (current.weekday % 7 === window.dayOfWeek) {
          const [startHour, startMin] = window.startTime.split(':').map(Number);
          const [endHour, endMin] = window.endTime.split(':').map(Number);

          const slotStart = current
            .setZone(window.timezone)
            .set({ hour: startHour, minute: startMin, second: 0 })
            .toUTC();

          const slotEnd = current
            .setZone(window.timezone)
            .set({ hour: endHour, minute: endMin, second: 0 })
            .toUTC();

          slots.push({
            start: slotStart.toJSDate(),
            end: slotEnd.toJSDate(),
          });
        }
      }
      current = current.plus({ days: 1 });
    }

    return slots;
  }

  /**
   * Check if two time slots overlap
   */
  doSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    return slot1.start < slot2.end && slot2.start < slot1.end;
  }

  /**
   * Find overlapping time between two arrays of time slots
   */
  findOverlappingSlots(
    slots1: TimeSlot[],
    slots2: TimeSlot[],
  ): TimeSlot[] {
    const overlaps: TimeSlot[] = [];

    for (const s1 of slots1) {
      for (const s2 of slots2) {
        if (this.doSlotsOverlap(s1, s2)) {
          const start = s1.start > s2.start ? s1.start : s2.start;
          const end = s1.end < s2.end ? s1.end : s2.end;
          overlaps.push({ start, end });
        }
      }
    }

    return this.mergeOverlappingSlots(overlaps);
  }

  /**
   * Merge overlapping time slots into continuous blocks
   */
  mergeOverlappingSlots(slots: TimeSlot[]): TimeSlot[] {
    if (slots.length === 0) return [];

    const sorted = [...slots].sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    const merged: TimeSlot[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const current = sorted[i];

      if (current.start <= last.end) {
        last.end = current.end > last.end ? current.end : last.end;
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Calculate total hours in a set of time slots
   */
  calculateTotalHours(slots: TimeSlot[]): number {
    return slots.reduce((total, slot) => {
      const duration = Duration.fromMillis(
        slot.end.getTime() - slot.start.getTime(),
      );
      return total + duration.as('hours');
    }, 0);
  }

  /**
   * Get working hours for a timezone (9 AM - 5 PM local time)
   */
  getWorkingHours(timezone: string, date: Date): TimeSlot {
    const dt = DateTime.fromJSDate(date, { zone: timezone });
    const start = dt.set({ hour: 9, minute: 0, second: 0 }).toUTC();
    const end = dt.set({ hour: 17, minute: 0, second: 0 }).toUTC();

    return {
      start: start.toJSDate(),
      end: end.toJSDate(),
    };
  }

  /**
   * Format date for display in a specific timezone
   */
  formatInTimezone(
    date: Date,
    timezone: string,
    format: string = 'yyyy-MM-dd HH:mm:ss ZZZZ',
  ): string {
    return DateTime.fromJSDate(date)
      .setZone(timezone)
      .toFormat(format);
  }

  /**
   * Get all valid IANA timezone identifiers
   */
  getAllTimezones(): string[] {
    return Intl.supportedValuesOf('timeZone');
  }

  /**
   * Group timezones by region
   */
  getTimezonesByRegion(): Record<string, string[]> {
    const timezones = this.getAllTimezones();
    const grouped: Record<string, string[]> = {};

    for (const tz of timezones) {
      const [region] = tz.split('/');
      if (!grouped[region]) {
        grouped[region] = [];
      }
      grouped[region].push(tz);
    }

    return grouped;
  }
}
