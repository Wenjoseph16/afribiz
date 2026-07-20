import { DomainEventType, DomainEvent } from '../events';
import { eventBus } from '../EventBus';
import { handleNotificationEvent, handleEmailEvent } from '../../services/NotificationService';
import { logger } from '../../lib/logger';
import { getIO } from '../../services/socket';

let registered = false;

export function registerNotificationHandlers(): void {
  if (registered) return;
  registered = true;
  eventBus.subscribeToAll(async (event: DomainEvent) => {
    const [notification] = await Promise.all([
      handleNotificationEvent(event),
      handleEmailEvent(event),
    ]);
    if (notification) {
      const io = getIO();
      if (io) {
        io.to(`user:${event.userId}`).emit('notification:new', notification);
      }
    }
  });

  const count = Object.keys(DomainEventType).length;
  logger.info(`Notification handlers registered for ${count} event types`);
}
