import { DomainEventType, DomainEvent } from '../events';
import { def, pub } from './helpers';

export const publishOrderPlaced = def<{
  userId: string;
  orderId: string;
  businessName: string;
  amount: string;
  businessId?: string;
}>(
  DomainEventType.ORDER_PLACED,
  (p) => ({ orderId: p.orderId, businessName: p.businessName, amount: p.amount }),
  (p) => ({
    orderId: p.orderId,
    businessName: p.businessName,
    businessId: p.businessId,
    amount: p.amount,
    link: `/dashboard/orders/${p.orderId}`,
  })
);

const ORDER_STATUS_MAP: Record<string, DomainEventType> = {
  confirmed: DomainEventType.ORDER_CONFIRMED,
  accepted: DomainEventType.ORDER_ACCEPTED,
  refused: DomainEventType.ORDER_REFUSED,
  preparing: DomainEventType.ORDER_PREPARING,
  shipped: DomainEventType.ORDER_SHIPPED,
  delivered: DomainEventType.ORDER_DELIVERED,
  cancelled: DomainEventType.ORDER_CANCELLED,
};
export function publishOrderStatusChanged(params: {
  userId: string;
  orderId: string;
  status: string;
  businessName: string;
  businessId?: string;
}) {
  const eventType = ORDER_STATUS_MAP[params.status];
  if (!eventType) return;
  pub({
    type: eventType,
    userId: params.userId,
    payload: { orderId: params.orderId, status: params.status, businessName: params.businessName },
    metadata: {
      orderId: params.orderId,
      businessName: params.businessName,
      businessId: params.businessId,
      link: `/dashboard/orders/${params.orderId}`,
    } as DomainEvent['metadata'],
  });
}
export const publishOrderPendingReminder = def<{
  userId: string;
  orderId: string;
  businessName: string;
  amount: string;
  businessId: string;
  minutesElapsed: number;
  reminderLevel: string;
}>(
  DomainEventType.ORDER_PENDING_REMINDER,
  (p) => ({
    orderId: p.orderId,
    businessName: p.businessName,
    amount: p.amount,
    minutesElapsed: p.minutesElapsed,
    reminderLevel: p.reminderLevel,
  }),
  (p) => ({
    orderId: p.orderId,
    businessName: p.businessName,
    businessId: p.businessId,
    amount: p.amount,
    reason: `${p.minutesElapsed} min sans reponse`,
    link: `/dashboard/orders/${p.orderId}`,
  })
);
export const publishOrderAutoCancelled = def<{
  userId: string;
  orderId: string;
  businessName: string;
  businessId: string;
}>(
  DomainEventType.ORDER_AUTO_CANCELLED,
  (p) => ({ orderId: p.orderId, businessName: p.businessName }),
  (p) => ({
    orderId: p.orderId,
    businessName: p.businessName,
    businessId: p.businessId,
    reason: 'Annulation automatique - delai de reponse depasse',
    link: `/dashboard/orders/${p.orderId}`,
  })
);
export const publishDeliveryConfirmReminder = def<{
  userId: string;
  orderId: string;
  businessName: string;
  amount: string;
}>(
  DomainEventType.ORDER_DELIVERY_CONFIRM_REMINDER,
  (p) => ({ orderId: p.orderId, businessName: p.businessName, amount: p.amount }),
  (p) => ({
    orderId: p.orderId,
    businessName: p.businessName,
    amount: p.amount,
    link: `/dashboard/orders/${p.orderId}`,
  })
);
export const publishCartAbandoned = def<{
  userId: string;
  businessId: string;
  orderId: string;
  amount: string;
}>(
  DomainEventType.CART_ABANDONED,
  (p) => ({ orderId: p.orderId, amount: p.amount }),
  (p) => ({
    orderId: p.orderId,
    businessId: p.businessId,
    amount: p.amount,
    link: `/dashboard/orders/${p.orderId}`,
  })
);
export const publishDisputeOpened = def<{ userId: string; orderId: string; businessName: string }>(
  DomainEventType.DISPUTE_OPENED,
  (p) => ({ orderId: p.orderId, businessName: p.businessName }),
  (p) => ({
    orderId: p.orderId,
    businessName: p.businessName,
    link: `/dashboard/orders/${p.orderId}`,
  })
);
export const publishDisputeResolved = def<{
  userId: string;
  disputeId: string;
  businessName: string;
}>(
  DomainEventType.DISPUTE_RESOLVED,
  (p) => ({ disputeId: p.disputeId, businessName: p.businessName }),
  (p) => ({ businessName: p.businessName, link: '/dashboard/disputes' })
);
