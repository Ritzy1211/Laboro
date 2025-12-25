import {
  Controller,
  Get,
  Post,
  Put,
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
import { AvailabilityService } from './availability.service';
import {
  CreateAvailabilityWindowDto,
  UpdateAvailabilityWindowDto,
  BulkAvailabilityDto,
  AvailabilityQueryDto,
  CheckAvailabilityDto,
  FindAvailableWorkersDto,
} from './dto/availability.dto';
import {
  AvailabilityWindowResponseDto,
  WeeklyAvailabilityResponseDto,
  AvailabilityCheckResponseDto,
  AvailableWorkerResponseDto,
  AvailabilitySlotResponseDto,
} from './dto/availability-response.dto';
import { CurrentUser, Timezone } from '@/common/decorators/user.decorators';

@ApiTags('Availability')
@ApiBearerAuth()
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ==================== AVAILABILITY WINDOWS ====================

  @Post()
  @ApiOperation({ summary: 'Create an availability window' })
  @ApiResponse({ status: 201, type: AvailabilityWindowResponseDto })
  async createWindow(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAvailabilityWindowDto,
  ) {
    return this.availabilityService.createWindow(userId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple availability windows' })
  @ApiResponse({ status: 201, type: [AvailabilityWindowResponseDto] })
  async bulkCreate(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkAvailabilityDto,
  ) {
    return this.availabilityService.bulkCreate(userId, dto);
  }

  @Get('windows')
  @ApiOperation({ summary: 'Get all availability windows for current user' })
  @ApiResponse({ status: 200, type: [AvailabilityWindowResponseDto] })
  async findUserWindows(@CurrentUser('id') userId: string) {
    return this.availabilityService.findUserWindows(userId);
  }

  @Get('windows/:id')
  @ApiOperation({ summary: 'Get specific availability window' })
  @ApiParam({ name: 'id', description: 'Window ID' })
  @ApiResponse({ status: 200, type: AvailabilityWindowResponseDto })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') windowId: string,
  ) {
    return this.availabilityService.findOne(userId, windowId);
  }

  @Put('windows/:id')
  @ApiOperation({ summary: 'Update an availability window' })
  @ApiParam({ name: 'id', description: 'Window ID' })
  @ApiResponse({ status: 200, type: AvailabilityWindowResponseDto })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') windowId: string,
    @Body() dto: UpdateAvailabilityWindowDto,
  ) {
    return this.availabilityService.update(userId, windowId, dto);
  }

  @Delete('windows/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an availability window' })
  @ApiParam({ name: 'id', description: 'Window ID' })
  @ApiResponse({ status: 204, description: 'Window deleted' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') windowId: string,
  ) {
    return this.availabilityService.remove(userId, windowId);
  }

  // ==================== AVAILABILITY QUERIES ====================

  @Get('schedule')
  @ApiOperation({ summary: 'Get availability schedule for date range' })
  @ApiResponse({ status: 200, type: [AvailabilitySlotResponseDto] })
  async getAvailability(
    @CurrentUser('id') userId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.availabilityService.getAvailability(userId, query);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get weekly availability overview' })
  @ApiQuery({ name: 'timezone', required: false })
  @ApiResponse({ status: 200, type: WeeklyAvailabilityResponseDto })
  async getWeeklyAvailability(
    @CurrentUser('id') userId: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.availabilityService.getWeeklyAvailability(userId, timezone);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if user is available at specific time' })
  @ApiResponse({ status: 200, type: AvailabilityCheckResponseDto })
  async checkAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.availabilityService.checkAvailability(userId, dto);
  }

  @Get('user/:userId/schedule')
  @ApiOperation({ summary: 'Get availability schedule for another user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: [AvailabilitySlotResponseDto] })
  async getUserAvailability(
    @Param('userId') userId: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.availabilityService.getAvailability(userId, query);
  }

  @Get('user/:userId/weekly')
  @ApiOperation({ summary: 'Get weekly availability for another user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'timezone', required: false })
  @ApiResponse({ status: 200, type: WeeklyAvailabilityResponseDto })
  async getUserWeeklyAvailability(
    @Param('userId') userId: string,
    @Query('timezone') timezone?: string,
  ) {
    return this.availabilityService.getWeeklyAvailability(userId, timezone);
  }

  @Post('user/:userId/check')
  @ApiOperation({ summary: 'Check if another user is available at specific time' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: AvailabilityCheckResponseDto })
  async checkUserAvailability(
    @Param('userId') userId: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.availabilityService.checkAvailability(userId, dto);
  }

  // ==================== WORKER SEARCH ====================

  @Post('workers/search')
  @ApiOperation({ summary: 'Find available workers for a time slot' })
  @ApiResponse({ status: 200, type: [AvailableWorkerResponseDto] })
  async findAvailableWorkers(@Body() dto: FindAvailableWorkersDto) {
    return this.availabilityService.findAvailableWorkers(dto);
  }
}
