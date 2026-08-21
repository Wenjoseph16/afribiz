import { DomainEventType, DomainEvent } from '../events';
import { def, pub } from './helpers';

export const publishNewMessage = def<{ userId: string; fromName: string; conversationId: string }>(
  DomainEventType.NEW_MESSAGE,
  (p) => ({ fromName: p.fromName, conversationId: p.conversationId }),
  (p) => ({ businessName: p.fromName, link: '/dashboard/messages' })
);
export const publishLoyaltyPointsEarned = def<{
  userId: string;
  businessId: string;
  points: number;
  reason: string;
}>(
  DomainEventType.LOYALTY_POINTS_EARNED,
  (p) => ({ points: p.points, reason: p.reason }),
  (p) => ({
    businessId: p.businessId,
    points: p.points,
    reason: p.reason,
    link: '/dashboard/loyalty',
  })
);
export const publishLoyaltyTierChanged = def<{ userId: string; businessId: string; tier: string }>(
  DomainEventType.LOYALTY_TIER_CHANGED,
  (p) => ({ tier: p.tier }),
  (p) => ({ businessId: p.businessId, tier: p.tier, link: '/dashboard/loyalty' })
);
export const publishClientInactive = def<{
  userId: string;
  businessId: string;
  daysInactive: number;
}>(
  DomainEventType.CLIENT_INACTIVE,
  (p) => ({ daysInactive: p.daysInactive }),
  (p) => ({
    businessId: p.businessId,
    reason: `${p.daysInactive} jours inactif`,
    link: '/dashboard/clients',
  })
);
export const publishClientBirthday = def<{
  userId: string;
  businessId: string;
  clientName: string;
}>(
  DomainEventType.CLIENT_BIRTHDAY,
  (p) => ({ clientName: p.clientName }),
  (p) => ({ businessId: p.businessId, businessName: p.clientName, link: '/dashboard/clients' })
);
export const publishNewClient = def<{
  userId: string;
  businessId: string;
  clientId: string;
  clientName: string;
}>(
  DomainEventType.NEW_CLIENT,
  (p) => ({ clientId: p.clientId, clientName: p.clientName }),
  (p) => ({ businessId: p.businessId, businessName: p.clientName, link: '/dashboard/clients' })
);
export const publishClientSegmentChanged = def<{
  userId: string;
  businessId: string;
  segment: string;
}>(
  DomainEventType.CLIENT_SEGMENT_CHANGED,
  (p) => ({ segment: p.segment }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/clients' })
);
export const publishClientLifetimeValueUpdated = def<{
  userId: string;
  businessId: string;
  lifetimeValue: number;
}>(
  DomainEventType.CLIENT_LIFETIME_VALUE_UPDATED,
  (p) => ({ lifetimeValue: p.lifetimeValue }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/clients' })
);
export const publishLtvRecalculated = def<{
  userId: string;
  businessId: string;
  clientId: string;
  ltv: number;
}>(
  DomainEventType.LTV_RECALCULATED,
  (p) => ({ clientId: p.clientId, ltv: p.ltv }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/clients' })
);
export const publishWelcomeCouponIssued = def<{
  userId: string;
  businessId: string;
  clientId: string;
  couponCode: string;
  discountValue: string;
}>(
  DomainEventType.WELCOME_COUPON_ISSUED,
  (p) => ({ clientId: p.clientId, couponCode: p.couponCode, discountValue: p.discountValue }),
  (p) => ({ businessId: p.businessId, amount: p.discountValue, link: '/dashboard/clients' })
);
export const publishCrossSellOpportunity = def<{
  userId: string;
  businessId: string;
  clientId: string;
  productName: string;
  productId: string;
}>(
  DomainEventType.CROSS_SELL_OPPORTUNITY,
  (p) => ({ clientId: p.clientId, productName: p.productName, productId: p.productId }),
  (p) => ({
    businessId: p.businessId,
    productId: p.productId,
    link: `/dashboard/products/${p.productId}`,
  })
);
export const publishReferralInvited = def<{ userId: string; refereeEmail: string; code: string }>(
  DomainEventType.REFERRAL_INVITED,
  (p) => ({ refereeEmail: p.refereeEmail, code: p.code }),
  (_p) => ({ link: '/dashboard/loyalty/referral' })
);
export const publishReferralConverted = def<{ userId: string; refereeId: string; code: string }>(
  DomainEventType.REFERRAL_CONVERTED,
  (p) => ({ refereeId: p.refereeId, code: p.code }),
  (_p) => ({ link: '/dashboard/loyalty/referral' })
);
export const publishReferralRewardAwarded = def<{ userId: string; points: number; type: string }>(
  DomainEventType.REFERRAL_REWARD_AWARDED,
  (p) => ({ points: p.points, type: p.type }),
  (p) => ({ points: p.points, link: '/dashboard/loyalty/referral' })
);
export const publishSatisfactionSurvey = def<{
  userId: string;
  orderId?: string;
  bookingId?: string;
  ticketId?: string;
  businessName?: string;
}>(
  DomainEventType.SATISFACTION_SURVEY,
  (p) => ({
    orderId: p.orderId || '',
    bookingId: p.bookingId || '',
    ticketId: p.ticketId || '',
    businessName: p.businessName || '',
  }),
  // Lien direct vers la page d'enquête (jamais de cul-de-sac : la page existe et
  // permet de noter + commenter, la réponse est enregistrée).
  (p) => {
    const link = p.orderId
      ? `/satisfaction?orderId=${p.orderId}`
      : p.bookingId
        ? `/satisfaction?bookingId=${p.bookingId}`
        : '/satisfaction';
    return { orderId: p.orderId, businessName: p.businessName, link };
  }
);
export const publishSurveyResponded = def<{
  userId: string;
  score: number;
  feedback?: string;
  orderId?: string;
  ticketId?: string;
}>(
  DomainEventType.SURVEY_RESPONDED,
  (p) => ({
    score: p.score,
    feedback: p.feedback || '',
    orderId: p.orderId || '',
    ticketId: p.ticketId || '',
  }),
  (p) => ({ score: p.score, reason: p.feedback, link: '/dashboard' })
);
export const publishSupportTicketCreated = def<{
  userId: string;
  ticketId: string;
  subject: string;
  businessName?: string;
}>(
  DomainEventType.SUPPORT_TICKET_CREATED,
  (p) => ({ ticketId: p.ticketId, subject: p.subject, businessName: p.businessName || '' }),
  (p) => ({ ticketId: p.ticketId, businessName: p.businessName, link: '/dashboard/support' })
);
export const publishSupportTicketResponded = def<{ userId: string; ticketId: string }>(
  DomainEventType.SUPPORT_TICKET_RESPONDED,
  (p) => ({ ticketId: p.ticketId }),
  (p) => ({ ticketId: p.ticketId, link: '/dashboard/support' })
);
export const publishSupportTicketClosed = def<{ userId: string; ticketId: string }>(
  DomainEventType.SUPPORT_TICKET_CLOSED,
  (p) => ({ ticketId: p.ticketId }),
  (p) => ({ ticketId: p.ticketId, link: '/dashboard/support' })
);
export const publishEscalatedTicket = def<{
  userId: string;
  ticketId: string;
  subject: string;
  reason: string;
}>(
  DomainEventType.ESCALATED_TICKET,
  (p) => ({ ticketId: p.ticketId, subject: p.subject, reason: p.reason }),
  (p) => ({ ticketId: p.ticketId, reason: p.reason, link: '/dashboard/support' })
);
export const publishSocialShareRequested = def<{
  userId: string;
  businessId: string;
  platform: string;
  content: string;
}>(
  DomainEventType.SOCIAL_SHARE_REQUESTED,
  (p) => ({ businessId: p.businessId, platform: p.platform, content: p.content }),
  (p) => ({ businessId: p.businessId, channel: p.platform })
);
export const publishSocialShareSuccess = def<{
  userId: string;
  businessId: string;
  platform: string;
}>(
  DomainEventType.SOCIAL_SHARE_SUCCESS,
  (p) => ({ businessId: p.businessId, platform: p.platform }),
  (p) => ({ businessId: p.businessId, channel: p.platform })
);
export const publishSocialShareFailed = def<{
  userId: string;
  businessId: string;
  platform: string;
  reason: string;
}>(
  DomainEventType.SOCIAL_SHARE_FAILED,
  (p) => ({ businessId: p.businessId, platform: p.platform, reason: p.reason }),
  (p) => ({ businessId: p.businessId, channel: p.platform, reason: p.reason })
);
export const publishFollowed = def<{
  userId: string;
  followerId: string;
  businessId?: string;
  developerId?: string;
  businessName: string;
}>(
  DomainEventType.FOLLOWED,
  (p) => ({
    followerId: p.followerId,
    businessId: p.businessId || '',
    developerId: p.developerId || '',
  }),
  (p) => ({ businessId: p.businessId, businessName: p.businessName, link: '/dashboard/followers' })
);
export const publishUnfollowed = def<{
  userId: string;
  followerId: string;
  businessId?: string;
  developerId?: string;
  businessName: string;
}>(
  DomainEventType.UNFOLLOWED,
  (p) => ({
    followerId: p.followerId,
    businessId: p.businessId || '',
    developerId: p.developerId || '',
  }),
  (p) => ({ businessId: p.businessId, businessName: p.businessName, link: '/dashboard/followers' })
);
export const publishFavoriteAdded = def<{
  userId: string;
  referenceId: string;
  type: string;
  businessId?: string;
  businessName?: string;
  itemName?: string;
}>(
  DomainEventType.FAVORITE_ADDED,
  (p) => ({ referenceId: p.referenceId, type: p.type, itemName: p.itemName || '' }),
  (p) => ({
    businessId: p.businessId,
    businessName: p.businessName,
    link: '/dashboard/favorites',
  })
);
export const publishFavoriteRemoved = def<{
  userId: string;
  referenceId: string;
  type: string;
  businessId?: string;
  businessName?: string;
  itemName?: string;
}>(
  DomainEventType.FAVORITE_REMOVED,
  (p) => ({ referenceId: p.referenceId, type: p.type, itemName: p.itemName || '' }),
  (p) => ({
    businessId: p.businessId,
    businessName: p.businessName,
    link: '/dashboard/favorites',
  })
);
export const publishBookingCreated = def<{
  userId: string;
  bookingId: string;
  businessName: string;
  businessId?: string;
}>(
  DomainEventType.BOOKING_CREATED,
  (p) => ({ bookingId: p.bookingId, businessName: p.businessName }),
  (p) => ({
    bookingId: p.bookingId,
    businessName: p.businessName,
    businessId: p.businessId,
    link: `/dashboard/bookings/${p.bookingId}`,
  })
);
const BOOKING_STATUS_MAP: Record<string, DomainEventType> = {
  confirmed: DomainEventType.BOOKING_CONFIRMED,
  cancelled: DomainEventType.BOOKING_CANCELLED,
};
export function publishBookingStatusChanged(params: {
  userId: string;
  bookingId: string;
  status: string;
  businessName: string;
  businessId?: string;
}) {
  const eventType = BOOKING_STATUS_MAP[params.status];
  if (!eventType) return;
  pub({
    type: eventType,
    userId: params.userId,
    payload: {
      bookingId: params.bookingId,
      status: params.status,
      businessName: params.businessName,
    },
    metadata: {
      bookingId: params.bookingId,
      businessName: params.businessName,
      businessId: params.businessId,
      link: `/dashboard/bookings/${params.bookingId}`,
    } as DomainEvent['metadata'],
  });
}
export const publishBookingReminder = def<{
  userId: string;
  bookingId: string;
  businessName: string;
}>(
  DomainEventType.BOOKING_REMINDER,
  (p) => ({ bookingId: p.bookingId, businessName: p.businessName }),
  (p) => ({
    bookingId: p.bookingId,
    businessName: p.businessName,
    link: `/dashboard/bookings/${p.bookingId}`,
  })
);
export const publishEventPurchased = def<{
  userId: string;
  eventId: string;
  businessId: string;
  eventName: string;
}>(
  DomainEventType.EVENT_PURCHASED,
  (p) => ({ eventId: p.eventId, eventName: p.eventName }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/events' })
);
export const publishUpcomingEvent = def<{
  userId: string;
  eventId: string;
  businessId: string;
  eventName: string;
  daysUntil: number;
}>(
  DomainEventType.UPCOMING_EVENT,
  (p) => ({ eventId: p.eventId, eventName: p.eventName, daysUntil: p.daysUntil }),
  (p) => ({ businessId: p.businessId, link: '/dashboard/events' })
);
export const publishTrainingPurchased = def<{
  userId: string;
  trainingId: string;
  trainingName: string;
}>(
  DomainEventType.TRAINING_PURCHASED,
  (p) => ({ trainingId: p.trainingId, trainingName: p.trainingName }),
  (_p) => ({ link: '/dashboard/trainings' })
);
