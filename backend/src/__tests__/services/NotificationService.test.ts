import { mockPrisma } from '../setup';
import { NotificationChannel } from '@prisma/client';
import { DomainEventType } from '../../events/events';

const mockCreate = jest.fn().mockResolvedValue('notif-1');
const mockCreateDelivery = jest.fn().mockResolvedValue(undefined);
const mockGetEnabledChannels = jest.fn();

jest.mock('../../repositories/notificationRepository', () => ({
  notificationRepository: {
    create: jest.fn().mockResolvedValue('notif-1'),
    createDelivery: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../repositories/notificationPreferenceRepository', () => ({
  notificationPreferenceRepository: {
    getEnabledChannels: jest.fn(),
  },
}));

jest.mock('../../repositories/notificationTemplateRepository', () => ({
  notificationTemplateRepository: {
    findByBusinessAndType: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/mail', () => ({ sendEmail: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../../services/NotificationChannels', () => ({
  processDelivery: jest.fn().mockResolvedValue(true),
}));

import * as NotificationService from '../../services/NotificationService';

describe('NotificationService', () => {
  const mockEvent = {
    type: DomainEventType.ORDER_PLACED,
    userId: 'user-1',
    metadata: {
      orderId: 'ORD-001',
      businessName: 'Biz',
      businessId: 'biz-1',
      link: '/orders/ORD-001',
    },
    payload: {},
    timestamp: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const {
      notificationPreferenceRepository,
    } = require('../../repositories/notificationPreferenceRepository');
    notificationPreferenceRepository.getEnabledChannels.mockResolvedValue([
      NotificationChannel.IN_APP,
    ]);
  });

  describe('handleNotificationEvent', () => {
    it('should create notification and return result', async () => {
      const result = await NotificationService.handleNotificationEvent(mockEvent);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('notif-1');
    });

    it('should return null if notification type not mapped', async () => {
      const result = await NotificationService.handleNotificationEvent({
        ...mockEvent,
        type: 'UNKNOWN' as any,
      });
      expect(result).toBeNull();
    });

    it('should return null if no channels enabled', async () => {
      const {
        notificationPreferenceRepository,
      } = require('../../repositories/notificationPreferenceRepository');
      notificationPreferenceRepository.getEnabledChannels.mockResolvedValue([]);
      const result = await NotificationService.handleNotificationEvent(mockEvent);
      expect(result).toBeNull();
    });
  });

  describe('handleEmailEvent', () => {
    it('should send email if EMAIL channel enabled', async () => {
      const {
        notificationPreferenceRepository,
      } = require('../../repositories/notificationPreferenceRepository');
      notificationPreferenceRepository.getEnabledChannels.mockResolvedValue([
        NotificationChannel.EMAIL,
      ]);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        firstName: 'John',
      });
      await NotificationService.handleEmailEvent(mockEvent);
      const { sendEmail } = require('../../lib/mail');
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should skip if EMAIL channel not enabled', async () => {
      const {
        notificationPreferenceRepository,
      } = require('../../repositories/notificationPreferenceRepository');
      notificationPreferenceRepository.getEnabledChannels.mockResolvedValue([
        NotificationChannel.IN_APP,
      ]);
      await NotificationService.handleEmailEvent(mockEvent);
      const { sendEmail } = require('../../lib/mail');
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });
});
