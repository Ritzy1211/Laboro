import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';
import { TimezoneService } from '../../common/utils';
import { PaginationDto, PaginatedResultDto } from '../../common/dto';
import {
  CreateJobDto,
  UpdateJobDto,
  CreateTaskDto,
  UpdateTaskDto,
  JobFilterDto,
  JobResponseDto,
  JobDetailResponseDto,
  TaskResponseDto,
  JobStatsDto,
} from './dto';
import { Prisma, Job, JobStatus, Role, TaskStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private timezoneService: TimezoneService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    clientId: string,
    dto: CreateJobDto,
  ): Promise<JobDetailResponseDto> {
    // Validate timezone
    if (!this.timezoneService.isValidTimezone(dto.timezone)) {
      throw new BadRequestException('Invalid timezone');
    }

    const job = await this.prisma.job.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        location: dto.location as Prisma.JsonObject,
        isRemote: dto.isRemote || false,
        budget: dto.budget,
        hourlyRate: dto.hourlyRate,
        estimatedHours: dto.estimatedHours,
        scheduledStartTime: new Date(dto.scheduledStartTime),
        scheduledEndTime: dto.scheduledEndTime
          ? new Date(dto.scheduledEndTime)
          : null,
        timezone: dto.timezone,
        requiredSkills: dto.requiredSkills || [],
        workersNeeded: dto.workersNeeded || 1,
        clientId,
        organizationId: dto.organizationId,
        metadata: dto.metadata as Prisma.JsonObject,
        status: JobStatus.DRAFT,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        tasks: true,
      },
    });

    // Emit job created event
    this.eventEmitter.emit('job.created', { jobId: job.id, clientId });

    return this.mapJobToDetailResponse(job);
  }

  async findAll(
    pagination: PaginationDto,
    filters: JobFilterDto,
    userId?: string,
    userRole?: Role,
  ): Promise<PaginatedResultDto<JobResponseDto>> {
    const where: Prisma.JobWhereInput = {
      deletedAt: null,
    };

    // Apply role-based filters
    if (userRole === Role.CLIENT) {
      where.clientId = userId;
    } else if (userRole === Role.WORKER) {
      // Workers can only see open jobs or jobs they're matched to
      where.OR = [
        { status: JobStatus.OPEN },
        {
          matches: {
            some: {
              workerId: userId,
            },
          },
        },
      ];
    }

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.isRemote !== undefined) {
      where.isRemote = filters.isRemote;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.startDate || filters.endDate) {
      where.scheduledStartTime = {};
      if (filters.startDate) {
        where.scheduledStartTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.scheduledStartTime.lte = new Date(filters.endDate);
      }
    }

    if (filters.skills && filters.skills.length > 0) {
      where.requiredSkills = {
        hasSome: filters.skills,
      };
    }

    if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
      where.budget = {};
      if (filters.minBudget !== undefined) {
        where.budget.gte = filters.minBudget;
      }
      if (filters.maxBudget !== undefined) {
        where.budget.lte = filters.maxBudget;
      }
    }

    if (pagination.search) {
      where.OR = [
        { title: { contains: pagination.search, mode: 'insensitive' } },
        { description: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: pagination.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder }
          : { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return new PaginatedResultDto(
      jobs.map((job) => this.mapJobToResponse(job)),
      total,
      pagination,
    );
  }

  async findById(id: string, userId?: string): Promise<JobDetailResponseDto> {
    const cacheKey = `job:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { matches: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const response = this.mapJobToDetailResponse(job);

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(response));

    return response;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateJobDto,
    userRole: Role,
  ): Promise<JobDetailResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check authorization
    if (userRole !== Role.SUPER_ADMIN && job.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to update this job');
    }

    // Validate status transitions
    if (dto.status) {
      this.validateStatusTransition(job.status, dto.status);
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        status: dto.status,
        location: dto.location as Prisma.JsonObject,
        isRemote: dto.isRemote,
        budget: dto.budget,
        hourlyRate: dto.hourlyRate,
        estimatedHours: dto.estimatedHours,
        scheduledStartTime: dto.scheduledStartTime
          ? new Date(dto.scheduledStartTime)
          : undefined,
        scheduledEndTime: dto.scheduledEndTime
          ? new Date(dto.scheduledEndTime)
          : undefined,
        timezone: dto.timezone,
        requiredSkills: dto.requiredSkills,
        workersNeeded: dto.workersNeeded,
        metadata: dto.metadata as Prisma.JsonObject,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`job:${id}`);

    // Emit job updated event
    this.eventEmitter.emit('job.updated', {
      jobId: id,
      changes: dto,
      previousStatus: job.status,
      newStatus: dto.status,
    });

    return this.mapJobToDetailResponse(updatedJob);
  }

  async delete(id: string, userId: string, userRole: Role): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (userRole !== Role.SUPER_ADMIN && job.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this job');
    }

    // Soft delete
    await this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.redis.del(`job:${id}`);

    // Emit job deleted event
    this.eventEmitter.emit('job.deleted', { jobId: id });
  }

  async publishJob(id: string, userId: string): Promise<JobDetailResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to publish this job');
    }

    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Only draft jobs can be published');
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.OPEN },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`job:${id}`);

    // Emit job published event (triggers matching)
    this.eventEmitter.emit('job.published', { jobId: id });

    return this.mapJobToDetailResponse(updatedJob);
  }

  async cancelJob(
    id: string,
    userId: string,
    reason?: string,
  ): Promise<JobDetailResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this job');
    }

    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel a completed or already cancelled job');
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CANCELLED,
        metadata: {
          ...(job.metadata as object),
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`job:${id}`);

    // Emit job cancelled event
    this.eventEmitter.emit('job.cancelled', { jobId: id, reason });

    return this.mapJobToDetailResponse(updatedJob);
  }

  // Task management
  async addTask(jobId: string, dto: CreateTaskDto): Promise<TaskResponseDto> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId, deletedAt: null },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Get max order
    const maxOrder = await this.prisma.task.aggregate({
      where: { jobId },
      _max: { order: true },
    });

    const task = await this.prisma.task.create({
      data: {
        jobId,
        title: dto.title,
        description: dto.description,
        order: dto.order ?? (maxOrder._max.order ?? 0) + 1,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        assigneeId: dto.assigneeId,
        status: TaskStatus.PENDING,
      },
    });

    // Invalidate job cache
    await this.redis.del(`job:${jobId}`);

    return this.mapTaskToResponse(task);
  }

  async updateTask(
    jobId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.jobId !== jobId) {
      throw new NotFoundException('Task not found');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: dto.title,
        description: dto.description,
        order: dto.order,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
        isCompleted: dto.isCompleted,
        completedAt: dto.isCompleted ? new Date() : undefined,
        status: dto.isCompleted ? TaskStatus.COMPLETED : undefined,
      },
    });

    // Invalidate job cache
    await this.redis.del(`job:${jobId}`);

    return this.mapTaskToResponse(updatedTask);
  }

  async deleteTask(jobId: string, taskId: string): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.jobId !== jobId) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    // Invalidate job cache
    await this.redis.del(`job:${jobId}`);
  }

  async getJobStats(
    userId: string,
    userRole: Role,
    organizationId?: string,
  ): Promise<JobStatsDto> {
    const where: Prisma.JobWhereInput = {
      deletedAt: null,
    };

    if (userRole === Role.CLIENT) {
      where.clientId = userId;
    } else if (organizationId) {
      where.organizationId = organizationId;
    }

    const [total, byStatus, budgetStats] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.job.aggregate({
        where,
        _sum: { budget: true },
        _avg: { budget: true },
      }),
    ]);

    const statusCounts = byStatus.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      },
      {} as Record<JobStatus, number>,
    );

    return {
      totalJobs: total,
      draftJobs: statusCounts[JobStatus.DRAFT] || 0,
      openJobs: statusCounts[JobStatus.OPEN] || 0,
      inProgressJobs: statusCounts[JobStatus.IN_PROGRESS] || 0,
      completedJobs: statusCounts[JobStatus.COMPLETED] || 0,
      cancelledJobs: statusCounts[JobStatus.CANCELLED] || 0,
      totalBudget: budgetStats._sum.budget?.toNumber() || 0,
      averageBudget: budgetStats._avg.budget?.toNumber() || 0,
    };
  }

  private validateStatusTransition(
    currentStatus: JobStatus,
    newStatus: JobStatus,
  ): void {
    const validTransitions: Record<JobStatus, JobStatus[]> = {
      [JobStatus.DRAFT]: [JobStatus.OPEN, JobStatus.CANCELLED],
      [JobStatus.OPEN]: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
      [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.ON_HOLD],
      [JobStatus.ON_HOLD]: [JobStatus.IN_PROGRESS, JobStatus.CANCELLED],
      [JobStatus.COMPLETED]: [],
      [JobStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private mapJobToResponse(job: Job): JobResponseDto {
    return {
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      type: job.type,
      priority: job.priority,
      location: job.location as any,
      isRemote: job.isRemote,
      budget: job.budget?.toNumber(),
      hourlyRate: job.hourlyRate?.toNumber(),
      estimatedHours: job.estimatedHours,
      scheduledStartTime: job.scheduledStartTime,
      scheduledEndTime: job.scheduledEndTime || undefined,
      actualStartTime: job.actualStartTime || undefined,
      actualEndTime: job.actualEndTime || undefined,
      timezone: job.timezone,
      requiredSkills: job.requiredSkills,
      workersNeeded: job.workersNeeded,
      workersAssigned: job.workersAssigned,
      clientId: job.clientId,
      organizationId: job.organizationId || undefined,
      metadata: job.metadata as any,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private mapJobToDetailResponse(job: any): JobDetailResponseDto {
    return {
      ...this.mapJobToResponse(job),
      tasks: job.tasks?.map((t: any) => this.mapTaskToResponse(t)),
      client: job.client,
      organization: job.organization || undefined,
      matchesCount: job._count?.matches,
    };
  }

  private mapTaskToResponse(task: any): TaskResponseDto {
    return {
      id: task.id,
      jobId: task.jobId,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      order: task.order,
      isCompleted: task.isCompleted,
      dueDate: task.dueDate || undefined,
      completedAt: task.completedAt || undefined,
      assigneeId: task.assigneeId || undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
