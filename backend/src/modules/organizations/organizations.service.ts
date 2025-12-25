import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';
import { HashService } from '../../common/utils';
import { PaginationDto, PaginatedResultDto } from '../../common/dto';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
  UpdateMemberDto,
  InviteMemberDto,
  OrganizationResponseDto,
  OrganizationMemberResponseDto,
  OrganizationStatsDto,
} from './dto';
import {
  Prisma,
  Organization,
  OrganizationStatus,
  OrganizationRole,
  JobStatus,
} from '@prisma/client';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private hashService: HashService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    userId: string,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    // Generate slug if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check if slug is unique
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ConflictException('Organization slug already exists');
    }

    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        type: dto.type,
        description: dto.description,
        logo: dto.logo,
        website: dto.website,
        phone: dto.phone,
        email: dto.email,
        address: dto.address as Prisma.JsonObject,
        timezone: dto.timezone || 'UTC',
        settings: dto.settings as Prisma.JsonObject,
        status: OrganizationStatus.ACTIVE,
        members: {
          create: {
            userId,
            role: OrganizationRole.OWNER,
            permissions: ['*'], // Full permissions for owner
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Update user's current organization
    await this.prisma.user.update({
      where: { id: userId },
      data: { currentOrganizationId: organization.id },
    });

    // Emit organization created event
    this.eventEmitter.emit('organization.created', {
      organizationId: organization.id,
      createdBy: userId,
    });

    return this.mapOrganizationToResponse(organization);
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      type?: string;
      status?: OrganizationStatus;
    },
  ): Promise<PaginatedResultDto<OrganizationResponseDto>> {
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
    };

    if (filters?.type) {
      where.type = filters.type as any;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { slug: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        include: {
          _count: {
            select: { members: true },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return new PaginatedResultDto(
      organizations.map((org) => this.mapOrganizationToResponse(org)),
      total,
      pagination,
    );
  }

  async findById(id: string): Promise<OrganizationResponseDto> {
    const cacheKey = `org:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const response = this.mapOrganizationToResponse(organization);

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(response));

    return response;
  }

  async findBySlug(slug: string): Promise<OrganizationResponseDto> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug, deletedAt: null },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.mapOrganizationToResponse(organization);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    await this.checkMemberPermission(id, userId, OrganizationRole.ADMIN);

    if (dto.slug) {
      const existingOrg = await this.prisma.organization.findFirst({
        where: {
          slug: dto.slug,
          id: { not: id },
        },
      });

      if (existingOrg) {
        throw new ConflictException('Organization slug already exists');
      }
    }

    const organization = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        status: dto.status,
        description: dto.description,
        logo: dto.logo,
        website: dto.website,
        phone: dto.phone,
        email: dto.email,
        address: dto.address as Prisma.JsonObject,
        timezone: dto.timezone,
        settings: dto.settings as Prisma.JsonObject,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    // Invalidate cache
    await this.redis.del(`org:${id}`);

    // Emit organization updated event
    this.eventEmitter.emit('organization.updated', {
      organizationId: id,
      updatedBy: userId,
    });

    return this.mapOrganizationToResponse(organization);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.checkMemberPermission(id, userId, OrganizationRole.OWNER);

    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache
    await this.redis.del(`org:${id}`);

    // Emit organization deleted event
    this.eventEmitter.emit('organization.deleted', {
      organizationId: id,
      deletedBy: userId,
    });
  }

  // Member management
  async addMember(
    organizationId: string,
    requesterId: string,
    dto: AddMemberDto,
  ): Promise<OrganizationMemberResponseDto> {
    await this.checkMemberPermission(
      organizationId,
      requesterId,
      OrganizationRole.ADMIN,
    );

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: dto.userId,
        deletedAt: null,
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: dto.userId,
        role: dto.role || OrganizationRole.MEMBER,
        permissions: dto.permissions || [],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Emit member added event
    this.eventEmitter.emit('organization.memberAdded', {
      organizationId,
      userId: dto.userId,
      addedBy: requesterId,
    });

    return this.mapMemberToResponse(member);
  }

  async getMembers(
    organizationId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResultDto<OrganizationMemberResponseDto>> {
    const [members, total] = await Promise.all([
      this.prisma.organizationMember.findMany({
        where: {
          organizationId,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true,
            },
          },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organizationMember.count({
        where: { organizationId, deletedAt: null },
      }),
    ]);

    return new PaginatedResultDto(
      members.map((m) => this.mapMemberToResponse(m)),
      total,
      pagination,
    );
  }

  async updateMember(
    organizationId: string,
    memberId: string,
    requesterId: string,
    dto: UpdateMemberDto,
  ): Promise<OrganizationMemberResponseDto> {
    await this.checkMemberPermission(
      organizationId,
      requesterId,
      OrganizationRole.ADMIN,
    );

    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId, deletedAt: null },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner's role
    if (member.role === OrganizationRole.OWNER && dto.role) {
      throw new ForbiddenException('Cannot change owner role');
    }

    const updatedMember = await this.prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        role: dto.role,
        permissions: dto.permissions,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return this.mapMemberToResponse(updatedMember);
  }

  async removeMember(
    organizationId: string,
    memberId: string,
    requesterId: string,
  ): Promise<void> {
    await this.checkMemberPermission(
      organizationId,
      requesterId,
      OrganizationRole.ADMIN,
    );

    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId, deletedAt: null },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === OrganizationRole.OWNER) {
      throw new ForbiddenException('Cannot remove organization owner');
    }

    await this.prisma.organizationMember.update({
      where: { id: memberId },
      data: { deletedAt: new Date() },
    });

    // Emit member removed event
    this.eventEmitter.emit('organization.memberRemoved', {
      organizationId,
      userId: member.userId,
      removedBy: requesterId,
    });
  }

  async inviteMember(
    organizationId: string,
    requesterId: string,
    dto: InviteMemberDto,
  ): Promise<void> {
    await this.checkMemberPermission(
      organizationId,
      requesterId,
      OrganizationRole.ADMIN,
    );

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      // If user exists, check if already a member
      const existingMember = await this.prisma.organizationMember.findFirst({
        where: {
          organizationId,
          userId: existingUser.id,
          deletedAt: null,
        },
      });

      if (existingMember) {
        throw new ConflictException('User is already a member');
      }
    }

    // Generate invitation token
    const token = this.hashService.generateRandomToken();

    // Store invitation in Redis (expires in 7 days)
    await this.redis.setex(
      `org:invite:${token}`,
      7 * 24 * 60 * 60,
      JSON.stringify({
        organizationId,
        email: dto.email.toLowerCase(),
        role: dto.role || OrganizationRole.MEMBER,
        permissions: dto.permissions || [],
        invitedBy: requesterId,
      }),
    );

    // Emit invitation created event
    this.eventEmitter.emit('organization.invitationCreated', {
      organizationId,
      organizationName: organization.name,
      email: dto.email,
      token,
      invitedBy: requesterId,
    });
  }

  async acceptInvitation(token: string, userId: string): Promise<OrganizationMemberResponseDto> {
    const invitationData = await this.redis.get(`org:invite:${token}`);

    if (!invitationData) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    const invitation = JSON.parse(invitationData);

    // Verify user email matches invitation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email.toLowerCase() !== invitation.email) {
      throw new ForbiddenException('Invitation is for a different email');
    }

    // Create membership
    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId: invitation.organizationId,
        userId,
        role: invitation.role,
        permissions: invitation.permissions,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Delete invitation
    await this.redis.del(`org:invite:${token}`);

    // Emit invitation accepted event
    this.eventEmitter.emit('organization.invitationAccepted', {
      organizationId: invitation.organizationId,
      userId,
    });

    return this.mapMemberToResponse(member);
  }

  async getStats(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationStatsDto> {
    await this.checkMemberPermission(organizationId, userId, OrganizationRole.MEMBER);

    const [membersCount, jobStats, ratings] = await Promise.all([
      this.prisma.organizationMember.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.job.groupBy({
        by: ['status'],
        where: { organizationId, deletedAt: null },
        _count: true,
        _sum: { budget: true },
      }),
      this.prisma.rating.aggregate({
        where: {
          job: { organizationId },
        },
        _avg: { score: true },
      }),
    ]);

    const activeJobs =
      jobStats.find((s) => s.status === JobStatus.IN_PROGRESS)?._count || 0;
    const completedJobs =
      jobStats.find((s) => s.status === JobStatus.COMPLETED)?._count || 0;
    const totalSpent = jobStats.reduce(
      (sum, s) => sum + (s._sum.budget?.toNumber() || 0),
      0,
    );

    return {
      totalMembers: membersCount,
      activeJobs,
      completedJobs,
      totalSpent,
      averageJobRating: ratings._avg.score || 0,
    };
  }

  async getUserOrganizations(userId: string): Promise<OrganizationResponseDto[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        organization: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
    });

    return memberships
      .filter((m) => m.organization && !m.organization.deletedAt)
      .map((m) => this.mapOrganizationToResponse(m.organization!));
  }

  private async checkMemberPermission(
    organizationId: string,
    userId: string,
    requiredRole: OrganizationRole,
  ): Promise<void> {
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        deletedAt: null,
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    const roleHierarchy: Record<OrganizationRole, number> = {
      [OrganizationRole.OWNER]: 4,
      [OrganizationRole.ADMIN]: 3,
      [OrganizationRole.MANAGER]: 2,
      [OrganizationRole.MEMBER]: 1,
    };

    if (roleHierarchy[member.role] < roleHierarchy[requiredRole]) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  private mapOrganizationToResponse(org: any): OrganizationResponseDto {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      status: org.status,
      description: org.description || undefined,
      logo: org.logo || undefined,
      website: org.website || undefined,
      phone: org.phone || undefined,
      email: org.email || undefined,
      address: org.address || undefined,
      timezone: org.timezone || undefined,
      settings: org.settings || undefined,
      membersCount: org._count?.members || 0,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  private mapMemberToResponse(member: any): OrganizationMemberResponseDto {
    return {
      id: member.id,
      userId: member.userId,
      organizationId: member.organizationId,
      role: member.role,
      permissions: member.permissions,
      user: member.user,
      joinedAt: member.createdAt,
    };
  }
}
