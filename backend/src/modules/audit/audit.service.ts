import { Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import {
  CreateAuditLogDto,
  AuditFilterDto,
  ExportAuditLogsDto,
  AuditAction,
  AuditResource,
  AuditSeverity,
} from './dto/audit.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class AuditService {
  private readonly CACHE_PREFIX = 'audit:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ==================== LOGGING ====================

  async log(dto: CreateAuditLogDto) {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        action: dto.action,
        resource: dto.resource,
        resourceId: dto.resourceId,
        userId: dto.userId,
        organizationId: dto.organizationId,
        severity: dto.severity ?? AuditSeverity.INFO,
        description: dto.description ?? this.generateDescription(dto),
        previousState: dto.previousState,
        newState: dto.newState,
        metadata: dto.metadata as any,
      },
    });

    // Invalidate summary cache
    await this.redis.del(`${this.CACHE_PREFIX}summary:*`);

    return auditLog;
  }

  async logBatch(logs: CreateAuditLogDto[]) {
    const auditLogs = await this.prisma.auditLog.createMany({
      data: logs.map((dto) => ({
        action: dto.action,
        resource: dto.resource,
        resourceId: dto.resourceId,
        userId: dto.userId,
        organizationId: dto.organizationId,
        severity: dto.severity ?? AuditSeverity.INFO,
        description: dto.description ?? this.generateDescription(dto),
        previousState: dto.previousState,
        newState: dto.newState,
        metadata: dto.metadata as any,
      })),
    });

    return auditLogs;
  }

  // ==================== QUERIES ====================

  async findAll(pagination: PaginationDto, filter?: AuditFilterDto) {
    const where = this.buildWhereClause(filter);

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          organization: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map((log) => this.formatAuditLog(log)),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Audit log not found');
    }

    return this.formatAuditLog(log);
  }

  async getResourceTimeline(resource: AuditResource, resourceId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    const events = logs.map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      timestamp: log.createdAt,
      user: log.user,
      changes: this.computeChanges(log.previousState, log.newState),
    }));

    return {
      resourceId,
      resourceType: resource,
      events,
      totalEvents: events.length,
    };
  }

  async getUserActivity(userId: string, pagination: PaginationDto) {
    return this.findAll(pagination, { userId });
  }

  async getOrganizationActivity(organizationId: string, pagination: PaginationDto) {
    return this.findAll(pagination, { organizationId });
  }

  // ==================== ANALYTICS ====================

  async getSummary(organizationId?: string, days: number = 30) {
    const cacheKey = `${this.CACHE_PREFIX}summary:${organizationId ?? 'all'}:${days}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const startDate = DateTime.now().minus({ days }).toJSDate();

    const where: any = {
      createdAt: { gte: startDate },
    };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [totalLogs, actionGroups, resourceGroups, severityGroups, recentLogs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { resource: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      }),
      this.prisma.auditLog.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    // Top active users
    const userActivity = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: { ...where, userId: { not: null } },
      _count: { userId: true },
      _max: { createdAt: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 5,
    });

    const userIds = userActivity.map((u) => u.userId!);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const topUsers = userActivity.map((u) => {
      const user = users.find((usr) => usr.id === u.userId);
      return {
        userId: u.userId,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        actionCount: u._count.userId,
        lastAction: u._max.createdAt,
      };
    });

    const summary = {
      totalLogs,
      byAction: actionGroups.reduce(
        (acc, g) => ({ ...acc, [g.action]: g._count.action }),
        {} as Record<string, number>,
      ),
      byResource: resourceGroups.reduce(
        (acc, g) => ({ ...acc, [g.resource]: g._count.resource }),
        {} as Record<string, number>,
      ),
      bySeverity: severityGroups.reduce(
        (acc, g) => ({ ...acc, [g.severity]: g._count.severity }),
        {} as Record<string, number>,
      ),
      topUsers,
      recentActivity: recentLogs.map((log) => this.formatAuditLog(log)),
      period: `${days} days`,
    };

    await this.redis.set(cacheKey, summary, this.CACHE_TTL);

    return summary;
  }

  async getComplianceReport(startDate: string, endDate: string, organizationId?: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const where: any = {
      createdAt: { gte: start, lte: end },
    };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const [
      totalEvents,
      uniqueUsers,
      criticalEvents,
      dataAccessEvents,
      failedLogins,
      permissionChanges,
      dataExports,
      apiAccess,
      hourlyDistribution,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({ by: ['userId'], where }).then((r) => r.length),
      this.prisma.auditLog.count({ where: { ...where, severity: AuditSeverity.CRITICAL } }),
      this.prisma.auditLog.count({ where: { ...where, action: AuditAction.READ } }),
      this.prisma.auditLog.count({
        where: { ...where, action: AuditAction.LOGIN, severity: AuditSeverity.ERROR },
      }),
      this.prisma.auditLog.count({
        where: { ...where, action: AuditAction.PERMISSION_CHANGE },
      }),
      this.prisma.auditLog.count({
        where: { ...where, action: AuditAction.EXPORT },
      }),
      this.prisma.auditLog.count({
        where: { ...where, action: AuditAction.API_ACCESS },
      }),
      this.getHourlyDistribution(where),
    ]);

    // Get oldest log for retention info
    const oldestLog = await this.prisma.auditLog.findFirst({
      where,
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    return {
      reportId: `rpt_${Date.now()}`,
      generatedAt: new Date(),
      period: { start, end },
      summary: {
        totalEvents,
        uniqueUsers,
        criticalEvents,
        dataAccessEvents,
      },
      accessPatterns: {
        byHour: hourlyDistribution.byHour,
        byDayOfWeek: hourlyDistribution.byDayOfWeek,
        peakHours: this.identifyPeakHours(hourlyDistribution.byHour),
      },
      securityEvents: {
        failedLogins,
        permissionChanges,
        dataExports,
        apiAccess,
      },
      dataRetention: {
        oldestLog: oldestLog?.createdAt ?? null,
        totalSize: 'N/A', // Would calculate actual size
        archivedLogs: 0,
      },
    };
  }

  // ==================== EXPORT ====================

  async exportLogs(dto: ExportAuditLogsDto) {
    const where = this.buildWhereClause({
      startDate: dto.startDate,
      endDate: dto.endDate,
      actions: dto.actions,
      resources: dto.resources,
    });

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Generate export based on format
    const exportId = `exp_${Date.now()}`;
    const format = dto.format ?? 'csv';

    // In production, this would generate actual files
    // and upload to S3 or similar storage

    return {
      exportId,
      fileName: `audit_logs_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.${format}`,
      format,
      recordCount: logs.length,
      fileSize: `${Math.round((JSON.stringify(logs).length / 1024) * 10) / 10} KB`,
      downloadUrl: `/api/v1/audit/exports/${exportId}/download`,
      expiresAt: DateTime.now().plus({ hours: 24 }).toJSDate(),
    };
  }

  // ==================== RETENTION ====================

  async applyRetentionPolicy(retentionDays: number, archiveInsteadOfDelete: boolean = true) {
    const cutoffDate = DateTime.now().minus({ days: retentionDays }).toJSDate();

    if (archiveInsteadOfDelete) {
      // Move to archive table
      const toArchive = await this.prisma.auditLog.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          severity: { not: AuditSeverity.CRITICAL }, // Keep critical logs
        },
      });

      // In production, this would move to an archive table or cold storage
      // For now, just count
      return {
        archived: toArchive.length,
        deleted: 0,
        cutoffDate,
      };
    } else {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          severity: { not: AuditSeverity.CRITICAL },
        },
      });

      return {
        archived: 0,
        deleted: result.count,
        cutoffDate,
      };
    }
  }

  // ==================== EVENT LISTENERS ====================

  @OnEvent('user.*')
  async handleUserEvent(payload: any) {
    const action = this.getActionFromEvent(payload.event);
    await this.log({
      action,
      resource: AuditResource.USER,
      resourceId: payload.userId,
      userId: payload.performedBy,
      description: payload.description,
      previousState: payload.previousState,
      newState: payload.newState,
    });
  }

  @OnEvent('job.*')
  async handleJobEvent(payload: any) {
    const action = this.getActionFromEvent(payload.event);
    await this.log({
      action,
      resource: AuditResource.JOB,
      resourceId: payload.jobId,
      userId: payload.performedBy,
      organizationId: payload.organizationId,
      description: payload.description,
    });
  }

  @OnEvent('payment.*')
  async handlePaymentEvent(payload: any) {
    await this.log({
      action: AuditAction.PAYMENT,
      resource: AuditResource.PAYMENT,
      resourceId: payload.paymentId,
      userId: payload.userId,
      severity: AuditSeverity.INFO,
      description: `Payment ${payload.event?.split('.')[1]} - Amount: ${payload.amount}`,
      metadata: {
        additionalData: {
          amount: payload.amount,
          status: payload.status,
        },
      },
    });
  }

  // ==================== HELPERS ====================

  private buildWhereClause(filter?: AuditFilterDto) {
    const where: any = {};

    if (filter?.actions && filter.actions.length > 0) {
      where.action = { in: filter.actions };
    }

    if (filter?.resources && filter.resources.length > 0) {
      where.resource = { in: filter.resources };
    }

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.organizationId) {
      where.organizationId = filter.organizationId;
    }

    if (filter?.resourceId) {
      where.resourceId = filter.resourceId;
    }

    if (filter?.severities && filter.severities.length > 0) {
      where.severity = { in: filter.severities };
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    if (filter?.search) {
      where.description = { contains: filter.search, mode: 'insensitive' };
    }

    return where;
  }

  private generateDescription(dto: CreateAuditLogDto): string {
    return `${dto.action} on ${dto.resource}${dto.resourceId ? ` (${dto.resourceId})` : ''}`;
  }

  private formatAuditLog(log: any) {
    return {
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      userId: log.userId,
      organizationId: log.organizationId,
      severity: log.severity,
      description: log.description,
      previousState: log.previousState,
      newState: log.newState,
      metadata: log.metadata,
      createdAt: log.createdAt,
      user: log.user,
      organization: log.organization,
    };
  }

  private computeChanges(previousState: any, newState: any) {
    if (!previousState || !newState) return [];

    const changes: any[] = [];
    const allKeys = new Set([
      ...Object.keys(previousState || {}),
      ...Object.keys(newState || {}),
    ]);

    for (const key of allKeys) {
      const oldValue = previousState?.[key];
      const newValue = newState?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field: key, oldValue, newValue });
      }
    }

    return changes;
  }

  private getActionFromEvent(event: string): AuditAction {
    if (event?.includes('created')) return AuditAction.CREATE;
    if (event?.includes('updated')) return AuditAction.UPDATE;
    if (event?.includes('deleted')) return AuditAction.DELETE;
    if (event?.includes('login')) return AuditAction.LOGIN;
    if (event?.includes('logout')) return AuditAction.LOGOUT;
    return AuditAction.READ;
  }

  private async getHourlyDistribution(where: any) {
    // Simplified - in production would use raw SQL for proper grouping
    const logs = await this.prisma.auditLog.findMany({
      where,
      select: { createdAt: true },
    });

    const byHour = new Array(24).fill(0);
    const byDayOfWeek = new Array(7).fill(0);

    for (const log of logs) {
      const dt = DateTime.fromJSDate(log.createdAt);
      byHour[dt.hour] += 1;
      byDayOfWeek[dt.weekday - 1] += 1;
    }

    return { byHour, byDayOfWeek };
  }

  private identifyPeakHours(hourlyData: number[]): string[] {
    const avg = hourlyData.reduce((a, b) => a + b, 0) / hourlyData.length;
    const peakHours: string[] = [];

    hourlyData.forEach((count, hour) => {
      if (count > avg * 1.5) {
        peakHours.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    });

    return peakHours;
  }
}
