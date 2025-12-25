import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import {
  CreateSkillDto,
  UpdateSkillDto,
  AddUserSkillDto,
  UpdateUserSkillDto,
  SkillSearchDto,
  SkillCategory,
} from './dto/skill.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser } from '@/common/decorators/user.decorators';
import { Roles } from '@/common/decorators/auth.decorators';
import { ApiPaginatedResponse } from '@/common/decorators/api.decorators';
import { SkillResponseDto, UserSkillResponseDto, PopularSkillResponseDto } from './dto/skill-response.dto';

@ApiTags('Skills')
@ApiBearerAuth()
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // ==================== SKILL MANAGEMENT ====================

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new skill (Admin only)' })
  @ApiResponse({ status: 201, description: 'Skill created', type: SkillResponseDto })
  async create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all skills' })
  @ApiPaginatedResponse(SkillResponseDto)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() search: SkillSearchDto,
  ) {
    return this.skillsService.findAll(pagination, search);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all skill categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  getCategories() {
    return Object.values(SkillCategory);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get most popular skills' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [PopularSkillResponseDto] })
  async getPopularSkills(@Query('limit') limit?: number) {
    return this.skillsService.getPopularSkills(limit);
  }

  @Get('demand')
  @ApiOperation({ summary: 'Get skill demand analysis' })
  @ApiResponse({ status: 200, description: 'Skill demand vs supply analysis' })
  async getSkillDemand() {
    return this.skillsService.getSkillDemand();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get skills by category' })
  @ApiParam({ name: 'category', enum: SkillCategory })
  @ApiResponse({ status: 200, type: [SkillResponseDto] })
  async findByCategory(@Param('category') category: SkillCategory) {
    return this.skillsService.findByCategory(category);
  }

  @Get('suggest')
  @ApiOperation({ summary: 'Get skill suggestions for current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Suggested skills based on profile' })
  async suggestSkills(
    @CurrentUser('id') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.skillsService.suggestSkills(userId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill by ID' })
  @ApiParam({ name: 'id', description: 'Skill ID' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  async findOne(@Param('id') id: string) {
    return this.skillsService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a skill (Admin only)' })
  @ApiParam({ name: 'id', description: 'Skill ID' })
  @ApiResponse({ status: 200, type: SkillResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a skill (Admin only)' })
  @ApiParam({ name: 'id', description: 'Skill ID' })
  @ApiResponse({ status: 204, description: 'Skill deleted' })
  async remove(@Param('id') id: string) {
    return this.skillsService.remove(id);
  }

  // ==================== USER SKILLS ====================

  @Post('user')
  @ApiOperation({ summary: 'Add skill to current user profile' })
  @ApiResponse({ status: 201, type: UserSkillResponseDto })
  async addUserSkill(
    @CurrentUser('id') userId: string,
    @Body() dto: AddUserSkillDto,
  ) {
    return this.skillsService.addUserSkill(userId, dto);
  }

  @Get('user/me')
  @ApiOperation({ summary: 'Get current user skills' })
  @ApiResponse({ status: 200, type: [UserSkillResponseDto] })
  async getMySkills(@CurrentUser('id') userId: string) {
    return this.skillsService.getUserSkills(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user skills by user ID' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: [UserSkillResponseDto] })
  async getUserSkills(@Param('userId') userId: string) {
    return this.skillsService.getUserSkills(userId);
  }

  @Put('user/:skillId')
  @ApiOperation({ summary: 'Update user skill' })
  @ApiParam({ name: 'skillId', description: 'Skill ID' })
  @ApiResponse({ status: 200, type: UserSkillResponseDto })
  async updateUserSkill(
    @CurrentUser('id') userId: string,
    @Param('skillId') skillId: string,
    @Body() dto: UpdateUserSkillDto,
  ) {
    return this.skillsService.updateUserSkill(userId, skillId, dto);
  }

  @Delete('user/:skillId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove skill from current user profile' })
  @ApiParam({ name: 'skillId', description: 'Skill ID' })
  @ApiResponse({ status: 204, description: 'Skill removed from profile' })
  async removeUserSkill(
    @CurrentUser('id') userId: string,
    @Param('skillId') skillId: string,
  ) {
    return this.skillsService.removeUserSkill(userId, skillId);
  }
}
