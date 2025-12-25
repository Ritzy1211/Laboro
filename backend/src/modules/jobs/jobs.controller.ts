import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
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
import { PaginationDto } from '../../common/dto';
import { CurrentUser, Roles, Permissions } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard, PermissionsGuard } from '../../common/guards';
import { Role } from '@prisma/client';

@ApiTags('Jobs')
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({ status: 201, type: JobDetailResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobDto,
  ): Promise<JobDetailResponseDto> {
    return this.jobsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs with filtering' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Query() pagination: PaginationDto,
    @Query() filters: JobFilterDto,
  ) {
    return this.jobsService.findAll(pagination, filters, userId, userRole);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job statistics' })
  @ApiResponse({ status: 200, type: JobStatsDto })
  async getStats(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Query('organizationId') organizationId?: string,
  ): Promise<JobStatsDto> {
    return this.jobsService.getJobStats(userId, userRole, organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, type: JobDetailResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<JobDetailResponseDto> {
    return this.jobsService.findById(id, userId);
  }

  @Patch(':id')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, type: JobDetailResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: UpdateJobDto,
  ): Promise<JobDetailResponseDto> {
    return this.jobsService.update(id, userId, dto, userRole);
  }

  @Delete(':id')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete job (soft delete)' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<void> {
    return this.jobsService.delete(id, userId, userRole);
  }

  @Post(':id/publish')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft job' })
  @ApiResponse({ status: 200, type: JobDetailResponseDto })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<JobDetailResponseDto> {
    return this.jobsService.publishJob(id, userId);
  }

  @Post(':id/cancel')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiResponse({ status: 200, type: JobDetailResponseDto })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ): Promise<JobDetailResponseDto> {
    return this.jobsService.cancelJob(id, userId, reason);
  }

  // Task endpoints
  @Post(':id/tasks')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add task to job' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  async addTask(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.jobsService.addTask(jobId, dto);
  }

  @Patch(':id/tasks/:taskId')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN, Role.WORKER)
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async updateTask(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.jobsService.updateTask(jobId, taskId, dto);
  }

  @Delete(':id/tasks/:taskId')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 204 })
  async deleteTask(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<void> {
    return this.jobsService.deleteTask(jobId, taskId);
  }
}
