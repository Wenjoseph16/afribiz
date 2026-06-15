import { DomainEventType, DomainEvent } from '../events';
import { eventBus } from '../EventBus';
import { handleNotificationEvent, handleEmailEvent } from '../../services/NotificationService';
import { logger } from '../../lib/logger';
import { getIO } from '../../services/socket';

export function registerNotificationHandlers(): void {
  eventBus.subscribeToAll(async (event: DomainEvent) => {
    const notification = await handleNotificationEvent(event);
    if (notification) {
      try {
        const io = getIO();
        io.to(`user:${event.userId}`).emit('notification:new', notification);
      } catch {
        // Socket.IO not initialized yet
      }
    }
  });

  eventBus.subscribeToAll(async (event: DomainEvent) => {
    await handleEmailEvent(event);
  });

  const count = Object.keys(DomainEventType).length / 2;
  logger.info(`Notification handlers registered for ${count} event types`);
}
