import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RatingType, RatingCategory } from './rating.dto';

export class RatingItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  raterId: string;

  @ApiProperty()
  ratedUserId: string;

  @ApiProperty()
  jobId: string;

  @ApiPropertyOptional()
  taskId?: string;

  @ApiProperty({ enum: RatingType })
  type: RatingType;

  @ApiProperty()
  overallScore: number;

  @ApiPropertyOptional()
  categoryScores?: Record<RatingCategory, number>;

  @ApiPropertyOptional()
  review?: string;

  @ApiPropertyOptional({ type: [String] })
  positiveTags?: string[];

  @ApiPropertyOptional({ type: [String] })
  improvementTags?: string[];

  @ApiProperty()
  wouldRecommend: boolean;

  @ApiProperty()
  isPrivate: boolean;

  @ApiPropertyOptional()
  response?: string;

  @ApiPropertyOptional()
  respondedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => RaterInfoDto })
  rater: RaterInfoDto;

  @ApiPropertyOptional({ type: () => JobInfoDto })
  job?: JobInfoDto;
}

export class RaterInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  avatar?: string;
}

export class JobInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class UserRatingSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalRatings: number;

  @ApiProperty()
  averageOverallScore: number;

  @ApiProperty()
  categoryAverages: Record<RatingCategory, number>;

  @ApiProperty()
  recommendationRate: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ type: [String] })
  topPositiveTags: TagCountDto[];

  @ApiProperty({ type: [String] })
  topImprovementTags: TagCountDto[];

  @ApiProperty()
  ratingDistribution: RatingDistributionDto;

  @ApiProperty()
  recentRatings: RatingItemResponseDto[];
}

export class TagCountDto {
  @ApiProperty()
  tag: string;

  @ApiProperty()
  count: number;
}

export class RatingDistributionDto {
  @ApiProperty()
  one: number;

  @ApiProperty()
  two: number;

  @ApiProperty()
  three: number;

  @ApiProperty()
  four: number;

  @ApiProperty()
  five: number;
}

export class ReliabilityScoreDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ description: 'Overall reliability score (0-100)' })
  score: number;

  @ApiProperty()
  factors: ReliabilityFactorsDto;

  @ApiProperty()
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';

  @ApiProperty()
  lastUpdated: Date;
}

export class ReliabilityFactorsDto {
  @ApiProperty({ description: 'Job completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'On-time arrival/completion percentage' })
  punctualityRate: number;

  @ApiProperty({ description: 'Average rating score (1-5)' })
  averageRating: number;

  @ApiProperty({ description: 'Response time to job offers (hours)' })
  responseTime: number;

  @ApiProperty({ description: 'Cancellation rate percentage' })
  cancellationRate: number;

  @ApiProperty({ description: 'Number of completed jobs' })
  totalCompletedJobs: number;

  @ApiProperty({ description: 'Months active on platform' })
  accountAge: number;
}

export class RatingTrendsDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  period: string;

  @ApiProperty({ type: [MonthlyRatingDto] })
  monthly: MonthlyRatingDto[];

  @ApiProperty()
  overallTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';

  @ApiProperty()
  percentageChange: number;
}

export class MonthlyRatingDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  averageScore: number;

  @ApiProperty()
  totalRatings: number;
}
