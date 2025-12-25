import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ASSIGN = 'ASSIGN',
  UNASSIGN = 'UNASSIGN',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',
  API_ACCESS = 'API_ACCESS',
}

export enum AuditResource {
  USER = 'USER',
  ORGANIZATION = 'ORGANIZATION',
  JOB = 'JOB',
  TASK = 'TASK',
  PAYMENT = 'PAYMENT',
  INVOICE = 'INVOICE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  RATING = 'RATING',
  MATCH = 'MATCH',
  SKILL = 'SKILL',
  NOTIFICATION = 'NOTIFICATION',
  SETTINGS = 'SETTINGS',
  API_KEY = 'API_KEY',
  REPORT = 'REPORT',
  EXPORT = 'EXPORT',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export class CreateAuditLogDto {
  @ApiProperty({ enum: AuditAction })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({ enum: AuditResource })
  @IsEnum(AuditResource)
  resource: AuditResource;

  @ApiPropertyOptional({ description: 'Resource ID affected' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'User ID who performed the action' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Organization context' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ enum: AuditSeverity, default: AuditSeverity.INFO })
  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @ApiPropertyOptional({ description: 'Action description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Previous state (for updates)' })
  @IsObject()
  @IsOptional()
  previousState?: Record<string, any>;

  @ApiPropertyOptional({ description: 'New state (for updates)' })
  @IsObject()
  @IsOptional()
  newState?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Request metadata' })
  @IsObject()
  @IsOptional()
  metadata?: AuditMetadataDto;
}

export class AuditMetadataDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  method?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  additionalData?: Record<string, any>;
}

export class AuditFilterDto {
  @ApiPropertyOptional({ enum: AuditAction, isArray: true })
  @IsEnum(AuditAction, { each: true })
  @IsOptional()
  actions?: AuditAction[];

  @ApiPropertyOptional({ enum: AuditResource, isArray: true })
  @IsEnum(AuditResource, { each: true })
  @IsOptional()
  resources?: AuditResource[];

  @ApiPropertyOptional({ description: 'User ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Resource ID' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({ enum: AuditSeverity, isArray: true })
  @IsEnum(AuditSeverity, { each: true })
  @IsOptional()
  severities?: AuditSeverity[];

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Search in description' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class ExportAuditLogsDto {
  @ApiPropertyOptional({ description: 'Export format', default: 'csv' })
  @IsString()
  @IsOptional()
  format?: 'csv' | 'json' | 'xlsx';

  @ApiProperty({ description: 'Start date for export' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for export' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ enum: AuditAction, isArray: true })
  @IsEnum(AuditAction, { each: true })
  @IsOptional()
  actions?: AuditAction[];

  @ApiPropertyOptional({ enum: AuditResource, isArray: true })
  @IsEnum(AuditResource, { each: true })
  @IsOptional()
  resources?: AuditResource[];

  @ApiPropertyOptional({ description: 'Include metadata in export' })
  @IsBoolean()
  @IsOptional()
  includeMetadata?: boolean;
}

export class RetentionPolicyDto {
  @ApiProperty({ description: 'Retention period in days' })
  retentionDays: number;

  @ApiPropertyOptional({ description: 'Archive instead of delete' })
  @IsBoolean()
  @IsOptional()
  archiveInsteadOfDelete?: boolean;

  @ApiPropertyOptional({ description: 'Exclude certain severities', enum: AuditSeverity, isArray: true })
  @IsEnum(AuditSeverity, { each: true })
  @IsOptional()
  excludeSeverities?: AuditSeverity[];
}
