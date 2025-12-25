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
  ApiQuery,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
  UpdateMemberDto,
  InviteMemberDto,
  BulkInviteMembersDto,
  OrganizationResponseDto,
  OrganizationMemberResponseDto,
  OrganizationStatsDto,
} from './dto';
import { PaginationDto } from '../../common/dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Role, OrganizationStatus } from '@prisma/client';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, type: OrganizationResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.create(userId, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all organizations (Admin only)' })
  @ApiQuery({ name: 'status', enum: OrganizationStatus, required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: OrganizationStatus,
    @Query('type') type?: string,
  ) {
    return this.organizationsService.findAll(pagination, { status, type });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user organizations' })
  @ApiResponse({ status: 200, type: [OrganizationResponseDto] })
  async getMyOrganizations(
    @CurrentUser('id') userId: string,
  ): Promise<OrganizationResponseDto[]> {
    return this.organizationsService.getUserOrganizations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.findBySlug(slug);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get organization statistics' })
  @ApiResponse({ status: 200, type: OrganizationStatsDto })
  async getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<OrganizationStatsDto> {
    return this.organizationsService.getStats(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, type: OrganizationResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete organization (soft delete)' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.organizationsService.delete(id, userId);
  }

  // Member endpoints
  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.organizationsService.getMembers(id, pagination);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to organization' })
  @ApiResponse({ status: 201, type: OrganizationMemberResponseDto })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddMemberDto,
  ): Promise<OrganizationMemberResponseDto> {
    return this.organizationsService.addMember(id, userId, dto);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update member role/permissions' })
  @ApiResponse({ status: 200, type: OrganizationMemberResponseDto })
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMemberDto,
  ): Promise<OrganizationMemberResponseDto> {
    return this.organizationsService.updateMember(id, memberId, userId, dto);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member from organization' })
  @ApiResponse({ status: 204 })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    return this.organizationsService.removeMember(id, memberId, userId);
  }

  // Invitation endpoints
  @Post(':id/invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invite user to organization by email' })
  @ApiResponse({ status: 200 })
  async inviteMember(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteMemberDto,
  ): Promise<{ message: string }> {
    await this.organizationsService.inviteMember(id, userId, dto);
    return { message: 'Invitation sent successfully' };
  }

  @Post(':id/invite/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk invite users to organization' })
  @ApiResponse({ status: 200 })
  async bulkInviteMembers(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: BulkInviteMembersDto,
  ): Promise<{ message: string; count: number }> {
    for (const invitation of dto.invitations) {
      await this.organizationsService.inviteMember(id, userId, invitation);
    }
    return {
      message: 'Invitations sent successfully',
      count: dto.invitations.length,
    };
  }

  @Post('accept-invitation/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept organization invitation' })
  @ApiResponse({ status: 200, type: OrganizationMemberResponseDto })
  async acceptInvitation(
    @Param('token') token: string,
    @CurrentUser('id') userId: string,
  ): Promise<OrganizationMemberResponseDto> {
    return this.organizationsService.acceptInvitation(token, userId);
  }
}
