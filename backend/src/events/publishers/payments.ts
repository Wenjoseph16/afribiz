import { DomainEventType } from '../events';
import { def, pub } from './helpers';
import { DomainEvent } from '../events';

export const publishPaymentReceived = def<{
  userId: string;
  paymentId: string;
  businessName: string;
  amount: string;
  businessId?: string;
}>(
  DomainEventType.PAYMENT_RECEIVED,
  (p) => ({ paymentId: p.paymentId, businessName: p.businessName, amount: p.amount }),
  (p) => ({
    paymentId: p.paymentId,
    businessName: p.businessName,
    businessId: p.businessId,
    amount: p.amount,
    link: '/dashboard/payments',
  })
);
export const publishPaymentFailed = def<{
  userId: string;
  paymentId: string;
  reason: string;
  amount: string;
  businessName?: string;
}>(
  DomainEventType.PAYMENT_FAILED,
  (p) => ({
    paymentId: p.paymentId,
    reason: p.reason,
    amount: p.amount,
    businessName: p.businessName || '',
  }),
  (p) => ({
    paymentId: p.paymentId,
    amount: p.amount,
    reason: p.reason,
    link: '/dashboard/payments',
  })
);
export const publishPaymentReminder = def<{ userId: string; businessName: string; amount: string }>(
  DomainEventType.PAYMENT_REMINDER,
  (p) => ({ businessName: p.businessName, amount: p.amount }),
  (p) => ({ businessName: p.businessName, amount: p.amount, link: '/dashboard/payments' })
);
export const publishRefundProcessed = def<{
  userId: string;
  orderId: string;
  amount: string;
  businessName: string;
}>(
  DomainEventType.PAYMENT_REFUNDED,
  (p) => ({ orderId: p.orderId, amount: p.amount, businessName: p.businessName }),
  (p) => ({
    orderId: p.orderId,
    amount: p.amount,
    businessName: p.businessName,
    link: `/dashboard/orders/${p.orderId}`,
  })
);
export const publishCommissionCharged = def<{
  userId: string;
  amount: string;
  businessName: string;
  businessId: string;
}>(
  DomainEventType.COMMISSION_CHARGED,
  (p) => ({ amount: p.amount, businessName: p.businessName }),
  (p) => ({
    amount: p.amount,
    businessName: p.businessName,
    businessId: p.businessId,
    link: '/dashboard/finance',
  })
);
export const publishEscrowCreated = def<{
  userId: string;
  escrowId: string;
  amount: string;
  orderId?: string;
}>(
  DomainEventType.ESCROW_CREATED,
  (p) => ({ escrowId: p.escrowId, amount: p.amount, orderId: p.orderId || '' }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishEscrowHeld = def<{ userId: string; escrowId: string; amount: string }>(
  DomainEventType.ESCROW_HELD,
  (p) => ({ escrowId: p.escrowId, amount: p.amount }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishEscrowReleased = def<{ userId: string; escrowId: string; amount: string }>(
  DomainEventType.ESCROW_RELEASED,
  (p) => ({ escrowId: p.escrowId, amount: p.amount }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishEscrowPartialRelease = def<{
  userId: string;
  escrowId: string;
  amount: string;
  percentage: number;
}>(
  DomainEventType.ESCROW_PARTIAL_RELEASE,
  (p) => ({ escrowId: p.escrowId, amount: p.amount, percentage: p.percentage }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishEscrowManualRelease = def<{ userId: string; escrowId: string; amount: string }>(
  DomainEventType.ESCROW_MANUAL_RELEASE,
  (p) => ({ escrowId: p.escrowId, amount: p.amount }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishEscrowStepRelease = def<{
  userId: string;
  escrowId: string;
  step: number;
  totalSteps: number;
  amount: string;
}>(
  DomainEventType.ESCROW_STEP_RELEASE,
  (p) => ({ escrowId: p.escrowId, step: p.step, totalSteps: p.totalSteps, amount: p.amount }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishEscrowRefunded = def<{ userId: string; escrowId: string; amount: string }>(
  DomainEventType.ESCROW_REFUNDED,
  (p) => ({ escrowId: p.escrowId, amount: p.amount }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishEscrowDisputed = def<{ userId: string; escrowId: string; amount: string }>(
  DomainEventType.ESCROW_DISPUTED,
  (p) => ({ escrowId: p.escrowId, amount: p.amount }),
  (p) => ({ escrowId: p.escrowId, amount: p.amount, link: '/dashboard/payments' })
);
export const publishDepositReleased = def<{
  userId: string;
  bookingId: string;
  amount: string;
  businessName: string;
}>(
  DomainEventType.DEPOSIT_RELEASED,
  (p) => ({ bookingId: p.bookingId, amount: p.amount }),
  (p) => ({
    bookingId: p.bookingId,
    amount: p.amount,
    businessName: p.businessName,
    link: '/dashboard/payments',
  })
);
export const publishDebtCreated = def<{
  userId: string;
  debtId: string;
  businessId: string;
  amount: string;
  businessName?: string;
}>(
  DomainEventType.DEBT_CREATED,
  (p) => ({ debtId: p.debtId, amount: p.amount, businessName: p.businessName || '' }),
  (p) => ({
    debtId: p.debtId,
    businessId: p.businessId,
    amount: p.amount,
    businessName: p.businessName,
    link: '/dashboard/finance',
  })
);
export const publishDebtSettled = def<{
  userId: string;
  debtId: string;
  businessId: string;
  amount: string;
}>(
  DomainEventType.DEBT_SETTLED,
  (p) => ({ debtId: p.debtId, amount: p.amount }),
  (p) => ({
    debtId: p.debtId,
    businessId: p.businessId,
    amount: p.amount,
    link: '/dashboard/finance',
  })
);
export const publishDebtOverdue = def<{
  userId: string;
  debtId: string;
  businessId: string;
  amount: string;
}>(
  DomainEventType.DEBT_OVERDUE,
  (p) => ({ debtId: p.debtId, amount: p.amount }),
  (p) => ({
    debtId: p.debtId,
    businessId: p.businessId,
    amount: p.amount,
    link: '/dashboard/finance',
  })
);
export const publishSubscriptionCreated = def<{
  userId: string;
  subscriptionId: string;
  planName: string;
}>(
  DomainEventType.SUBSCRIPTION_CREATED,
  (p) => ({ subscriptionId: p.subscriptionId, planName: p.planName }),
  (p) => ({ subscriptionId: p.subscriptionId, link: '/dashboard/subscriptions' })
);
export const publishSubscriptionCancelled = def<{
  userId: string;
  subscriptionId: string;
  planName: string;
}>(
  DomainEventType.SUBSCRIPTION_CANCELLED,
  (p) => ({ subscriptionId: p.subscriptionId, planName: p.planName }),
  (p) => ({ subscriptionId: p.subscriptionId, link: '/dashboard/subscriptions' })
);
export const publishSubscriptionRenewed = def<{
  userId: string;
  subscriptionId: string;
  planName: string;
}>(
  DomainEventType.SUBSCRIPTION_RENEWED,
  (p) => ({ subscriptionId: p.subscriptionId, planName: p.planName }),
  (p) => ({ subscriptionId: p.subscriptionId, link: '/dashboard/subscriptions' })
);
export const publishSubscriptionExpiring = def<{
  userId: string;
  subscriptionId: string;
  planName: string;
  daysUntilExpiry: number;
}>(
  DomainEventType.SUBSCRIPTION_EXPIRING,
  (p) => ({
    subscriptionId: p.subscriptionId,
    planName: p.planName,
    daysUntilExpiry: p.daysUntilExpiry,
  }),
  (p) => ({ subscriptionId: p.subscriptionId, link: '/dashboard/subscriptions' })
);

// Accounting publishers (different signature: userId, businessId, payload separated)
export function publishQuoteSent(
  userId: string,
  businessId: string,
  payload: { quoteId: string; clientName: string; amount: number }
) {
  pub({
    type: DomainEventType.QUOTE_SENT,
    userId,
    payload: { quoteId: payload.quoteId, clientName: payload.clientName, amount: payload.amount },
    metadata: {
      businessId,
      businessName: payload.clientName,
      amount: String(payload.amount),
      link: '/dashboard/finance',
    } as DomainEvent['metadata'],
  });
}
export function publishQuoteAccepted(
  userId: string,
  businessId: string,
  payload: { quoteId: string; clientName: string; amount: number }
) {
  pub({
    type: DomainEventType.QUOTE_ACCEPTED,
    userId,
    payload: { quoteId: payload.quoteId, clientName: payload.clientName, amount: payload.amount },
    metadata: {
      businessId,
      businessName: payload.clientName,
      amount: String(payload.amount),
      link: '/dashboard/finance',
    } as DomainEvent['metadata'],
  });
}
export function publishInvoiceSent(
  userId: string,
  businessId: string,
  payload: { invoiceId: string; clientName: string; amount: number; dueDate: string }
) {
  pub({
    type: DomainEventType.INVOICE_SENT,
    userId,
    payload: {
      invoiceId: payload.invoiceId,
      clientName: payload.clientName,
      amount: payload.amount,
      dueDate: payload.dueDate,
    },
    metadata: {
      businessId,
      businessName: payload.clientName,
      amount: String(payload.amount),
      link: '/dashboard/finance',
    } as DomainEvent['metadata'],
  });
}
export function publishInvoicePaid(
  userId: string,
  businessId: string,
  payload: { invoiceId: string; clientName: string; amount: number }
) {
  pub({
    type: DomainEventType.INVOICE_PAID,
    userId,
    payload: {
      invoiceId: payload.invoiceId,
      clientName: payload.clientName,
      amount: payload.amount,
    },
    metadata: {
      businessId,
      businessName: payload.clientName,
      amount: String(payload.amount),
      link: '/dashboard/finance',
    } as DomainEvent['metadata'],
  });
}
export function publishInvoiceOverdue(
  userId: string,
  businessId: string,
  payload: { invoiceId: string; clientName: string; amount: number }
) {
  pub({
    type: DomainEventType.INVOICE_OVERDUE,
    userId,
    payload: {
      invoiceId: payload.invoiceId,
      clientName: payload.clientName,
      amount: payload.amount,
    },
    metadata: {
      businessId,
      businessName: payload.clientName,
      amount: String(payload.amount),
      link: '/dashboard/finance',
    } as DomainEvent['metadata'],
  });
}
