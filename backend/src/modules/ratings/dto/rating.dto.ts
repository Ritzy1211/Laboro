import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum RatingType {
  JOB_COMPLETION = 'JOB_COMPLETION',
  TASK_COMPLETION = 'TASK_COMPLETION',
  WORKER_PERFORMANCE = 'WORKER_PERFORMANCE',
  CLIENT_EXPERIENCE = 'CLIENT_EXPERIENCE',
}

export enum RatingCategory {
  QUALITY = 'QUALITY',
  COMMUNICATION = 'COMMUNICATION',
  PUNCTUALITY = 'PUNCTUALITY',
  PROFESSIONALISM = 'PROFESSIONALISM',
  VALUE = 'VALUE',
  OVERALL = 'OVERALL',
}

export class CreateRatingDto {
  @ApiProperty({ description: 'ID of the user being rated' })
  @IsString()
  @IsNotEmpty()
  ratedUserId: string;

  @ApiProperty({ description: 'Related job ID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiPropertyOptional({ description: 'Related task ID' })
  @IsString()
  @IsOptional()
  taskId?: string;

  @ApiProperty({ enum: RatingType, example: RatingType.JOB_COMPLETION })
  @IsEnum(RatingType)
  type: RatingType;

  @ApiProperty({ description: 'Overall rating score', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  overallScore: number;

  @ApiPropertyOptional({ description: 'Category-specific ratings', type: 'object' })
  @IsOptional()
  categoryScores?: Record<RatingCategory, number>;

  @ApiPropertyOptional({ description: 'Written review' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  review?: string;

  @ApiPropertyOptional({ description: 'Positive tags', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  positiveTags?: string[];

  @ApiPropertyOptional({ description: 'Areas for improvement', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  improvementTags?: string[];

  @ApiPropertyOptional({ description: 'Would recommend this person' })
  @IsBoolean()
  @IsOptional()
  wouldRecommend?: boolean;

  @ApiPropertyOptional({ description: 'Is this rating private' })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class UpdateRatingDto {
  @ApiPropertyOptional({ description: 'Overall rating score', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  overallScore?: number;

  @ApiPropertyOptional({ description: 'Category-specific ratings' })
  @IsOptional()
  categoryScores?: Record<RatingCategory, number>;

  @ApiPropertyOptional({ description: 'Written review' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  review?: string;

  @ApiPropertyOptional({ description: 'Positive tags', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  positiveTags?: string[];

  @ApiPropertyOptional({ description: 'Areas for improvement', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  improvementTags?: string[];

  @ApiPropertyOptional({ description: 'Would recommend this person' })
  @IsBoolean()
  @IsOptional()
  wouldRecommend?: boolean;
}

export class RatingResponseDto {
  @ApiProperty({ description: 'ID of the user being responded to' })
  @IsString()
  @IsNotEmpty()
  ratingId: string;

  @ApiProperty({ description: 'Response text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  response: string;
}

export class ReportRatingDto {
  @ApiProperty({ description: 'Reason for reporting' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Additional details' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  details?: string;
}

export class RatingFilterDto {
  @ApiPropertyOptional({ description: 'User ID to filter by' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Job ID to filter by' })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiPropertyOptional({ enum: RatingType })
  @IsEnum(RatingType)
  @IsOptional()
  type?: RatingType;

  @ApiPropertyOptional({ description: 'Minimum rating score' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Include private ratings' })
  @IsBoolean()
  @IsOptional()
  includePrivate?: boolean;

  @ApiPropertyOptional({ description: 'Only ratings with reviews' })
  @IsBoolean()
  @IsOptional()
  withReviewOnly?: boolean;
}
