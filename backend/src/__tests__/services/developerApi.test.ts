import { mockPrisma } from '../setup';
import * as developerApi from '../../services/developerApi';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: { findByUserId: jest.fn() },
}));

const { DeveloperRepository } = require('../../repositories/developerRepository');

const mockProfile = { id: 'dp-1', userId: 'u1', companyName: 'Dev Corp' };
const mockApiKey = {
  id: 'key-1',
  developerId: 'dp-1',
  name: 'Test Key',
  key: 'afb_dev_xxx',
  scopes: ['read'],
  isActive: true,
  createdAt: new Date(),
};
const mockWebhook = {
  id: 'wh-1',
  developerId: 'dp-1',
  url: 'https://example.com/hook',
  events: ['order.created'],
  secret: 'whsec_xxx',
  isActive: true,
  createdAt: new Date(),
};
const mockDelivery = {
  id: 'del-1',
  webhookId: 'wh-1',
  event: 'order.created',
  payload: {},
  status: 'PENDING',
  createdAt: new Date(),
};

describe('developerApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApiKey', () => {
    test('creates api key successfully', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.developerApiKey.create as jest.Mock).mockResolvedValue(mockApiKey);
      const r = await developerApi.createApiKey('u1', { name: 'Test Key', scopes: ['read'] });
      expect(r.id).toBe('key-1');
      expect(mockPrisma.developerApiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ developerId: 'dp-1', name: 'Test Key' }),
        })
      );
    });

    test('throws if developer profile not found', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(null);
      await expect(developerApi.createApiKey('u-x', { name: 'Test' })).rejects.toThrow(
        'Profil développeur non trouvé'
      );
    });
  });

  describe('getApiKeys', () => {
    test('returns api keys for developer', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.developerApiKey.findMany as jest.Mock).mockResolvedValue([mockApiKey]);
      const r = await developerApi.getApiKeys('u1');
      expect(r).toHaveLength(1);
    });

    test('throws if not found', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(null);
      await expect(developerApi.getApiKeys('u-x')).rejects.toThrow('Profil développeur non trouvé');
    });
  });

  describe('revokeApiKey', () => {
    test('revokes api key', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.developerApiKey.findFirst as jest.Mock).mockResolvedValue(mockApiKey);
      (mockPrisma.developerApiKey.update as jest.Mock).mockResolvedValue({
        ...mockApiKey,
        isActive: false,
      });
      const r = await developerApi.revokeApiKey('u1', 'key-1');
      expect(r.isActive).toBe(false);
    });

    test('throws if key not found', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.developerApiKey.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(developerApi.revokeApiKey('u1', 'bad-id')).rejects.toThrow(
        'Clé API non trouvée'
      );
    });
  });

  describe('createWebhook', () => {
    test('creates webhook', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.moduleWebhook.create as jest.Mock).mockResolvedValue(mockWebhook);
      const r = await developerApi.createWebhook('u1', {
        url: 'https://example.com/hook',
        events: ['order.created'],
      });
      expect(r.id).toBe('wh-1');
    });
  });

  describe('getWebhooks', () => {
    test('returns webhooks', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.moduleWebhook.findMany as jest.Mock).mockResolvedValue([mockWebhook]);
      const r = await developerApi.getWebhooks('u1');
      expect(r).toHaveLength(1);
    });
  });

  describe('deleteWebhook', () => {
    test('deletes webhook', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.moduleWebhook.findFirst as jest.Mock).mockResolvedValue(mockWebhook);
      (mockPrisma.moduleWebhook.delete as jest.Mock).mockResolvedValue(mockWebhook);
      const r = await developerApi.deleteWebhook('u1', 'wh-1');
      expect(r.success).toBe(true);
    });

    test('throws if webhook not found', async () => {
      DeveloperRepository.findByUserId.mockResolvedValue(mockProfile);
      (mockPrisma.moduleWebhook.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(developerApi.deleteWebhook('u1', 'bad-id')).rejects.toThrow(
        'Webhook non trouvé'
      );
    });
  });

  describe('triggerWebhookEvent', () => {
    test('triggers webhook event and creates deliveries', async () => {
      (mockPrisma.moduleWebhook.findMany as jest.Mock).mockResolvedValue([mockWebhook]);
      (mockPrisma.webhookDelivery.create as jest.Mock).mockResolvedValue(mockDelivery);
      const r = await developerApi.triggerWebhookEvent('order.created', { test: true });
      expect(r.triggered).toBe(1);
    });

    test('returns 0 triggered if no webhooks match', async () => {
      (mockPrisma.moduleWebhook.findMany as jest.Mock).mockResolvedValue([]);
      const r = await developerApi.triggerWebhookEvent('unknown.event', {});
      expect(r.triggered).toBe(0);
    });
  });

  describe('getWebhookDeliveries', () => {
    test('returns deliveries', async () => {
      (mockPrisma.webhookDelivery.findMany as jest.Mock).mockResolvedValue([mockDelivery]);
      const r = await developerApi.getWebhookDeliveries('wh-1', 10);
      expect(r).toHaveLength(1);
    });
  });
});
