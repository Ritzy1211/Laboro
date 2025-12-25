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
import { NotificationsService } from './notifications.service';
import {
  NotificationFilterDto,
  UpdateNotificationPreferencesDto,
  NotificationResponseDto,
  NotificationCountDto,
  NotificationPreferencesDto,
} from './dto';
import { PaginationDto } from '../../common/dto';
import { CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: NotificationFilterDto,
  ) {
    return this.notificationsService.findAll(userId, pagination, filters);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get notification counts' })
  @ApiResponse({ status: 200, type: NotificationCountDto })
  async getCount(
    @CurrentUser('id') userId: string,
  ): Promise<NotificationCountDto> {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesDto })
  async getPreferences(
    @CurrentUser('id') userId: string,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationsService.getPreferences(userId);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, type: NotificationPreferencesDto })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.notificationsService.updatePreferences(userId, dto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, type: NotificationResponseDto })
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200 })
  async markAllAsRead(
    @CurrentUser('id') userId: string,
  ): Promise<{ count: number }> {
    const count = await this.notificationsService.markAllAsRead(userId);
    return { count };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.notificationsService.delete(id, userId);
  }
}
