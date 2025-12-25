import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum SkillCategory {
  TECHNICAL = 'TECHNICAL',
  PROFESSIONAL = 'PROFESSIONAL',
  LANGUAGE = 'LANGUAGE',
  CERTIFICATION = 'CERTIFICATION',
  SOFT_SKILL = 'SOFT_SKILL',
  TRADE = 'TRADE',
  OTHER = 'OTHER',
}

export enum ProficiencyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export class CreateSkillDto {
  @ApiProperty({ description: 'Skill name', example: 'JavaScript' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Skill description' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: SkillCategory, example: SkillCategory.TECHNICAL })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiPropertyOptional({ description: 'Parent skill ID for hierarchical skills' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Related skill tags', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is this skill verified/official' })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}

export class AddUserSkillDto {
  @ApiProperty({ description: 'Skill ID' })
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @ApiProperty({ enum: ProficiencyLevel, example: ProficiencyLevel.INTERMEDIATE })
  @IsEnum(ProficiencyLevel)
  proficiencyLevel: ProficiencyLevel;

  @ApiPropertyOptional({ description: 'Years of experience', example: 3 })
  @IsInt()
  @Min(0)
  @Max(50)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Is this skill verified' })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Certification or proof URL' })
  @IsString()
  @IsOptional()
  certificationUrl?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class UpdateUserSkillDto extends PartialType(AddUserSkillDto) {}

export class SkillSearchDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({ enum: SkillCategory })
  @IsEnum(SkillCategory)
  @IsOptional()
  category?: SkillCategory;

  @ApiPropertyOptional({ description: 'Include child skills' })
  @IsBoolean()
  @IsOptional()
  includeChildren?: boolean;

  @ApiPropertyOptional({ description: 'Only verified skills' })
  @IsBoolean()
  @IsOptional()
  verifiedOnly?: boolean;
}
