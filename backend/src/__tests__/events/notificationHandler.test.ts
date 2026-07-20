import { DomainEventType } from '../../events/events';
import { eventBus } from '../../events/EventBus';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../services/NotificationService', () => ({
  handleNotificationEvent: jest.fn().mockResolvedValue({ id: 'notif-1', type: 'SYSTEM' }),
  handleEmailEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../services/socket', () => ({
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  }),
}));

jest.mock('../../events/EventBus', () => ({
  eventBus: { subscribeToAll: jest.fn() },
}));

import { registerNotificationHandlers } from '../../events/handlers/notificationHandler';
import * as notificationService from '../../services/NotificationService';
import { getIO } from '../../services/socket';

describe('registerNotificationHandlers — event handling', () => {
  let capturedCallback: (...args: unknown[]) => unknown;

  beforeAll(() => {
    (eventBus.subscribeToAll as jest.Mock).mockImplementation(
      (cb: (...args: unknown[]) => unknown) => {
        capturedCallback = cb;
      }
    );
    registerNotificationHandlers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call handleNotificationEvent and handleEmailEvent on event', async () => {
    await capturedCallback({
      type: DomainEventType.ORDER_PLACED,
      userId: 'user-1',
      payload: { orderId: 'order-1' },
      metadata: { orderId: 'order-1' },
      timestamp: new Date(),
    });

    expect(notificationService.handleNotificationEvent).toHaveBeenCalled();
    expect(notificationService.handleEmailEvent).toHaveBeenCalled();
  });

  it('should emit socket notification when notification is returned', async () => {
    await capturedCallback({
      type: DomainEventType.ORDER_PLACED,
      userId: 'user-1',
      payload: {},
      metadata: { orderId: 'order-1' },
      timestamp: new Date(),
    });

    expect(getIO()!.to).toHaveBeenCalledWith('user:user-1');
  });

  it('should not emit socket if notification is null', async () => {
    (notificationService.handleNotificationEvent as jest.Mock).mockResolvedValueOnce(null);

    await capturedCallback({
      type: DomainEventType.ORDER_PLACED,
      userId: 'user-1',
      payload: {},
      metadata: { orderId: 'order-1' },
      timestamp: new Date(),
    });

    expect(getIO()!.to).not.toHaveBeenCalled();
  });

  it('should not crash if socket is not available', async () => {
    (getIO as jest.Mock).mockReturnValueOnce(null);

    await expect(
      capturedCallback({
        type: DomainEventType.ORDER_PLACED,
        userId: 'user-1',
        payload: {},
        metadata: { orderId: 'order-1' },
        timestamp: new Date(),
      })
    ).resolves.toBeUndefined();
  });
});

describe('registerNotificationHandlers — guard', () => {
  it('should subscribe only once even if called multiple times', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { eventBus: eb } = require('../../events/EventBus');
      eb.subscribeToAll = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const {
        registerNotificationHandlers: rnh,
      } = require('../../events/handlers/notificationHandler');
      rnh();
      rnh();
      rnh();
      expect(eb.subscribeToAll).toHaveBeenCalledTimes(1);
    });
  });
});
