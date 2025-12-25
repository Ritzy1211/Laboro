import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';
import { PrismaService } from '@/common/prisma/prisma.service';
import { RedisService } from '@/common/redis/redis.service';
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
  InvoiceStatus,
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  Currency,
} from './dto/payment.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class PaymentsService {
  private readonly CACHE_PREFIX = 'payments:';
  private readonly CACHE_TTL = 1800;

  // Plan pricing (monthly)
  private readonly PLAN_PRICES: Record<SubscriptionPlan, number> = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.STARTER]: 29,
    [SubscriptionPlan.PROFESSIONAL]: 99,
    [SubscriptionPlan.ENTERPRISE]: 299,
  };

  // Plan features
  private readonly PLAN_FEATURES: Record<SubscriptionPlan, any> = {
    [SubscriptionPlan.FREE]: {
      maxUsers: 3,
      maxJobs: 10,
      maxStorage: 1024, // MB
      apiAccess: false,
      customBranding: false,
      prioritySupport: false,
      advancedAnalytics: false,
      ssoEnabled: false,
    },
    [SubscriptionPlan.STARTER]: {
      maxUsers: 10,
      maxJobs: 50,
      maxStorage: 10240,
      apiAccess: true,
      customBranding: false,
      prioritySupport: false,
      advancedAnalytics: false,
      ssoEnabled: false,
    },
    [SubscriptionPlan.PROFESSIONAL]: {
      maxUsers: 50,
      maxJobs: 500,
      maxStorage: 102400,
      apiAccess: true,
      customBranding: true,
      prioritySupport: true,
      advancedAnalytics: true,
      ssoEnabled: false,
    },
    [SubscriptionPlan.ENTERPRISE]: {
      maxUsers: -1, // Unlimited
      maxJobs: -1,
      maxStorage: -1,
      apiAccess: true,
      customBranding: true,
      prioritySupport: true,
      advancedAnalytics: true,
      ssoEnabled: true,
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== INVOICES ====================

  async createInvoice(createdBy: string, dto: CreateInvoiceDto) {
    // Generate invoice number
    const invoiceCount = await this.prisma.invoice.count();
    const invoiceNumber = `INV-${DateTime.now().toFormat('yyyyMM')}-${String(invoiceCount + 1).padStart(5, '0')}`;

    // Calculate totals
    const subtotal = dto.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    let discount = 0;
    if (dto.discount) {
      discount = dto.discountIsPercentage
        ? (subtotal * dto.discount) / 100
        : dto.discount;
    }

    const taxableAmount = subtotal - discount;
    const taxAmount = dto.taxRate ? (taxableAmount * dto.taxRate) / 100 : 0;
    const total = taxableAmount + taxAmount;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: dto.clientId,
        jobId: dto.jobId,
        status: InvoiceStatus.DRAFT,
        currency: dto.currency ?? Currency.USD,
        subtotal,
        taxRate: dto.taxRate,
        taxAmount,
        discount,
        total,
        amountPaid: 0,
        amountDue: total,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        notes: dto.notes,
        metadata: {
          lineItems: dto.lineItems.map((item, index) => ({
            id: `line-${index}`,
            ...item,
            lineTotal: item.quantity * item.unitPrice,
          })),
          createdBy,
        },
      },
      include: this.getInvoiceIncludes(),
    });

    this.eventEmitter.emit('invoice.created', { invoice });

    return this.formatInvoice(invoice);
  }

  async sendInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Invoice has already been sent');
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.SENT,
        sentAt: new Date(),
      },
      include: this.getInvoiceIncludes(),
    });

    this.eventEmitter.emit('invoice.sent', { invoice: updated });

    return this.formatInvoice(updated);
  }

  async getInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: this.getInvoiceIncludes(),
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.formatInvoice(invoice);
  }

  async getInvoices(pagination: PaginationDto, filter?: any) {
    const where: any = {};

    if (filter?.clientId) {
      where.clientId = filter.clientId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: this.getInvoiceIncludes(),
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices.map((inv) => this.formatInvoice(inv)),
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async updateInvoice(invoiceId: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Cannot update sent invoice');
    }

    // Recalculate if line items changed
    let updateData: any = { ...dto };

    if (dto.lineItems) {
      const subtotal = dto.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      let discount = 0;
      if (dto.discount !== undefined) {
        discount = dto.discountIsPercentage
          ? (subtotal * dto.discount) / 100
          : dto.discount;
      } else if (invoice.discount) {
        discount = invoice.discount;
      }

      const taxRate = dto.taxRate ?? invoice.taxRate ?? 0;
      const taxableAmount = subtotal - discount;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const total = taxableAmount + taxAmount;

      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        discount,
        total,
        amountDue: total - invoice.amountPaid,
        metadata: {
          ...(invoice.metadata as any),
          lineItems: dto.lineItems.map((item, index) => ({
            id: `line-${index}`,
            ...item,
            lineTotal: item.quantity * item.unitPrice,
          })),
        },
      };
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: this.getInvoiceIncludes(),
    });

    return this.formatInvoice(updated);
  }

  async cancelInvoice(invoiceId: string, reason: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot cancel paid invoice');
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.CANCELLED,
        metadata: {
          ...(invoice.metadata as any),
          cancelledReason: reason,
          cancelledAt: new Date(),
        },
      },
      include: this.getInvoiceIncludes(),
    });

    this.eventEmitter.emit('invoice.cancelled', { invoice: updated });

    return this.formatInvoice(updated);
  }

  // ==================== PAYMENTS ====================

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay cancelled invoice');
    }

    if (dto.amount > invoice.amountDue) {
      throw new BadRequestException('Payment amount exceeds amount due');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        userId,
        amount: dto.amount,
        currency: invoice.currency,
        status: PaymentStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        metadata: {
          paymentToken: dto.paymentToken,
          savePaymentMethod: dto.savePaymentMethod,
        },
      },
    });

    // In production, this would integrate with Stripe/PayPal
    // For now, simulate processing
    await this.processPaymentInternal(payment.id);

    const updatedPayment = await this.prisma.payment.findUnique({
      where: { id: payment.id },
    });

    return updatedPayment;
  }

  private async processPaymentInternal(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Simulate payment processing
    // In production, this would call Stripe/PayPal APIs
    const success = true; // Simulated success

    if (success) {
      await this.prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: `txn_${Date.now()}`,
            processedAt: new Date(),
          },
        });

        // Update invoice
        const newAmountPaid = payment.invoice.amountPaid + payment.amount;
        const newAmountDue = payment.invoice.total - newAmountPaid;
        const newStatus = newAmountDue <= 0
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIALLY_PAID;

        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            amountDue: Math.max(0, newAmountDue),
            status: newStatus,
            paidAt: newAmountDue <= 0 ? new Date() : undefined,
          },
        });
      });

      this.eventEmitter.emit('payment.completed', { paymentId });
    } else {
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: 'Payment declined',
        },
      });

      this.eventEmitter.emit('payment.failed', { paymentId });
    }
  }

  async refundPayment(userId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
      include: { invoice: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    const refundAmount = dto.amount ?? payment.amount;
    const alreadyRefunded = payment.refundedAmount ?? 0;

    if (refundAmount + alreadyRefunded > payment.amount) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    // Process refund (would call payment processor in production)
    await this.prisma.$transaction(async (tx) => {
      const newRefundedAmount = alreadyRefunded + refundAmount;
      const isFullRefund = newRefundedAmount >= payment.amount;

      await tx.payment.update({
        where: { id: dto.paymentId },
        data: {
          status: isFullRefund ? PaymentStatus.REFUNDED : payment.status,
          refundedAmount: newRefundedAmount,
          metadata: {
            ...(payment.metadata as any),
            refunds: [
              ...((payment.metadata as any)?.refunds ?? []),
              {
                amount: refundAmount,
                reason: dto.reason,
                processedAt: new Date(),
                processedBy: userId,
              },
            ],
          },
        },
      });

      // Update invoice
      await tx.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          amountPaid: { decrement: refundAmount },
          amountDue: { increment: refundAmount },
          status: InvoiceStatus.REFUNDED,
        },
      });
    });

    this.eventEmitter.emit('payment.refunded', {
      paymentId: dto.paymentId,
      amount: refundAmount,
    });

    return { message: 'Refund processed successfully' };
  }

  async getPayments(pagination: PaginationDto, filter?: PaymentFilterDto) {
    const where: any = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.userId) {
      where.userId = filter.userId;
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: true,
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  // ==================== SUBSCRIPTIONS ====================

  async createSubscription(dto: CreateSubscriptionDto) {
    // Check if organization already has active subscription
    const existing = await this.prisma.subscription.findFirst({
      where: {
        organizationId: dto.organizationId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
    });

    if (existing) {
      throw new ConflictException('Organization already has an active subscription');
    }

    const price = this.PLAN_PRICES[dto.plan] * (dto.billingCycle ?? 1);
    const features = this.PLAN_FEATURES[dto.plan];

    const now = DateTime.now();
    const periodEnd = now.plus({ months: dto.billingCycle ?? 1 });

    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId: dto.organizationId,
        plan: dto.plan,
        status: dto.plan === SubscriptionPlan.FREE
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.TRIALING,
        billingCycle: dto.billingCycle ?? 1,
        price,
        currency: Currency.USD,
        currentPeriodStart: now.toJSDate(),
        currentPeriodEnd: periodEnd.toJSDate(),
        trialEnd: dto.plan !== SubscriptionPlan.FREE
          ? now.plus({ days: 14 }).toJSDate()
          : null,
        metadata: {
          features,
          paymentMethod: dto.paymentMethod,
          promoCode: dto.promoCode,
        },
      },
    });

    this.eventEmitter.emit('subscription.created', { subscription });

    return this.formatSubscription(subscription);
  }

  async getSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.formatSubscription(subscription);
  }

  async getOrganizationSubscription(organizationId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        organizationId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE] },
      },
    });

    if (!subscription) {
      return null;
    }

    return this.formatSubscription(subscription);
  }

  async updateSubscription(subscriptionId: string, dto: UpdateSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const updateData: any = {};

    if (dto.plan && dto.plan !== subscription.plan) {
      const newPrice = this.PLAN_PRICES[dto.plan] * (dto.billingCycle ?? subscription.billingCycle);
      const newFeatures = this.PLAN_FEATURES[dto.plan];

      updateData.plan = dto.plan;
      updateData.price = newPrice;
      updateData.metadata = {
        ...(subscription.metadata as any),
        features: newFeatures,
        previousPlan: subscription.plan,
        planChangedAt: new Date(),
      };
    }

    if (dto.billingCycle) {
      updateData.billingCycle = dto.billingCycle;
      updateData.price = this.PLAN_PRICES[dto.plan ?? subscription.plan] * dto.billingCycle;
    }

    if (dto.paymentMethod) {
      updateData.metadata = {
        ...(subscription.metadata as any),
        ...updateData.metadata,
        paymentMethod: dto.paymentMethod,
      };
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
    });

    this.eventEmitter.emit('subscription.updated', { subscription: updated });

    return this.formatSubscription(updated);
  }

  async cancelSubscription(subscriptionId: string, dto: CancelSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: dto.immediate ? SubscriptionStatus.CANCELLED : subscription.status,
        cancelAtPeriodEnd: !dto.immediate,
        cancelledAt: new Date(),
        metadata: {
          ...(subscription.metadata as any),
          cancellationReason: dto.reason,
          cancellationFeedback: dto.feedback,
        },
      },
    });

    this.eventEmitter.emit('subscription.cancelled', {
      subscription: updated,
      immediate: dto.immediate,
    });

    return this.formatSubscription(updated);
  }

  async getSubscriptionPlans() {
    return Object.values(SubscriptionPlan).map((plan) => ({
      plan,
      name: plan.charAt(0) + plan.slice(1).toLowerCase(),
      description: this.getPlanDescription(plan),
      monthlyPrice: this.PLAN_PRICES[plan],
      yearlyPrice: this.PLAN_PRICES[plan] * 12 * 0.8, // 20% discount
      currency: Currency.USD,
      features: this.PLAN_FEATURES[plan],
      popular: plan === SubscriptionPlan.PROFESSIONAL,
    }));
  }

  // ==================== PAYOUTS ====================

  async createPayout(adminId: string, dto: CreatePayoutDto) {
    const worker = await this.prisma.user.findUnique({
      where: { id: dto.workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    const payout = await this.prisma.payout.create({
      data: {
        workerId: dto.workerId,
        amount: dto.amount,
        currency: dto.currency ?? Currency.USD,
        status: PaymentStatus.PENDING,
        metadata: {
          jobIds: dto.jobIds,
          notes: dto.notes,
          createdBy: adminId,
        },
      },
    });

    this.eventEmitter.emit('payout.created', { payout });

    return payout;
  }

  async processPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    if (payout.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payout is not pending');
    }

    // In production, this would integrate with payment processor
    const updated = await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PaymentStatus.COMPLETED,
        transactionId: `po_${Date.now()}`,
        processedAt: new Date(),
      },
    });

    this.eventEmitter.emit('payout.completed', { payout: updated });

    return updated;
  }

  async getPayouts(pagination: PaginationDto, filter?: any) {
    const where: any = {};

    if (filter?.workerId) {
      where.workerId = filter.workerId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          worker: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      data: payouts,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getWorkerPayouts(workerId: string, pagination: PaginationDto) {
    return this.getPayouts(pagination, { workerId });
  }

  // ==================== ANALYTICS ====================

  async getPaymentSummary(organizationId?: string) {
    const where: any = organizationId ? { invoice: { clientId: organizationId } } : {};

    const payments = await this.prisma.payment.findMany({
      where: {
        ...where,
        status: PaymentStatus.COMPLETED,
      },
      select: { amount: true, currency: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const payouts = await this.prisma.payout.findMany({
      where: { status: PaymentStatus.COMPLETED },
      select: { amount: true },
    });

    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = await this.prisma.payment.count({
      where: { ...where, status: PaymentStatus.PENDING },
    });

    const overdueInvoices = await this.prisma.invoice.count({
      where: {
        status: InvoiceStatus.OVERDUE,
        ...(organizationId ? { clientId: organizationId } : {}),
      },
    });

    return {
      totalRevenue,
      totalPayouts,
      netRevenue: totalRevenue - totalPayouts,
      pendingPayments,
      overdueInvoices,
      averagePaymentTime: 3.5, // days - would be calculated
      currency: Currency.USD,
    };
  }

  async getWalletBalance(userId: string) {
    const completedPayouts = await this.prisma.payout.findMany({
      where: {
        workerId: userId,
        status: PaymentStatus.COMPLETED,
      },
      select: { amount: true },
    });

    const pendingPayouts = await this.prisma.payout.findMany({
      where: {
        workerId: userId,
        status: PaymentStatus.PENDING,
      },
      select: { amount: true },
    });

    const available = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
    const pending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);

    return {
      userId,
      available,
      pending,
      total: available + pending,
      currency: Currency.USD,
      lastUpdated: new Date(),
    };
  }

  // ==================== HELPERS ====================

  private getInvoiceIncludes() {
    return {
      client: {
        select: { id: true, name: true, email: true },
      },
      payments: true,
      job: {
        select: { id: true, title: true },
      },
    };
  }

  private formatInvoice(invoice: any) {
    const metadata = invoice.metadata as any;
    return {
      ...invoice,
      lineItems: metadata?.lineItems ?? [],
      metadata: undefined,
    };
  }

  private formatSubscription(subscription: any) {
    const metadata = subscription.metadata as any;
    return {
      ...subscription,
      features: metadata?.features ?? this.PLAN_FEATURES[subscription.plan],
      metadata: undefined,
    };
  }

  private getPlanDescription(plan: SubscriptionPlan): string {
    const descriptions: Record<SubscriptionPlan, string> = {
      [SubscriptionPlan.FREE]: 'Perfect for individuals and small teams getting started',
      [SubscriptionPlan.STARTER]: 'Great for growing teams with moderate needs',
      [SubscriptionPlan.PROFESSIONAL]: 'Best for established businesses with advanced needs',
      [SubscriptionPlan.ENTERPRISE]: 'Custom solutions for large organizations',
    };
    return descriptions[plan];
  }
}
