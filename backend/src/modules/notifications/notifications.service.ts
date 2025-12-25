import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';
import { PaginationDto, PaginatedResultDto } from '../../common/dto';
import {
  CreateNotificationDto,
  NotificationFilterDto,
  UpdateNotificationPreferencesDto,
  NotificationType,
  NotificationChannel,
  NotificationResponseDto,
  NotificationCountDto,
  NotificationPreferencesDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data as Prisma.JsonObject,
        actionUrl: dto.actionUrl,
        channels: dto.channels || [NotificationChannel.IN_APP],
      },
    });

    // Update unread count in Redis
    await this.incrementUnreadCount(dto.userId);

    // TODO: Send push notification if enabled
    // TODO: Send email notification if enabled
    // TODO: Send SMS notification if enabled

    return this.mapNotificationToResponse(notification);
  }

  async findAll(
    userId: string,
    pagination: PaginationDto,
    filters: NotificationFilterDto,
  ): Promise<PaginatedResultDto<NotificationResponseDto>> {
    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return new PaginatedResultDto(
      notifications.map((n) => this.mapNotificationToResponse(n)),
      total,
      pagination,
    );
  }

  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.isRead) {
      return this.mapNotificationToResponse(notification);
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Decrement unread count
    await this.decrementUnreadCount(userId);

    return this.mapNotificationToResponse(updated);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Reset unread count
    await this.redis.set(`notifications:unread:${userId}`, '0');

    return result.count;
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id },
    });

    if (!notification.isRead) {
      await this.decrementUnreadCount(userId);
    }
  }

  async getUnreadCount(userId: string): Promise<NotificationCountDto> {
    // Try Redis first
    const cached = await this.redis.get(`notifications:unread:${userId}`);

    if (cached !== null) {
      const total = await this.prisma.notification.count({ where: { userId } });
      return {
        total,
        unread: parseInt(cached, 10),
      };
    }

    // Calculate from database
    const [total, unread] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    // Cache unread count
    await this.redis.set(`notifications:unread:${userId}`, String(unread));

    return { total, unread };
  }

  async getPreferences(userId: string): Promise<NotificationPreferencesDto> {
    // Get from Redis or use defaults
    const cached = await this.redis.get(`notifications:prefs:${userId}`);

    if (cached) {
      return JSON.parse(cached);
    }

    return {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      disabledTypes: [],
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    const current = await this.getPreferences(userId);

    const updated: NotificationPreferencesDto = {
      emailEnabled: dto.emailEnabled ?? current.emailEnabled,
      pushEnabled: dto.pushEnabled ?? current.pushEnabled,
      smsEnabled: dto.smsEnabled ?? current.smsEnabled,
      disabledTypes: dto.disabledTypes ?? current.disabledTypes,
    };

    // Store in Redis (no expiry - permanent)
    await this.redis.set(
      `notifications:prefs:${userId}`,
      JSON.stringify(updated),
    );

    return updated;
  }

  // Event handlers
  @OnEvent('job.created')
  async handleJobCreated(payload: { jobId: string; clientId: string }) {
    // Notify relevant workers (this would be more sophisticated in production)
    this.logger.log(`Job created: ${payload.jobId}`);
  }

  @OnEvent('job.published')
  async handleJobPublished(payload: { jobId: string }) {
    // Notify matched workers
    this.logger.log(`Job published: ${payload.jobId}`);
  }

  @OnEvent('match.created')
  async handleMatchCreated(payload: {
    matchId: string;
    jobId: string;
    workerId: string;
  }) {
    const job = await this.prisma.job.findUnique({
      where: { id: payload.jobId },
    });

    if (job) {
      await this.create({
        userId: payload.workerId,
        type: NotificationType.MATCH_CREATED,
        title: 'New Job Match',
        message: `You've been matched to the job: ${job.title}`,
        data: {
          matchId: payload.matchId,
          jobId: payload.jobId,
        },
        actionUrl: `/jobs/${payload.jobId}`,
      });
    }
  }

  @OnEvent('match.responded')
  async handleMatchResponded(payload: {
    matchId: string;
    jobId: string;
    workerId: string;
    action: string;
  }) {
    const [job, worker] = await Promise.all([
      this.prisma.job.findUnique({ where: { id: payload.jobId } }),
      this.prisma.user.findUnique({ where: { id: payload.workerId } }),
    ]);

    if (job && worker) {
      const type =
        payload.action === 'accept'
          ? NotificationType.MATCH_ACCEPTED
          : NotificationType.MATCH_REJECTED;

      await this.create({
        userId: job.clientId,
        type,
        title:
          payload.action === 'accept' ? 'Match Accepted' : 'Match Rejected',
        message: `${worker.firstName} ${worker.lastName} has ${payload.action}ed the job: ${job.title}`,
        data: {
          matchId: payload.matchId,
          jobId: payload.jobId,
          workerId: payload.workerId,
        },
        actionUrl: `/jobs/${payload.jobId}`,
      });
    }
  }

  @OnEvent('organization.invitationCreated')
  async handleOrgInvitation(payload: {
    organizationId: string;
    organizationName: string;
    email: string;
    token: string;
    invitedBy: string;
  }) {
    // Look up user by email
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (user) {
      await this.create({
        userId: user.id,
        type: NotificationType.ORG_INVITATION,
        title: 'Organization Invitation',
        message: `You've been invited to join ${payload.organizationName}`,
        data: {
          organizationId: payload.organizationId,
          token: payload.token,
        },
        actionUrl: `/organizations/accept-invitation/${payload.token}`,
      });
    }

    // TODO: Send email invitation for non-registered users
  }

  @OnEvent('user.passwordChanged')
  async handlePasswordChanged(payload: { userId: string }) {
    await this.create({
      userId: payload.userId,
      type: NotificationType.ACCOUNT_UPDATE,
      title: 'Password Changed',
      message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    });
  }

  private async incrementUnreadCount(userId: string): Promise<void> {
    const key = `notifications:unread:${userId}`;
    const current = await this.redis.get(key);

    if (current !== null) {
      await this.redis.set(key, String(parseInt(current, 10) + 1));
    }
  }

  private async decrementUnreadCount(userId: string): Promise<void> {
    const key = `notifications:unread:${userId}`;
    const current = await this.redis.get(key);

    if (current !== null && parseInt(current, 10) > 0) {
      await this.redis.set(key, String(parseInt(current, 10) - 1));
    }
  }

  private mapNotificationToResponse(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      data: notification.data || undefined,
      actionUrl: notification.actionUrl || undefined,
      isRead: notification.isRead,
      readAt: notification.readAt || undefined,
      createdAt: notification.createdAt,
    };
  }
}
