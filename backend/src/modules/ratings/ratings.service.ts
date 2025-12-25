import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import {
  CreateRatingDto,
  UpdateRatingDto,
  RatingResponseDto,
  ReportRatingDto,
  RatingFilterDto,
  RatingType,
  RatingCategory,
} from './dto/rating.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class RatingsService {
  private readonly CACHE_PREFIX = 'ratings:';
  private readonly CACHE_TTL = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== RATING CRUD ====================

  async create(raterId: string, dto: CreateRatingDto) {
    // Verify job exists and is completed
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: {
        matches: {
          where: {
            OR: [
              { workerId: raterId },
              { workerId: dto.ratedUserId },
            ],
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Verify rater was involved in the job
    const isClient = job.clientId === raterId;
    const isWorker = job.matches.some((m) => m.workerId === raterId);

    if (!isClient && !isWorker) {
      throw new ForbiddenException('You are not authorized to rate this job');
    }

    // Prevent self-rating
    if (raterId === dto.ratedUserId) {
      throw new BadRequestException('Cannot rate yourself');
    }

    // Check if already rated
    const existingRating = await this.prisma.rating.findFirst({
      where: {
        raterId,
        ratedUserId: dto.ratedUserId,
        jobId: dto.jobId,
        type: dto.type,
      },
    });

    if (existingRating) {
      throw new ConflictException('You have already rated this user for this job');
    }

    // Validate category scores
    if (dto.categoryScores) {
      for (const [category, score] of Object.entries(dto.categoryScores)) {
        if (score < 1 || score > 5) {
          throw new BadRequestException(`Invalid score for category ${category}`);
        }
      }
    }

    const rating = await this.prisma.rating.create({
      data: {
        raterId,
        ratedUserId: dto.ratedUserId,
        jobId: dto.jobId,
        taskId: dto.taskId,
        type: dto.type,
        overallScore: dto.overallScore,
        review: dto.review,
        wouldRecommend: dto.wouldRecommend ?? true,
        isPrivate: dto.isPrivate ?? false,
        metadata: {
          categoryScores: dto.categoryScores,
          positiveTags: dto.positiveTags,
          improvementTags: dto.improvementTags,
        },
      },
      include: this.getRatingIncludes(),
    });

    // Invalidate cache and update reliability score
    await this.invalidateUserCache(dto.ratedUserId);
    await this.updateReliabilityScore(dto.ratedUserId);

    this.eventEmitter.emit('rating.created', {
      rating,
      raterId,
      ratedUserId: dto.ratedUserId,
    });

    return this.formatRating(rating);
  }

  async findAll(pagination: PaginationDto, filter?: RatingFilterDto) {
    const where: any = {};

    if (filter?.userId) {
      where.ratedUserId = filter.userId;
    }

    if (filter?.jobId) {
      where.jobId = filter.jobId;
    }

    if (filter?.type) {
      where.type = filter.type;
    }

    if (filter?.minScore) {
      where.overallScore = { gte: filter.minScore };
    }

    if (!filter?.includePrivate) {
      where.isPrivate = false;
    }

    if (filter?.withReviewOnly) {
      where.review = { not: null };
    }

    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: this.getRatingIncludes(),
      }),
      this.prisma.rating.count({ where }),
    ]);

    return {
      data: ratings.map((r) => this.formatRating(r)),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findOne(id: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
      include: this.getRatingIncludes(),
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return this.formatRating(rating);
  }

  async findByUser(userId: string, pagination: PaginationDto) {
    const cacheKey = `${this.CACHE_PREFIX}user:${userId}:page:${pagination.page}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.findAll(pagination, {
      userId,
      includePrivate: false,
    });

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async update(id: string, userId: string, dto: UpdateRatingDto) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.raterId !== userId) {
      throw new ForbiddenException('You can only update your own ratings');
    }

    // Check if within edit window (e.g., 7 days)
    const editWindow = DateTime.fromJSDate(rating.createdAt).plus({ days: 7 });
    if (DateTime.now() > editWindow) {
      throw new BadRequestException('Rating can no longer be edited');
    }

    const updated = await this.prisma.rating.update({
      where: { id },
      data: {
        overallScore: dto.overallScore,
        review: dto.review,
        wouldRecommend: dto.wouldRecommend,
        metadata: {
          ...(rating.metadata as any),
          categoryScores: dto.categoryScores,
          positiveTags: dto.positiveTags,
          improvementTags: dto.improvementTags,
        },
      },
      include: this.getRatingIncludes(),
    });

    await this.invalidateUserCache(rating.ratedUserId);
    await this.updateReliabilityScore(rating.ratedUserId);

    this.eventEmitter.emit('rating.updated', { rating: updated });

    return this.formatRating(updated);
  }

  async respond(userId: string, dto: RatingResponseDto) {
    const rating = await this.prisma.rating.findUnique({
      where: { id: dto.ratingId },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.ratedUserId !== userId) {
      throw new ForbiddenException('You can only respond to ratings about you');
    }

    if (rating.response) {
      throw new ConflictException('You have already responded to this rating');
    }

    const updated = await this.prisma.rating.update({
      where: { id: dto.ratingId },
      data: {
        response: dto.response,
        respondedAt: new Date(),
      },
      include: this.getRatingIncludes(),
    });

    this.eventEmitter.emit('rating.responded', {
      rating: updated,
      raterId: rating.raterId,
    });

    return this.formatRating(updated);
  }

  async report(id: string, userId: string, dto: ReportRatingDto) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    await this.prisma.ratingReport.create({
      data: {
        ratingId: id,
        reporterId: userId,
        reason: dto.reason,
        details: dto.details,
      },
    });

    this.eventEmitter.emit('rating.reported', {
      ratingId: id,
      reporterId: userId,
    });

    return { message: 'Rating reported successfully' };
  }

  async remove(id: string, userId: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.raterId !== userId) {
      throw new ForbiddenException('You can only delete your own ratings');
    }

    await this.prisma.rating.delete({ where: { id } });
    await this.invalidateUserCache(rating.ratedUserId);
    await this.updateReliabilityScore(rating.ratedUserId);

    this.eventEmitter.emit('rating.deleted', { ratingId: id });
  }

  // ==================== RATING SUMMARY & ANALYTICS ====================

  async getUserRatingSummary(userId: string) {
    const cacheKey = `${this.CACHE_PREFIX}summary:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const ratings = await this.prisma.rating.findMany({
      where: {
        ratedUserId: userId,
        isPrivate: false,
      },
      include: this.getRatingIncludes(),
    });

    if (ratings.length === 0) {
      return {
        userId,
        totalRatings: 0,
        averageOverallScore: 0,
        categoryAverages: {},
        recommendationRate: 0,
        totalReviews: 0,
        topPositiveTags: [],
        topImprovementTags: [],
        ratingDistribution: { one: 0, two: 0, three: 0, four: 0, five: 0 },
        recentRatings: [],
      };
    }

    // Calculate averages
    const totalScore = ratings.reduce((sum, r) => sum + r.overallScore, 0);
    const averageOverallScore = Math.round((totalScore / ratings.length) * 10) / 10;

    // Category averages
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    for (const rating of ratings) {
      const categoryScores = (rating.metadata as any)?.categoryScores ?? {};
      for (const [category, score] of Object.entries(categoryScores)) {
        if (!categoryTotals[category]) {
          categoryTotals[category] = { sum: 0, count: 0 };
        }
        categoryTotals[category].sum += score as number;
        categoryTotals[category].count += 1;
      }
    }

    const categoryAverages: Record<string, number> = {};
    for (const [category, data] of Object.entries(categoryTotals)) {
      categoryAverages[category] = Math.round((data.sum / data.count) * 10) / 10;
    }

    // Recommendation rate
    const recommendations = ratings.filter((r) => r.wouldRecommend).length;
    const recommendationRate = Math.round((recommendations / ratings.length) * 100);

    // Count reviews
    const totalReviews = ratings.filter((r) => r.review).length;

    // Tag analysis
    const positiveTags: Record<string, number> = {};
    const improvementTags: Record<string, number> = {};

    for (const rating of ratings) {
      const metadata = rating.metadata as any;
      (metadata?.positiveTags ?? []).forEach((tag: string) => {
        positiveTags[tag] = (positiveTags[tag] ?? 0) + 1;
      });
      (metadata?.improvementTags ?? []).forEach((tag: string) => {
        improvementTags[tag] = (improvementTags[tag] ?? 0) + 1;
      });
    }

    const topPositiveTags = Object.entries(positiveTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    const topImprovementTags = Object.entries(improvementTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Rating distribution
    const distribution = { one: 0, two: 0, three: 0, four: 0, five: 0 };
    for (const rating of ratings) {
      const key = ['', 'one', 'two', 'three', 'four', 'five'][rating.overallScore] as keyof typeof distribution;
      distribution[key] += 1;
    }

    // Recent ratings
    const recentRatings = ratings
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((r) => this.formatRating(r));

    const summary = {
      userId,
      totalRatings: ratings.length,
      averageOverallScore,
      categoryAverages,
      recommendationRate,
      totalReviews,
      topPositiveTags,
      topImprovementTags,
      ratingDistribution: distribution,
      recentRatings,
    };

    await this.redis.set(cacheKey, summary, this.CACHE_TTL);

    return summary;
  }

  async getReliabilityScore(userId: string) {
    const cacheKey = `reliability:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        reliabilityScore: true,
        createdAt: true,
        matches: {
          where: {
            status: { in: ['ACCEPTED', 'COMPLETED', 'CANCELLED'] },
          },
          select: {
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        receivedRatings: {
          select: {
            overallScore: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matches = user.matches;
    const completedJobs = matches.filter((m) => m.status === 'COMPLETED').length;
    const totalJobs = matches.length;
    const cancelledJobs = matches.filter((m) => m.status === 'CANCELLED').length;

    const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 100;
    const cancellationRate = totalJobs > 0 ? (cancelledJobs / totalJobs) * 100 : 0;

    const ratings = user.receivedRatings;
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.overallScore, 0) / ratings.length
      : 0;

    // Calculate account age in months
    const accountAge = Math.floor(
      DateTime.now().diff(DateTime.fromJSDate(user.createdAt), 'months').months,
    );

    // Calculate average response time (simplified)
    const responseTime = 2; // hours - would be calculated from actual data

    // Calculate punctuality (simplified)
    const punctualityRate = 95; // Would be calculated from actual job data

    const factors = {
      completionRate: Math.round(completionRate * 10) / 10,
      punctualityRate,
      averageRating: Math.round(averageRating * 10) / 10,
      responseTime,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      totalCompletedJobs: completedJobs,
      accountAge,
    };

    // Calculate overall score (weighted average)
    const score = Math.round(
      factors.completionRate * 0.25 +
      factors.punctualityRate * 0.20 +
      (factors.averageRating / 5) * 100 * 0.30 +
      Math.min(100, (100 - factors.responseTime * 10)) * 0.10 +
      (100 - factors.cancellationRate) * 0.15,
    );

    // Determine trend (simplified)
    const trend = 'STABLE' as const;

    const result = {
      userId,
      score,
      factors,
      trend,
      lastUpdated: new Date(),
    };

    await this.redis.set(cacheKey, result, 3600); // 1 hour

    return result;
  }

  async getRatingTrends(userId: string, months: number = 12) {
    const startDate = DateTime.now().minus({ months }).startOf('month');

    const ratings = await this.prisma.rating.findMany({
      where: {
        ratedUserId: userId,
        createdAt: { gte: startDate.toJSDate() },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by month
    const monthlyData: Record<string, { total: number; count: number }> = {};
    let current = startDate;

    while (current <= DateTime.now()) {
      const key = current.toFormat('yyyy-MM');
      monthlyData[key] = { total: 0, count: 0 };
      current = current.plus({ months: 1 });
    }

    for (const rating of ratings) {
      const key = DateTime.fromJSDate(rating.createdAt).toFormat('yyyy-MM');
      if (monthlyData[key]) {
        monthlyData[key].total += rating.overallScore;
        monthlyData[key].count += 1;
      }
    }

    const monthly = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      averageScore: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
      totalRatings: data.count,
    }));

    // Calculate trend
    const recentMonths = monthly.slice(-3);
    const olderMonths = monthly.slice(-6, -3);

    const recentAvg = recentMonths.reduce((sum, m) => sum + m.averageScore, 0) / 3;
    const olderAvg = olderMonths.reduce((sum, m) => sum + m.averageScore, 0) / 3;

    let overallTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
    let percentageChange = 0;

    if (olderAvg > 0) {
      percentageChange = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
      if (percentageChange > 5) overallTrend = 'IMPROVING';
      else if (percentageChange < -5) overallTrend = 'DECLINING';
    }

    return {
      userId,
      period: `${months} months`,
      monthly,
      overallTrend,
      percentageChange,
    };
  }

  // ==================== HELPERS ====================

  private async updateReliabilityScore(userId: string) {
    const reliabilityData = await this.getReliabilityScore(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { reliabilityScore: reliabilityData.score },
    });
  }

  private async invalidateUserCache(userId: string) {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}*${userId}*`);
    keys.push(`reliability:${userId}`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redis.del(key)));
    }
  }

  private getRatingIncludes() {
    return {
      rater: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      ratedUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    };
  }

  private formatRating(rating: any) {
    const metadata = rating.metadata as any;
    return {
      id: rating.id,
      raterId: rating.raterId,
      ratedUserId: rating.ratedUserId,
      jobId: rating.jobId,
      taskId: rating.taskId,
      type: rating.type,
      overallScore: rating.overallScore,
      categoryScores: metadata?.categoryScores,
      review: rating.review,
      positiveTags: metadata?.positiveTags,
      improvementTags: metadata?.improvementTags,
      wouldRecommend: rating.wouldRecommend,
      isPrivate: rating.isPrivate,
      response: rating.response,
      respondedAt: rating.respondedAt,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
      rater: rating.rater,
      job: rating.job,
    };
  }
}
