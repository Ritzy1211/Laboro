import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';
import { TimezoneService, TimeSlot, AvailabilityWindow } from '../../common/utils';
import { PaginationDto, PaginatedResultDto } from '../../common/dto';
import {
  CreateMatchDto,
  RespondToMatchDto,
  MatchFilterDto,
  MatchingCriteriaDto,
  MatchResponseDto,
  MatchDetailResponseDto,
  WorkerMatchSuggestionDto,
  JobMatchSuggestionDto,
  MatchScoreBreakdownDto,
} from './dto';
import { Match, MatchStatus, JobStatus, Role } from '@prisma/client';

interface MatchingConfig {
  skillWeight: number;
  availabilityWeight: number;
  ratingWeight: number;
  reliabilityWeight: number;
  minMatchScore: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private readonly defaultConfig: MatchingConfig = {
    skillWeight: 40,
    availabilityWeight: 30,
    ratingWeight: 15,
    reliabilityWeight: 15,
    minMatchScore: 50,
  };

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private timezoneService: TimezoneService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('job.published')
  async handleJobPublished(payload: { jobId: string }) {
    this.logger.log(`Job published event received: ${payload.jobId}`);
    await this.findMatchesForJob(payload.jobId);
  }

  async findMatchesForJob(
    jobId: string,
    criteria?: MatchingCriteriaDto,
  ): Promise<WorkerMatchSuggestionDto[]> {
    const config: MatchingConfig = {
      ...this.defaultConfig,
      ...criteria,
    };

    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
      include: {
        client: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Get all available workers
    const workers = await this.prisma.user.findMany({
      where: {
        role: Role.WORKER,
        status: 'ACTIVE',
        deletedAt: null,
        workerProfile: {
          isAvailable: true,
        },
      },
      include: {
        workerProfile: true,
        availabilityWindows: true,
      },
    });

    const suggestions: WorkerMatchSuggestionDto[] = [];

    for (const worker of workers) {
      const scoreBreakdown = await this.calculateMatchScore(job, worker, config);

      if (scoreBreakdown.totalScore >= config.minMatchScore) {
        suggestions.push({
          worker: {
            id: worker.id,
            firstName: worker.firstName,
            lastName: worker.lastName,
            email: worker.email,
            profileImageUrl: worker.profileImageUrl || undefined,
            timezone: worker.timezone || undefined,
            reliabilityScore: worker.workerProfile?.reliabilityScore,
            averageRating: worker.workerProfile?.averageRating,
            totalJobsCompleted: worker.workerProfile?.totalJobsCompleted,
          },
          scoreBreakdown,
          overallScore: scoreBreakdown.totalScore,
          rank: 0, // Will be set after sorting
        });
      }
    }

    // Sort by score and assign ranks
    suggestions.sort((a, b) => b.overallScore - a.overallScore);
    suggestions.forEach((s, i) => (s.rank = i + 1));

    // Cache the results
    await this.redis.setex(
      `job:matches:${jobId}`,
      3600, // 1 hour
      JSON.stringify(suggestions.slice(0, 50)), // Top 50
    );

    // Emit matches found event
    this.eventEmitter.emit('matches.found', {
      jobId,
      matchCount: suggestions.length,
    });

    return suggestions.slice(0, 50);
  }

  async findJobsForWorker(
    workerId: string,
    criteria?: MatchingCriteriaDto,
  ): Promise<JobMatchSuggestionDto[]> {
    const config: MatchingConfig = {
      ...this.defaultConfig,
      ...criteria,
    };

    const worker = await this.prisma.user.findUnique({
      where: { id: workerId, deletedAt: null },
      include: {
        workerProfile: true,
        availabilityWindows: true,
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Get all open jobs
    const jobs = await this.prisma.job.findMany({
      where: {
        status: JobStatus.OPEN,
        deletedAt: null,
        scheduledStartTime: {
          gte: new Date(),
        },
      },
      include: {
        client: true,
      },
    });

    const suggestions: JobMatchSuggestionDto[] = [];

    for (const job of jobs) {
      const scoreBreakdown = await this.calculateMatchScore(job, worker, config);

      if (scoreBreakdown.totalScore >= config.minMatchScore) {
        suggestions.push({
          job: {
            id: job.id,
            title: job.title,
            description: job.description,
            scheduledStartTime: job.scheduledStartTime,
            scheduledEndTime: job.scheduledEndTime || undefined,
            timezone: job.timezone,
            budget: job.budget?.toNumber(),
            hourlyRate: job.hourlyRate?.toNumber(),
            isRemote: job.isRemote,
            location: job.location,
          },
          scoreBreakdown,
          overallScore: scoreBreakdown.totalScore,
          rank: 0,
        });
      }
    }

    suggestions.sort((a, b) => b.overallScore - a.overallScore);
    suggestions.forEach((s, i) => (s.rank = i + 1));

    // Cache the results
    await this.redis.setex(
      `worker:matches:${workerId}`,
      3600,
      JSON.stringify(suggestions.slice(0, 50)),
    );

    return suggestions.slice(0, 50);
  }

  async createMatch(dto: CreateMatchDto): Promise<MatchDetailResponseDto> {
    // Check if match already exists
    const existingMatch = await this.prisma.match.findFirst({
      where: {
        jobId: dto.jobId,
        workerId: dto.workerId,
        status: {
          notIn: [MatchStatus.REJECTED, MatchStatus.CANCELLED],
        },
      },
    });

    if (existingMatch) {
      throw new BadRequestException('Match already exists for this job and worker');
    }

    // Verify job is open
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job || job.status !== JobStatus.OPEN) {
      throw new BadRequestException('Job is not available for matching');
    }

    const match = await this.prisma.match.create({
      data: {
        jobId: dto.jobId,
        workerId: dto.workerId,
        matchScore: dto.matchScore || 0,
        matchReason: dto.matchReason,
        status: MatchStatus.PENDING,
      },
      include: {
        job: true,
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    // Emit match created event
    this.eventEmitter.emit('match.created', {
      matchId: match.id,
      jobId: dto.jobId,
      workerId: dto.workerId,
    });

    return this.mapMatchToDetailResponse(match);
  }

  async respondToMatch(
    matchId: string,
    workerId: string,
    dto: RespondToMatchDto,
  ): Promise<MatchDetailResponseDto> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.workerId !== workerId) {
      throw new ForbiddenException('You cannot respond to this match');
    }

    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not in pending status');
    }

    const newStatus =
      dto.action === 'accept' ? MatchStatus.ACCEPTED : MatchStatus.REJECTED;

    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: newStatus,
        respondedAt: new Date(),
        responseNote: dto.reason,
      },
      include: {
        job: true,
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    // If accepted, update job workers assigned count
    if (dto.action === 'accept') {
      await this.prisma.job.update({
        where: { id: match.jobId },
        data: {
          workersAssigned: { increment: 1 },
          status:
            match.job.workersAssigned + 1 >= match.job.workersNeeded
              ? JobStatus.IN_PROGRESS
              : match.job.status,
        },
      });
    }

    // Emit match response event
    this.eventEmitter.emit('match.responded', {
      matchId,
      jobId: match.jobId,
      workerId,
      action: dto.action,
    });

    return this.mapMatchToDetailResponse(updatedMatch);
  }

  async cancelMatch(
    matchId: string,
    userId: string,
    reason?: string,
  ): Promise<MatchDetailResponseDto> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        job: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Only job owner or the matched worker can cancel
    if (match.workerId !== userId && match.job.clientId !== userId) {
      throw new ForbiddenException('You cannot cancel this match');
    }

    if (match.status === MatchStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed match');
    }

    const wasAccepted = match.status === MatchStatus.ACCEPTED;

    const updatedMatch = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.CANCELLED,
        responseNote: reason,
      },
      include: {
        job: true,
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    // Decrement workers assigned if was accepted
    if (wasAccepted) {
      await this.prisma.job.update({
        where: { id: match.jobId },
        data: {
          workersAssigned: { decrement: 1 },
        },
      });
    }

    // Emit match cancelled event
    this.eventEmitter.emit('match.cancelled', {
      matchId,
      jobId: match.jobId,
      workerId: match.workerId,
      cancelledBy: userId,
      reason,
    });

    return this.mapMatchToDetailResponse(updatedMatch);
  }

  async findAll(
    pagination: PaginationDto,
    filters: MatchFilterDto,
  ): Promise<PaginatedResultDto<MatchDetailResponseDto>> {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.jobId) {
      where.jobId = filters.jobId;
    }
    if (filters.workerId) {
      where.workerId = filters.workerId;
    }
    if (filters.minScore !== undefined) {
      where.matchScore = { gte: filters.minScore };
    }

    const [matches, total] = await Promise.all([
      this.prisma.match.findMany({
        where,
        include: {
          job: true,
          worker: {
            include: {
              workerProfile: true,
            },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.match.count({ where }),
    ]);

    return new PaginatedResultDto(
      matches.map((m) => this.mapMatchToDetailResponse(m)),
      total,
      pagination,
    );
  }

  async findById(id: string): Promise<MatchDetailResponseDto> {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: {
        job: true,
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.mapMatchToDetailResponse(match);
  }

  private async calculateMatchScore(
    job: any,
    worker: any,
    config: MatchingConfig,
  ): Promise<MatchScoreBreakdownDto> {
    const workerProfile = worker.workerProfile;
    const workerSkills = (workerProfile?.skills as any[]) || [];
    const requiredSkills = job.requiredSkills || [];

    // Skill matching
    const workerSkillNames = workerSkills.map((s: any) =>
      typeof s === 'string' ? s : s.name,
    ).map((s: string) => s.toLowerCase());

    const matchedSkills = requiredSkills.filter((skill: string) =>
      workerSkillNames.includes(skill.toLowerCase()),
    );

    const missingSkills = requiredSkills.filter(
      (skill: string) => !workerSkillNames.includes(skill.toLowerCase()),
    );

    const skillScore =
      requiredSkills.length > 0
        ? (matchedSkills.length / requiredSkills.length) * 100
        : 100;

    // Availability matching
    let availabilityScore = 0;
    const availableWindows: any[] = [];

    if (worker.availabilityWindows && worker.availabilityWindows.length > 0) {
      const jobStart = job.scheduledStartTime;
      const jobEnd = job.scheduledEndTime || new Date(jobStart.getTime() + 4 * 60 * 60 * 1000);

      const workerAvailability: AvailabilityWindow[] = worker.availabilityWindows.map(
        (w: any) => ({
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
          timezone: w.timezone,
        }),
      );

      const utcSlots = this.timezoneService.convertAvailabilityToUtc(
        workerAvailability,
        jobStart,
        jobEnd,
      );

      const jobSlot: TimeSlot = { start: jobStart, end: jobEnd };
      const overlaps = utcSlots.filter((slot) =>
        this.timezoneService.doSlotsOverlap(slot, jobSlot),
      );

      if (overlaps.length > 0) {
        availabilityScore = 100;
        availableWindows.push(...overlaps);
      }
    } else {
      // Assume available if no windows set
      availabilityScore = 50;
    }

    // Rating score (0-5 mapped to 0-100)
    const ratingScore = (workerProfile?.averageRating || 0) * 20;

    // Reliability score (already 0-100)
    const reliabilityScore = workerProfile?.reliabilityScore || 50;

    // Distance score (placeholder - would use geolocation)
    const distanceScore = job.isRemote ? 100 : 75;

    // Calculate weighted total
    const totalScore =
      (skillScore * config.skillWeight +
        availabilityScore * config.availabilityWeight +
        ratingScore * config.ratingWeight +
        reliabilityScore * config.reliabilityWeight) /
      100;

    return {
      skillScore: Math.round(skillScore),
      availabilityScore: Math.round(availabilityScore),
      ratingScore: Math.round(ratingScore),
      reliabilityScore: Math.round(reliabilityScore),
      distanceScore: Math.round(distanceScore),
      totalScore: Math.round(totalScore),
      matchedSkills,
      missingSkills,
      availableWindows,
    };
  }

  private mapMatchToResponse(match: Match): MatchResponseDto {
    return {
      id: match.id,
      jobId: match.jobId,
      workerId: match.workerId,
      status: match.status,
      matchScore: match.matchScore,
      matchReason: match.matchReason as any,
      respondedAt: match.respondedAt || undefined,
      responseNote: match.responseNote || undefined,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }

  private mapMatchToDetailResponse(match: any): MatchDetailResponseDto {
    return {
      ...this.mapMatchToResponse(match),
      worker: match.worker
        ? {
            id: match.worker.id,
            firstName: match.worker.firstName,
            lastName: match.worker.lastName,
            email: match.worker.email,
            profileImageUrl: match.worker.profileImageUrl || undefined,
            timezone: match.worker.timezone || undefined,
            reliabilityScore: match.worker.workerProfile?.reliabilityScore,
            averageRating: match.worker.workerProfile?.averageRating,
            totalJobsCompleted: match.worker.workerProfile?.totalJobsCompleted,
          }
        : undefined,
      job: match.job
        ? {
            id: match.job.id,
            title: match.job.title,
            description: match.job.description,
            scheduledStartTime: match.job.scheduledStartTime,
            scheduledEndTime: match.job.scheduledEndTime || undefined,
            timezone: match.job.timezone,
            budget: match.job.budget?.toNumber(),
            hourlyRate: match.job.hourlyRate?.toNumber(),
            isRemote: match.job.isRemote,
            location: match.job.location,
          }
        : undefined,
    };
  }
}
