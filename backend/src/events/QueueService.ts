import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { DomainEvent, DomainEventType } from './events';

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

export class QueueService {
  static async enqueue(event: DomainEvent): Promise<void> {
    try {
      await prisma.queuedEvent.create({
        data: {
          type: event.type,
          userId: event.userId,
          payload: event.payload as any,
          metadata: (event.metadata || {}) as any,
          status: 'PENDING',
          maxRetries: MAX_RETRIES,
        },
      });
    } catch (error) {
      logger.error('Failed to persist event to queue', { error, eventType: event.type });
    }
  }

  static async dequeue(batchSize: number = BATCH_SIZE): Promise<DomainEvent[]> {
    const rows = await prisma.queuedEvent.findMany({
      where: {
        status: 'PENDING',
        attempts: { lt: MAX_RETRIES },
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    if (rows.length === 0) return [];

    await prisma.queuedEvent.updateMany({
      where: { id: { in: rows.map(r => r.id) } },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });

    return rows.map(row => ({
      type: row.type as DomainEventType,
      userId: row.userId,
      payload: row.payload as Record<string, unknown>,
      metadata: row.metadata as Record<string, unknown> | undefined,
      timestamp: new Date(row.createdAt),
      _queueId: row.id,
    })) as DomainEvent[];
  }

  static async markCompleted(queueId: string): Promise<void> {
    await prisma.queuedEvent.update({
      where: { id: queueId },
      data: { status: 'COMPLETED', processedAt: new Date() },
    });
  }

  static async markFailed(queueId: string, error: string): Promise<void> {
    await prisma.queuedEvent.update({
      where: { id: queueId },
      data: {
        status: 'FAILED',
        error,
        updatedAt: new Date(),
      },
    });
  }

  static async replayPending(handler: (event: DomainEvent) => Promise<void>): Promise<number> {
    let processed = 0;
    let batch = await QueueService.dequeue();

    while (batch.length > 0) {
      await Promise.allSettled(
        batch.map(async (event) => {
          try {
            await handler(event);
            await QueueService.markCompleted((event as any)._queueId);
            processed++;
          } catch (err: any) {
            logger.error('Replay handler failed', { eventType: event.type, error: err.message });
            await QueueService.markFailed((event as any)._queueId, err.message);
          }
        })
      );
      batch = await QueueService.dequeue();
    }

    return processed;
  }

  static async cleanupProcessed(olderThanDays: number = 7): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const result = await prisma.queuedEvent.deleteMany({
      where: {
        status: 'COMPLETED',
        processedAt: { lt: cutoff },
      },
    });
    return result.count;
  }
}
