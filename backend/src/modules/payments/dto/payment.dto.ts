import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  IsDateString,
  IsArray,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  WALLET = 'WALLET',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
  TRIALING = 'TRIALING',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
}

// ==================== INVOICE DTOs ====================

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Client/Organization ID' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({ description: 'Related job ID' })
  @IsString()
  @IsOptional()
  jobId?: string;

  @ApiProperty({ type: [InvoiceLineItemDto], description: 'Invoice line items' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  @IsArray()
  lineItems: InvoiceLineItemDto[];

  @ApiPropertyOptional({ enum: Currency, default: Currency.USD })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Invoice notes' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Discount is percentage' })
  @IsBoolean()
  @IsOptional()
  discountIsPercentage?: boolean;
}

export class InvoiceLineItemDto {
  @ApiProperty({ description: 'Item description' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Task ID if related' })
  @IsString()
  @IsOptional()
  taskId?: string;
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}

// ==================== PAYMENT DTOs ====================

export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice ID' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment token from payment processor' })
  @IsString()
  @IsOptional()
  paymentToken?: string;

  @ApiPropertyOptional({ description: 'Save payment method for future use' })
  @IsBoolean()
  @IsOptional()
  savePaymentMethod?: boolean;
}

export class ProcessPaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Payment processor transaction ID' })
  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'Payment ID' })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiPropertyOptional({ description: 'Refund amount (defaults to full amount)' })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @ApiProperty({ description: 'Refund reason' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

// ==================== SUBSCRIPTION DTOs ====================

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'Billing cycle in months', default: 1 })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  billingCycle?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Apply promo code' })
  @IsString()
  @IsOptional()
  promoCode?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'Billing cycle in months' })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  billingCycle?: number;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;
}

export class CancelSubscriptionDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'Cancel immediately or at period end' })
  @IsBoolean()
  @IsOptional()
  immediate?: boolean;

  @ApiPropertyOptional({ description: 'Feedback for improvement' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  feedback?: string;
}

// ==================== PAYOUT DTOs ====================

export class CreatePayoutDto {
  @ApiProperty({ description: 'Worker ID' })
  @IsString()
  @IsNotEmpty()
  workerId: string;

  @ApiProperty({ description: 'Payout amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.USD })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Related job IDs', type: [String] })
  @IsString({ each: true })
  @IsOptional()
  jobIds?: string[];

  @ApiPropertyOptional({ description: 'Payout notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class PaymentFilterDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
