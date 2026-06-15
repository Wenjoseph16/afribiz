/**
 * MonetizationConfig unit tests
 *
 * Tests: getMonetizationSettings, getTransactionCommissionRate,
 *        getEscrowCommissionRate, calculateCommission
 */

import { mockPrisma } from '../setup';
import * as monetizationConfig from '../../services/monetizationConfig';

jest.mock('../../lib/db', () => ({
  prisma: mockPrisma,
}));

describe('MonetizationConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: no settings in DB -> should fall back to DEFAULTS
    (mockPrisma.platformSetting.findMany as jest.Mock).mockResolvedValue([]);
    (mockPrisma.commissionConfig.findMany as jest.Mock).mockResolvedValue([]);
  });

  describe('getMonetizationSettings', () => {
    it('should return default values when no settings exist', async () => {
      (mockPrisma.platformSetting.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.commissionConfig.findMany as jest.Mock).mockResolvedValue([]);

      const settings = await monetizationConfig.getMonetizationSettings();

      expect(settings.transactionCommissionRate).toBe(0.01);
      expect(settings.escrowCommissionRate).toBe(0.02);
      expect(settings.developerModuleCommissionRate).toBe(0.20);
      expect(settings.minimumEscrowFee).toBe(0);
      expect(settings.maximumEscrowFee).toBeNull();
      expect(settings.currency).toBe('FCFA');
    });

    it('should read rates from PlatformSetting', async () => {
      (mockPrisma.platformSetting.findMany as jest.Mock).mockResolvedValue([
        { key: 'transactionCommissionRate', value: 0.025 },
        { key: 'escrowCommissionRate', value: 0.03 },
        { key: 'currency', value: 'XOF' },
      ]);

      const settings = await monetizationConfig.getMonetizationSettings();

      expect(settings.transactionCommissionRate).toBe(0.025);
      expect(settings.escrowCommissionRate).toBe(0.03);
      expect(settings.currency).toBe('XOF');
    });

    it('should give priority to CommissionConfig over PlatformSetting', async () => {
      (mockPrisma.platformSetting.findMany as jest.Mock).mockResolvedValue([
        { key: 'transactionCommissionRate', value: 0.01 },
      ]);
      (mockPrisma.commissionConfig.findMany as jest.Mock).mockResolvedValue([
        {
          key: 'TRANSACTION_COMMISSION',
          rate: 3,
          minFee: null,
          maxFee: null,
          isActive: true,
        },
      ]);

      const settings = await monetizationConfig.getMonetizationSettings();

      expect(settings.transactionCommissionRate).toBe(0.03);
    });

    it('should return defaults on DB error', async () => {
      (mockPrisma.platformSetting.findMany as jest.Mock).mockRejectedValue(new Error('DB down'));

      const settings = await monetizationConfig.getMonetizationSettings();

      expect(settings.transactionCommissionRate).toBe(0.01);
      expect(settings.currency).toBe('FCFA');
    });
  });

  describe('getTransactionCommissionRate', () => {
    it('should return the transaction rate', async () => {
      (mockPrisma.platformSetting.findMany as jest.Mock).mockResolvedValue([
        { key: 'transactionCommissionRate', value: 0.02 },
      ]);

      const rate = await monetizationConfig.getTransactionCommissionRate();

      expect(rate).toBe(0.02);
    });
  });

  describe('calculateCommission', () => {
    it('should calculate transaction commission correctly', async () => {
      const result = await monetizationConfig.calculateCommission(10000, 'transaction');

      expect(result.rate).toBe(0.01);
      expect(result.commission).toBe(100);
      expect(result.netAmount).toBe(9900);
    });

    it('should calculate escrow commission correctly', async () => {
      const result = await monetizationConfig.calculateCommission(50000, 'escrow');

      expect(result.rate).toBe(0.02);
      expect(result.commission).toBe(1000);
      expect(result.netAmount).toBe(49000);
    });

    it('should apply minimum escrow fee when configured', async () => {
      (mockPrisma.platformSetting.findMany as jest.Mock).mockResolvedValue([
        { key: 'minimumEscrowFee', value: 500 },
      ]);

      const result = await monetizationConfig.calculateCommission(5000, 'escrow');

      expect(result.commission).toBe(500);
      expect(result.netAmount).toBe(4500);
    });

    it('should apply maximum escrow fee when configured', async () => {
      (mockPrisma.platformSetting.findMany as jest.Mock).mockResolvedValue([
        { key: 'maximumEscrowFee', value: 2000 },
      ]);

      const result = await monetizationConfig.calculateCommission(500000, 'escrow');

      expect(result.commission).toBe(2000);
      expect(result.netAmount).toBe(498000);
    });
  });
});
