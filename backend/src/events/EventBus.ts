import { EventEmitter } from 'events';
import { DomainEvent, DomainEventType } from './events';
import { logger } from '../lib/logger';
import { QueueService } from './QueueService';

type EventHandler = (event: DomainEvent) => void | Promise<void>;

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe(eventType: DomainEventType, handler: EventHandler): void {
    this.on(eventType, handler);
    logger.debug(`Handler subscribed to ${eventType}`);
  }

  async publish(event: DomainEvent): Promise<void> {
    logger.info(`Publishing event: ${event.type} for user ${event.userId}`);

    // Persist event to PostgreSQL queue before emitting
    // Ensures at-least-once delivery: events survive restarts
    await QueueService.enqueue(event);

    this.emit(event.type, event);
  }

  subscribeToAll(handler: EventHandler): void {
    const types = Object.values(DomainEventType);
    types.forEach((type) => this.subscribe(type, handler));
  }
}

export const eventBus = EventBus.getInstance();
