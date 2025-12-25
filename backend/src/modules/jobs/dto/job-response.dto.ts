import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, JobType, JobPriority, TaskStatus } from '@prisma/client';

export class LocationResponseDto {
  @ApiProperty()
  address: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;
}

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isCompleted: boolean;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  assigneeId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class JobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: JobStatus })
  status: JobStatus;

  @ApiProperty({ enum: JobType })
  type: JobType;

  @ApiProperty({ enum: JobPriority })
  priority: JobPriority;

  @ApiPropertyOptional({ type: LocationResponseDto })
  location?: LocationResponseDto;

  @ApiProperty()
  isRemote: boolean;

  @ApiPropertyOptional()
  budget?: number;

  @ApiPropertyOptional()
  hourlyRate?: number;

  @ApiPropertyOptional()
  estimatedHours?: number;

  @ApiProperty()
  scheduledStartTime: Date;

  @ApiPropertyOptional()
  scheduledEndTime?: Date;

  @ApiPropertyOptional()
  actualStartTime?: Date;

  @ApiPropertyOptional()
  actualEndTime?: Date;

  @ApiProperty()
  timezone: string;

  @ApiPropertyOptional()
  requiredSkills?: string[];

  @ApiProperty()
  workersNeeded: number;

  @ApiProperty()
  workersAssigned: number;

  @ApiProperty()
  clientId: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class JobDetailResponseDto extends JobResponseDto {
  @ApiPropertyOptional({ type: [TaskResponseDto] })
  tasks?: TaskResponseDto[];

  @ApiPropertyOptional()
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };

  @ApiPropertyOptional()
  organization?: {
    id: string;
    name: string;
    logo?: string;
  };

  @ApiPropertyOptional()
  matchesCount?: number;
}

export class JobStatsDto {
  @ApiProperty()
  totalJobs: number;

  @ApiProperty()
  draftJobs: number;

  @ApiProperty()
  openJobs: number;

  @ApiProperty()
  inProgressJobs: number;

  @ApiProperty()
  completedJobs: number;

  @ApiProperty()
  cancelledJobs: number;

  @ApiProperty()
  totalBudget: number;

  @ApiProperty()
  averageBudget: number;
}
