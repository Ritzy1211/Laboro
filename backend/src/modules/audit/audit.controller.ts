import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import {
  AuditFilterDto,
  ExportAuditLogsDto,
  RetentionPolicyDto,
  AuditResource,
} from './dto/audit.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser, CurrentOrganization } from '@/common/decorators/user.decorators';
import { Roles } from '@/common/decorators/auth.decorators';
import { ApiPaginatedResponse } from '@/common/decorators/api.decorators';
import {
  AuditLogResponseDto,
  AuditSummaryDto,
  AuditTimelineDto,
  ComplianceReportDto,
  AuditExportResultDto,
} from './dto/audit-response.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiPaginatedResponse(AuditLogResponseDto)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filter: AuditFilterDto,
  ) {
    return this.auditService.findAll(pagination, filter);
  }

  @Get('logs/:id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({ status: 200, type: AuditLogResponseDto })
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }

  @Get('summary')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get audit summary' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, type: AuditSummaryDto })
  async getSummary(
    @CurrentOrganization() organizationId: string,
    @Query('days') days?: number,
  ) {
    return this.auditService.getSummary(organizationId, days);
  }

  @Get('timeline/:resource/:resourceId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get resource timeline' })
  @ApiParam({ name: 'resource', enum: AuditResource })
  @ApiParam({ name: 'resourceId', description: 'Resource ID' })
  @ApiResponse({ status: 200, type: AuditTimelineDto })
  async getResourceTimeline(
    @Param('resource') resource: AuditResource,
    @Param('resourceId') resourceId: string,
  ) {
    return this.auditService.getResourceTimeline(resource, resourceId);
  }

  @Get('user/:userId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get user activity' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiPaginatedResponse(AuditLogResponseDto)
  async getUserActivity(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.auditService.getUserActivity(userId, pagination);
  }

  @Get('organization/:organizationId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get organization activity' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiPaginatedResponse(AuditLogResponseDto)
  async getOrganizationActivity(
    @Param('organizationId') organizationId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.auditService.getOrganizationActivity(organizationId, pagination);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my activity' })
  @ApiPaginatedResponse(AuditLogResponseDto)
  async getMyActivity(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.auditService.getUserActivity(userId, pagination);
  }

  // ==================== COMPLIANCE ====================

  @Get('compliance-report')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  @ApiResponse({ status: 200, type: ComplianceReportDto })
  async getComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentOrganization() organizationId?: string,
  ) {
    return this.auditService.getComplianceReport(startDate, endDate, organizationId);
  }

  // ==================== EXPORT ====================

  @Post('export')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiResponse({ status: 200, type: AuditExportResultDto })
  async exportLogs(@Body() dto: ExportAuditLogsDto) {
    return this.auditService.exportLogs(dto);
  }

  // ==================== RETENTION ====================

  @Post('retention/apply')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Apply retention policy (Admin only)' })
  @ApiResponse({ status: 200, description: 'Retention policy applied' })
  async applyRetentionPolicy(@Body() dto: RetentionPolicyDto) {
    return this.auditService.applyRetentionPolicy(
      dto.retentionDays,
      dto.archiveInsteadOfDelete,
    );
  }
}
