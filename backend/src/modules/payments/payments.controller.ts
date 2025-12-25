import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentDto,
  RefundPaymentDto,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  CancelSubscriptionDto,
  CreatePayoutDto,
  PaymentFilterDto,
} from './dto/payment.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser, CurrentOrganization } from '@/common/decorators/user.decorators';
import { Roles } from '@/common/decorators/auth.decorators';
import { ApiPaginatedResponse } from '@/common/decorators/api.decorators';
import {
  InvoiceResponseDto,
  PaymentResponseDto,
  SubscriptionResponseDto,
  SubscriptionPlanDetailsDto,
  PayoutResponseDto,
  PaymentSummaryDto,
  WalletBalanceDto,
} from './dto/payment-response.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ==================== INVOICES ====================

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  async createInvoice(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.paymentsService.createInvoice(userId, dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiPaginatedResponse(InvoiceResponseDto)
  async getInvoices(
    @Query() pagination: PaginationDto,
    @Query() filter: any,
  ) {
    return this.paymentsService.getInvoices(pagination, filter);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async getInvoice(@Param('id') id: string) {
    return this.paymentsService.getInvoice(id);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.paymentsService.updateInvoice(id, dto);
  }

  @Post('invoices/:id/send')
  @ApiOperation({ summary: 'Send an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async sendInvoice(@Param('id') id: string) {
    return this.paymentsService.sendInvoice(id);
  }

  @Post('invoices/:id/cancel')
  @ApiOperation({ summary: 'Cancel an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  async cancelInvoice(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.paymentsService.cancelInvoice(id, reason);
  }

  // ==================== PAYMENTS ====================

  @Post()
  @ApiOperation({ summary: 'Create a payment' })
  @ApiResponse({ status: 201, type: PaymentResponseDto })
  async createPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiPaginatedResponse(PaymentResponseDto)
  async getPayments(
    @Query() pagination: PaginationDto,
    @Query() filter: PaymentFilterDto,
  ) {
    return this.paymentsService.getPayments(pagination, filter);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  async refundPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(userId, dto);
  }

  // ==================== SUBSCRIPTIONS ====================

  @Post('subscriptions')
  @ApiOperation({ summary: 'Create a subscription' })
  @ApiResponse({ status: 201, type: SubscriptionResponseDto })
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.paymentsService.createSubscription(dto);
  }

  @Get('subscriptions/plans')
  @ApiOperation({ summary: 'Get available subscription plans' })
  @ApiResponse({ status: 200, type: [SubscriptionPlanDetailsDto] })
  async getSubscriptionPlans() {
    return this.paymentsService.getSubscriptionPlans();
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getSubscription(@Param('id') id: string) {
    return this.paymentsService.getSubscription(id);
  }

  @Get('subscriptions/organization/:organizationId')
  @ApiOperation({ summary: 'Get organization subscription' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getOrganizationSubscription(
    @Param('organizationId') organizationId: string,
  ) {
    return this.paymentsService.getOrganizationSubscription(organizationId);
  }

  @Put('subscriptions/:id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async updateSubscription(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.paymentsService.updateSubscription(id, dto);
  }

  @Post('subscriptions/:id/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiParam({ name: 'id', description: 'Subscription ID' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async cancelSubscription(
    @Param('id') id: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.paymentsService.cancelSubscription(id, dto);
  }

  // ==================== PAYOUTS ====================

  @Post('payouts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a payout (Admin only)' })
  @ApiResponse({ status: 201, type: PayoutResponseDto })
  async createPayout(
    @CurrentUser('id') adminId: string,
    @Body() dto: CreatePayoutDto,
  ) {
    return this.paymentsService.createPayout(adminId, dto);
  }

  @Get('payouts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all payouts (Admin only)' })
  @ApiPaginatedResponse(PayoutResponseDto)
  async getPayouts(
    @Query() pagination: PaginationDto,
    @Query() filter: any,
  ) {
    return this.paymentsService.getPayouts(pagination, filter);
  }

  @Get('payouts/me')
  @ApiOperation({ summary: 'Get my payouts' })
  @ApiPaginatedResponse(PayoutResponseDto)
  async getMyPayouts(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.paymentsService.getWorkerPayouts(userId, pagination);
  }

  @Post('payouts/:id/process')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Process a payout (Admin only)' })
  @ApiParam({ name: 'id', description: 'Payout ID' })
  @ApiResponse({ status: 200, type: PayoutResponseDto })
  async processPayout(@Param('id') id: string) {
    return this.paymentsService.processPayout(id);
  }

  // ==================== ANALYTICS ====================

  @Get('summary')
  @ApiOperation({ summary: 'Get payment summary' })
  @ApiResponse({ status: 200, type: PaymentSummaryDto })
  async getPaymentSummary(
    @CurrentOrganization() organizationId?: string,
  ) {
    return this.paymentsService.getPaymentSummary(organizationId);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, type: WalletBalanceDto })
  async getWalletBalance(@CurrentUser('id') userId: string) {
    return this.paymentsService.getWalletBalance(userId);
  }
}
