import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationStatus, OrganizationType, OrganizationRole } from '@prisma/client';

export class OrganizationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: OrganizationType })
  type: OrganizationType;

  @ApiProperty({ enum: OrganizationStatus })
  status: OrganizationStatus;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  logo?: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  address?: Record<string, any>;

  @ApiPropertyOptional()
  timezone?: string;

  @ApiPropertyOptional()
  settings?: Record<string, any>;

  @ApiProperty()
  membersCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OrganizationMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ enum: OrganizationRole })
  role: OrganizationRole;

  @ApiPropertyOptional()
  permissions?: string[];

  @ApiPropertyOptional()
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };

  @ApiProperty()
  joinedAt: Date;
}

export class OrganizationInvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: OrganizationRole })
  role: OrganizationRole;

  @ApiProperty()
  status: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class OrganizationStatsDto {
  @ApiProperty()
  totalMembers: number;

  @ApiProperty()
  activeJobs: number;

  @ApiProperty()
  completedJobs: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  averageJobRating: number;
}
