import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  AssignTaskDto,
  BulkCreateTasksDto,
  UpdateChecklistDto,
  TaskFilterDto,
  TaskTimeLogDto,
} from './dto/task.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser } from '@/common/decorators/user.decorators';
import { ApiPaginatedResponse } from '@/common/decorators/api.decorators';
import {
  TaskResponseDto,
  TaskSummaryDto,
  TaskTimeLogResponseDto,
} from './dto/task-response.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple tasks' })
  @ApiResponse({ status: 201, type: [TaskResponseDto] })
  async bulkCreate(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkCreateTasksDto,
  ) {
    return this.tasksService.bulkCreate(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiPaginatedResponse(TaskResponseDto)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filter: TaskFilterDto,
  ) {
    return this.tasksService.findAll(pagination, filter);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my assigned tasks' })
  @ApiPaginatedResponse(TaskResponseDto)
  async findMyTasks(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
    @Query() filter: TaskFilterDto,
  ) {
    return this.tasksService.findMyTasks(userId, pagination, filter);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get task summary statistics' })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiResponse({ status: 200, type: TaskSummaryDto })
  async getTaskSummary(
    @Query('jobId') jobId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.tasksService.getTaskSummary(jobId, userId);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get all tasks for a job' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, type: [TaskResponseDto] })
  async findByJob(@Param('jobId') jobId: string) {
    return this.tasksService.findByJob(jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, userId, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(id, userId, dto);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign task to a worker' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async assign(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AssignTaskDto,
  ) {
    return this.tasksService.assign(id, userId, dto);
  }

  @Patch(':id/unassign')
  @ApiOperation({ summary: 'Unassign task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async unassign(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.unassign(id, userId);
  }

  @Patch(':id/checklist')
  @ApiOperation({ summary: 'Update checklist item' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  async updateChecklist(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateChecklistDto,
  ) {
    return this.tasksService.updateChecklist(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 204, description: 'Task deleted' })
  async remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  // ==================== TIME TRACKING ====================

  @Post(':id/time-log')
  @ApiOperation({ summary: 'Log time for a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 201, type: TaskTimeLogResponseDto })
  async logTime(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TaskTimeLogDto,
  ) {
    return this.tasksService.logTime(id, userId, dto);
  }

  @Get(':id/time-logs')
  @ApiOperation({ summary: 'Get time logs for a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, type: [TaskTimeLogResponseDto] })
  async getTimeLogs(@Param('id') id: string) {
    return this.tasksService.getTimeLogs(id);
  }
}
