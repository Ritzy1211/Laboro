import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  AssignTaskDto,
  BulkCreateTasksDto,
  UpdateChecklistDto,
  TaskFilterDto,
  TaskTimeLogDto,
  TaskStatus,
  TaskPriority,
} from './dto/task.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== TASK CRUD ====================

  async create(userId: string, dto: CreateTaskDto) {
    // Verify job exists and user has access
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
      include: { organization: true },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Validate assignee exists if provided
    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
      });
      if (!assignee) {
        throw new BadRequestException('Assignee not found');
      }
    }

    // Validate dependencies
    if (dto.dependencyIds && dto.dependencyIds.length > 0) {
      const dependencies = await this.prisma.task.findMany({
        where: {
          id: { in: dto.dependencyIds },
          jobId: dto.jobId,
        },
      });

      if (dependencies.length !== dto.dependencyIds.length) {
        throw new BadRequestException('One or more dependencies not found');
      }
    }

    // Get next order if not provided
    let order = dto.order;
    if (order === undefined) {
      const lastTask = await this.prisma.task.findFirst({
        where: { jobId: dto.jobId },
        orderBy: { order: 'desc' },
      });
      order = (lastTask?.order ?? -1) + 1;
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        jobId: dto.jobId,
        status: dto.assigneeId ? TaskStatus.ASSIGNED : TaskStatus.PENDING,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        assigneeId: dto.assigneeId,
        estimatedDuration: dto.estimatedDuration,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : null,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : null,
        order,
        metadata: {
          checklist: dto.checklist?.map((item, index) => ({
            index,
            text: item,
            completed: false,
          })),
          location: dto.location,
          instructions: dto.instructions,
          requiredSkillIds: dto.requiredSkillIds,
          dependencyIds: dto.dependencyIds,
          createdBy: userId,
        },
      },
      include: this.getTaskIncludes(),
    });

    // Create status history
    await this.createStatusHistory(task.id, null, task.status, userId, 'Task created');

    this.eventEmitter.emit('task.created', {
      task,
      jobId: dto.jobId,
      assigneeId: dto.assigneeId,
    });

    return this.formatTask(task);
  }

  async bulkCreate(userId: string, dto: BulkCreateTasksDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const tasks = await Promise.all(
      dto.tasks.map((taskDto, index) =>
        this.create(userId, {
          ...taskDto,
          jobId: dto.jobId,
          order: taskDto.order ?? index,
        } as CreateTaskDto),
      ),
    );

    return tasks;
  }

  async findAll(pagination: PaginationDto, filter?: TaskFilterDto) {
    const where: any = {};

    if (filter?.status && filter.status.length > 0) {
      where.status = { in: filter.status };
    }

    if (filter?.priority && filter.priority.length > 0) {
      where.priority = { in: filter.priority };
    }

    if (filter?.assigneeId) {
      where.assigneeId = filter.assigneeId;
    }

    if (filter?.jobId) {
      where.jobId = filter.jobId;
    }

    if (filter?.scheduledAfter || filter?.scheduledBefore) {
      where.scheduledStart = {};
      if (filter.scheduledAfter) {
        where.scheduledStart.gte = new Date(filter.scheduledAfter);
      }
      if (filter.scheduledBefore) {
        where.scheduledStart.lte = new Date(filter.scheduledBefore);
      }
    }

    if (filter?.overdueOnly) {
      where.scheduledEnd = { lt: new Date() };
      where.status = { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] };
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: [
          { priority: 'desc' },
          { scheduledStart: 'asc' },
          { order: 'asc' },
        ],
        include: this.getTaskIncludes(),
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks.map((task) => this.formatTask(task)),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findByJob(jobId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { jobId },
      orderBy: { order: 'asc' },
      include: this.getTaskIncludes(),
    });

    return tasks.map((task) => this.formatTask(task));
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: this.getTaskIncludes(),
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.formatTask(task);
  }

  async findMyTasks(userId: string, pagination: PaginationDto, filter?: TaskFilterDto) {
    const whereFilter = {
      ...filter,
      assigneeId: userId,
    };

    return this.findAll(pagination, whereFilter);
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Handle status change separately
    if (dto.status && dto.status !== task.status) {
      await this.createStatusHistory(task.id, task.status, dto.status, userId);
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        estimatedDuration: dto.estimatedDuration,
        scheduledStart: dto.scheduledStart ? new Date(dto.scheduledStart) : undefined,
        scheduledEnd: dto.scheduledEnd ? new Date(dto.scheduledEnd) : undefined,
        order: dto.order,
        startedAt: dto.status === TaskStatus.IN_PROGRESS && !task.startedAt
          ? new Date()
          : undefined,
        completedAt: dto.status === TaskStatus.COMPLETED
          ? new Date()
          : dto.status === TaskStatus.IN_PROGRESS
            ? null
            : undefined,
        metadata: {
          ...(task.metadata as any),
          checklist: dto.checklist?.map((item, index) => ({
            index,
            text: item,
            completed: false,
          })),
          location: dto.location,
          instructions: dto.instructions,
          requiredSkillIds: dto.requiredSkillIds,
          dependencyIds: dto.dependencyIds,
        },
      },
      include: this.getTaskIncludes(),
    });

    this.eventEmitter.emit('task.updated', { task: updated, updatedBy: userId });

    return this.formatTask(updated);
  }

  async updateStatus(id: string, userId: string, dto: UpdateTaskStatusDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Validate status transition
    this.validateStatusTransition(task.status, dto.status);

    // Check dependencies if starting
    if (dto.status === TaskStatus.IN_PROGRESS) {
      await this.checkDependencies(task);
    }

    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === TaskStatus.IN_PROGRESS && !task.startedAt) {
      updateData.startedAt = new Date();
    }

    if (dto.status === TaskStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (dto.actualDuration) {
        updateData.actualDuration = dto.actualDuration;
      } else if (task.startedAt) {
        // Calculate actual duration
        updateData.actualDuration = Math.round(
          (new Date().getTime() - task.startedAt.getTime()) / 60000,
        );
      }
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: this.getTaskIncludes(),
    });

    await this.createStatusHistory(task.id, task.status, dto.status, userId, dto.notes);

    this.eventEmitter.emit('task.status.changed', {
      task: updated,
      previousStatus: task.status,
      newStatus: dto.status,
      changedBy: userId,
    });

    // Check if all tasks completed
    if (dto.status === TaskStatus.COMPLETED) {
      await this.checkJobCompletion(task.jobId);
    }

    return this.formatTask(updated);
  }

  async assign(id: string, userId: string, dto: AssignTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: dto.assigneeId },
    });

    if (!assignee) {
      throw new BadRequestException('Assignee not found');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        assigneeId: dto.assigneeId,
        status: task.status === TaskStatus.PENDING ? TaskStatus.ASSIGNED : task.status,
      },
      include: this.getTaskIncludes(),
    });

    if (task.status === TaskStatus.PENDING) {
      await this.createStatusHistory(task.id, task.status, TaskStatus.ASSIGNED, userId, dto.notes);
    }

    this.eventEmitter.emit('task.assigned', {
      task: updated,
      assigneeId: dto.assigneeId,
      assignedBy: userId,
      notify: dto.notify ?? true,
    });

    return this.formatTask(updated);
  }

  async unassign(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot unassign task in progress');
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        assigneeId: null,
        status: TaskStatus.PENDING,
      },
      include: this.getTaskIncludes(),
    });

    if (task.status === TaskStatus.ASSIGNED) {
      await this.createStatusHistory(task.id, task.status, TaskStatus.PENDING, userId, 'Unassigned');
    }

    this.eventEmitter.emit('task.unassigned', {
      task: updated,
      previousAssigneeId: task.assigneeId,
      unassignedBy: userId,
    });

    return this.formatTask(updated);
  }

  async updateChecklist(id: string, userId: string, dto: UpdateChecklistDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const checklist = (task.metadata as any)?.checklist ?? [];

    if (dto.itemIndex >= checklist.length) {
      throw new BadRequestException('Checklist item not found');
    }

    checklist[dto.itemIndex] = {
      ...checklist[dto.itemIndex],
      completed: dto.completed,
      completedAt: dto.completed ? new Date() : null,
      completedBy: dto.completed ? userId : null,
      notes: dto.notes,
    };

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        metadata: {
          ...(task.metadata as any),
          checklist,
        },
      },
      include: this.getTaskIncludes(),
    });

    this.eventEmitter.emit('task.checklist.updated', {
      taskId: id,
      itemIndex: dto.itemIndex,
      completed: dto.completed,
      updatedBy: userId,
    });

    return this.formatTask(updated);
  }

  async remove(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status === TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete task in progress');
    }

    await this.prisma.task.delete({ where: { id } });

    this.eventEmitter.emit('task.deleted', { taskId: id, jobId: task.jobId });
  }

  // ==================== TIME TRACKING ====================

  async logTime(id: string, userId: string, dto: TaskTimeLogDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const startedAt = new Date(dto.startedAt);
    const endedAt = dto.endedAt ? new Date(dto.endedAt) : null;
    const duration = endedAt
      ? Math.round((endedAt.getTime() - startedAt.getTime()) / 60000) - (dto.breakDuration ?? 0)
      : 0;

    const timeLog = await this.prisma.taskTimeLog.create({
      data: {
        taskId: id,
        userId,
        startedAt,
        endedAt,
        duration,
        breakDuration: dto.breakDuration,
        notes: dto.notes,
      },
    });

    // Update actual duration on task
    if (duration > 0) {
      await this.prisma.task.update({
        where: { id },
        data: {
          actualDuration: {
            increment: duration,
          },
        },
      });
    }

    return timeLog;
  }

  async getTimeLogs(taskId: string) {
    return this.prisma.taskTimeLog.findMany({
      where: { taskId },
      orderBy: { startedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // ==================== ANALYTICS ====================

  async getTaskSummary(jobId?: string, userId?: string) {
    const where: any = {};
    if (jobId) where.jobId = jobId;
    if (userId) where.assigneeId = userId;

    const tasks = await this.prisma.task.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const overdue = await this.prisma.task.count({
      where: {
        ...where,
        scheduledEnd: { lt: new Date() },
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      },
    });

    const aggregates = await this.prisma.task.aggregate({
      where,
      _sum: {
        estimatedDuration: true,
        actualDuration: true,
      },
      _count: true,
    });

    const statusCounts = tasks.reduce(
      (acc, t) => ({ ...acc, [t.status]: t._count.status }),
      {} as Record<string, number>,
    );

    const completed = statusCounts[TaskStatus.COMPLETED] ?? 0;
    const total = aggregates._count;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    const estimatedTotal = aggregates._sum.estimatedDuration ?? 0;
    const actualTotal = aggregates._sum.actualDuration ?? 0;
    const efficiencyRate = estimatedTotal > 0 ? (estimatedTotal / actualTotal) * 100 : 100;

    return {
      totalTasks: total,
      pendingTasks: statusCounts[TaskStatus.PENDING] ?? 0,
      assignedTasks: statusCounts[TaskStatus.ASSIGNED] ?? 0,
      inProgressTasks: statusCounts[TaskStatus.IN_PROGRESS] ?? 0,
      completedTasks: completed,
      cancelledTasks: statusCounts[TaskStatus.CANCELLED] ?? 0,
      overdueTasks: overdue,
      totalEstimatedMinutes: estimatedTotal,
      totalActualMinutes: actualTotal,
      completionRate: Math.round(completionRate * 10) / 10,
      efficiencyRate: Math.round(efficiencyRate * 10) / 10,
    };
  }

  // ==================== HELPERS ====================

  private validateStatusTransition(from: string, to: string) {
    const validTransitions: Record<string, string[]> = {
      [TaskStatus.PENDING]: [TaskStatus.ASSIGNED, TaskStatus.CANCELLED],
      [TaskStatus.ASSIGNED]: [TaskStatus.IN_PROGRESS, TaskStatus.PENDING, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.ON_HOLD, TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED],
      [TaskStatus.ON_HOLD]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
      [TaskStatus.FAILED]: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BadRequestException(
        `Cannot transition from ${from} to ${to}`,
      );
    }
  }

  private async checkDependencies(task: any) {
    const dependencyIds = (task.metadata as any)?.dependencyIds ?? [];

    if (dependencyIds.length === 0) return;

    const dependencies = await this.prisma.task.findMany({
      where: {
        id: { in: dependencyIds },
        status: { not: TaskStatus.COMPLETED },
      },
    });

    if (dependencies.length > 0) {
      throw new BadRequestException(
        `Cannot start task. Incomplete dependencies: ${dependencies.map((d) => d.title).join(', ')}`,
      );
    }
  }

  private async checkJobCompletion(jobId: string) {
    const incompleteTasks = await this.prisma.task.count({
      where: {
        jobId,
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
      },
    });

    if (incompleteTasks === 0) {
      this.eventEmitter.emit('job.tasks.completed', { jobId });
    }
  }

  private async createStatusHistory(
    taskId: string,
    fromStatus: string | null,
    toStatus: string,
    changedBy: string,
    notes?: string,
  ) {
    await this.prisma.taskStatusHistory.create({
      data: {
        taskId,
        fromStatus,
        toStatus,
        changedBy,
        notes,
      },
    });
  }

  private getTaskIncludes() {
    return {
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
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

  private formatTask(task: any) {
    const metadata = task.metadata as any;
    return {
      ...task,
      checklist: metadata?.checklist,
      location: metadata?.location,
      instructions: metadata?.instructions,
      requiredSkillIds: metadata?.requiredSkillIds,
      dependencyIds: metadata?.dependencyIds,
      metadata: undefined,
    };
  }
}
