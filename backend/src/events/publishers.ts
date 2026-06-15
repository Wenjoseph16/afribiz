import { eventBus } from './EventBus';
import { DomainEventType, DomainEvent } from './events';

function pub(event: {
  type: DomainEventType;
  userId: string;
  payload: Record<string, unknown>;
  metadata?: DomainEvent['metadata'];
}) {
  eventBus.publish({
    type: event.type,
    userId: event.userId,
    payload: event.payload,
    metadata: event.metadata,
    timestamp: new Date(),
  });
}

// ── Auth ──
export function publishUserSignedUp(params: { userId: string; email: string; name: string }) {
  pub({ type: DomainEventType.USER_SIGNED_UP, userId: params.userId, payload: { email: params.email, name: params.name }, metadata: { email: params.email } });
}
export function publishUserLoggedIn(params: { userId: string; device?: string; location?: string }) {
  pub({ type: DomainEventType.USER_LOGGED_IN, userId: params.userId, payload: { device: params.device || '', location: params.location || '' }, metadata: { device: params.device, location: params.location } });
}
export function publishPasswordChanged(params: { userId: string }) {
  pub({ type: DomainEventType.PASSWORD_CHANGED, userId: params.userId, payload: {} });
}
export function publishBusinessActivated(params: { userId: string; businessId: string; businessName: string }) {
  pub({ type: DomainEventType.BUSINESS_ACTIVATED, userId: params.userId, payload: { businessId: params.businessId, businessName: params.businessName }, metadata: { businessId: params.businessId, businessName: params.businessName, link: '/dashboard' } });
}
export function publishDeveloperActivated(params: { userId: string }) {
  pub({ type: DomainEventType.DEVELOPER_ACTIVATED, userId: params.userId, payload: {} });
}
// ── Trial ──
export function publishTrialExpiring(params: { userId: string; businessId: string; moduleId: string; moduleName: string; daysLeft: number }) {
  pub({ type: DomainEventType.TRIAL_EXPIRING, userId: params.userId, payload: { businessId: params.businessId, moduleId: params.moduleId, moduleName: params.moduleName, daysLeft: params.daysLeft }, metadata: { businessId: params.businessId, moduleId: params.moduleId, businessName: params.moduleName, reason: `Essai expire dans ${params.daysLeft} jours`, link: '/dashboard/business/modules' } });
}

export function publishModuleInstalled(params: { userId: string; businessId: string; moduleId: string; moduleName: string }) {
  pub({ type: DomainEventType.MODULE_INSTALLED, userId: params.userId, payload: { businessId: params.businessId, moduleId: params.moduleId, moduleName: params.moduleName }, metadata: { businessId: params.businessId, link: '/dashboard/modules' } });
}
export function publishModuleUninstalled(params: { userId: string; businessId: string; moduleId: string; moduleName: string }) {
  pub({ type: DomainEventType.MODULE_UNINSTALLED, userId: params.userId, payload: { businessId: params.businessId, moduleId: params.moduleId, moduleName: params.moduleName }, metadata: { businessId: params.businessId, link: '/dashboard/modules' } });
}

// ── Orders ──
export function publishOrderPlaced(params: { userId: string; orderId: string; businessName: string; amount: string; businessId?: string }) {
  pub({ type: DomainEventType.ORDER_PLACED, userId: params.userId, payload: { orderId: params.orderId, businessName: params.businessName, amount: params.amount }, metadata: { orderId: params.orderId, businessName: params.businessName, businessId: params.businessId, amount: params.amount, link: `/dashboard/orders/${params.orderId}` } });
}
export function publishOrderStatusChanged(params: { userId: string; orderId: string; status: string; businessName: string; businessId?: string }) {
  const typeMap: Record<string, DomainEventType> = {
    confirmed: DomainEventType.ORDER_CONFIRMED,
    accepted: DomainEventType.ORDER_ACCEPTED,
    refused: DomainEventType.ORDER_REFUSED,
    preparing: DomainEventType.ORDER_PREPARING,
    shipped: DomainEventType.ORDER_SHIPPED,
    delivered: DomainEventType.ORDER_DELIVERED,
    cancelled: DomainEventType.ORDER_CANCELLED,
  };
  const eventType = typeMap[params.status];
  if (!eventType) return;
  pub({ type: eventType, userId: params.userId, payload: { orderId: params.orderId, status: params.status, businessName: params.businessName }, metadata: { orderId: params.orderId, businessName: params.businessName, businessId: params.businessId, link: `/dashboard/orders/${params.orderId}` } });
}
export function publishOrderPendingReminder(params: { userId: string; orderId: string; businessName: string; amount: string; businessId: string; minutesElapsed: number; reminderLevel: string }) {
  pub({ type: DomainEventType.ORDER_PENDING_REMINDER, userId: params.userId, payload: { orderId: params.orderId, businessName: params.businessName, amount: params.amount, minutesElapsed: params.minutesElapsed, reminderLevel: params.reminderLevel }, metadata: { orderId: params.orderId, businessName: params.businessName, businessId: params.businessId, amount: params.amount, reason: params.minutesElapsed + ' min sans reponse', link: '/dashboard/orders/' + params.orderId } });
}
export function publishOrderAutoCancelled(params: { userId: string; orderId: string; businessName: string; businessId: string }) {
  pub({ type: DomainEventType.ORDER_AUTO_CANCELLED, userId: params.userId, payload: { orderId: params.orderId, businessName: params.businessName }, metadata: { orderId: params.orderId, businessName: params.businessName, businessId: params.businessId, reason: 'Annulation automatique - delai de reponse depasse', link: '/dashboard/orders/' + params.orderId } });
}

// ── Bookings ──
export function publishBookingCreated(params: { userId: string; bookingId: string; businessName: string; businessId?: string }) {
  pub({ type: DomainEventType.BOOKING_CREATED, userId: params.userId, payload: { bookingId: params.bookingId, businessName: params.businessName }, metadata: { bookingId: params.bookingId, businessName: params.businessName, businessId: params.businessId, link: `/dashboard/bookings/${params.bookingId}` } });
}
export function publishBookingStatusChanged(params: { userId: string; bookingId: string; status: string; businessName: string; businessId?: string }) {
  const typeMap: Record<string, DomainEventType> = {
    confirmed: DomainEventType.BOOKING_CONFIRMED,
    cancelled: DomainEventType.BOOKING_CANCELLED,
  };
  const eventType = typeMap[params.status];
  if (!eventType) return;
  pub({ type: eventType, userId: params.userId, payload: { bookingId: params.bookingId, status: params.status, businessName: params.businessName }, metadata: { bookingId: params.bookingId, businessName: params.businessName, businessId: params.businessId, link: `/dashboard/bookings/${params.bookingId}` } });
}
export function publishBookingReminder(params: { userId: string; bookingId: string; businessName: string }) {
  pub({ type: DomainEventType.BOOKING_REMINDER, userId: params.userId, payload: { bookingId: params.bookingId, businessName: params.businessName }, metadata: { bookingId: params.bookingId, businessName: params.businessName, link: `/dashboard/bookings/${params.bookingId}` } });
}

// ── Payments ──
export function publishPaymentReceived(params: { userId: string; paymentId: string; businessName: string; amount: string; businessId?: string }) {
  pub({ type: DomainEventType.PAYMENT_RECEIVED, userId: params.userId, payload: { paymentId: params.paymentId, businessName: params.businessName, amount: params.amount }, metadata: { paymentId: params.paymentId, businessName: params.businessName, businessId: params.businessId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishPaymentFailed(params: { userId: string; paymentId: string; reason: string; amount: string; businessName?: string }) {
  pub({ type: DomainEventType.PAYMENT_FAILED, userId: params.userId, payload: { paymentId: params.paymentId, reason: params.reason, amount: params.amount, businessName: params.businessName || '' }, metadata: { paymentId: params.paymentId, amount: params.amount, reason: params.reason, link: '/dashboard/payments' } });
}
export function publishPaymentReminder(params: { userId: string; businessName: string; amount: string }) {
  pub({ type: DomainEventType.PAYMENT_REMINDER, userId: params.userId, payload: { businessName: params.businessName, amount: params.amount }, metadata: { businessName: params.businessName, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishRefundProcessed(params: { userId: string; orderId: string; amount: string; businessName: string }) {
  pub({ type: DomainEventType.PAYMENT_REFUNDED, userId: params.userId, payload: { orderId: params.orderId, amount: params.amount, businessName: params.businessName }, metadata: { orderId: params.orderId, amount: params.amount, businessName: params.businessName, link: `/dashboard/orders/${params.orderId}` } });
}
export function publishCommissionCharged(params: { userId: string; amount: string; businessName: string; businessId: string }) {
  pub({ type: DomainEventType.COMMISSION_CHARGED, userId: params.userId, payload: { amount: params.amount, businessName: params.businessName }, metadata: { amount: params.amount, businessName: params.businessName, businessId: params.businessId, link: '/dashboard/finance' } });
}

// ── Escrow ──
export function publishEscrowCreated(params: { userId: string; escrowId: string; amount: string; orderId?: string }) {
  pub({ type: DomainEventType.ESCROW_CREATED, userId: params.userId, payload: { escrowId: params.escrowId, amount: params.amount, orderId: params.orderId || '' }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishEscrowHeld(params: { userId: string; escrowId: string; amount: string }) {
  pub({ type: DomainEventType.ESCROW_HELD, userId: params.userId, payload: { escrowId: params.escrowId, amount: params.amount }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishEscrowReleased(params: { userId: string; escrowId: string; amount: string }) {
  pub({ type: DomainEventType.ESCROW_RELEASED, userId: params.userId, payload: { escrowId: params.escrowId, amount: params.amount }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishEscrowPartialRelease(params: { userId: string; escrowId: string; amount: string; percentage: number }) {
  pub({ type: DomainEventType.ESCROW_PARTIAL_RELEASE, userId: params.userId, payload: { escrowId: params.escrowId, amount: params.amount, percentage: params.percentage }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishEscrowManualRelease(params: { userId: string; escrowId: string; amount: string }) {
  pub({ type: DomainEventType.ESCROW_MANUAL_RELEASE, userId: params.userId, payload: { escrowId: params.escrowId, amount: params.amount }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishEscrowStepRelease(params: { userId: string; escrowId: string; step: number; totalSteps: number; amount: string }) {
  pub({ type: DomainEventType.ESCROW_STEP_RELEASE, userId: params.userId, payload: { escrowId: params.escrowId, step: params.step, totalSteps: params.totalSteps, amount: params.amount }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishEscrowRefunded(params: { userId: string; escrowId: string; amount: string }) {
  pub({ type: DomainEventType.ESCROW_REFUNDED, userId: params.userId, payload: { escrowId: params.escrowId, amount: params.amount }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}
export function publishEscrowDisputed(params: { userId: string; escrowId: string; amount: string }) {
  pub({ type: DomainEventType.ESCROW_DISPUTED, userId: params.userId, payload: { escrowId: params.escrowId, amount: params.amount }, metadata: { escrowId: params.escrowId, amount: params.amount, link: '/dashboard/payments' } });
}

// ── Rentals ──
export function publishRentalCreated(params: { userId: string; rentalId: string; businessName: string; businessId?: string }) {
  pub({ type: DomainEventType.RENTAL_CREATED, userId: params.userId, payload: { rentalId: params.rentalId, businessName: params.businessName }, metadata: { rentalId: params.rentalId, businessName: params.businessName, businessId: params.businessId, link: `/dashboard/rentals/${params.rentalId}` } });
}
export function publishRentalReturned(params: { userId: string; rentalId: string; businessName: string }) {
  pub({ type: DomainEventType.RENTAL_RETURNED, userId: params.userId, payload: { rentalId: params.rentalId, businessName: params.businessName }, metadata: { rentalId: params.rentalId, businessName: params.businessName, link: `/dashboard/rentals/${params.rentalId}` } });
}
export function publishRentalOverdue(params: { userId: string; rentalId: string; businessName: string }) {
  pub({ type: DomainEventType.RENTAL_OVERDUE, userId: params.userId, payload: { rentalId: params.rentalId, businessName: params.businessName }, metadata: { rentalId: params.rentalId, businessName: params.businessName, link: `/dashboard/rentals/${params.rentalId}` } });
}
export function publishRentalReturnReminder(params: { userId: string; rentalId: string; businessName: string; daysUntilDue: number }) {
  pub({ type: DomainEventType.RENTAL_RETURN_REMINDER, userId: params.userId, payload: { rentalId: params.rentalId, daysUntilDue: params.daysUntilDue }, metadata: { rentalId: params.rentalId, businessName: params.businessName, reason: `Retour prévu dans ${params.daysUntilDue} jour(s)`, link: `/dashboard/rentals/${params.rentalId}` } });
}
export function publishDepositReleased(params: { userId: string; bookingId: string; amount: string; businessName: string }) {
  pub({ type: DomainEventType.DEPOSIT_RELEASED, userId: params.userId, payload: { bookingId: params.bookingId, amount: params.amount }, metadata: { bookingId: params.bookingId, amount: params.amount, businessName: params.businessName, link: '/dashboard/payments' } });
}

// ── Products / Stock ──
export function publishProductPublished(params: { userId: string; productId: string; businessId: string; productName: string }) {
  pub({ type: DomainEventType.PRODUCT_PUBLISHED, userId: params.userId, payload: { productId: params.productId, productName: params.productName }, metadata: { productId: params.productId, businessId: params.businessId, link: '/dashboard/products' } });
}
export function publishProductModified(params: { userId: string; productId: string; businessId: string; productName: string }) {
  pub({ type: DomainEventType.PRODUCT_MODIFIED, userId: params.userId, payload: { productId: params.productId, productName: params.productName }, metadata: { productId: params.productId, businessId: params.businessId, link: '/dashboard/products' } });
}
export function publishProductDeleted(params: { userId: string; productId: string; businessId: string; productName: string }) {
  pub({ type: DomainEventType.PRODUCT_DELETED, userId: params.userId, payload: { productId: params.productId, productName: params.productName }, metadata: { productId: params.productId, businessId: params.businessId, link: '/dashboard/products' } });
}
export function publishLowStock(params: { userId: string; productId: string; businessId: string; productName: string; remainingStock: number }) {
  pub({ type: DomainEventType.LOW_STOCK, userId: params.userId, payload: { productId: params.productId, productName: params.productName, remainingStock: params.remainingStock }, metadata: { productId: params.productId, businessId: params.businessId, link: '/dashboard/products' } });
}
export function publishOutOfStock(params: { userId: string; productId: string; businessId: string; productName: string }) {
  pub({ type: DomainEventType.OUT_OF_STOCK, userId: params.userId, payload: { productId: params.productId, productName: params.productName }, metadata: { productId: params.productId, businessId: params.businessId, link: '/dashboard/products' } });
}
export function publishBackInStock(params: { userId: string; productId: string; businessId: string; productName: string }) {
  pub({ type: DomainEventType.BACK_IN_STOCK, userId: params.userId, payload: { productId: params.productId, productName: params.productName }, metadata: { productId: params.productId, businessId: params.businessId, link: '/dashboard/products' } });
}

// ── Services ──
export function publishServicePublished(params: { userId: string; serviceId: string; businessId: string; serviceName: string }) {
  pub({ type: DomainEventType.SERVICE_PUBLISHED, userId: params.userId, payload: { serviceId: params.serviceId, serviceName: params.serviceName }, metadata: { serviceId: params.serviceId, businessId: params.businessId, link: '/dashboard/services' } });
}

// ── Reviews ──
export function publishReviewPublished(params: { userId: string; businessId: string; businessName: string; rating: number }) {
  pub({ type: DomainEventType.REVIEW_PUBLISHED, userId: params.userId, payload: { businessId: params.businessId, businessName: params.businessName, rating: params.rating }, metadata: { businessId: params.businessId, businessName: params.businessName, link: '/dashboard/reviews' } });
}
export function publishReviewResponse(params: { userId: string; businessId: string; businessName: string }) {
  pub({ type: DomainEventType.REVIEW_RESPONSE, userId: params.userId, payload: { businessId: params.businessId, businessName: params.businessName }, metadata: { businessId: params.businessId, businessName: params.businessName, link: '/dashboard/reviews' } });
}

// ── Messages ──
export function publishNewMessage(params: { userId: string; fromName: string; conversationId: string }) {
  pub({ type: DomainEventType.NEW_MESSAGE, userId: params.userId, payload: { fromName: params.fromName, conversationId: params.conversationId }, metadata: { businessName: params.fromName, link: '/dashboard/messages' } });
}

// ── Loyalty / Marketing ──
export function publishLoyaltyPointsEarned(params: { userId: string; businessId: string; points: number; reason: string }) {
  pub({ type: DomainEventType.LOYALTY_POINTS_EARNED, userId: params.userId, payload: { points: params.points, reason: params.reason }, metadata: { businessId: params.businessId, points: params.points, reason: params.reason, link: '/dashboard/loyalty' } });
}
export function publishLoyaltyTierChanged(params: { userId: string; businessId: string; tier: string }) {
  pub({ type: DomainEventType.LOYALTY_TIER_CHANGED, userId: params.userId, payload: { tier: params.tier }, metadata: { businessId: params.businessId, tier: params.tier, link: '/dashboard/loyalty' } });
}
export function publishCampaignScheduled(params: { userId: string; businessId: string; campaignId: string }) {
  pub({ type: DomainEventType.CAMPAIGN_SCHEDULED, userId: params.userId, payload: { campaignId: params.campaignId }, metadata: { campaignId: params.campaignId, businessId: params.businessId, link: '/dashboard/marketing' } });
}
export function publishCampaignSent(params: { userId: string; businessId: string; campaignId: string; channel: string }) {
  pub({ type: DomainEventType.CAMPAIGN_SENT, userId: params.userId, payload: { campaignId: params.campaignId, channel: params.channel }, metadata: { campaignId: params.campaignId, businessId: params.businessId, channel: params.channel, link: '/dashboard/marketing' } });
}
export function publishPromotionStarted(params: { userId: string; businessId: string; promotionId: string; promotionName: string }) {
  pub({ type: DomainEventType.PROMOTION_STARTED, userId: params.userId, payload: { promotionId: params.promotionId, promotionName: params.promotionName }, metadata: { promotionId: params.promotionId, businessId: params.businessId, link: '/dashboard/promotions' } });
}
export function publishFlashSaleStarted(params: { userId: string; businessId: string; promotionId: string; promotionName: string }) {
  pub({ type: DomainEventType.FLASH_SALE_STARTED, userId: params.userId, payload: { promotionId: params.promotionId, promotionName: params.promotionName }, metadata: { promotionId: params.promotionId, businessId: params.businessId, link: '/dashboard/promotions' } });
}
export function publishCartAbandoned(params: { userId: string; businessId: string; orderId: string; amount: string }) {
  pub({ type: DomainEventType.CART_ABANDONED, userId: params.userId, payload: { orderId: params.orderId, amount: params.amount }, metadata: { orderId: params.orderId, businessId: params.businessId, amount: params.amount, link: `/dashboard/orders/${params.orderId}` } });
}
export function publishClientInactive(params: { userId: string; businessId: string; daysInactive: number }) {
  pub({ type: DomainEventType.CLIENT_INACTIVE, userId: params.userId, payload: { daysInactive: params.daysInactive }, metadata: { businessId: params.businessId, reason: `${params.daysInactive} jours inactif`, link: '/dashboard/clients' } });
}
export function publishClientBirthday(params: { userId: string; businessId: string; clientName: string }) {
  pub({ type: DomainEventType.CLIENT_BIRTHDAY, userId: params.userId, payload: { clientName: params.clientName }, metadata: { businessId: params.businessId, businessName: params.clientName, link: '/dashboard/clients' } });
}

// ── Disputes ──
export function publishDisputeOpened(params: { userId: string; orderId: string; businessName: string }) {
  pub({ type: DomainEventType.DISPUTE_OPENED, userId: params.userId, payload: { orderId: params.orderId, businessName: params.businessName }, metadata: { orderId: params.orderId, businessName: params.businessName, link: `/dashboard/orders/${params.orderId}` } });
}
export function publishDisputeResolved(params: { userId: string; disputeId: string; businessName: string }) {
  pub({ type: DomainEventType.DISPUTE_RESOLVED, userId: params.userId, payload: { disputeId: params.disputeId, businessName: params.businessName }, metadata: { businessName: params.businessName, link: '/dashboard/disputes' } });
}

// ── Support ──
export function publishSupportTicketCreated(params: { userId: string; ticketId: string; subject: string; businessName?: string }) {
  pub({ type: DomainEventType.SUPPORT_TICKET_CREATED, userId: params.userId, payload: { ticketId: params.ticketId, subject: params.subject, businessName: params.businessName || '' }, metadata: { ticketId: params.ticketId, businessName: params.businessName, link: '/dashboard/support' } });
}
export function publishSupportTicketResponded(params: { userId: string; ticketId: string }) {
  pub({ type: DomainEventType.SUPPORT_TICKET_RESPONDED, userId: params.userId, payload: { ticketId: params.ticketId }, metadata: { ticketId: params.ticketId, link: '/dashboard/support' } });
}
export function publishSupportTicketClosed(params: { userId: string; ticketId: string }) {
  pub({ type: DomainEventType.SUPPORT_TICKET_CLOSED, userId: params.userId, payload: { ticketId: params.ticketId }, metadata: { ticketId: params.ticketId, link: '/dashboard/support' } });
}
export function publishEscalatedTicket(params: { userId: string; ticketId: string; subject: string; reason: string }) {
  pub({ type: DomainEventType.ESCALATED_TICKET, userId: params.userId, payload: { ticketId: params.ticketId, subject: params.subject, reason: params.reason }, metadata: { ticketId: params.ticketId, reason: params.reason, link: '/dashboard/support' } });
}
export function publishSatisfactionSurvey(params: { userId: string; orderId?: string; bookingId?: string; ticketId?: string }) {
  pub({ type: DomainEventType.SATISFACTION_SURVEY, userId: params.userId, payload: { orderId: params.orderId || '', bookingId: params.bookingId || '', ticketId: params.ticketId || '' }, metadata: { orderId: params.orderId, link: '/dashboard' } });
}

// ── Developer ──
export function publishModuleSubmitted(params: { userId: string; moduleId: string; moduleName: string }) {
  pub({ type: DomainEventType.MODULE_SUBMITTED, userId: params.userId, payload: { moduleId: params.moduleId, moduleName: params.moduleName }, metadata: { moduleId: params.moduleId, link: '/developer/modules' } });
}
export function publishModuleApproved(params: { userId: string; moduleId: string; moduleName: string }) {
  pub({ type: DomainEventType.MODULE_APPROVED, userId: params.userId, payload: { moduleId: params.moduleId, moduleName: params.moduleName }, metadata: { moduleId: params.moduleId, link: '/developer/modules' } });
}
export function publishModuleRejected(params: { userId: string; moduleId: string; moduleName: string; reason: string }) {
  pub({ type: DomainEventType.MODULE_REJECTED, userId: params.userId, payload: { moduleId: params.moduleId, moduleName: params.moduleName, reason: params.reason }, metadata: { moduleId: params.moduleId, reason: params.reason, link: '/developer/modules' } });
}
export function publishModuleBugReported(params: { userId: string; moduleId: string; moduleName: string }) {
  pub({ type: DomainEventType.MODULE_BUG_REPORTED, userId: params.userId, payload: { moduleId: params.moduleId, moduleName: params.moduleName }, metadata: { moduleId: params.moduleId, link: '/developer/modules' } });
}
export function publishDeveloperRevenueEarned(params: { userId: string; amount: string; moduleName: string }) {
  pub({ type: DomainEventType.DEVELOPER_REVENUE_EARNED, userId: params.userId, payload: { amount: params.amount, moduleName: params.moduleName }, metadata: { amount: params.amount, link: '/developer/revenue' } });
}
export function publishDeveloperPayoutProcessed(params: { userId: string; amount: string }) {
  pub({ type: DomainEventType.DEVELOPER_PAYOUT_PROCESSED, userId: params.userId, payload: { amount: params.amount }, metadata: { amount: params.amount, link: '/developer/revenue' } });
}

// ── Advertising ──
export function publishAdCreated(params: { userId: string; adId: string; businessId: string; businessName: string }) {
  pub({ type: DomainEventType.AD_CREATED, userId: params.userId, payload: { adId: params.adId, businessName: params.businessName }, metadata: { adId: params.adId, businessId: params.businessId, businessName: params.businessName, link: '/dashboard/ads' } });
}
export function publishAdApproved(params: { userId: string; adId: string; businessName: string }) {
  pub({ type: DomainEventType.AD_APPROVED, userId: params.userId, payload: { adId: params.adId, businessName: params.businessName }, metadata: { adId: params.adId, businessName: params.businessName, link: '/dashboard/ads' } });
}
export function publishAdRejected(params: { userId: string; adId: string; businessName: string; reason: string }) {
  pub({ type: DomainEventType.AD_REJECTED, userId: params.userId, payload: { adId: params.adId, businessName: params.businessName, reason: params.reason }, metadata: { adId: params.adId, businessName: params.businessName, reason: params.reason, link: '/dashboard/ads' } });
}
export function publishAdCompleted(params: { userId: string; adId: string; businessName: string }) {
  pub({ type: DomainEventType.AD_COMPLETED, userId: params.userId, payload: { adId: params.adId, businessName: params.businessName }, metadata: { adId: params.adId, businessName: params.businessName, link: '/dashboard/ads' } });
}

// ── Employee ──
export function publishEmployeeCreated(params: { userId: string; employeeId: string; businessId: string; employeeName: string }) {
  pub({ type: DomainEventType.EMPLOYEE_CREATED, userId: params.userId, payload: { employeeId: params.employeeId, employeeName: params.employeeName }, metadata: { employeeId: params.employeeId, businessId: params.businessId, link: '/dashboard/employees' } });
}
export function publishEmployeeAbsent(params: { userId: string; employeeId: string; businessId: string; employeeName: string }) {
  pub({ type: DomainEventType.EMPLOYEE_ABSENT, userId: params.userId, payload: { employeeId: params.employeeId, employeeName: params.employeeName }, metadata: { employeeId: params.employeeId, businessId: params.businessId, link: '/dashboard/employees' } });
}
export function publishEmployeeLate(params: { userId: string; employeeId: string; businessId: string; employeeName: string; lateMinutes: number }) {
  pub({ type: DomainEventType.EMPLOYEE_LATE, userId: params.userId, payload: { employeeId: params.employeeId, employeeName: params.employeeName, lateMinutes: params.lateMinutes }, metadata: { employeeId: params.employeeId, businessId: params.businessId, reason: `${params.lateMinutes} min de retard`, link: '/dashboard/employees' } });
}
export function publishDocumentExpiring(params: { userId: string; documentId: string; employeeId: string; businessId: string; documentTitle: string; daysUntilExpiry: number }) {
  pub({ type: DomainEventType.DOCUMENT_EXPIRING, userId: params.userId, payload: { documentId: params.documentId, documentTitle: params.documentTitle, daysUntilExpiry: params.daysUntilExpiry }, metadata: { employeeId: params.employeeId, businessId: params.businessId, reason: `Expire dans ${params.daysUntilExpiry} jours`, link: '/dashboard/employees' } });
}
export function publishLeaveRequested(params: { userId: string; employeeId: string; businessId: string; employeeName: string }) {
  pub({ type: DomainEventType.LEAVE_REQUESTED, userId: params.userId, payload: { employeeId: params.employeeId, employeeName: params.employeeName }, metadata: { employeeId: params.employeeId, businessId: params.businessId, link: '/dashboard/employees' } });
}
export function publishLeaveApproved(params: { userId: string; employeeId: string; businessId: string; employeeName: string }) {
  pub({ type: DomainEventType.LEAVE_APPROVED, userId: params.userId, payload: { employeeId: params.employeeId, employeeName: params.employeeName }, metadata: { employeeId: params.employeeId, businessId: params.businessId, link: '/dashboard/employees' } });
}
export function publishPayrollProcessed(params: { userId: string; businessId: string; amount: string }) {
  pub({ type: DomainEventType.PAYROLL_PROCESSED, userId: params.userId, payload: { amount: params.amount }, metadata: { businessId: params.businessId, amount: params.amount, link: '/dashboard/employees' } });
}

// ── Delivery ──
export function publishDeliveryAssigned(params: { userId: string; deliveryId: string; businessId: string; driverName?: string }) {
  pub({ type: DomainEventType.DELIVERY_ASSIGNED, userId: params.userId, payload: { deliveryId: params.deliveryId, driverName: params.driverName || '' }, metadata: { deliveryId: params.deliveryId, businessId: params.businessId, link: `/dashboard/delivery/${params.deliveryId}` } });
}
export function publishDeliveryStarted(params: { userId: string; deliveryId: string; businessId: string }) {
  pub({ type: DomainEventType.DELIVERY_STARTED, userId: params.userId, payload: { deliveryId: params.deliveryId }, metadata: { deliveryId: params.deliveryId, businessId: params.businessId, link: `/dashboard/delivery/${params.deliveryId}` } });
}
export function publishDeliveryCompleted(params: { userId: string; deliveryId: string; businessId: string }) {
  pub({ type: DomainEventType.DELIVERY_COMPLETED, userId: params.userId, payload: { deliveryId: params.deliveryId }, metadata: { deliveryId: params.deliveryId, businessId: params.businessId, link: `/dashboard/delivery/${params.deliveryId}` } });
}
export function publishDeliveryFailed(params: { userId: string; deliveryId: string; businessId: string; reason: string }) {
  pub({ type: DomainEventType.DELIVERY_FAILED, userId: params.userId, payload: { deliveryId: params.deliveryId, reason: params.reason }, metadata: { deliveryId: params.deliveryId, businessId: params.businessId, reason: params.reason, link: `/dashboard/delivery/${params.deliveryId}` } });
}
export function publishDeliveryNoStart(params: { userId: string; deliveryId: string; businessId: string; minutesElapsed: number }) {
  pub({ type: DomainEventType.DELIVERY_NO_START, userId: params.userId, payload: { deliveryId: params.deliveryId, minutesElapsed: params.minutesElapsed }, metadata: { deliveryId: params.deliveryId, businessId: params.businessId, reason: `Pas démarrée après ${params.minutesElapsed} min`, link: `/dashboard/delivery/${params.deliveryId}` } });
}
export function publishDeliveryReassigned(params: { userId: string; deliveryId: string; businessId: string; newDriverName: string }) {
  pub({ type: DomainEventType.DELIVERY_REASSIGNED, userId: params.userId, payload: { deliveryId: params.deliveryId, newDriverName: params.newDriverName }, metadata: { deliveryId: params.deliveryId, businessId: params.businessId, businessName: params.newDriverName, link: `/dashboard/delivery/${params.deliveryId}` } });
}

// ── AfriScore ──
export function publishScoreRecalculated(params: { userId: string; businessId: string; score: number; previousScore?: number }) {
  pub({ type: DomainEventType.SCORE_RECALCULATED, userId: params.userId, payload: { score: params.score, previousScore: params.previousScore || 0 }, metadata: { businessId: params.businessId, score: params.score, previousScore: params.previousScore, link: '/dashboard/afriscore' } });
}
export function publishBadgeEarned(params: { userId: string; businessId: string; badgeType: string }) {
  pub({ type: DomainEventType.BADGE_EARNED, userId: params.userId, payload: { badgeType: params.badgeType }, metadata: { badgeType: params.badgeType, businessId: params.businessId, link: '/dashboard/afriscore' } });
}
export function publishScoreImproved(params: { userId: string; businessId: string; score: number; previousScore: number }) {
  pub({ type: DomainEventType.SCORE_IMPROVED, userId: params.userId, payload: { score: params.score, previousScore: params.previousScore, improvement: params.score - params.previousScore }, metadata: { businessId: params.businessId, score: params.score, previousScore: params.previousScore, link: '/dashboard/afriscore' } });
}
export function publishScoreDecreased(params: { userId: string; businessId: string; score: number; previousScore: number }) {
  pub({ type: DomainEventType.SCORE_DECREASED, userId: params.userId, payload: { score: params.score, previousScore: params.previousScore, drop: params.previousScore - params.score }, metadata: { businessId: params.businessId, score: params.score, previousScore: params.previousScore, link: '/dashboard/afriscore' } });
}

// ── Security ──
export function publishSecurityAlert(params: { userId: string; location: string; device: string }) {
  pub({ type: DomainEventType.SECURITY_ALERT, userId: params.userId, payload: { location: params.location, device: params.device }, metadata: { device: params.device, location: params.location, link: '/dashboard/security' } });
}
export function publishNewDeviceDetected(params: { userId: string; device: string; location: string }) {
  pub({ type: DomainEventType.NEW_DEVICE_DETECTED, userId: params.userId, payload: { device: params.device, location: params.location }, metadata: { device: params.device, location: params.location, link: '/dashboard/security' } });
}
export function publishFraudAlert(params: { userId: string; reason: string; severity: string; metadata?: Record<string, unknown> }) {
  pub({ type: DomainEventType.FRAUD_ALERT, userId: params.userId, payload: { reason: params.reason, severity: params.severity }, metadata: { reason: params.reason, link: '/dashboard/security', ...params.metadata } });
}
export function publishSuspiciousActivity(params: { userId: string; reason: string; location?: string }) {
  pub({ type: DomainEventType.SUSPICIOUS_ACTIVITY, userId: params.userId, payload: { reason: params.reason, location: params.location || '' }, metadata: { reason: params.reason, location: params.location, link: '/dashboard/security' } });
}
export function publishAccountLocked(params: { userId: string; reason: string }) {
  pub({ type: DomainEventType.ACCOUNT_LOCKED, userId: params.userId, payload: { reason: params.reason }, metadata: { reason: params.reason, link: '/dashboard/security' } });
}

// ── System ──
export function publishSystemError(params: { userId: string; error: string; component: string }) {
  pub({ type: DomainEventType.SYSTEM_ERROR, userId: params.userId, payload: { error: params.error, component: params.component }, metadata: { reason: params.error } });
}
export function publishBackupFailed(params: { userId: string; error: string }) {
  pub({ type: DomainEventType.BACKUP_FAILED, userId: params.userId, payload: { error: params.error }, metadata: { reason: params.error } });
}

// ── Events & Training ──
export function publishEventPurchased(params: { userId: string; eventId: string; businessId: string; eventName: string }) {
  pub({ type: DomainEventType.EVENT_PURCHASED, userId: params.userId, payload: { eventId: params.eventId, eventName: params.eventName }, metadata: { businessId: params.businessId, link: '/dashboard/events' } });
}
export function publishTrainingPurchased(params: { userId: string; trainingId: string; trainingName: string }) {
  pub({ type: DomainEventType.TRAINING_PURCHASED, userId: params.userId, payload: { trainingId: params.trainingId, trainingName: params.trainingName }, metadata: { link: '/dashboard/trainings' } });
}
export function publishUpcomingEvent(params: { userId: string; eventId: string; businessId: string; eventName: string; daysUntil: number }) {
  pub({ type: DomainEventType.UPCOMING_EVENT, userId: params.userId, payload: { eventId: params.eventId, eventName: params.eventName, daysUntil: params.daysUntil }, metadata: { businessId: params.businessId, link: '/dashboard/events' } });
}

// ── Onboarding ──
export function publishOnboardingCompleted(params: { userId: string; businessId: string; businessName: string }) {
  pub({ type: DomainEventType.ONBOARDING_COMPLETED, userId: params.userId, payload: { businessId: params.businessId, businessName: params.businessName }, metadata: { businessId: params.businessId, businessName: params.businessName, link: '/dashboard' } });
}
export function publishSetupIncomplete(params: { userId: string; businessId: string; missingSteps: string[] }) {
  pub({ type: DomainEventType.SETUP_INCOMPLETE, userId: params.userId, payload: { missingSteps: params.missingSteps }, metadata: { businessId: params.businessId, link: '/dashboard/onboarding' } });
}

// ── Satisfaction & Admin ──
export function publishSurveyResponded(params: { userId: string; score: number; feedback?: string; orderId?: string; ticketId?: string }) {
  pub({ type: DomainEventType.SURVEY_RESPONDED, userId: params.userId, payload: { score: params.score, feedback: params.feedback || '', orderId: params.orderId || '', ticketId: params.ticketId || '' }, metadata: { score: params.score, reason: params.feedback, link: '/dashboard' } });
}
export function publishScoreCritical(params: { userId: string; businessId: string; score: number; previousScore?: number }) {
  pub({ type: DomainEventType.SCORE_CRITICAL, userId: params.userId, payload: { score: params.score, previousScore: params.previousScore || 0 }, metadata: { businessId: params.businessId, score: params.score, previousScore: params.previousScore, reason: `Score critique: ${params.score}`, link: '/dashboard/afriscore' } });
}
export function publishDailyReportReady(params: { userId: string; reportDate: string; stats: Record<string, unknown> }) {
  pub({ type: DomainEventType.DAILY_REPORT_READY, userId: params.userId, payload: { reportDate: params.reportDate, stats: params.stats }, metadata: { reason: `Rapport du ${params.reportDate}`, link: '/dashboard/admin' } });
}
export function publishWeeklyDevReport(params: { userId: string; weekStart: string; downloads: number; revenue: number; newReviews: number }) {
  pub({ type: DomainEventType.WEEKLY_DEV_REPORT, userId: params.userId, payload: { weekStart: params.weekStart, downloads: params.downloads, revenue: params.revenue, newReviews: params.newReviews }, metadata: { amount: params.revenue.toString(), link: '/developer/revenue' } });
}

// ── Debt ──
export function publishDebtCreated(params: { userId: string; debtId: string; businessId: string; amount: string; businessName?: string }) {
  pub({ type: DomainEventType.DEBT_CREATED, userId: params.userId, payload: { debtId: params.debtId, amount: params.amount, businessName: params.businessName || '' }, metadata: { debtId: params.debtId, businessId: params.businessId, amount: params.amount, businessName: params.businessName, link: '/dashboard/finance' } });
}
export function publishDebtSettled(params: { userId: string; debtId: string; businessId: string; amount: string }) {
  pub({ type: DomainEventType.DEBT_SETTLED, userId: params.userId, payload: { debtId: params.debtId, amount: params.amount }, metadata: { debtId: params.debtId, businessId: params.businessId, amount: params.amount, link: '/dashboard/finance' } });
}
export function publishDebtOverdue(params: { userId: string; debtId: string; businessId: string; amount: string }) {
  pub({ type: DomainEventType.DEBT_OVERDUE, userId: params.userId, payload: { debtId: params.debtId, amount: params.amount }, metadata: { debtId: params.debtId, businessId: params.businessId, amount: params.amount, link: '/dashboard/finance' } });
}

// ── Subscription ──
export function publishSubscriptionCreated(params: { userId: string; subscriptionId: string; planName: string }) {
  pub({ type: DomainEventType.SUBSCRIPTION_CREATED, userId: params.userId, payload: { subscriptionId: params.subscriptionId, planName: params.planName }, metadata: { subscriptionId: params.subscriptionId, link: '/dashboard/subscriptions' } });
}
export function publishSubscriptionCancelled(params: { userId: string; subscriptionId: string; planName: string }) {
  pub({ type: DomainEventType.SUBSCRIPTION_CANCELLED, userId: params.userId, payload: { subscriptionId: params.subscriptionId, planName: params.planName }, metadata: { subscriptionId: params.subscriptionId, link: '/dashboard/subscriptions' } });
}
export function publishSubscriptionRenewed(params: { userId: string; subscriptionId: string; planName: string }) {
  pub({ type: DomainEventType.SUBSCRIPTION_RENEWED, userId: params.userId, payload: { subscriptionId: params.subscriptionId, planName: params.planName }, metadata: { subscriptionId: params.subscriptionId, link: '/dashboard/subscriptions' } });
}
export function publishSubscriptionExpiring(params: { userId: string; subscriptionId: string; planName: string; daysUntilExpiry: number }) {
  pub({ type: DomainEventType.SUBSCRIPTION_EXPIRING, userId: params.userId, payload: { subscriptionId: params.subscriptionId, planName: params.planName, daysUntilExpiry: params.daysUntilExpiry }, metadata: { subscriptionId: params.subscriptionId, link: '/dashboard/subscriptions' } });
}

// ── CRM ──
export function publishClientSegmentChanged(params: { userId: string; businessId: string; segment: string }) {
  pub({ type: DomainEventType.CLIENT_SEGMENT_CHANGED, userId: params.userId, payload: { segment: params.segment }, metadata: { businessId: params.businessId, link: '/dashboard/clients' } });
}
export function publishClientLifetimeValueUpdated(params: { userId: string; businessId: string; lifetimeValue: number }) {
  pub({ type: DomainEventType.CLIENT_LIFETIME_VALUE_UPDATED, userId: params.userId, payload: { lifetimeValue: params.lifetimeValue }, metadata: { businessId: params.businessId, link: '/dashboard/clients' } });
}
export function publishNewClient(params: { userId: string; businessId: string; clientId: string; clientName: string }) {
  pub({ type: DomainEventType.NEW_CLIENT, userId: params.userId, payload: { clientId: params.clientId, clientName: params.clientName }, metadata: { businessId: params.businessId, businessName: params.clientName, link: '/dashboard/clients' } });
}
export function publishLtvRecalculated(params: { userId: string; businessId: string; clientId: string; ltv: number }) {
  pub({ type: DomainEventType.LTV_RECALCULATED, userId: params.userId, payload: { clientId: params.clientId, ltv: params.ltv }, metadata: { businessId: params.businessId, link: '/dashboard/clients' } });
}
export function publishWelcomeCouponIssued(params: { userId: string; businessId: string; clientId: string; couponCode: string; discountValue: string }) {
  pub({ type: DomainEventType.WELCOME_COUPON_ISSUED, userId: params.userId, payload: { clientId: params.clientId, couponCode: params.couponCode, discountValue: params.discountValue }, metadata: { businessId: params.businessId, amount: params.discountValue, link: '/dashboard/clients' } });
}
export function publishCrossSellOpportunity(params: { userId: string; businessId: string; clientId: string; productName: string; productId: string }) {
  pub({ type: DomainEventType.CROSS_SELL_OPPORTUNITY, userId: params.userId, payload: { clientId: params.clientId, productName: params.productName, productId: params.productId }, metadata: { businessId: params.businessId, productId: params.productId, link: `/dashboard/products/${params.productId}` } });
}

// ── Cart ──
export function publishCartItemAdded(params: { userId: string; productId?: string; name: string; quantity: number }) {
  pub({ type: DomainEventType.CART_ITEM_ADDED, userId: params.userId, payload: { productId: params.productId, name: params.name, quantity: params.quantity }, metadata: { productId: params.productId, link: '/dashboard/cart' } });
}
export function publishCheckoutInitiated(params: { userId: string; itemCount: number; totalAmount: string }) {
  pub({ type: DomainEventType.CHECKOUT_INITIATED, userId: params.userId, payload: { itemCount: params.itemCount, totalAmount: params.totalAmount }, metadata: { amount: params.totalAmount, link: '/dashboard/cart/checkout' } });
}
export function publishCheckoutCompleted(params: { userId: string; orderId: string; totalAmount: string }) {
  pub({ type: DomainEventType.CHECKOUT_COMPLETED, userId: params.userId, payload: { orderId: params.orderId, totalAmount: params.totalAmount }, metadata: { orderId: params.orderId, amount: params.totalAmount, link: `/dashboard/orders/${params.orderId}` } });
}

// ── Referral ──
export function publishReferralInvited(params: { userId: string; refereeEmail: string; code: string }) {
  pub({ type: DomainEventType.REFERRAL_INVITED, userId: params.userId, payload: { refereeEmail: params.refereeEmail, code: params.code }, metadata: { link: '/dashboard/loyalty/referral' } });
}
export function publishReferralConverted(params: { userId: string; refereeId: string; code: string }) {
  pub({ type: DomainEventType.REFERRAL_CONVERTED, userId: params.userId, payload: { refereeId: params.refereeId, code: params.code }, metadata: { link: '/dashboard/loyalty/referral' } });
}
export function publishReferralRewardAwarded(params: { userId: string; points: number; type: string }) {
  pub({ type: DomainEventType.REFERRAL_REWARD_AWARDED, userId: params.userId, payload: { points: params.points, type: params.type }, metadata: { points: params.points, link: '/dashboard/loyalty/referral' } });
}
