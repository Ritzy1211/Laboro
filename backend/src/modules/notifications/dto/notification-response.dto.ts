import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationChannel } from './notification.dto';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional()
  actionUrl?: string;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationCountDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  unread: number;
}

export class NotificationPreferencesDto {
  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  pushEnabled: boolean;

  @ApiProperty()
  smsEnabled: boolean;

  @ApiProperty({ type: [String], enum: NotificationType })
  disabledTypes: NotificationType[];
}
