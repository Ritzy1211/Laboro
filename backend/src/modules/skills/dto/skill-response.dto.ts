import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SkillCategory, ProficiencyLevel } from './skill.dto';

export class SkillResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: SkillCategory })
  category: SkillCategory;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  usageCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => [SkillResponseDto] })
  children?: SkillResponseDto[];

  @ApiPropertyOptional({ type: () => SkillResponseDto })
  parent?: SkillResponseDto;
}

export class UserSkillResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  skillId: string;

  @ApiProperty({ enum: ProficiencyLevel })
  proficiencyLevel: ProficiencyLevel;

  @ApiPropertyOptional()
  yearsOfExperience?: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional()
  certificationUrl?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  endorsementCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => SkillResponseDto })
  skill: SkillResponseDto;
}

export class SkillEndorsementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userSkillId: string;

  @ApiProperty()
  endorserId: string;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty()
  createdAt: Date;
}

export class PopularSkillResponseDto {
  @ApiProperty()
  skill: SkillResponseDto;

  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  averageExperience: number;

  @ApiProperty()
  demandScore: number;
}
