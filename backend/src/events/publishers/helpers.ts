import { eventBus } from '../EventBus';
import { DomainEventType, DomainEvent } from '../events';

export function pub(event: {
  type: DomainEventType;
  userId: string;
  payload: Record<string, unknown>;
  metadata?: DomainEvent['metadata'];
}) {
  eventBus.publish({ ...event, timestamp: new Date() });
}

export function def<P extends { userId: string }>(
  type: DomainEventType,
  toPayload: (params: P) => Record<string, unknown>,
  toMetadata?: (params: P) => DomainEvent['metadata']
): (params: P) => void {
  return (params: P) =>
    pub({
      type,
      userId: params.userId,
      payload: toPayload(params),
      metadata: toMetadata?.(params),
    });
}
