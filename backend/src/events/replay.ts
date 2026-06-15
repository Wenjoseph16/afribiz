import { prisma } from '../lib/db';
import { eventBus } from './EventBus';
import { DomainEvent, DomainEventType } from './events';
import { logger } from '../lib/logger';

export async function replayPendingEvents(): Promise<number> {
  const pending = await prisma.queuedEvent.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });

  if (pending.length === 0) return 0;

  logger.info(`Replaying ${pending.length} pending events from queue`);

  for (const row of pending) {
    try {
      const event: DomainEvent = {
        type: row.type as DomainEventType,
        userId: row.userId,
        payload: row.payload as Record<string, unknown>,
        metadata: row.metadata as Record<string, unknown> | undefined,
        timestamp: new Date(row.createdAt),
      };

      eventBus.emit(event.type, event);

      await prisma.queuedEvent.update({
        where: { id: row.id },
        data: { status: 'COMPLETED', processedAt: new Date() },
      });
    } catch (err: any) {
      logger.error('Replay failed for event', { eventId: row.id, error: err.message });
      await prisma.queuedEvent.update({
        where: { id: row.id },
        data: { status: 'FAILED', error: err.message },
      });
    }
  }

  logger.info(`Replayed ${pending.length} events`);
  return pending.length;
}
