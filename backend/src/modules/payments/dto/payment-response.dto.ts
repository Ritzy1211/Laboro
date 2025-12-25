import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentStatus,
  PaymentMethod,
  InvoiceStatus,
  SubscriptionStatus,
  SubscriptionPlan,
  Currency,
  InvoiceLineItemDto,
} from './payment.dto';

// ==================== INVOICE RESPONSES ====================

export class InvoiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceNumber: string;

  @ApiProperty()
  clientId: string;

  @ApiPropertyOptional()
  jobId?: string;

  @ApiProperty({ enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty({ type: [InvoiceLineItemResponseDto] })
  lineItems: InvoiceLineItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  taxRate?: number;

  @ApiPropertyOptional()
  taxAmount?: number;

  @ApiPropertyOptional()
  discount?: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  amountPaid: number;

  @ApiProperty()
  amountDue: number;

  @ApiPropertyOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => ClientInfoDto })
  client?: ClientInfoDto;

  @ApiPropertyOptional({ type: () => [PaymentResponseDto] })
  payments?: PaymentResponseDto[];
}

export class InvoiceLineItemResponseDto extends InvoiceLineItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  lineTotal: number;
}

export class ClientInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  email?: string;
}

// ==================== PAYMENT RESPONSES ====================

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  invoiceId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiPropertyOptional()
  failureReason?: string;

  @ApiPropertyOptional()
  refundedAmount?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  processedAt?: Date;
}

// ==================== SUBSCRIPTION RESPONSES ====================

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty({ enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty()
  billingCycle: number;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  currentPeriodStart: Date;

  @ApiProperty()
  currentPeriodEnd: Date;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  cancelAtPeriodEnd?: boolean;

  @ApiPropertyOptional()
  trialEnd?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => SubscriptionFeaturesDto })
  features?: SubscriptionFeaturesDto;
}

export class SubscriptionFeaturesDto {
  @ApiProperty()
  maxUsers: number;

  @ApiProperty()
  maxJobs: number;

  @ApiProperty()
  maxStorage: number;

  @ApiProperty()
  apiAccess: boolean;

  @ApiProperty()
  customBranding: boolean;

  @ApiProperty()
  prioritySupport: boolean;

  @ApiProperty()
  advancedAnalytics: boolean;

  @ApiProperty()
  ssoEnabled: boolean;
}

export class SubscriptionPlanDetailsDto {
  @ApiProperty({ enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  monthlyPrice: number;

  @ApiProperty()
  yearlyPrice: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty({ type: () => SubscriptionFeaturesDto })
  features: SubscriptionFeaturesDto;

  @ApiProperty()
  popular: boolean;
}

// ==================== PAYOUT RESPONSES ====================

export class PayoutResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  workerId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ type: [String] })
  jobIds?: string[];

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  processedAt?: Date;

  @ApiPropertyOptional({ type: () => WorkerInfoDto })
  worker?: WorkerInfoDto;
}

export class WorkerInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  email?: string;
}

// ==================== ANALYTICS RESPONSES ====================

export class PaymentSummaryDto {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  totalPayouts: number;

  @ApiProperty()
  netRevenue: number;

  @ApiProperty()
  pendingPayments: number;

  @ApiProperty()
  overdueInvoices: number;

  @ApiProperty()
  averagePaymentTime: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;
}

export class RevenueChartDto {
  @ApiProperty()
  period: string;

  @ApiProperty({ type: [RevenueDataPointDto] })
  data: RevenueDataPointDto[];
}

export class RevenueDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  payouts: number;

  @ApiProperty()
  invoiceCount: number;
}

export class WalletBalanceDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  available: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  total: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  lastUpdated: Date;
}
