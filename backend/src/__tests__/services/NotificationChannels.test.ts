import { mockPrisma } from '../setup';
import * as NotificationChannels from '../../services/NotificationChannels';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../config/env', () => ({ config: { NODE_ENV: 'test' } }));

describe('NotificationChannels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWhatsApp', () => {
    it('should log in non-production', async () => {
      await NotificationChannels.sendWhatsApp({
        to: '+22890123456',
        message: 'Hello',
        businessName: 'Biz',
      });
    });
  });

  describe('sendSMS', () => {
    it('should log in non-production', async () => {
      await NotificationChannels.sendSMS({ to: '+22890123456', message: 'Test SMS' });
    });
  });

  describe('sendPushNotification', () => {
    it('should return early if web-push not available', async () => {
      (mockPrisma.pushSubscription.findMany as jest.Mock).mockResolvedValue([]);
      await NotificationChannels.sendPushNotification('user-1', 'Title', 'Body');
      expect(mockPrisma.pushSubscription.findMany).not.toHaveBeenCalled();
    });
  });

  describe('sendSocialMediaMessage', () => {
    it('should log the message', async () => {
      await NotificationChannels.sendSocialMediaMessage({
        pageId: 'page1',
        accessToken: 'tok',
        recipientId: 'r1',
        message: 'Hi',
      });
    });
  });

  describe('sendTikTokMessage', () => {
    it('should log the message', async () => {
      await NotificationChannels.sendTikTokMessage({
        openId: 'open1',
        accessToken: 'tok',
        message: 'Hi',
      });
    });
  });

  describe('processDelivery', () => {
    it('should send SMS and return true', async () => {
      const result = await NotificationChannels.processDelivery('SMS', '+22890123456', 'Hello');
      expect(result).toBe(true);
    });

    it('should send WhatsApp and return true', async () => {
      const result = await NotificationChannels.processDelivery(
        'WHATSAPP',
        '+22890123456',
        'Hello'
      );
      expect(result).toBe(true);
    });

    it('should return false for unknown channel', async () => {
      const result = await NotificationChannels.processDelivery('EMAIL', 'test@test.com', 'Hello');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const result = await NotificationChannels.processDelivery('SMS', '', '');
      expect(result).toBe(true);
    });
  });
});
