import { mockPrisma } from '../setup';
import { eventBus } from '../../events/EventBus';
import { CampaignEngineService } from '../../services/CampaignEngineService';
import { DomainEvent, DomainEventType } from '../../events/events';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../events/EventBus', () => ({
  eventBus: { subscribeToAll: jest.fn() },
}));

const mockCampaign = {
  id: 'c1',
  businessId: 'b1',
  name: 'Camp 1',
  trigger: 'ORDER_PLACED',
  status: 'ACTIVE',
  steps: [
    {
      id: 's1',
      name: 'Step 1',
      actionType: 'SEND_NOTIFICATION',
      actionConfig: { title: 'Hello {{name}}', description: 'Test' },
      delayMinutes: 0,
      delayHours: 0,
      delayDays: 0,
      stepOrder: 0,
      isActive: true,
    },
  ],
};
const mockEvent: DomainEvent = {
  type: DomainEventType.ORDER_PLACED,
  userId: 'u1',
  payload: { name: 'John' },
  metadata: { businessId: 'b1' },
  timestamp: new Date(),
};

describe('CampaignEngineService', () => {
  beforeEach(() => {
    CampaignEngineService.stop();
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    CampaignEngineService.stop();
    jest.useRealTimers();
  });

  describe('start', () => {
    test('subscribes to event bus and sets interval', () => {
      CampaignEngineService.start();
      expect(eventBus.subscribeToAll as jest.Mock).toHaveBeenCalled();
      // Starting again should be no-op
      CampaignEngineService.start();
      expect(eventBus.subscribeToAll as jest.Mock).toHaveBeenCalledTimes(1);
    });
  });

  describe('processEvent', () => {
    test('finds and executes matching campaign', async () => {
      jest.spyOn(mockPrisma.campaign, 'findMany').mockResolvedValue([mockCampaign]);
      jest.spyOn(mockPrisma.notification, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.campaignExecutionLog, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.campaignExecutionLog, 'update').mockResolvedValue({} as any);

      await CampaignEngineService.processEvent(mockEvent);
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    test('does nothing for unmapped event type', async () => {
      const unmappedEvent: DomainEvent = {
        type: 'UNKNOWN' as any,
        userId: 'u1',
        payload: {},
        metadata: {},
        timestamp: new Date(),
      };
      await CampaignEngineService.processEvent(unmappedEvent);
      expect(mockPrisma.campaign.findMany).not.toHaveBeenCalled();
    });
  });

  describe('executeStepAction', () => {
    test('executes SEND_NOTIFICATION action', async () => {
      jest.spyOn(mockPrisma.notification, 'create').mockResolvedValue({} as any);
      await (CampaignEngineService as any).executeStepAction(
        {
          id: 's1',
          actionType: 'SEND_NOTIFICATION',
          actionConfig: { title: 'Hi', description: 'Test' },
        },
        mockCampaign,
        mockEvent
      );
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    test('executes APPLY_DISCOUNT action', async () => {
      jest.spyOn(mockPrisma.coupon, 'create').mockResolvedValue({} as any);
      await (CampaignEngineService as any).executeStepAction(
        {
          id: 's1',
          actionType: 'APPLY_DISCOUNT',
          actionConfig: { percentage: 10, reason: 'Welcome!' },
        },
        mockCampaign,
        mockEvent
      );
      expect(mockPrisma.coupon.create).toHaveBeenCalled();
    });

    test('executes LOG_EVENT action', async () => {
      await (CampaignEngineService as any).executeStepAction(
        { id: 's1', actionType: 'LOG_EVENT', actionConfig: {} },
        mockCampaign,
        mockEvent
      );
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('processScheduledCampaigns', () => {
    test('activates due scheduled campaigns', async () => {
      jest.spyOn(mockPrisma.campaign, 'findMany').mockResolvedValue([mockCampaign]);
      jest.spyOn(mockPrisma.campaign, 'update').mockResolvedValue(mockCampaign);
      jest.spyOn(mockPrisma.notification, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.campaignExecutionLog, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.campaignExecutionLog, 'update').mockResolvedValue({} as any);

      await CampaignEngineService.processScheduledCampaigns();
      expect(mockPrisma.campaign.update).toHaveBeenCalled();
    });
  });

  describe('processPendingSteps', () => {
    test('processes due pending steps', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      jest.spyOn(mockPrisma.campaignExecutionLog, 'findMany').mockResolvedValue([
        {
          id: 'log1',
          campaignId: 'c1',
          userId: 'u1',
          stepId: 's1',
          businessId: 'b1',
          result: 'SCHEDULED',
          metadata: {
            scheduledAt: pastDate,
            actionType: 'LOG_EVENT',
            actionConfig: {},
            stepName: 'Step 1',
            eventType: 'ORDER_PLACED',
            eventPayload: { name: 'John' },
          },
        } as any,
      ]);
      jest.spyOn(mockPrisma.campaign, 'findUnique').mockResolvedValue(mockCampaign);
      jest.spyOn(mockPrisma.campaignExecutionLog, 'update').mockResolvedValue({} as any);

      await CampaignEngineService.processPendingSteps();
      expect(mockPrisma.campaignExecutionLog.update).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    test('stops the service', () => {
      CampaignEngineService.start();
      CampaignEngineService.stop();
      // Should be able to stop twice without error
      CampaignEngineService.stop();
    });
  });
});
