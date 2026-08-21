import { DomainEventType, DomainEvent } from '../events';
import { eventBus } from '../EventBus';
import { getIO } from '../../services/socket';
import { logger } from '../../lib/logger';

/**
 * Handler temps réel : pousse les changements de statut de transaction
 * vers les rooms `transaction:{type}:{id}` pour suivi en temps réel.
 *
 * Les clients rejoignent la room quand ils ouvrent une page détail
 * et la quittent quand ils naviguent ailleurs.
 */
let registered = false;

const TRACKING_EVENTS: DomainEventType[] = [
  // Orders
  DomainEventType.ORDER_PLACED,
  DomainEventType.ORDER_CONFIRMED,
  DomainEventType.ORDER_PREPARING,
  DomainEventType.ORDER_SHIPPED,
  DomainEventType.ORDER_DELIVERED,
  DomainEventType.ORDER_CANCELLED,
  DomainEventType.ORDER_ACCEPTED,
  DomainEventType.ORDER_REFUSED,
  // Bookings
  DomainEventType.BOOKING_CREATED,
  DomainEventType.BOOKING_CONFIRMED,
  DomainEventType.BOOKING_CANCELLED,
  // Rentals
  DomainEventType.RENTAL_CREATED,
  DomainEventType.RENTAL_RETURNED,
  DomainEventType.RENTAL_OVERDUE,
  // Events
  DomainEventType.EVENT_PURCHASED,
  // Subscriptions
  DomainEventType.SUBSCRIPTION_CREATED,
  DomainEventType.SUBSCRIPTION_CANCELLED,
  DomainEventType.SUBSCRIPTION_RENEWED,
  // Training
  DomainEventType.TRAINING_PURCHASED,
  // Delivery
  DomainEventType.DELIVERY_ASSIGNED,
  DomainEventType.DELIVERY_STARTED,
  DomainEventType.DELIVERY_COMPLETED,
  DomainEventType.DELIVERY_FAILED,
  DomainEventType.DELIVERY_REASSIGNED,
  // Payment
  DomainEventType.PAYMENT_RECEIVED,
  DomainEventType.PAYMENT_REFUNDED,
];

// Map event type → transaction type
function getTransactionType(event: DomainEventType): string | null {
  if (event.startsWith('ORDER_')) return 'ORDER';
  if (event.startsWith('BOOKING_')) return 'BOOKING';
  if (event.startsWith('RENTAL_')) return 'RENTAL';
  if (event === DomainEventType.EVENT_PURCHASED) return 'EVENT';
  if (event.startsWith('SUBSCRIPTION_')) return 'SUBSCRIPTION';
  if (event === DomainEventType.TRAINING_PURCHASED) return 'TRAINING';
  if (event.startsWith('DELIVERY_')) return 'ORDER';
  if (event.startsWith('PAYMENT_')) return 'ORDER';
  return null;
}

// Map event type → readable status label
function getStatusFromEvent(event: DomainEventType, payload: Record<string, unknown>): string {
  const status = payload.status as string | undefined;
  if (status) return status;

  switch (event) {
    case DomainEventType.ORDER_PLACED:
      return 'PENDING';
    case DomainEventType.ORDER_CONFIRMED:
      return 'CONFIRMED';
    case DomainEventType.ORDER_PREPARING:
      return 'PREPARING';
    case DomainEventType.ORDER_SHIPPED:
      return 'SHIPPED';
    case DomainEventType.ORDER_DELIVERED:
      return 'DELIVERED';
    case DomainEventType.ORDER_CANCELLED:
      return 'CANCELLED';
    case DomainEventType.ORDER_ACCEPTED:
      return 'ACCEPTED';
    case DomainEventType.ORDER_REFUSED:
      return 'REFUSED';
    case DomainEventType.BOOKING_CREATED:
      return 'PENDING';
    case DomainEventType.BOOKING_CONFIRMED:
      return 'CONFIRMED';
    case DomainEventType.BOOKING_CANCELLED:
      return 'CANCELLED';
    case DomainEventType.RENTAL_CREATED:
      return 'ACTIVE';
    case DomainEventType.RENTAL_RETURNED:
      return 'RETURNED';
    case DomainEventType.RENTAL_OVERDUE:
      return 'OVERDUE';
    case DomainEventType.SUBSCRIPTION_CREATED:
      return 'ACTIVE';
    case DomainEventType.SUBSCRIPTION_CANCELLED:
      return 'CANCELLED';
    case DomainEventType.SUBSCRIPTION_RENEWED:
      return 'RENEWED';
    case DomainEventType.DELIVERY_ASSIGNED:
      return 'DELIVERING';
    case DomainEventType.DELIVERY_STARTED:
      return 'DELIVERING';
    case DomainEventType.DELIVERY_COMPLETED:
      return 'DELIVERED';
    case DomainEventType.DELIVERY_FAILED:
      return 'CANCELLED';
    case DomainEventType.PAYMENT_RECEIVED:
      return 'PAID';
    case DomainEventType.PAYMENT_REFUNDED:
      return 'REFUNDED';
    default:
      return 'UPDATED';
  }
}

export function registerTransactionTrackingHandlers(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribeToAll(async (event: DomainEvent) => {
    if (!TRACKING_EVENTS.includes(event.type)) return;

    const io = getIO();
    if (!io) return;

    const txType = getTransactionType(event.type);
    if (!txType) return;

    const metadata = event.metadata || {};
    const payload = (event.payload || {}) as Record<string, unknown>;

    const txId =
      metadata.orderId ||
      metadata.bookingId ||
      metadata.rentalId ||
      metadata.subscriptionId ||
      (payload.id as string);
    if (!txId) return;

    const status = getStatusFromEvent(event.type, payload);
    const room = `transaction:${txType}:${txId}`;

    io.to(room).emit('transaction:update', {
      type: txType,
      id: txId,
      status,
      statusLabel: status,
      progress: undefined,
      timestamp: event.timestamp.toISOString(),
      message: payload.message as string | undefined,
      eventType: event.type,
    });

    logger.debug(`Transaction tracking emitted: ${event.type} → ${room}`);
  });

  logger.info('Transaction tracking handlers registered (realtime push)');
}
