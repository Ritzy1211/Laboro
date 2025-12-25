import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
import {
  CreateSkillDto,
  UpdateSkillDto,
  AddUserSkillDto,
  UpdateUserSkillDto,
  SkillSearchDto,
  SkillCategory,
} from './dto/skill.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class SkillsService {
  private readonly CACHE_PREFIX = 'skills:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== SKILL CRUD ====================

  async create(dto: CreateSkillDto) {
    // Check for duplicate name in same category
    const existing = await this.prisma.skill.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
        category: dto.category,
      },
    });

    if (existing) {
      throw new ConflictException('Skill already exists in this category');
    }

    // Validate parent if provided
    if (dto.parentId) {
      const parent = await this.prisma.skill.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent skill not found');
      }
    }

    const skill = await this.prisma.skill.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        parentId: dto.parentId,
        metadata: dto.tags ? { tags: dto.tags } : undefined,
        isVerified: dto.isVerified ?? false,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    await this.invalidateCache();

    this.eventEmitter.emit('skill.created', { skill });

    return skill;
  }

  async findAll(pagination: PaginationDto, search?: SkillSearchDto) {
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify({ pagination, search })}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = {};

    if (search?.query) {
      where.OR = [
        { name: { contains: search.query, mode: 'insensitive' } },
        { description: { contains: search.query, mode: 'insensitive' } },
      ];
    }

    if (search?.category) {
      where.category = search.category;
    }

    if (search?.verifiedOnly) {
      where.isVerified = true;
    }

    if (!search?.includeChildren) {
      where.parentId = null;
    }

    const [skills, total] = await Promise.all([
      this.prisma.skill.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { name: 'asc' },
        include: {
          children: true,
          _count: {
            select: { userSkills: true },
          },
        },
      }),
      this.prisma.skill.count({ where }),
    ]);

    const result = {
      data: skills.map((skill) => ({
        ...skill,
        usageCount: skill._count.userSkills,
      })),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            _count: { select: { userSkills: true } },
          },
        },
        _count: {
          select: { userSkills: true },
        },
      },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    const result = {
      ...skill,
      usageCount: skill._count.userSkills,
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findByCategory(category: SkillCategory) {
    const cacheKey = `${this.CACHE_PREFIX}category:${category}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skills = await this.prisma.skill.findMany({
      where: { category, parentId: null },
      orderBy: { name: 'asc' },
      include: {
        children: true,
        _count: { select: { userSkills: true } },
      },
    });

    const result = skills.map((skill) => ({
      ...skill,
      usageCount: skill._count.userSkills,
    }));

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async update(id: string, dto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (dto.name && dto.name !== skill.name) {
      const duplicate = await this.prisma.skill.findFirst({
        where: {
          name: { equals: dto.name, mode: 'insensitive' },
          category: dto.category ?? skill.category,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException('Skill name already exists in this category');
      }
    }

    // Prevent circular parent reference
    if (dto.parentId === id) {
      throw new BadRequestException('Skill cannot be its own parent');
    }

    const updatedSkill = await this.prisma.skill.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        parentId: dto.parentId,
        metadata: dto.tags ? { tags: dto.tags } : undefined,
        isVerified: dto.isVerified,
      },
      include: {
        parent: true,
        children: true,
      },
    });

    await this.invalidateCache();

    this.eventEmitter.emit('skill.updated', { skill: updatedSkill });

    return updatedSkill;
  }

  async remove(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: { _count: { select: { userSkills: true, children: true } } },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill._count.userSkills > 0) {
      throw new BadRequestException('Cannot delete skill with active users');
    }

    if (skill._count.children > 0) {
      throw new BadRequestException('Cannot delete skill with child skills');
    }

    await this.prisma.skill.delete({ where: { id } });
    await this.invalidateCache();

    this.eventEmitter.emit('skill.deleted', { skillId: id });
  }

  // ==================== USER SKILLS ====================

  async addUserSkill(userId: string, dto: AddUserSkillDto) {
    // Check skill exists
    const skill = await this.prisma.skill.findUnique({
      where: { id: dto.skillId },
    });
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    // Check for duplicate
    const existing = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId: dto.skillId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User already has this skill');
    }

    const userSkill = await this.prisma.userSkill.create({
      data: {
        userId,
        skillId: dto.skillId,
        proficiencyLevel: dto.proficiencyLevel,
        yearsOfExperience: dto.yearsOfExperience,
        isVerified: dto.isVerified ?? false,
        metadata: {
          certificationUrl: dto.certificationUrl,
          notes: dto.notes,
        },
      },
      include: {
        skill: true,
      },
    });

    await this.redis.del(`user:${userId}:skills`);

    this.eventEmitter.emit('user.skill.added', { userId, userSkill });

    return userSkill;
  }

  async updateUserSkill(userId: string, skillId: string, dto: UpdateUserSkillDto) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: { userId, skillId },
      },
    });

    if (!userSkill) {
      throw new NotFoundException('User skill not found');
    }

    const updated = await this.prisma.userSkill.update({
      where: {
        userId_skillId: { userId, skillId },
      },
      data: {
        proficiencyLevel: dto.proficiencyLevel,
        yearsOfExperience: dto.yearsOfExperience,
        isVerified: dto.isVerified,
        metadata: {
          certificationUrl: dto.certificationUrl,
          notes: dto.notes,
        },
      },
      include: {
        skill: true,
      },
    });

    await this.redis.del(`user:${userId}:skills`);

    this.eventEmitter.emit('user.skill.updated', { userId, userSkill: updated });

    return updated;
  }

  async removeUserSkill(userId: string, skillId: string) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: { userId, skillId },
      },
    });

    if (!userSkill) {
      throw new NotFoundException('User skill not found');
    }

    await this.prisma.userSkill.delete({
      where: {
        userId_skillId: { userId, skillId },
      },
    });

    await this.redis.del(`user:${userId}:skills`);

    this.eventEmitter.emit('user.skill.removed', { userId, skillId });
  }

  async getUserSkills(userId: string) {
    const cacheKey = `user:${userId}:skills`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: {
          include: {
            parent: true,
          },
        },
      },
      orderBy: [
        { proficiencyLevel: 'desc' },
        { yearsOfExperience: 'desc' },
      ],
    });

    await this.redis.set(cacheKey, userSkills, 1800); // 30 minutes

    return userSkills;
  }

  // ==================== SKILL ANALYTICS ====================

  async getPopularSkills(limit: number = 20) {
    const cacheKey = `${this.CACHE_PREFIX}popular:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    const skills = await this.prisma.skill.findMany({
      take: limit,
      orderBy: {
        userSkills: { _count: 'desc' },
      },
      include: {
        _count: { select: { userSkills: true } },
        userSkills: {
          select: { yearsOfExperience: true },
        },
      },
    });

    const result = skills.map((skill) => {
      const totalYears = skill.userSkills.reduce(
        (sum, us) => sum + (us.yearsOfExperience ?? 0),
        0,
      );
      const avgExperience = skill.userSkills.length > 0
        ? totalYears / skill.userSkills.length
        : 0;

      return {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        totalUsers: skill._count.userSkills,
        averageExperience: Math.round(avgExperience * 10) / 10,
      };
    });

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async getSkillDemand() {
    const cacheKey = `${this.CACHE_PREFIX}demand`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get skills requested in jobs vs available in users
    const [jobSkills, userSkills] = await Promise.all([
      this.prisma.jobSkill.groupBy({
        by: ['skillId'],
        _count: { skillId: true },
      }),
      this.prisma.userSkill.groupBy({
        by: ['skillId'],
        _count: { skillId: true },
      }),
    ]);

    const jobSkillMap = new Map(
      jobSkills.map((js) => [js.skillId, js._count.skillId]),
    );
    const userSkillMap = new Map(
      userSkills.map((us) => [us.skillId, us._count.skillId]),
    );

    const allSkillIds = new Set([
      ...jobSkillMap.keys(),
      ...userSkillMap.keys(),
    ]);

    const skills = await this.prisma.skill.findMany({
      where: { id: { in: Array.from(allSkillIds) } },
    });

    const result = skills.map((skill) => {
      const demand = jobSkillMap.get(skill.id) ?? 0;
      const supply = userSkillMap.get(skill.id) ?? 0;
      const demandScore = supply > 0 ? demand / supply : demand;

      return {
        id: skill.id,
        name: skill.name,
        category: skill.category,
        demand,
        supply,
        demandScore: Math.round(demandScore * 100) / 100,
        gap: demand - supply,
      };
    });

    result.sort((a, b) => b.demandScore - a.demandScore);

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async suggestSkills(userId: string, limit: number = 10) {
    // Get user's current skills
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId },
      select: { skillId: true },
    });

    const userSkillIds = userSkills.map((us) => us.skillId);

    // Find related skills based on users with similar profiles
    const similarUsers = await this.prisma.userSkill.findMany({
      where: {
        skillId: { in: userSkillIds },
        userId: { not: userId },
      },
      select: { userId: true },
      distinct: ['userId'],
      take: 100,
    });

    const similarUserIds = similarUsers.map((u) => u.userId);

    // Get skills from similar users that current user doesn't have
    const suggestedSkills = await this.prisma.userSkill.groupBy({
      by: ['skillId'],
      where: {
        userId: { in: similarUserIds },
        skillId: { notIn: userSkillIds },
      },
      _count: { skillId: true },
      orderBy: { _count: { skillId: 'desc' } },
      take: limit,
    });

    const skillIds = suggestedSkills.map((s) => s.skillId);
    const skills = await this.prisma.skill.findMany({
      where: { id: { in: skillIds } },
    });

    return suggestedSkills.map((s) => ({
      skill: skills.find((sk) => sk.id === s.skillId),
      relevanceScore: s._count.skillId,
    }));
  }

  // ==================== HELPERS ====================

  private async invalidateCache() {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redis.del(key)));
    }
  }
}
