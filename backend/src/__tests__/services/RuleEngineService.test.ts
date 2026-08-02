import { mockPrisma } from '../setup';
import { DomainEventType } from '../../events/events';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/EventBus', () => ({
  eventBus: { subscribeToAll: jest.fn() },
}));

import { RuleEngineService } from '../../services/RuleEngineService';

describe('RuleEngineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should subscribe to all events', () => {
      RuleEngineService['initialized'] = false;
      const { eventBus } = require('../../events/EventBus');
      RuleEngineService.start();
      expect(eventBus.subscribeToAll).toHaveBeenCalled();
    });
  });

  describe('processEvent', () => {
    const mockEvent = {
      type: DomainEventType.ORDER_PLACED,
      userId: 'user-1',
      payload: { amount: 100 },
      metadata: { businessId: 'biz-1' },
      timestamp: new Date(),
    };

    it('should process a mapped event and execute rules', async () => {
      (mockPrisma.automationRule.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'rule-1',
          name: 'Test Rule',
          trigger: 'ORDER_PLACED',
          status: 'ACTIVE',
          conditions: null,
          actionType: 'LOG_EVENT',
          actionConfig: null,
          cooldownMinutes: 0,
          lastExecutedAt: null,
        },
      ]);
      (mockPrisma.automationRule.update as jest.Mock).mockResolvedValue({});
      (mockPrisma.automationExecutionLog.create as jest.Mock).mockResolvedValue({});
      await RuleEngineService.processEvent(mockEvent);
      expect(mockPrisma.automationRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { trigger: 'ORDER_PLACED', status: 'ACTIVE' } })
      );
    });

    it('should skip unmapped events', async () => {
      await RuleEngineService.processEvent({ ...mockEvent, type: 'UNMAPPED' as any });
      expect(mockPrisma.automationRule.findMany).not.toHaveBeenCalled();
    });

    it('should skip if no active rules', async () => {
      (mockPrisma.automationRule.findMany as jest.Mock).mockResolvedValue([]);
      await RuleEngineService.processEvent(mockEvent);
      expect(mockPrisma.automationRule.update).not.toHaveBeenCalled();
    });

    it('should map expanded events to enum triggers (signup -> NEW_CLIENT)', async () => {
      (mockPrisma.automationRule.findMany as jest.Mock).mockResolvedValue([]);
      await RuleEngineService.processEvent({
        ...mockEvent,
        type: DomainEventType.USER_SIGNED_UP,
      });
      expect(mockPrisma.automationRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { trigger: 'NEW_CLIENT', status: 'ACTIVE' } })
      );
    });

    it('should map INVOICE_PAID to PAYMENT_RECEIVED trigger', async () => {
      (mockPrisma.automationRule.findMany as jest.Mock).mockResolvedValue([]);
      await RuleEngineService.processEvent({ ...mockEvent, type: DomainEventType.INVOICE_PAID });
      expect(mockPrisma.automationRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { trigger: 'PAYMENT_RECEIVED', status: 'ACTIVE' } })
      );
    });
  });
});
