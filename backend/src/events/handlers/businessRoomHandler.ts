import { DomainEventType, DomainEvent } from '../events';
import { eventBus } from '../EventBus';
import { getIO } from '../../services/socket';
import { logger } from '../../lib/logger';

/**
 * Handler temps réel : pousse les événements métier vers la room socket
 * `business:{businessId}` pour rafraîchir le tableau de bord du commerce
 * sans polling HTTP.
 */
let registered = false;

const BUSINESS_EVENTS: DomainEventType[] = [
  DomainEventType.ORDER_PLACED,
  DomainEventType.ORDER_CONFIRMED,
  DomainEventType.ORDER_PREPARING,
  DomainEventType.ORDER_SHIPPED,
  DomainEventType.ORDER_DELIVERED,
  DomainEventType.ORDER_CANCELLED,
  DomainEventType.ORDER_ACCEPTED,
  DomainEventType.ORDER_REFUSED,
  DomainEventType.BOOKING_CREATED,
  DomainEventType.BOOKING_CONFIRMED,
  DomainEventType.BOOKING_CANCELLED,
  DomainEventType.REVIEW_PUBLISHED,
  DomainEventType.PROMOTION_STARTED,
  DomainEventType.FLASH_SALE_STARTED,
  DomainEventType.LOW_STOCK,
  DomainEventType.OUT_OF_STOCK,
  DomainEventType.NEW_CLIENT,
  DomainEventType.INVOICE_SENT,
  DomainEventType.INVOICE_PAID,
  DomainEventType.DELIVERY_STARTED,
  DomainEventType.DELIVERY_COMPLETED,
];

export function registerBusinessRoomHandlers(): void {
  if (registered) return;
  registered = true;

  eventBus.subscribeToAll(async (event: DomainEvent) => {
    if (!BUSINESS_EVENTS.includes(event.type)) return;

    const metadata = event.metadata || {};
    const businessId = metadata.businessId as string | undefined;
    if (!businessId) return;

    const io = getIO();
    if (!io) return;

    const socketEvent = `business:${event.type.toLowerCase()}`;
    io.to(`business:${businessId}`).emit(socketEvent, {
      type: event.type,
      payload: event.payload || {},
      metadata,
      timestamp: event.timestamp,
    });

    // Événement générique pour les clients qui écoutent une seule room
    io.to(`business:${businessId}`).emit('business:event', {
      type: event.type,
      payload: event.payload || {},
      metadata,
      timestamp: event.timestamp,
    });
  });

  logger.info('Business room handlers registered (realtime dashboard push)');
}
