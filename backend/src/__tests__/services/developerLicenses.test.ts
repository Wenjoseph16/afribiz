/**
 * Developer Licenses Service — unit tests
 */

import { mockPrisma } from '../setup';
import * as licensesService from '../../services/developerLicenses';
import { AppError } from '../../middlewares/errorHandler';

jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: {
    findByUserId: jest.fn().mockResolvedValue({ id: 'dev-1', userId: 'user-1' }),
  },
}));

describe('DeveloperLicensesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLicense', () => {
    it('should create a new license', async () => {
      (mockPrisma.moduleLicense.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.moduleLicense.create as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        licenseKey: 'AAAA-BBBB-CCCC-DDDD',
        status: 'PENDING',
      });

      const result = await licensesService.createLicense('module-1', 'biz-1', {
        licenseType: 'STANDARD',
        price: 50000,
      });
      expect(result).toHaveProperty('licenseKey');
      expect(result.licenseKey).toMatch(/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/);
    });

    it('should throw if duplicate active license exists', async () => {
      (mockPrisma.moduleLicense.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing',
        status: 'ACTIVE',
      });

      await expect(
        licensesService.createLicense('module-1', 'biz-1', { licenseType: 'STANDARD' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('activateLicense', () => {
    it('should activate a pending license', async () => {
      (mockPrisma.moduleLicense.findUnique as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        licenseKey: 'KEY-1',
        status: 'PENDING',
      });
      (mockPrisma.moduleLicense.update as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        status: 'ACTIVE',
        startsAt: new Date(),
      });

      const result = await licensesService.activateLicense('KEY-1');
      expect(result.status).toBe('ACTIVE');
    });

    it('should throw if license not found', async () => {
      (mockPrisma.moduleLicense.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(licensesService.activateLicense('INVALID')).rejects.toThrow(AppError);
    });

    it('should throw if license not pending', async () => {
      (mockPrisma.moduleLicense.findUnique as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        status: 'ACTIVE',
      });
      await expect(licensesService.activateLicense('KEY-1')).rejects.toThrow(AppError);
    });
  });

  describe('revokeLicense', () => {
    it('should revoke license as developer', async () => {
      (mockPrisma.moduleLicense.findUnique as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        status: 'ACTIVE',
        module: { developerId: 'dev-1' },
      });
      (mockPrisma.moduleLicense.update as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        status: 'REVOKED',
        revokedAt: new Date(),
        revokeReason: 'Violation',
      });

      const result = await licensesService.revokeLicense('user-1', 'lic-1', 'Violation');
      expect(result.status).toBe('REVOKED');
    });

    it('should throw if not authorized', async () => {
      (mockPrisma.moduleLicense.findUnique as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        module: { developerId: 'dev-2' },
      });
      await expect(licensesService.revokeLicense('user-1', 'lic-1')).rejects.toThrow(AppError);
    });
  });

  describe('renewLicense', () => {
    it('should renew with future expiry', async () => {
      (mockPrisma.moduleLicense.findUnique as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        status: 'ACTIVE',
      });
      (mockPrisma.moduleLicense.update as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        status: 'ACTIVE',
        expiresAt: new Date(),
      });

      const result = await licensesService.renewLicense('lic-1', { durationDays: 30 });
      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.moduleLicense.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'lic-1' },
        })
      );
    });
  });

  describe('checkLicense', () => {
    it('should return valid for active license', async () => {
      (mockPrisma.moduleLicense.findFirst as jest.Mock).mockResolvedValue({
        id: 'lic-1',
        expiresAt: null,
        status: 'ACTIVE',
      });

      const result = await licensesService.checkLicense('module-1', 'biz-1');
      expect(result.valid).toBe(true);
    });

    it('should return invalid when no license', async () => {
      (mockPrisma.moduleLicense.findFirst as jest.Mock).mockResolvedValue(null);
      const result = await licensesService.checkLicense('module-1', 'biz-1');
      expect(result.valid).toBe(false);
    });
  });

  describe('getModuleLicenses', () => {
    it('should return licenses with business info', async () => {
      (mockPrisma.moduleLicense.findMany as jest.Mock).mockResolvedValue([
        { id: 'lic-1', business: { id: 'biz-1', name: 'Biz 1' } },
        { id: 'lic-2', business: { id: 'biz-2', name: 'Biz 2' } },
      ]);

      const result = await licensesService.getModuleLicenses('module-1');
      expect(result).toHaveLength(2);
      expect(mockPrisma.moduleLicense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { moduleId: 'module-1' },
        })
      );
    });
  });

  describe('getBusinessLicenses', () => {
    it('should return licenses for business with module info', async () => {
      (mockPrisma.moduleLicense.findMany as jest.Mock).mockResolvedValue([
        { id: 'lic-1', module: { id: 'mod-1', name: 'Mod 1' } },
      ]);

      const result = await licensesService.getBusinessLicenses('biz-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.moduleLicense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { businessId: 'biz-1' },
        })
      );
    });
  });

  describe('getLicenseStats', () => {
    it('should return aggregated stats', async () => {
      (mockPrisma.moduleLicense.count as jest.Mock).mockResolvedValueOnce(10);
      (mockPrisma.moduleLicense.count as jest.Mock).mockResolvedValueOnce(5);
      (mockPrisma.moduleLicense.count as jest.Mock).mockResolvedValueOnce(2);
      (mockPrisma.moduleLicense.count as jest.Mock).mockResolvedValueOnce(1);
      (mockPrisma.moduleLicense.aggregate as jest.Mock).mockResolvedValue({
        _sum: { price: 250000 },
      });

      const result = await licensesService.getLicenseStats('dev-1');
      expect(result.total).toBe(10);
      expect(result.active).toBe(5);
      expect(result.expired).toBe(2);
      expect(result.revoked).toBe(1);
      expect(result.monthlyRevenue).toBe(250000);
    });
  });
});
