import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  emailVerified: boolean;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  preferredLanguage?: string;

  @ApiPropertyOptional()
  profileImageUrl?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WorkerProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  skills?: any[];

  @ApiPropertyOptional()
  hourlyRate?: number;

  @ApiProperty()
  isAvailable: boolean;

  @ApiPropertyOptional()
  certifications?: string[];

  @ApiPropertyOptional()
  languages?: string[];

  @ApiPropertyOptional()
  maxHoursPerWeek?: number;

  @ApiPropertyOptional()
  travelRadius?: number;

  @ApiProperty()
  reliabilityScore: number;

  @ApiProperty()
  totalJobsCompleted: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalHoursWorked: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserWithWorkerProfileDto extends UserResponseDto {
  @ApiPropertyOptional({ type: WorkerProfileResponseDto })
  workerProfile?: WorkerProfileResponseDto;
}

export class AvailabilityWindowResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  dayOfWeek: number;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  endTime: string;

  @ApiProperty()
  timezone: string;

  @ApiProperty()
  isRecurring: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class UserStatsDto {
  @ApiProperty()
  totalJobsCompleted: number;

  @ApiProperty()
  totalHoursWorked: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  reliabilityScore: number;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  activeJobsCount: number;

  @ApiProperty()
  upcomingJobsCount: number;
}
