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
import { RatingsService } from './ratings.service';
import {
  CreateRatingDto,
  UpdateRatingDto,
  RatingResponseDto,
  ReportRatingDto,
  RatingFilterDto,
} from './dto/rating.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser } from '@/common/decorators/user.decorators';
import { ApiPaginatedResponse } from '@/common/decorators/api.decorators';
import {
  RatingItemResponseDto,
  UserRatingSummaryDto,
  ReliabilityScoreDto,
  RatingTrendsDto,
} from './dto/rating-response.dto';

@ApiTags('Ratings')
@ApiBearerAuth()
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new rating' })
  @ApiResponse({ status: 201, type: RatingItemResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all ratings' })
  @ApiPaginatedResponse(RatingItemResponseDto)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filter: RatingFilterDto,
  ) {
    return this.ratingsService.findAll(pagination, filter);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get ratings for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiPaginatedResponse(RatingItemResponseDto)
  async findByUser(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.ratingsService.findByUser(userId, pagination);
  }

  @Get('user/:userId/summary')
  @ApiOperation({ summary: 'Get rating summary for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: UserRatingSummaryDto })
  async getUserRatingSummary(@Param('userId') userId: string) {
    return this.ratingsService.getUserRatingSummary(userId);
  }

  @Get('user/:userId/reliability')
  @ApiOperation({ summary: 'Get reliability score for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, type: ReliabilityScoreDto })
  async getReliabilityScore(@Param('userId') userId: string) {
    return this.ratingsService.getReliabilityScore(userId);
  }

  @Get('user/:userId/trends')
  @ApiOperation({ summary: 'Get rating trends for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  @ApiResponse({ status: 200, type: RatingTrendsDto })
  async getRatingTrends(
    @Param('userId') userId: string,
    @Query('months') months?: number,
  ) {
    return this.ratingsService.getRatingTrends(userId, months);
  }

  @Get('me/summary')
  @ApiOperation({ summary: 'Get my rating summary' })
  @ApiResponse({ status: 200, type: UserRatingSummaryDto })
  async getMyRatingSummary(@CurrentUser('id') userId: string) {
    return this.ratingsService.getUserRatingSummary(userId);
  }

  @Get('me/reliability')
  @ApiOperation({ summary: 'Get my reliability score' })
  @ApiResponse({ status: 200, type: ReliabilityScoreDto })
  async getMyReliabilityScore(@CurrentUser('id') userId: string) {
    return this.ratingsService.getReliabilityScore(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rating by ID' })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({ status: 200, type: RatingItemResponseDto })
  async findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a rating' })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({ status: 200, type: RatingItemResponseDto })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRatingDto,
  ) {
    return this.ratingsService.update(id, userId, dto);
  }

  @Post('respond')
  @ApiOperation({ summary: 'Respond to a rating' })
  @ApiResponse({ status: 200, type: RatingItemResponseDto })
  async respond(
    @CurrentUser('id') userId: string,
    @Body() dto: RatingResponseDto,
  ) {
    return this.ratingsService.respond(userId, dto);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a rating' })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({ status: 200, description: 'Rating reported successfully' })
  async report(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReportRatingDto,
  ) {
    return this.ratingsService.report(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a rating' })
  @ApiParam({ name: 'id', description: 'Rating ID' })
  @ApiResponse({ status: 204, description: 'Rating deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ratingsService.remove(id, userId);
  }
}
