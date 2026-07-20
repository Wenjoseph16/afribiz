import { mockPrisma } from '../setup';
import { FraudDetectionService } from '../../services/fraudDetectionService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

describe('FraudDetectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLoginVelocity', () => {
    test('returns LOW severity when under threshold', async () => {
      (mockPrisma.securityLog.count as jest.Mock).mockResolvedValue(1);
      const r = await FraudDetectionService.checkLoginVelocity('u1', '127.0.0.1');
      expect(r.severity).toBe('LOW');
      expect(r.blocked).toBe(false);
    });

    test('returns MEDIUM severity when >= 3 failed logins', async () => {
      (mockPrisma.securityLog.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.fraudEvent.create as jest.Mock).mockResolvedValue({ id: 'fe-1' });
      const r = await FraudDetectionService.checkLoginVelocity('u1', '127.0.0.1');
      expect(r.severity).toBe('MEDIUM');
      expect(r.reason).toBe('Tentatives de connexion anormales');
    });
  });

  describe('checkTransactionVelocity', () => {
    test('returns LOW severity when under threshold', async () => {
      (mockPrisma.payment.count as jest.Mock).mockResolvedValue(5);
      const r = await FraudDetectionService.checkTransactionVelocity('u1');
      expect(r.severity).toBe('LOW');
      expect(r.blocked).toBe(false);
    });

    test('returns HIGH severity and blocked when >= 10 payments', async () => {
      (mockPrisma.payment.count as jest.Mock).mockResolvedValue(10);
      (mockPrisma.fraudEvent.create as jest.Mock).mockResolvedValue({ id: 'fe-1' });
      const r = await FraudDetectionService.checkTransactionVelocity('u1');
      expect(r.severity).toBe('HIGH');
      expect(r.blocked).toBe(true);
      expect(r.reason).toBe('Trop de tentatives de paiement');
    });
  });

  describe('checkOrderVelocity', () => {
    test('returns LOW severity when under threshold', async () => {
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(1);
      const r = await FraudDetectionService.checkOrderVelocity('u1');
      expect(r.severity).toBe('LOW');
    });

    test('returns HIGH severity when >= 3 orders', async () => {
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.fraudEvent.create as jest.Mock).mockResolvedValue({ id: 'fe-1' });
      const r = await FraudDetectionService.checkOrderVelocity('u1');
      expect(r.severity).toBe('HIGH');
      expect(r.blocked).toBe(false);
    });
  });

  describe('checkDeviceTrust', () => {
    const mockDevice = {
      id: 'dev-1',
      isTrusted: true,
      trustExpiresAt: new Date(Date.now() + 86400000),
      lastVerifiedAt: new Date(),
    };

    test('returns trusted for trusted device', async () => {
      (mockPrisma.device.findUnique as jest.Mock).mockResolvedValue(mockDevice);
      const r = await FraudDetectionService.checkDeviceTrust('u1', 'dev-1');
      expect(r.isTrusted).toBe(true);
      expect(r.isNewDevice).toBe(false);
    });

    test('returns not trusted if no deviceId', async () => {
      const r = await FraudDetectionService.checkDeviceTrust('u1', undefined);
      expect(r.isTrusted).toBe(false);
      expect(r.isNewDevice).toBe(true);
    });

    test('returns not trusted if device not found', async () => {
      (mockPrisma.device.findUnique as jest.Mock).mockResolvedValue(null);
      const r = await FraudDetectionService.checkDeviceTrust('u1', 'bad-id');
      expect(r.isTrusted).toBe(false);
      expect(r.isNewDevice).toBe(true);
    });

    test('marks device as untrusted if trust expired', async () => {
      const expiredDevice = {
        ...mockDevice,
        trustExpiresAt: new Date(Date.now() - 86400000),
        lastVerifiedAt: new Date(Date.now() - 40 * 86400000),
      };
      (mockPrisma.device.findUnique as jest.Mock).mockResolvedValue(expiredDevice);
      (mockPrisma.device.update as jest.Mock).mockResolvedValue({
        ...expiredDevice,
        isTrusted: false,
      });
      const r = await FraudDetectionService.checkDeviceTrust('u1', 'dev-1');
      expect(r.isTrusted).toBe(false);
    });
  });

  describe('verifyDevice', () => {
    test('marks device as trusted', async () => {
      (mockPrisma.device.update as jest.Mock).mockResolvedValue({ id: 'dev-1', isTrusted: true });
      await FraudDetectionService.verifyDevice('u1', 'dev-1');
      expect(mockPrisma.device.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isTrusted: true }) })
      );
    });
  });
});
