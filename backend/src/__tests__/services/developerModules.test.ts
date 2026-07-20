/**
 * Developer Modules Service — unit tests for new functions
 */

import { mockPrisma } from '../setup';
import * as modulesService from '../../services/developerModules';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: {
    findByUserId: jest.fn().mockResolvedValue({ id: 'dev-1', userId: 'user-1' }),
  },
}));

jest.mock('../../services/monetizationConfig', () => ({
  getMonetizationSettings: jest.fn().mockResolvedValue({ developerModuleCommissionRate: 0.2 }),
}));

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('DeveloperModulesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableBalance', () => {
    it('should calculate available balance from revenue minus payouts', async () => {
      (mockPrisma.developerRevenue.aggregate as jest.Mock).mockResolvedValue({
        _sum: { netAmount: 100000 },
      });
      (mockPrisma.developerPayout.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 30000 },
      });

      const result = await modulesService.getAvailableBalance('dev-1');
      expect(result).toEqual({ available: 70000, earned: 100000, paid: 30000 });
    });

    it('should handle zero revenue and payouts', async () => {
      (mockPrisma.developerRevenue.aggregate as jest.Mock).mockResolvedValue({
        _sum: { netAmount: null },
      });
      (mockPrisma.developerPayout.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await modulesService.getAvailableBalance('dev-1');
      expect(result).toEqual({ available: 0, earned: 0, paid: 0 });
    });
  });

  describe('requestPayout', () => {
    it('should create a payout when balance is sufficient', async () => {
      (mockPrisma.developerRevenue.aggregate as jest.Mock).mockResolvedValue({
        _sum: { netAmount: 100000 },
      });
      (mockPrisma.developerPayout.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 0 },
      });
      (mockPrisma.developerPayout.create as jest.Mock).mockResolvedValue({
        id: 'payout-1',
        amount: 50000,
        status: 'PENDING',
      });

      const result = await modulesService.requestPayout('user-1', {
        amount: 50000,
        method: 'MOBILE_MONEY',
      });

      expect(result).toHaveProperty('id', 'payout-1');
      expect(result.status).toBe('PENDING');
    });

    it('should throw when balance is insufficient', async () => {
      (mockPrisma.developerRevenue.aggregate as jest.Mock).mockResolvedValue({
        _sum: { netAmount: 10000 },
      });
      (mockPrisma.developerPayout.aggregate as jest.Mock).mockResolvedValue({
        _sum: { amount: 0 },
      });

      await expect(
        modulesService.requestPayout('user-1', { amount: 50000, method: 'BANK_TRANSFER' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('reinstallModule', () => {
    it('should reinstall an uninstalled module', async () => {
      const mockInstallation = {
        id: 'inst-1',
        moduleId: 'mod-1',
        businessId: 'biz-1',
        status: 'UNINSTALLED',
        module: { isPublished: true },
      };
      (mockPrisma.developerModuleInstallation.findFirst as jest.Mock).mockResolvedValue(
        mockInstallation
      );
      (mockPrisma.developerModuleVersion.findFirst as jest.Mock).mockResolvedValue({
        id: 'ver-2',
        version: '2.0.0',
      });
      (mockPrisma.developerModuleInstallation.update as jest.Mock).mockResolvedValue({
        ...mockInstallation,
        status: 'ACTIVE',
        currentVersionId: 'ver-2',
      });
      (mockPrisma.moduleConfiguration.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await modulesService.reinstallModule('mod-1', 'biz-1', 'user-1');
      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.developerModuleInstallation.update).toHaveBeenCalled();
    });

    it('should throw if no uninstalled installation exists', async () => {
      (mockPrisma.developerModuleInstallation.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(modulesService.reinstallModule('mod-1', 'biz-1', 'user-1')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('renewModuleSubscription', () => {
    it('should renew an active subscription', async () => {
      (mockPrisma as any).developerModuleSubscription.findUnique = jest.fn().mockResolvedValue({
        id: 'sub-1',
        status: 'ACTIVE',
        period: 'MONTHLY',
        autoRenew: true,
      });
      (mockPrisma as any).developerModuleSubscription.update = jest.fn().mockResolvedValue({
        id: 'sub-1',
        status: 'ACTIVE',
        nextBillingAt: new Date(),
      });

      const result = await modulesService.renewModuleSubscription('sub-1');
      expect(result).toBeDefined();
      expect((mockPrisma as any).developerModuleSubscription.update).toHaveBeenCalled();
    });

    it('should throw if subscription not active', async () => {
      (mockPrisma as any).developerModuleSubscription.findUnique = jest.fn().mockResolvedValue({
        id: 'sub-1',
        status: 'EXPIRED',
      });

      await expect(modulesService.renewModuleSubscription('sub-1')).rejects.toThrow(AppError);
    });
  });

  describe('convertTrialToPaid', () => {
    it('should convert an expired trial installation', async () => {
      const mockInstallation = {
        id: 'inst-1',
        moduleId: 'mod-1',
        businessId: 'biz-1',
        status: 'EXPIRED',
        module: { pricingType: 'MONTHLY', currency: 'FCFA', price: 50000 },
      };
      (mockPrisma.developerModuleInstallation.findUnique as jest.Mock).mockResolvedValue(
        mockInstallation
      );
      (mockPrisma.developerModuleInstallation.update as jest.Mock).mockResolvedValue({
        ...mockInstallation,
        status: 'ACTIVE',
      });

      const result = await modulesService.convertTrialToPaid('inst-1', 50000);
      expect(result.success).toBe(true);
    });

    it('should throw if installation not expired', async () => {
      (mockPrisma.developerModuleInstallation.findUnique as jest.Mock).mockResolvedValue({
        id: 'inst-1',
        status: 'ACTIVE',
      });

      await expect(modulesService.convertTrialToPaid('inst-1', 50000)).rejects.toThrow(AppError);
    });
  });

  describe('approvePayout', () => {
    it('should approve a pending payout', async () => {
      (mockPrisma.developerPayout.findUnique as jest.Mock).mockResolvedValue({
        id: 'payout-1',
        developerId: 'dev-1',
        amount: 50000,
        currency: 'FCFA',
        status: 'PENDING',
      });
      (mockPrisma.developerProfile.findUnique as jest.Mock).mockResolvedValue({
        id: 'dev-1',
        userId: 'user-1',
        companyName: 'DevCo',
      });

      const result = await modulesService.approvePayout('payout-1', 'admin-1');
      expect(result.success).toBe(true);
      expect(mockPrisma.developerPayout.findUnique).toHaveBeenCalledWith({
        where: { id: 'payout-1' },
      });
    });
  });
});
