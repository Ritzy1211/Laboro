import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsArray,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum TaskStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Install HVAC Unit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Parent job ID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Assigned worker ID' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Estimated duration in minutes' })
  @IsInt()
  @Min(1)
  @Max(10080) // Max 1 week
  @IsOptional()
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Scheduled start date/time' })
  @IsDateString()
  @IsOptional()
  scheduledStart?: string;

  @ApiPropertyOptional({ description: 'Scheduled end date/time' })
  @IsDateString()
  @IsOptional()
  scheduledEnd?: string;

  @ApiPropertyOptional({ description: 'Task order within job' })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Required skill IDs', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  requiredSkillIds?: string[];

  @ApiPropertyOptional({ description: 'Dependent task IDs (must complete first)', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  dependencyIds?: string[];

  @ApiPropertyOptional({ description: 'Custom checklist items', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  checklist?: string[];

  @ApiPropertyOptional({ description: 'Location for the task' })
  @ValidateNested()
  @Type(() => TaskLocationDto)
  @IsOptional()
  location?: TaskLocationDto;

  @ApiPropertyOptional({ description: 'Additional instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class TaskLocationDto {
  @ApiProperty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiPropertyOptional({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}

export class UpdateTaskStatusDto {
  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({ description: 'Status change notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Actual duration in minutes' })
  @IsInt()
  @Min(0)
  @IsOptional()
  actualDuration?: number;
}

export class AssignTaskDto {
  @ApiProperty({ description: 'Worker ID to assign' })
  @IsString()
  @IsNotEmpty()
  assigneeId: string;

  @ApiPropertyOptional({ description: 'Assignment notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Notify the worker' })
  @IsBoolean()
  @IsOptional()
  notify?: boolean;
}

export class BulkCreateTasksDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ type: [CreateTaskDto] })
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  @IsArray()
  tasks: Omit<CreateTaskDto, 'jobId'>[];
}

export class UpdateChecklistDto {
  @ApiProperty({ description: 'Checklist item index' })
  @IsInt()
  @Min(0)
  itemIndex: number;

  @ApiProperty({ description: 'Is item completed' })
  @IsBoolean()
  completed: boolean;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TaskFilterDto {
  @ApiPropertyOptional({ enum: TaskStatus, isArray: true })
  @IsEnum(TaskStatus, { each: true })
  @IsOptional()
  status?: TaskStatus[];

  @ApiPropertyOptional({ enum: TaskPriority, isArray: true })
  @IsEnum(TaskPriority, { each: true })
  @IsOptional()
  priority?: TaskPriority[];

  @ApiPropertyOptional({ description: 'Assigned to user ID' })
  @IsString()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Job ID' })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Scheduled after date' })
  @IsDateString()
  @IsOptional()
  scheduledAfter?: string;

  @ApiPropertyOptional({ description: 'Scheduled before date' })
  @IsDateString()
  @IsOptional()
  scheduledBefore?: string;

  @ApiPropertyOptional({ description: 'Include overdue tasks only' })
  @IsBoolean()
  @IsOptional()
  overdueOnly?: boolean;
}

export class TaskTimeLogDto {
  @ApiProperty({ description: 'Started at timestamp' })
  @IsDateString()
  startedAt: string;

  @ApiPropertyOptional({ description: 'Ended at timestamp' })
  @IsDateString()
  @IsOptional()
  endedAt?: string;

  @ApiPropertyOptional({ description: 'Time log notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Break duration in minutes' })
  @IsInt()
  @Min(0)
  @IsOptional()
  breakDuration?: number;
}
