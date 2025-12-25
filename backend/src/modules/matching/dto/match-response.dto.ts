import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '@prisma/client';

export class MatchWorkerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  profileImageUrl?: string;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  reliabilityScore?: number;

  @ApiPropertyOptional()
  averageRating?: number;

  @ApiPropertyOptional()
  totalJobsCompleted?: number;
}

export class MatchJobDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  scheduledStartTime: Date;

  @ApiPropertyOptional()
  scheduledEndTime?: Date;

  @ApiProperty()
  timezone: string;

  @ApiPropertyOptional()
  budget?: number;

  @ApiPropertyOptional()
  hourlyRate?: number;

  @ApiProperty()
  isRemote: boolean;

  @ApiPropertyOptional()
  location?: any;
}

export class MatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  jobId: string;

  @ApiProperty()
  workerId: string;

  @ApiProperty({ enum: MatchStatus })
  status: MatchStatus;

  @ApiProperty()
  matchScore: number;

  @ApiPropertyOptional()
  matchReason?: Record<string, any>;

  @ApiPropertyOptional()
  respondedAt?: Date;

  @ApiPropertyOptional()
  responseNote?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class MatchDetailResponseDto extends MatchResponseDto {
  @ApiPropertyOptional({ type: MatchWorkerDto })
  worker?: MatchWorkerDto;

  @ApiPropertyOptional({ type: MatchJobDto })
  job?: MatchJobDto;
}

export class MatchScoreBreakdownDto {
  @ApiProperty()
  skillScore: number;

  @ApiProperty()
  availabilityScore: number;

  @ApiProperty()
  ratingScore: number;

  @ApiProperty()
  reliabilityScore: number;

  @ApiProperty()
  distanceScore: number;

  @ApiProperty()
  totalScore: number;

  @ApiPropertyOptional()
  matchedSkills?: string[];

  @ApiPropertyOptional()
  missingSkills?: string[];

  @ApiPropertyOptional()
  availableWindows?: any[];
}

export class WorkerMatchSuggestionDto {
  @ApiProperty({ type: MatchWorkerDto })
  worker: MatchWorkerDto;

  @ApiProperty({ type: MatchScoreBreakdownDto })
  scoreBreakdown: MatchScoreBreakdownDto;

  @ApiProperty()
  overallScore: number;

  @ApiProperty()
  rank: number;
}

export class JobMatchSuggestionDto {
  @ApiProperty({ type: MatchJobDto })
  job: MatchJobDto;

  @ApiProperty({ type: MatchScoreBreakdownDto })
  scoreBreakdown: MatchScoreBreakdownDto;

  @ApiProperty()
  overallScore: number;

  @ApiProperty()
  rank: number;
}
