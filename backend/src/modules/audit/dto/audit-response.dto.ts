import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditResource, AuditSeverity, AuditMetadataDto } from './audit.dto';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ enum: AuditResource })
  resource: AuditResource;

  @ApiPropertyOptional()
  resourceId?: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  organizationId?: string;

  @ApiProperty({ enum: AuditSeverity })
  severity: AuditSeverity;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  previousState?: Record<string, any>;

  @ApiPropertyOptional()
  newState?: Record<string, any>;

  @ApiPropertyOptional({ type: () => AuditMetadataDto })
  metadata?: AuditMetadataDto;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: () => AuditUserDto })
  user?: AuditUserDto;

  @ApiPropertyOptional({ type: () => AuditOrganizationDto })
  organization?: AuditOrganizationDto;
}

export class AuditUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

export class AuditOrganizationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class AuditSummaryDto {
  @ApiProperty()
  totalLogs: number;

  @ApiProperty()
  byAction: Record<AuditAction, number>;

  @ApiProperty()
  byResource: Record<AuditResource, number>;

  @ApiProperty()
  bySeverity: Record<AuditSeverity, number>;

  @ApiProperty()
  topUsers: AuditUserActivityDto[];

  @ApiProperty()
  recentActivity: AuditLogResponseDto[];

  @ApiProperty()
  period: string;
}

export class AuditUserActivityDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  actionCount: number;

  @ApiProperty()
  lastAction: Date;
}

export class AuditTimelineDto {
  @ApiProperty()
  resourceId: string;

  @ApiProperty({ enum: AuditResource })
  resourceType: AuditResource;

  @ApiProperty({ type: [AuditTimelineEventDto] })
  events: AuditTimelineEventDto[];

  @ApiProperty()
  totalEvents: number;
}

export class AuditTimelineEventDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AuditAction })
  action: AuditAction;

  @ApiProperty()
  description: string;

  @ApiProperty()
  timestamp: Date;

  @ApiPropertyOptional({ type: () => AuditUserDto })
  user?: AuditUserDto;

  @ApiPropertyOptional()
  changes?: AuditChangeDto[];
}

export class AuditChangeDto {
  @ApiProperty()
  field: string;

  @ApiPropertyOptional()
  oldValue?: any;

  @ApiPropertyOptional()
  newValue?: any;
}

export class ComplianceReportDto {
  @ApiProperty()
  reportId: string;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    criticalEvents: number;
    dataAccessEvents: number;
  };

  @ApiProperty()
  accessPatterns: {
    byHour: number[];
    byDayOfWeek: number[];
    peakHours: string[];
  };

  @ApiProperty()
  securityEvents: {
    failedLogins: number;
    permissionChanges: number;
    dataExports: number;
    apiAccess: number;
  };

  @ApiProperty()
  dataRetention: {
    oldestLog: Date;
    totalSize: string;
    archivedLogs: number;
  };
}

export class AuditExportResultDto {
  @ApiProperty()
  exportId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  format: string;

  @ApiProperty()
  recordCount: number;

  @ApiProperty()
  fileSize: string;

  @ApiProperty()
  downloadUrl: string;

  @ApiProperty()
  expiresAt: Date;
}
