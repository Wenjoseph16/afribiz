jest.mock('../../services/dataHubAnalytics', () => ({
  getSearchTrends: jest.fn(),
  getConversionFunnel: jest.fn(),
  getRetentionCohorts: jest.fn(),
  getProductRecommendations: jest.fn(),
  getEngagementAnalytics: jest.fn(),
}));

jest.mock('../../services/businessCopilot', () => ({
  generateDailyTips: jest.fn(),
  getBusinessHealth: jest.fn(),
  getModuleTips: jest.fn(),
  generateSmartTip: jest.fn(),
  generateDailyBriefForBusiness: jest.fn(),
}));

jest.mock('../../services/copilotBenchmark', () => ({ getPeerBenchmarks: jest.fn() }));
jest.mock('../../services/copilotAnomaly', () => ({ detectAnomalies: jest.fn() }));
jest.mock('../../services/copilotSeasonal', () => ({ getSeasonalOpportunities: jest.fn() }));
jest.mock('../../services/copilotReport', () => ({ generateWeeklyReport: jest.fn() }));
jest.mock('../../services/copilotOnboarding', () => ({ scheduleOnboardingSequence: jest.fn() }));
jest.mock('../../services/copilotNotificationService', () => ({
  generateBusinessNotifications: jest.fn(),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/dataHubAnalyticsController';
import * as analytics from '../../services/dataHubAnalytics';
import * as copilot from '../../services/businessCopilot';
import * as benchmark from '../../services/copilotBenchmark';
import * as anomaly from '../../services/copilotAnomaly';
import * as seasonal from '../../services/copilotSeasonal';
import * as report from '../../services/copilotReport';
import * as onboarding from '../../services/copilotOnboarding';
import * as notif from '../../services/copilotNotificationService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('dataHubAnalytics controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlatformStats', () => {
    it('should compute platform stats', async () => {
      mockPrisma.business.count.mockResolvedValue(100);
      mockPrisma.order.count.mockResolvedValue(500);
      mockPrisma.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 1000000 } });
      mockPrisma.business.aggregate.mockResolvedValue({ _avg: { rating: 4 } });
      mockPrisma.user.count.mockResolvedValue(1000);
      mockPrisma.product.count.mockResolvedValue(2000);
      const res = mockRes();
      ctrl.getPlatformStats(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalBusinesses: 100,
          totalOrders: 500,
          totalRevenue: 1000000,
          avgScore: 4,
          totalUsers: 1000,
          totalProducts: 2000,
        },
      });
    });
  });

  describe('getSectorBenchmarks', () => {
    it('should compute sector benchmarks', async () => {
      mockPrisma.business.findMany.mockResolvedValue([
        { type: 'RESTAURANT', rating: 4 },
        { type: 'RESTAURANT', rating: 3 },
        { type: 'SHOP', rating: 5 },
      ]);
      const res = mockRes();
      ctrl.getSectorBenchmarks(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalled();
      const data = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(data.sectors).toHaveLength(2);
      expect(data.sectors.find((s: any) => s.sector === 'RESTAURANT').avgScore).toBe(4);
    });
  });

  describe('getGeographicStats', () => {
    it('should compute geographic stats', async () => {
      mockPrisma.business.findMany.mockResolvedValue([
        { country: 'Cameroun', city: 'Douala', rating: 4 },
        { country: 'Cameroun', city: 'Yaounde', rating: 3 },
        { country: 'Senegal', city: 'Dakar', rating: 5 },
      ]);
      const res = mockRes();
      ctrl.getGeographicStats(req(), res, jest.fn());
      await flush();
      const data = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(data.regions).toHaveLength(2);
      expect(data.regions.find((r: any) => r.country === 'Cameroun').activeCities).toBe(2);
    });
  });

  describe('getGrowthStats', () => {
    it('should compute growth stats', async () => {
      mockPrisma.business.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      mockPrisma.order.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(500);
      const res = mockRes();
      ctrl.getGrowthStats(req(), res, jest.fn());
      await flush();
      const data = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(data.newBusinesses).toBe(10);
      expect(data.transactionGrowth).toBe(100);
    });
  });

  describe('getPaymentTrends', () => {
    it('should compute payment trends', async () => {
      mockPrisma.payment.count.mockResolvedValueOnce(100).mockResolvedValueOnce(80);
      mockPrisma.payment.aggregate
        .mockResolvedValueOnce({ _avg: { amount: 5000 } })
        .mockResolvedValueOnce({ _sum: { amount: 20000 } });
      const res = mockRes();
      ctrl.getPaymentTrends(req(), res, jest.fn());
      await flush();
      const data = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(data.totalPayments).toBe(100);
      expect(data.successRate).toBe(80);
    });
  });

  describe('getSearchTrends', () => {
    it('should get search trends', async () => {
      (analytics.getSearchTrends as jest.Mock).mockResolvedValue([{ query: 'test' }]);
      const res = mockRes();
      ctrl.getSearchTrends(req({ query: { days: '7' } }), res, jest.fn());
      await flush();
      expect(analytics.getSearchTrends).toHaveBeenCalledWith(7);
    });
  });

  describe('copilot endpoints', () => {
    beforeEach(() => {
      mockPrisma.business.findUnique.mockResolvedValue({
        id: 'b1',
        ownerId: 'u1',
        name: 'Biz',
        type: 'RESTAURANT',
      });
    });

    it('getDailyTips', async () => {
      (copilot.generateDailyTips as jest.Mock).mockResolvedValue({ tips: [] });
      const res = mockRes();
      ctrl.getDailyTips(req(), res, jest.fn());
      await flush();
      expect(copilot.generateDailyTips).toHaveBeenCalledWith('b1');
    });

    it('triggerCopilotNotifications', async () => {
      (notif.generateBusinessNotifications as jest.Mock).mockResolvedValue(3);
      const res = mockRes();
      ctrl.triggerCopilotNotifications(req(), res, jest.fn());
      await flush();
      expect(notif.generateBusinessNotifications).toHaveBeenCalledWith('b1', 'u1', 'Biz');
    });

    it('getBusinessHealth', async () => {
      (copilot.getBusinessHealth as jest.Mock).mockResolvedValue({
        healthScore: 85,
        status: 'good',
      });
      const res = mockRes();
      ctrl.getBusinessHealth(req(), res, jest.fn());
      await flush();
    });

    it('getBenchmarksCtrl', async () => {
      (benchmark.getPeerBenchmarks as jest.Mock).mockResolvedValue({ avgRating: 4.0 });
      const res = mockRes();
      ctrl.getBenchmarksCtrl(req(), res, jest.fn());
      await flush();
      expect(benchmark.getPeerBenchmarks).toHaveBeenCalled();
    });

    it('getAnomaliesCtrl', async () => {
      (anomaly.detectAnomalies as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getAnomaliesCtrl(req(), res, jest.fn());
      await flush();
      expect(anomaly.detectAnomalies).toHaveBeenCalledWith('b1');
    });

    it('getSeasonalCtrl', async () => {
      (seasonal.getSeasonalOpportunities as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getSeasonalCtrl(req(), res, jest.fn());
      await flush();
    });

    it('getWeeklyReportCtrl', async () => {
      (report.generateWeeklyReport as jest.Mock).mockResolvedValue({ report: 'data' });
      const res = mockRes();
      ctrl.getWeeklyReportCtrl(req(), res, jest.fn());
      await flush();
    });

    it('triggerOnboardingCtrl', async () => {
      (onboarding.scheduleOnboardingSequence as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.triggerOnboardingCtrl(req(), res, jest.fn());
      await flush();
      expect(onboarding.scheduleOnboardingSequence).toHaveBeenCalledWith('b1', 'admin_manual');
    });

    it('generateDailyAnalysisCtrl', async () => {
      (copilot.generateDailyTips as jest.Mock).mockResolvedValue({
        tips: [
          { message: 'High priority', priority: 'high' },
          { message: 'Low priority', priority: 'low' },
        ],
      });
      (copilot.getBusinessHealth as jest.Mock).mockResolvedValue({
        healthScore: 70,
        status: 'fair',
      });
      (copilot.generateDailyBriefForBusiness as jest.Mock).mockResolvedValue({
        brief: 'Daily brief',
      });
      const res = mockRes();
      ctrl.generateDailyAnalysisCtrl(req(), res, jest.fn());
      await flush();
      const data = (res.json as jest.Mock).mock.calls[0][0].data;
      expect(data.insights).toHaveLength(1);
      expect(data.riskLevel).toBe('medium');
    });

    it('getModuleTips', async () => {
      (copilot.getModuleTips as jest.Mock).mockResolvedValue({ tips: [] });
      const res = mockRes();
      ctrl.getModuleTips(req({ params: { moduleKey: 'POS' } }), res, jest.fn());
      await flush();
      expect(copilot.getModuleTips).toHaveBeenCalledWith('b1', 'POS');
    });

    it('should return 400 if moduleKey in body missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.generateSmartTipCtrl(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('errors', () => {
    it('should return 404 if business not found for business endpoints', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getConversionFunnel(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('should return 404 if business detail not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getBusinessDetails(req({ params: { id: 'invalid' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('getBusinessDetails should return business', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1', name: 'Biz' });
      const res = mockRes();
      ctrl.getBusinessDetails(req({ params: { id: 'b1' } }), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'b1', name: 'Biz' } });
    });
  });
});
