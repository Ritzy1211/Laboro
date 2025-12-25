import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
  MaxLength,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { OrganizationStatus, OrganizationType, OrganizationRole } from '@prisma/client';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  slug?: string;

  @ApiPropertyOptional({ enum: OrganizationType })
  @IsOptional()
  @IsEnum(OrganizationType)
  type?: OrganizationType = OrganizationType.BUSINESS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  address?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {
  @ApiPropertyOptional({ enum: OrganizationStatus })
  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;
}

export class AddMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ enum: OrganizationRole })
  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole = OrganizationRole.MEMBER;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: OrganizationRole })
  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class InviteMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: OrganizationRole })
  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole = OrganizationRole.MEMBER;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}

export class BulkInviteMembersDto {
  @ApiProperty({ type: [InviteMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InviteMemberDto)
  invitations: InviteMemberDto[];
}
