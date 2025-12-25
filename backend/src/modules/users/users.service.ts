import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';
import { HashService, TimezoneService } from '../../common/utils';
import { PaginationDto, PaginatedResultDto } from '../../common/dto';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateWorkerProfileDto,
  SetAvailabilityDto,
  UserResponseDto,
  UserWithWorkerProfileDto,
  AvailabilityWindowResponseDto,
  UserStatsDto,
} from './dto';
import { Prisma, User, UserStatus, Role } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private hashService: HashService,
    private timezoneService: TimezoneService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Generate temporary password
    const tempPassword = this.hashService.generateRandomToken(16);
    const hashedPassword = await this.hashService.hashPassword(tempPassword);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || Role.WORKER,
        timezone: dto.timezone || 'UTC',
        preferredLanguage: dto.preferredLanguage || 'en',
        status: UserStatus.PENDING,
      },
    });

    // Create worker profile if role is WORKER
    if (user.role === Role.WORKER) {
      await this.prisma.workerProfile.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Emit user created event with temp password
    this.eventEmitter.emit('user.createdByAdmin', {
      userId: user.id,
      email: user.email,
      tempPassword,
    });

    return this.mapUserToResponse(user);
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      role?: Role;
      status?: UserStatus;
      organizationId?: string;
    },
  ): Promise<PaginatedResultDto<UserResponseDto>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.organizationId) {
      where.organizationMembers = {
        some: {
          organizationId: filters.organizationId,
          deletedAt: null,
        },
      };
    }

    if (pagination.search) {
      where.OR = [
        { firstName: { contains: pagination.search, mode: 'insensitive' } },
        { lastName: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: pagination.sortBy
          ? { [pagination.sortBy]: pagination.sortOrder }
          : { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResultDto(
      users.map((user) => this.mapUserToResponse(user)),
      total,
      pagination,
    );
  }

  async findById(id: string): Promise<UserWithWorkerProfileDto> {
    // Try to get from cache first
    const cached = await this.redis.get(`user:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        workerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const response = this.mapUserWithProfileToResponse(user);

    // Cache for 5 minutes
    await this.redis.setex(`user:${id}`, 300, JSON.stringify(response));

    return response;
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase(), deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapUserToResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        timezone: dto.timezone,
        preferredLanguage: dto.preferredLanguage,
        profileImageUrl: dto.profileImageUrl,
        bio: dto.bio,
      },
    });

    // Invalidate cache
    await this.redis.del(`user:${id}`);

    // Emit user updated event
    this.eventEmitter.emit('user.updated', { userId: id });

    return this.mapUserToResponse(updatedUser);
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    // Invalidate cache
    await this.redis.del(`user:${id}`);

    // Emit status change event
    this.eventEmitter.emit('user.statusChanged', {
      userId: id,
      oldStatus: user.status,
      newStatus: dto.status,
      reason: dto.reason,
    });

    return this.mapUserToResponse(updatedUser);
  }

  async delete(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.redis.del(`user:${id}`);

    // Emit user deleted event
    this.eventEmitter.emit('user.deleted', { userId: id });
  }

  async updateWorkerProfile(
    userId: string,
    dto: UpdateWorkerProfileDto,
  ): Promise<any> {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Worker profile not found');
    }

    const updatedProfile = await this.prisma.workerProfile.update({
      where: { userId },
      data: {
        skills: dto.skills,
        hourlyRate: dto.hourlyRate,
        isAvailable: dto.isAvailable,
        certifications: dto.certifications,
        languages: dto.languages,
        maxHoursPerWeek: dto.maxHoursPerWeek,
        travelRadius: dto.travelRadius,
      },
    });

    // Invalidate cache
    await this.redis.del(`user:${userId}`);

    // Emit profile updated event
    this.eventEmitter.emit('workerProfile.updated', { userId });

    return updatedProfile;
  }

  async setAvailability(
    userId: string,
    dto: SetAvailabilityDto,
  ): Promise<AvailabilityWindowResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const timezone = dto.timezone || user.timezone || 'UTC';

    // Validate timezone
    if (!this.timezoneService.isValidTimezone(timezone)) {
      throw new ConflictException('Invalid timezone');
    }

    // Delete existing availability windows
    await this.prisma.availabilityWindow.deleteMany({
      where: { userId },
    });

    // Create new availability windows
    const windows = await Promise.all(
      dto.windows.map((window) =>
        this.prisma.availabilityWindow.create({
          data: {
            userId,
            dayOfWeek: window.dayOfWeek,
            startTime: window.startTime,
            endTime: window.endTime,
            timezone,
            isRecurring: window.isRecurring ?? true,
          },
        }),
      ),
    );

    // Cache availability in Redis for quick matching
    await this.redis.setex(
      `availability:${userId}`,
      3600, // 1 hour
      JSON.stringify(windows),
    );

    // Emit availability updated event
    this.eventEmitter.emit('user.availabilityUpdated', { userId });

    return windows.map((w) => ({
      id: w.id,
      dayOfWeek: w.dayOfWeek,
      startTime: w.startTime,
      endTime: w.endTime,
      timezone: w.timezone,
      isRecurring: w.isRecurring,
      createdAt: w.createdAt,
    }));
  }

  async getAvailability(userId: string): Promise<AvailabilityWindowResponseDto[]> {
    // Try cache first
    const cached = await this.redis.get(`availability:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const windows = await this.prisma.availabilityWindow.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Cache result
    await this.redis.setex(
      `availability:${userId}`,
      3600,
      JSON.stringify(windows),
    );

    return windows.map((w) => ({
      id: w.id,
      dayOfWeek: w.dayOfWeek,
      startTime: w.startTime,
      endTime: w.endTime,
      timezone: w.timezone,
      isRecurring: w.isRecurring,
      createdAt: w.createdAt,
    }));
  }

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const cacheKey = `user:stats:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        workerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get job statistics
    const [activeJobs, upcomingJobs, completedMatches] = await Promise.all([
      this.prisma.match.count({
        where: {
          workerId: userId,
          status: 'ACTIVE',
        },
      }),
      this.prisma.match.count({
        where: {
          workerId: userId,
          status: 'ACCEPTED',
          job: {
            scheduledStartTime: { gt: new Date() },
          },
        },
      }),
      this.prisma.match.findMany({
        where: {
          workerId: userId,
          status: 'COMPLETED',
        },
        include: {
          job: true,
        },
      }),
    ]);

    // Calculate total earnings
    const totalEarnings = completedMatches.reduce(
      (sum, match) => sum + (match.job.budget?.toNumber() || 0),
      0,
    );

    const stats: UserStatsDto = {
      totalJobsCompleted: user.workerProfile?.totalJobsCompleted || 0,
      totalHoursWorked: user.workerProfile?.totalHoursWorked || 0,
      averageRating: user.workerProfile?.averageRating || 0,
      reliabilityScore: user.workerProfile?.reliabilityScore || 100,
      totalEarnings,
      activeJobsCount: activeJobs,
      upcomingJobsCount: upcomingJobs,
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(stats));

    return stats;
  }

  async getWorkersBySkills(
    skills: string[],
    pagination: PaginationDto,
  ): Promise<PaginatedResultDto<UserWithWorkerProfileDto>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      role: Role.WORKER,
      workerProfile: {
        isAvailable: true,
        skills: {
          array_contains: skills.map((s) => ({ name: s })),
        },
      },
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { workerProfile: true },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: {
          workerProfile: {
            reliabilityScore: 'desc',
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResultDto(
      users.map((user) => this.mapUserWithProfileToResponse(user)),
      total,
      pagination,
    );
  }

  async getAvailableWorkers(
    startTime: Date,
    endTime: Date,
    timezone: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResultDto<UserWithWorkerProfileDto>> {
    // Convert requested time to day of week and time strings
    const startDt = this.timezoneService.nowInTimezone(timezone);
    const dayOfWeek = startDt.weekday % 7;

    const workers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: Role.WORKER,
        workerProfile: {
          isAvailable: true,
        },
        availabilityWindows: {
          some: {
            dayOfWeek,
            // Additional time filtering would need more complex logic
          },
        },
      },
      include: { workerProfile: true },
      skip: pagination.skip,
      take: pagination.take,
    });

    const total = await this.prisma.user.count({
      where: {
        deletedAt: null,
        role: Role.WORKER,
        workerProfile: {
          isAvailable: true,
        },
      },
    });

    return new PaginatedResultDto(
      workers.map((user) => this.mapUserWithProfileToResponse(user)),
      total,
      pagination,
    );
  }

  private mapUserToResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      phone: user.phone || undefined,
      timezone: user.timezone || undefined,
      preferredLanguage: user.preferredLanguage || undefined,
      profileImageUrl: user.profileImageUrl || undefined,
      bio: user.bio || undefined,
      lastLoginAt: user.lastLoginAt || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapUserWithProfileToResponse(user: any): UserWithWorkerProfileDto {
    const baseResponse = this.mapUserToResponse(user);
    return {
      ...baseResponse,
      workerProfile: user.workerProfile
        ? {
            id: user.workerProfile.id,
            userId: user.workerProfile.userId,
            skills: user.workerProfile.skills,
            hourlyRate: user.workerProfile.hourlyRate?.toNumber(),
            isAvailable: user.workerProfile.isAvailable,
            certifications: user.workerProfile.certifications,
            languages: user.workerProfile.languages,
            maxHoursPerWeek: user.workerProfile.maxHoursPerWeek,
            travelRadius: user.workerProfile.travelRadius?.toNumber(),
            reliabilityScore: user.workerProfile.reliabilityScore,
            totalJobsCompleted: user.workerProfile.totalJobsCompleted,
            averageRating: user.workerProfile.averageRating,
            totalHoursWorked: user.workerProfile.totalHoursWorked,
            createdAt: user.workerProfile.createdAt,
            updatedAt: user.workerProfile.updatedAt,
          }
        : undefined,
    };
  }
}
