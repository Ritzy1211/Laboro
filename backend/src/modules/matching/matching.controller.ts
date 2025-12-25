import {
  Controller,
  Get,
  Post,
  Patch,
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
} from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import {
  CreateMatchDto,
  RespondToMatchDto,
  MatchFilterDto,
  MatchingCriteriaDto,
  MatchDetailResponseDto,
  WorkerMatchSuggestionDto,
  JobMatchSuggestionDto,
} from './dto';
import { PaginationDto } from '../../common/dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Role } from '@prisma/client';

@ApiTags('Matching')
@Controller('matches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post()
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new match (invite worker to job)' })
  @ApiResponse({ status: 201, type: MatchDetailResponseDto })
  async create(@Body() dto: CreateMatchDto): Promise<MatchDetailResponseDto> {
    return this.matchingService.createMatch(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all matches with filtering' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filters: MatchFilterDto,
  ) {
    return this.matchingService.findAll(pagination, filters);
  }

  @Get('job/:jobId/suggestions')
  @Roles(Role.CLIENT, Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get worker suggestions for a job' })
  @ApiResponse({ status: 200, type: [WorkerMatchSuggestionDto] })
  async getWorkerSuggestionsForJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() criteria: MatchingCriteriaDto,
  ): Promise<WorkerMatchSuggestionDto[]> {
    return this.matchingService.findMatchesForJob(jobId, criteria);
  }

  @Get('worker/suggestions')
  @Roles(Role.WORKER)
  @ApiOperation({ summary: 'Get job suggestions for current worker' })
  @ApiResponse({ status: 200, type: [JobMatchSuggestionDto] })
  async getJobSuggestionsForWorker(
    @CurrentUser('id') workerId: string,
    @Query() criteria: MatchingCriteriaDto,
  ): Promise<JobMatchSuggestionDto[]> {
    return this.matchingService.findJobsForWorker(workerId, criteria);
  }

  @Get('worker/:workerId/suggestions')
  @Roles(Role.ENTERPRISE_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get job suggestions for a specific worker' })
  @ApiResponse({ status: 200, type: [JobMatchSuggestionDto] })
  async getJobSuggestionsForSpecificWorker(
    @Param('workerId', ParseUUIDPipe) workerId: string,
    @Query() criteria: MatchingCriteriaDto,
  ): Promise<JobMatchSuggestionDto[]> {
    return this.matchingService.findJobsForWorker(workerId, criteria);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiResponse({ status: 200, type: MatchDetailResponseDto })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MatchDetailResponseDto> {
    return this.matchingService.findById(id);
  }

  @Patch(':id/respond')
  @Roles(Role.WORKER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Respond to a match (accept/reject)' })
  @ApiResponse({ status: 200, type: MatchDetailResponseDto })
  async respondToMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') workerId: string,
    @Body() dto: RespondToMatchDto,
  ): Promise<MatchDetailResponseDto> {
    return this.matchingService.respondToMatch(id, workerId, dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a match' })
  @ApiResponse({ status: 200, type: MatchDetailResponseDto })
  async cancelMatch(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body('reason') reason?: string,
  ): Promise<MatchDetailResponseDto> {
    return this.matchingService.cancelMatch(id, userId, reason);
  }
}
