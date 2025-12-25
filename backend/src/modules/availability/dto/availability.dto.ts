import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsInt,
  Min,
  Max,
  IsDateString,
  ValidateNested,
  ArrayMinSize,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum AvailabilityType {
  RECURRING = 'RECURRING',
  ONE_TIME = 'ONE_TIME',
  EXCEPTION = 'EXCEPTION',
}

export class TimeSlotDto {
  @ApiProperty({ description: 'Start time in HH:mm format', example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '17:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:mm format',
  })
  endTime: string;
}

export class CreateAvailabilityWindowDto {
  @ApiProperty({ enum: AvailabilityType, example: AvailabilityType.RECURRING })
  @IsEnum(AvailabilityType)
  type: AvailabilityType;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    isArray: true,
    description: 'Days of week (required for RECURRING type)',
  })
  @IsEnum(DayOfWeek, { each: true })
  @IsArray()
  @IsOptional()
  daysOfWeek?: DayOfWeek[];

  @ApiPropertyOptional({ description: 'Specific date for ONE_TIME or EXCEPTION' })
  @IsDateString()
  @IsOptional()
  specificDate?: string;

  @ApiProperty({ type: [TimeSlotDto], description: 'Time slots for this window' })
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  @ArrayMinSize(1)
  @IsArray()
  timeSlots: TimeSlotDto[];

  @ApiProperty({ description: 'Timezone identifier', example: 'America/New_York' })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiPropertyOptional({ description: 'Effective from date' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective until date' })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Is this window active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Notes about this availability' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAvailabilityWindowDto extends PartialType(CreateAvailabilityWindowDto) {}

export class BulkAvailabilityDto {
  @ApiProperty({ type: [CreateAvailabilityWindowDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateAvailabilityWindowDto)
  @IsArray()
  @ArrayMinSize(1)
  windows: CreateAvailabilityWindowDto[];

  @ApiPropertyOptional({ description: 'Replace all existing availability' })
  @IsBoolean()
  @IsOptional()
  replaceExisting?: boolean;
}

export class AvailabilityQueryDto {
  @ApiProperty({ description: 'Start date for availability check' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for availability check' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Target timezone for results' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Include exceptions' })
  @IsBoolean()
  @IsOptional()
  includeExceptions?: boolean;
}

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Date to check' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Start time in HH:mm', example: '10:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm', example: '12:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

  @ApiProperty({ description: 'Timezone of the request' })
  @IsString()
  @IsNotEmpty()
  timezone: string;
}

export class FindAvailableWorkersDto {
  @ApiProperty({ description: 'Required date' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Start time in HH:mm' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  endTime: string;

  @ApiProperty({ description: 'Timezone of the job' })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiPropertyOptional({ description: 'Required skill IDs', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  skillIds?: string[];

  @ApiPropertyOptional({ description: 'Location coordinates' })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({ description: 'Maximum distance in kilometers' })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  maxDistance?: number;

  @ApiPropertyOptional({ description: 'Number of results' })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

export class LocationDto {
  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;
}
