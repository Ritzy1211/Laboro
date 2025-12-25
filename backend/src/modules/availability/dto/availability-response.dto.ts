import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvailabilityType, DayOfWeek, TimeSlotDto } from './availability.dto';

export class AvailabilityWindowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: AvailabilityType })
  type: AvailabilityType;

  @ApiPropertyOptional({ enum: DayOfWeek, isArray: true })
  daysOfWeek?: DayOfWeek[];

  @ApiPropertyOptional()
  specificDate?: Date;

  @ApiProperty({ type: [TimeSlotDto] })
  timeSlots: TimeSlotDto[];

  @ApiProperty()
  timezone: string;

  @ApiPropertyOptional()
  effectiveFrom?: Date;

  @ApiPropertyOptional()
  effectiveUntil?: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AvailabilitySlotResponseDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  dayOfWeek: DayOfWeek;

  @ApiProperty({ type: [TimeSlotDto] })
  slots: TimeSlotDto[];

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  isAvailable: boolean;

  @ApiPropertyOptional()
  exception?: string;
}

export class WeeklyAvailabilityResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ type: [AvailabilitySlotResponseDto] })
  days: AvailabilitySlotResponseDto[];

  @ApiProperty()
  totalHoursPerWeek: number;
}

export class AvailabilityCheckResponseDto {
  @ApiProperty()
  isAvailable: boolean;

  @ApiPropertyOptional()
  reason?: string;

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  availableSlots?: TimeSlotDto[];

  @ApiPropertyOptional({ type: [TimeSlotDto] })
  conflictingSlots?: TimeSlotDto[];
}

export class AvailableWorkerResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty({ type: [TimeSlotDto] })
  availableSlots: TimeSlotDto[];

  @ApiProperty()
  matchScore: number;

  @ApiPropertyOptional()
  distance?: number;

  @ApiProperty()
  reliabilityScore: number;

  @ApiProperty({ type: [String] })
  matchingSkills: string[];
}
