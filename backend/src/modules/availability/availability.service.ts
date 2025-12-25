import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import { TimezoneService } from '@/common/utils/timezone.service';
import {
  CreateAvailabilityWindowDto,
  UpdateAvailabilityWindowDto,
  BulkAvailabilityDto,
  AvailabilityQueryDto,
  CheckAvailabilityDto,
  FindAvailableWorkersDto,
  DayOfWeek,
  AvailabilityType,
  TimeSlotDto,
} from './dto/availability.dto';

@Injectable()
export class AvailabilityService {
  private readonly CACHE_PREFIX = 'availability:';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly timezoneService: TimezoneService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async createWindow(userId: string, dto: CreateAvailabilityWindowDto) {
    // Validate timezone
    if (!this.timezoneService.isValidTimezone(dto.timezone)) {
      throw new BadRequestException('Invalid timezone');
    }

    // Validate time slots
    this.validateTimeSlots(dto.timeSlots);

    // Validate type-specific requirements
    if (dto.type === AvailabilityType.RECURRING && (!dto.daysOfWeek || dto.daysOfWeek.length === 0)) {
      throw new BadRequestException('Days of week required for recurring availability');
    }

    if ((dto.type === AvailabilityType.ONE_TIME || dto.type === AvailabilityType.EXCEPTION) && !dto.specificDate) {
      throw new BadRequestException('Specific date required for one-time or exception availability');
    }

    // Check for conflicts
    await this.checkForConflicts(userId, dto);

    const window = await this.prisma.availabilityWindow.create({
      data: {
        userId,
        type: dto.type,
        daysOfWeek: dto.daysOfWeek,
        specificDate: dto.specificDate ? new Date(dto.specificDate) : null,
        startTime: dto.timeSlots[0].startTime,
        endTime: dto.timeSlots[dto.timeSlots.length - 1].endTime,
        timezone: dto.timezone,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
        isActive: dto.isActive ?? true,
        metadata: {
          timeSlots: dto.timeSlots,
          notes: dto.notes,
        },
      },
    });

    await this.invalidateUserCache(userId);

    this.eventEmitter.emit('availability.created', { userId, window });

    return this.formatWindow(window);
  }

  async bulkCreate(userId: string, dto: BulkAvailabilityDto) {
    if (dto.replaceExisting) {
      await this.prisma.availabilityWindow.deleteMany({
        where: { userId },
      });
    }

    const windows = await Promise.all(
      dto.windows.map((windowDto) => this.createWindow(userId, windowDto)),
    );

    return windows;
  }

  async findUserWindows(userId: string) {
    const cacheKey = `${this.CACHE_PREFIX}${userId}:windows`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const windows = await this.prisma.availabilityWindow.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: [
        { type: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const formatted = windows.map((w) => this.formatWindow(w));
    await this.redis.set(cacheKey, formatted, this.CACHE_TTL);

    return formatted;
  }

  async findOne(userId: string, windowId: string) {
    const window = await this.prisma.availabilityWindow.findFirst({
      where: {
        id: windowId,
        userId,
      },
    });

    if (!window) {
      throw new NotFoundException('Availability window not found');
    }

    return this.formatWindow(window);
  }

  async update(userId: string, windowId: string, dto: UpdateAvailabilityWindowDto) {
    const window = await this.prisma.availabilityWindow.findFirst({
      where: { id: windowId, userId },
    });

    if (!window) {
      throw new NotFoundException('Availability window not found');
    }

    if (dto.timezone && !this.timezoneService.isValidTimezone(dto.timezone)) {
      throw new BadRequestException('Invalid timezone');
    }

    if (dto.timeSlots) {
      this.validateTimeSlots(dto.timeSlots);
    }

    const updated = await this.prisma.availabilityWindow.update({
      where: { id: windowId },
      data: {
        type: dto.type,
        daysOfWeek: dto.daysOfWeek,
        specificDate: dto.specificDate ? new Date(dto.specificDate) : undefined,
        startTime: dto.timeSlots?.[0]?.startTime,
        endTime: dto.timeSlots?.[dto.timeSlots.length - 1]?.endTime,
        timezone: dto.timezone,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
        isActive: dto.isActive,
        metadata: dto.timeSlots || dto.notes ? {
          timeSlots: dto.timeSlots ?? (window.metadata as any)?.timeSlots,
          notes: dto.notes ?? (window.metadata as any)?.notes,
        } : undefined,
      },
    });

    await this.invalidateUserCache(userId);

    this.eventEmitter.emit('availability.updated', { userId, window: updated });

    return this.formatWindow(updated);
  }

  async remove(userId: string, windowId: string) {
    const window = await this.prisma.availabilityWindow.findFirst({
      where: { id: windowId, userId },
    });

    if (!window) {
      throw new NotFoundException('Availability window not found');
    }

    await this.prisma.availabilityWindow.delete({
      where: { id: windowId },
    });

    await this.invalidateUserCache(userId);

    this.eventEmitter.emit('availability.deleted', { userId, windowId });
  }

  // ==================== AVAILABILITY QUERIES ====================

  async getAvailability(userId: string, query: AvailabilityQueryDto) {
    const startDate = DateTime.fromISO(query.startDate);
    const endDate = DateTime.fromISO(query.endDate);
    const targetTimezone = query.timezone ?? 'UTC';

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const windows = await this.prisma.availabilityWindow.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { type: AvailabilityType.RECURRING },
          {
            type: AvailabilityType.ONE_TIME,
            specificDate: {
              gte: startDate.toJSDate(),
              lte: endDate.toJSDate(),
            },
          },
          ...(query.includeExceptions ? [{
            type: AvailabilityType.EXCEPTION,
            specificDate: {
              gte: startDate.toJSDate(),
              lte: endDate.toJSDate(),
            },
          }] : []),
        ],
      },
    });

    const availability: any[] = [];
    let current = startDate;

    while (current <= endDate) {
      const dayOfWeek = this.getDayOfWeek(current.weekday);
      const dateStr = current.toISODate();

      // Check for exceptions first
      const exception = windows.find(
        (w) =>
          w.type === AvailabilityType.EXCEPTION &&
          DateTime.fromJSDate(w.specificDate!).toISODate() === dateStr,
      );

      if (exception) {
        availability.push({
          date: dateStr,
          dayOfWeek,
          slots: [],
          timezone: targetTimezone,
          isAvailable: false,
          exception: (exception.metadata as any)?.notes ?? 'Not available',
        });
        current = current.plus({ days: 1 });
        continue;
      }

      // Check for one-time availability
      const oneTime = windows.find(
        (w) =>
          w.type === AvailabilityType.ONE_TIME &&
          DateTime.fromJSDate(w.specificDate!).toISODate() === dateStr,
      );

      if (oneTime) {
        const slots = this.convertSlotsToTimezone(
          (oneTime.metadata as any)?.timeSlots ?? [{ startTime: oneTime.startTime, endTime: oneTime.endTime }],
          oneTime.timezone,
          targetTimezone,
          current,
        );

        availability.push({
          date: dateStr,
          dayOfWeek,
          slots,
          timezone: targetTimezone,
          isAvailable: true,
        });
        current = current.plus({ days: 1 });
        continue;
      }

      // Check recurring availability
      const recurring = windows.filter(
        (w) =>
          w.type === AvailabilityType.RECURRING &&
          w.daysOfWeek?.includes(dayOfWeek) &&
          this.isWindowEffective(w, current),
      );

      if (recurring.length > 0) {
        const allSlots: TimeSlotDto[] = [];
        for (const window of recurring) {
          const slots = this.convertSlotsToTimezone(
            (window.metadata as any)?.timeSlots ?? [{ startTime: window.startTime, endTime: window.endTime }],
            window.timezone,
            targetTimezone,
            current,
          );
          allSlots.push(...slots);
        }

        availability.push({
          date: dateStr,
          dayOfWeek,
          slots: this.mergeSlots(allSlots),
          timezone: targetTimezone,
          isAvailable: true,
        });
      } else {
        availability.push({
          date: dateStr,
          dayOfWeek,
          slots: [],
          timezone: targetTimezone,
          isAvailable: false,
        });
      }

      current = current.plus({ days: 1 });
    }

    return availability;
  }

  async getWeeklyAvailability(userId: string, timezone?: string) {
    const cacheKey = `${this.CACHE_PREFIX}${userId}:weekly:${timezone ?? 'user'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });

    const targetTimezone = timezone ?? user?.timezone ?? 'UTC';

    const today = DateTime.now().setZone(targetTimezone).startOf('week');
    const endOfWeek = today.plus({ days: 6 });

    const availability = await this.getAvailability(userId, {
      startDate: today.toISODate()!,
      endDate: endOfWeek.toISODate()!,
      timezone: targetTimezone,
      includeExceptions: true,
    });

    const totalHours = availability.reduce((sum, day) => {
      return sum + day.slots.reduce((slotSum: number, slot: TimeSlotDto) => {
        const start = DateTime.fromFormat(slot.startTime, 'HH:mm');
        const end = DateTime.fromFormat(slot.endTime, 'HH:mm');
        return slotSum + end.diff(start, 'hours').hours;
      }, 0);
    }, 0);

    const result = {
      userId,
      timezone: targetTimezone,
      days: availability,
      totalHoursPerWeek: Math.round(totalHours * 10) / 10,
    };

    await this.redis.set(cacheKey, result, 900); // 15 minutes

    return result;
  }

  async checkAvailability(userId: string, dto: CheckAvailabilityDto) {
    const date = DateTime.fromISO(dto.date);
    const availability = await this.getAvailability(userId, {
      startDate: dto.date,
      endDate: dto.date,
      timezone: dto.timezone,
      includeExceptions: true,
    });

    const dayAvailability = availability[0];

    if (!dayAvailability?.isAvailable) {
      return {
        isAvailable: false,
        reason: dayAvailability?.exception ?? 'No availability on this date',
        availableSlots: [],
        conflictingSlots: [],
      };
    }

    const requestedSlot = {
      startTime: dto.startTime,
      endTime: dto.endTime,
    };

    const overlappingSlots = dayAvailability.slots.filter((slot: TimeSlotDto) =>
      this.slotsOverlap(slot, requestedSlot),
    );

    if (overlappingSlots.length === 0) {
      return {
        isAvailable: false,
        reason: 'Requested time not within available hours',
        availableSlots: dayAvailability.slots,
        conflictingSlots: [],
      };
    }

    // Check if fully covered
    const isFullyCovered = this.isSlotFullyCovered(requestedSlot, overlappingSlots);

    return {
      isAvailable: isFullyCovered,
      reason: isFullyCovered ? undefined : 'Requested time only partially available',
      availableSlots: overlappingSlots,
      conflictingSlots: [],
    };
  }

  async findAvailableWorkers(dto: FindAvailableWorkersDto) {
    const date = DateTime.fromISO(dto.date);
    const dayOfWeek = this.getDayOfWeek(date.weekday);

    // Find users with availability on this day
    const windowsQuery: any = {
      isActive: true,
      OR: [
        {
          type: AvailabilityType.RECURRING,
          daysOfWeek: { has: dayOfWeek },
        },
        {
          type: AvailabilityType.ONE_TIME,
          specificDate: {
            gte: date.startOf('day').toJSDate(),
            lte: date.endOf('day').toJSDate(),
          },
        },
      ],
    };

    const windows = await this.prisma.availabilityWindow.findMany({
      where: windowsQuery,
      include: {
        user: {
          include: {
            userSkills: {
              include: { skill: true },
            },
          },
        },
      },
    });

    // Filter by exceptions
    const exceptedUserIds = await this.prisma.availabilityWindow.findMany({
      where: {
        type: AvailabilityType.EXCEPTION,
        specificDate: {
          gte: date.startOf('day').toJSDate(),
          lte: date.endOf('day').toJSDate(),
        },
      },
      select: { userId: true },
    });

    const exceptedSet = new Set(exceptedUserIds.map((e) => e.userId));

    const availableWorkers: any[] = [];

    for (const window of windows) {
      if (exceptedSet.has(window.userId)) continue;

      // Convert requested time to worker's timezone
      const workerTimezone = window.timezone;
      const requestedStart = DateTime.fromISO(`${dto.date}T${dto.startTime}`, {
        zone: dto.timezone,
      }).setZone(workerTimezone);
      const requestedEnd = DateTime.fromISO(`${dto.date}T${dto.endTime}`, {
        zone: dto.timezone,
      }).setZone(workerTimezone);

      // Check if window covers requested time
      const windowSlots = (window.metadata as any)?.timeSlots ?? [
        { startTime: window.startTime, endTime: window.endTime },
      ];

      const matchingSlots = windowSlots.filter((slot: TimeSlotDto) => {
        const slotStart = DateTime.fromFormat(slot.startTime, 'HH:mm', {
          zone: workerTimezone,
        }).set({
          year: requestedStart.year,
          month: requestedStart.month,
          day: requestedStart.day,
        });
        const slotEnd = DateTime.fromFormat(slot.endTime, 'HH:mm', {
          zone: workerTimezone,
        }).set({
          year: requestedEnd.year,
          month: requestedEnd.month,
          day: requestedEnd.day,
        });

        return slotStart <= requestedStart && slotEnd >= requestedEnd;
      });

      if (matchingSlots.length === 0) continue;

      // Filter by skills if specified
      if (dto.skillIds && dto.skillIds.length > 0) {
        const userSkillIds = window.user.userSkills.map((us) => us.skillId);
        const hasAllSkills = dto.skillIds.every((skillId) =>
          userSkillIds.includes(skillId),
        );
        if (!hasAllSkills) continue;
      }

      availableWorkers.push({
        userId: window.user.id,
        firstName: window.user.firstName,
        lastName: window.user.lastName,
        avatar: window.user.avatar,
        timezone: workerTimezone,
        availableSlots: this.convertSlotsToTimezone(
          matchingSlots,
          workerTimezone,
          dto.timezone,
          date,
        ),
        matchingSkills: window.user.userSkills
          .filter((us) => dto.skillIds?.includes(us.skillId))
          .map((us) => us.skill.name),
        reliabilityScore: window.user.reliabilityScore ?? 0,
      });
    }

    // Sort by reliability score
    availableWorkers.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

    return availableWorkers.slice(0, dto.limit ?? 50);
  }

  // ==================== HELPERS ====================

  private validateTimeSlots(slots: TimeSlotDto[]) {
    for (const slot of slots) {
      const start = DateTime.fromFormat(slot.startTime, 'HH:mm');
      const end = DateTime.fromFormat(slot.endTime, 'HH:mm');

      if (end <= start) {
        throw new BadRequestException(
          `Invalid time slot: ${slot.startTime} - ${slot.endTime}`,
        );
      }
    }

    // Check for overlaps within slots
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (this.slotsOverlap(slots[i], slots[j])) {
          throw new BadRequestException('Time slots cannot overlap');
        }
      }
    }
  }

  private async checkForConflicts(userId: string, dto: CreateAvailabilityWindowDto) {
    if (dto.type === AvailabilityType.RECURRING && dto.daysOfWeek) {
      const existing = await this.prisma.availabilityWindow.findFirst({
        where: {
          userId,
          type: AvailabilityType.RECURRING,
          daysOfWeek: { hasSome: dto.daysOfWeek },
          isActive: true,
        },
      });

      if (existing) {
        const existingSlots = (existing.metadata as any)?.timeSlots ?? [
          { startTime: existing.startTime, endTime: existing.endTime },
        ];

        for (const newSlot of dto.timeSlots) {
          for (const existingSlot of existingSlots) {
            if (this.slotsOverlap(newSlot, existingSlot)) {
              throw new ConflictException(
                'Time slot conflicts with existing availability',
              );
            }
          }
        }
      }
    }
  }

  private slotsOverlap(slot1: TimeSlotDto, slot2: TimeSlotDto): boolean {
    const s1Start = this.timeToMinutes(slot1.startTime);
    const s1End = this.timeToMinutes(slot1.endTime);
    const s2Start = this.timeToMinutes(slot2.startTime);
    const s2End = this.timeToMinutes(slot2.endTime);

    return s1Start < s2End && s2Start < s1End;
  }

  private isSlotFullyCovered(
    requested: TimeSlotDto,
    availableSlots: TimeSlotDto[],
  ): boolean {
    const requestedStart = this.timeToMinutes(requested.startTime);
    const requestedEnd = this.timeToMinutes(requested.endTime);

    for (const slot of availableSlots) {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);

      if (slotStart <= requestedStart && slotEnd >= requestedEnd) {
        return true;
      }
    }

    return false;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private mergeSlots(slots: TimeSlotDto[]): TimeSlotDto[] {
    if (slots.length === 0) return [];

    const sorted = [...slots].sort(
      (a, b) => this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
    );

    const merged: TimeSlotDto[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const current = sorted[i];

      if (this.timeToMinutes(current.startTime) <= this.timeToMinutes(last.endTime)) {
        last.endTime = this.minutesToTime(
          Math.max(
            this.timeToMinutes(last.endTime),
            this.timeToMinutes(current.endTime),
          ),
        );
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  private getDayOfWeek(weekday: number): DayOfWeek {
    const days: DayOfWeek[] = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
      DayOfWeek.SUNDAY,
    ];
    return days[weekday - 1];
  }

  private isWindowEffective(window: any, date: DateTime): boolean {
    if (window.effectiveFrom && date < DateTime.fromJSDate(window.effectiveFrom)) {
      return false;
    }
    if (window.effectiveUntil && date > DateTime.fromJSDate(window.effectiveUntil)) {
      return false;
    }
    return true;
  }

  private convertSlotsToTimezone(
    slots: TimeSlotDto[],
    fromTimezone: string,
    toTimezone: string,
    date: DateTime,
  ): TimeSlotDto[] {
    return slots.map((slot) => {
      const startDt = DateTime.fromFormat(slot.startTime, 'HH:mm', {
        zone: fromTimezone,
      }).set({
        year: date.year,
        month: date.month,
        day: date.day,
      });

      const endDt = DateTime.fromFormat(slot.endTime, 'HH:mm', {
        zone: fromTimezone,
      }).set({
        year: date.year,
        month: date.month,
        day: date.day,
      });

      return {
        startTime: startDt.setZone(toTimezone).toFormat('HH:mm'),
        endTime: endDt.setZone(toTimezone).toFormat('HH:mm'),
      };
    });
  }

  private formatWindow(window: any) {
    const metadata = window.metadata as any;
    return {
      id: window.id,
      userId: window.userId,
      type: window.type,
      daysOfWeek: window.daysOfWeek,
      specificDate: window.specificDate,
      timeSlots: metadata?.timeSlots ?? [
        { startTime: window.startTime, endTime: window.endTime },
      ],
      timezone: window.timezone,
      effectiveFrom: window.effectiveFrom,
      effectiveUntil: window.effectiveUntil,
      isActive: window.isActive,
      notes: metadata?.notes,
      createdAt: window.createdAt,
      updatedAt: window.updatedAt,
    };
  }

  private async invalidateUserCache(userId: string) {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}${userId}:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redis.del(key)));
    }
  }
}
