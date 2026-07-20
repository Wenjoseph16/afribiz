/**
 * Developer Analytics Service — unit tests
 */

import { mockPrisma } from '../setup';
import * as analyticsService from '../../services/developerAnalytics';

jest.mock('../../repositories/developerRepository', () => ({
  DeveloperRepository: {
    findByUserId: jest.fn().mockResolvedValue({ id: 'dev-1', userId: 'user-1' }),
  },
}));

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

describe('DeveloperAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackAnalytics', () => {
    it('should create new analytics record', async () => {
      (mockPrisma.moduleAnalytics.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.moduleAnalytics.create as jest.Mock).mockResolvedValue({
        id: 'analytics-1',
        moduleId: 'module-1',
        date: TODAY,
        installs: 5,
        uninstalls: 0,
        activeUsers: 10,
        errors: 0,
        apiCalls: 100,
        revenue: 50000,
        refunds: 0,
      });

      const result = await analyticsService.trackAnalytics('module-1', {
        installs: 5,
        activeUsers: 10,
        apiCalls: 100,
        revenue: 50000,
      });
      expect(result).toHaveProperty('id');
      expect(result.installs).toBe(5);
    });

    it('should update existing record with increments', async () => {
      (mockPrisma.moduleAnalytics.findUnique as jest.Mock).mockResolvedValue({
        id: 'analytics-1',
        moduleId: 'module-1',
        date: TODAY,
        installs: 2,
        activeUsers: 5,
      });
      (mockPrisma.moduleAnalytics.update as jest.Mock).mockResolvedValue({
        id: 'analytics-1',
        installs: 3,
        activeUsers: 10,
      });

      await analyticsService.trackAnalytics('module-1', { installs: 1, activeUsers: 10 });
      expect(mockPrisma.moduleAnalytics.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'analytics-1' },
          data: expect.objectContaining({ installs: { increment: 1 } }),
        })
      );
    });
  });

  describe('getModuleAnalytics', () => {
    it('should return daily data with totals', async () => {
      (mockPrisma.moduleAnalytics.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'a1',
          date: new Date('2026-01-01'),
          installs: 5,
          uninstalls: 0,
          errors: 1,
          apiCalls: 50,
          revenue: 25000,
          refunds: 0,
          activeUsers: 10,
          avgResponseTime: null,
        },
        {
          id: 'a2',
          date: new Date('2026-01-02'),
          installs: 3,
          uninstalls: 1,
          errors: 0,
          apiCalls: 80,
          revenue: 30000,
          refunds: 0,
          activeUsers: 12,
          avgResponseTime: 150,
        },
      ]);
      const result = await analyticsService.getModuleAnalytics('module-1');
      expect(result.daily).toHaveLength(2);
      expect(result.totals.totalInstalls).toBe(8);
      expect(result.totals.totalRevenue).toBe(55000);
    });
  });

  describe('logModuleError / getModuleErrors / resolveError', () => {
    it('should create, list and resolve errors', async () => {
      (mockPrisma.moduleErrorLog.create as jest.Mock).mockResolvedValue({
        id: 'err-1',
        errorType: 'RUNTIME_ERROR',
        resolved: false,
      });
      (mockPrisma.moduleErrorLog.findMany as jest.Mock).mockResolvedValue([
        { id: 'err-1', errorType: 'RUNTIME_ERROR', resolved: false },
      ]);
      (mockPrisma.moduleErrorLog.update as jest.Mock).mockResolvedValue({
        id: 'err-1',
        resolved: true,
        resolvedAt: new Date(),
      });

      const log = await analyticsService.logModuleError('module-1', {
        errorType: 'RUNTIME_ERROR',
        errorMessage: 'test error',
      });
      expect(log).toHaveProperty('id');

      const errors = await analyticsService.getModuleErrors('module-1', false);
      expect(errors).toHaveLength(1);

      await analyticsService.resolveError('err-1');
      expect(mockPrisma.moduleErrorLog.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'err-1' } })
      );
    });
  });

  describe('getDeveloperAnalyticsOverview', () => {
    it('should return aggregated overview', async () => {
      (mockPrisma.developerModule.findMany as jest.Mock).mockResolvedValue([
        { id: 'module-1', name: 'Module 1' },
        { id: 'module-2', name: 'Module 2' },
      ]);
      (mockPrisma.moduleAnalytics.aggregate as jest.Mock).mockResolvedValue({
        _sum: {
          installs: 10,
          uninstalls: 2,
          errors: 5,
          apiCalls: 500,
          revenue: 100000,
          refunds: 0,
        },
      });
      (mockPrisma.moduleErrorLog.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.moduleErrorLog.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'err-1',
          errorType: 'API_ERROR',
          module: { id: 'module-1', name: 'Module 1', slug: 'module-1' },
        },
      ]);

      const result = await analyticsService.getDeveloperAnalyticsOverview('dev-1');
      expect(result.totalModules).toBe(2);
      expect(result.analytics.totalInstalls).toBe(10);
      expect(result.analytics.totalApiCalls).toBe(500);
      expect(result.unresolvedErrors).toBe(3);
      expect(result.recentErrors).toHaveLength(1);
    });
  });
});
