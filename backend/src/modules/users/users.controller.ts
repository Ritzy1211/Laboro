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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
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
import { PaginationDto } from '../../common/dto';
import { CurrentUser, Roles, Permissions } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard, PermissionsGuard } from '../../common/guards';
import { Role, UserStatus } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ENTERPRISE_ADMIN)
  @Permissions('users:create')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ENTERPRISE_ADMIN)
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  @ApiQuery({ name: 'organizationId', required: false })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.usersService.findAll(pagination, {
      role,
      status,
      organizationId,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserWithWorkerProfileDto })
  async getMe(@CurrentUser('id') userId: string): Promise<UserWithWorkerProfileDto> {
    return this.usersService.findById(userId);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get current user statistics' })
  @ApiResponse({ status: 200, type: UserStatsDto })
  async getMyStats(@CurrentUser('id') userId: string): Promise<UserStatsDto> {
    return this.usersService.getUserStats(userId);
  }

  @Get('me/availability')
  @ApiOperation({ summary: 'Get current user availability' })
  @ApiResponse({ status: 200, type: [AvailabilityWindowResponseDto] })
  async getMyAvailability(
    @CurrentUser('id') userId: string,
  ): Promise<AvailabilityWindowResponseDto[]> {
    return this.usersService.getAvailability(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(userId, dto);
  }

  @Patch('me/worker-profile')
  @Roles(Role.WORKER)
  @ApiOperation({ summary: 'Update worker profile' })
  async updateMyWorkerProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkerProfileDto,
  ) {
    return this.usersService.updateWorkerProfile(userId, dto);
  }

  @Post('me/availability')
  @Roles(Role.WORKER)
  @ApiOperation({ summary: 'Set availability windows' })
  @ApiResponse({ status: 201, type: [AvailabilityWindowResponseDto] })
  async setMyAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: SetAvailabilityDto,
  ): Promise<AvailabilityWindowResponseDto[]> {
    return this.usersService.setAvailability(userId, dto);
  }

  @Get('workers/available')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get available workers' })
  @ApiQuery({ name: 'startTime', required: true })
  @ApiQuery({ name: 'endTime', required: true })
  @ApiQuery({ name: 'timezone', required: false })
  async getAvailableWorkers(
    @Query() pagination: PaginationDto,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.usersService.getAvailableWorkers(
      new Date(startTime),
      new Date(endTime),
      timezone || 'UTC',
      pagination,
    );
  }

  @Get('workers/by-skills')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get workers by skills' })
  @ApiQuery({ name: 'skills', isArray: true })
  async getWorkersBySkills(
    @Query() pagination: PaginationDto,
    @Query('skills') skills: string | string[],
  ) {
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    return this.usersService.getWorkersBySkills(skillsArray, pagination);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ENTERPRISE_ADMIN)
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserWithWorkerProfileDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserWithWorkerProfileDto> {
    return this.usersService.findById(id);
  }

  @Get(':id/stats')
  @Roles(Role.SUPER_ADMIN, Role.ENTERPRISE_ADMIN)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, type: UserStatsDto })
  async getUserStats(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserStatsDto> {
    return this.usersService.getUserStats(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get user availability' })
  @ApiResponse({ status: 200, type: [AvailabilityWindowResponseDto] })
  async getUserAvailability(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AvailabilityWindowResponseDto[]> {
    return this.usersService.getAvailability(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ENTERPRISE_ADMIN)
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ENTERPRISE_ADMIN)
  @Permissions('users:update')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @Permissions('users:delete')
  @ApiOperation({ summary: 'Delete user (Soft delete)' })
  @ApiResponse({ status: 204 })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.delete(id);
  }
}
