import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma';
import { RedisService } from '../../common/redis';
import { Public } from '../../common/decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200 })
  async check() {
    const checks = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.services.database = 'healthy';
    } catch (error) {
      checks.services.database = 'unhealthy';
      checks.status = 'degraded';
    }

    // Check Redis
    try {
      await this.redis.set('health:check', Date.now().toString());
      await this.redis.del('health:check');
      checks.services.redis = 'healthy';
    } catch (error) {
      checks.services.redis = 'unhealthy';
      checks.status = 'degraded';
    }

    return checks;
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200 })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      await this.redis.set('health:ready', Date.now().toString());
      await this.redis.del('health:ready');

      return {
        ready: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        ready: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200 })
  live() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
    };
  }
}
