import { mockPrisma } from '../setup';

jest.mock('../../services/afriScoreService', () => ({
  computeBusinessScore: jest.fn(),
  getScoreHistory: jest.fn(),
  getBadges: jest.fn(),
  getSectorBenchmark: jest.fn(),
  recomputeAllScores: jest.fn(),
}));

jest.mock('../../services/afriDataHubService', () => ({
  getBusinessConsentCheck: jest.fn(),
  generateBusinessReport: jest.fn(),
  generateSectorReport: jest.fn(),
  getPlatformStats: jest.fn(),
  getSectorStats: jest.fn(),
  getGeographicStats: jest.fn(),
  getGrowthStats: jest.fn(),
  getConsumptionTrends: jest.fn(),
  getBookingTrends: jest.fn(),
  getDeliveryTrends: jest.fn(),
  getPaymentTrends: jest.fn(),
  computeSectorBenchmarks: jest.fn(),
}));

import * as ctrl from '../../controllers/afriScoreController';
import * as afriScoreService from '../../services/afriScoreService';
import * as afriDataHubService from '../../services/afriDataHubService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}
function partnerReq(overrides: any = {}) {
  return {
    user: { id: 'u1' },
    partner: { id: 'p1', name: 'Partner', type: 'BANK', slug: 'partner' },
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as any;
}

describe('afriScoreController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockBusiness = {
    id: 'b1',
    ownerId: 'u1',
    name: 'Biz',
    type: 'RESTAURANT',
    slug: 'biz',
    logo: 'l.png',
    city: 'Dakar',
    country: 'SN',
  };

  // ============= getMyScore =============
  describe('getMyScore', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyScore(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 404, message: 'Business not found' })
      );
    });

    it('returns score on success', async () => {
      const score = { id: 's1', overallScore: 750 };
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      (afriScoreService.computeBusinessScore as jest.Mock).mockResolvedValue(score);
      const res = mockRes();
      ctrl.getMyScore(req(), res, jest.fn());
      await flush();
      expect(afriScoreService.computeBusinessScore).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: score });
    });
  });

  // ============= getMyScoreHistory =============
  describe('getMyScoreHistory', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyScoreHistory(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('returns history on success', async () => {
      const history = [{ snapshotDate: '2024-01-01', overallScore: 700 }];
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      (afriScoreService.getScoreHistory as jest.Mock).mockResolvedValue(history);
      const res = mockRes();
      ctrl.getMyScoreHistory(req({ query: { period: 'MONTHLY' } }), res, jest.fn());
      await flush();
      expect(afriScoreService.getScoreHistory).toHaveBeenCalledWith('b1', 'MONTHLY');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: history });
    });
  });

  // ============= getMyBadges =============
  describe('getMyBadges', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyBadges(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('returns badges on success', async () => {
      const badges = [{ badge: 'TOP_SELLER', label: 'Top Vendeur' }];
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      (afriScoreService.getBadges as jest.Mock).mockResolvedValue(badges);
      const res = mockRes();
      ctrl.getMyBadges(req(), res, jest.fn());
      await flush();
      expect(afriScoreService.getBadges).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: badges });
    });
  });

  // ============= getMyBenchmark =============
  describe('getMyBenchmark', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyBenchmark(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('returns benchmark with score null when no businessScore exists', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.businessScore.findUnique.mockResolvedValue(null);
      (afriScoreService.getSectorBenchmark as jest.Mock).mockResolvedValue({ avgScore: 500 });
      const res = mockRes();
      ctrl.getMyBenchmark(req(), res, jest.fn());
      await flush();
      expect(afriScoreService.getSectorBenchmark).toHaveBeenCalledWith('RESTAURANT');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { myScore: null, benchmark: { avgScore: 500 } },
      });
    });

    it('returns benchmark with myScore', async () => {
      const myScore = { overallScore: 750, category: 'GOOD' };
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.businessScore.findUnique.mockResolvedValue(myScore);
      (afriScoreService.getSectorBenchmark as jest.Mock).mockResolvedValue({ avgScore: 500 });
      const res = mockRes();
      ctrl.getMyBenchmark(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { myScore: { overall: 750, category: 'GOOD' }, benchmark: { avgScore: 500 } },
      });
    });
  });

  // ============= getPublicScore =============
  describe('getPublicScore', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getPublicScore(req({ params: { businessId: 'b1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('returns public score with default values when no score exists', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.businessScore.findUnique.mockResolvedValue(null);
      (afriScoreService.getBadges as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getPublicScore(req({ params: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          business: mockBusiness,
          score: {
            overallScore: 0,
            category: 'VERY_LOW',
            commercialScore: 0,
            financialScore: 0,
            satisfactionScore: 0,
            reliabilityScore: 0,
            profileScore: 0,
            totalOrders: 0,
            totalBookings: 0,
            avgRating: 0,
            reviewCount: 0,
            completionPct: 0,
          },
          badges: [],
        },
      });
    });

    it('returns public score with existing score', async () => {
      const score = {
        overallScore: 800,
        category: 'EXCELLENT',
        commercialScore: 160,
        financialScore: 160,
        satisfactionScore: 160,
        reliabilityScore: 160,
        profileScore: 160,
        totalOrders: 50,
        totalBookings: 20,
        avgRating: 4.5,
        reviewCount: 10,
        completionPct: 90,
      };
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.businessScore.findUnique.mockResolvedValue(score);
      (afriScoreService.getBadges as jest.Mock).mockResolvedValue([{ badge: 'TOP_SELLER' }]);
      const res = mockRes();
      ctrl.getPublicScore(req({ params: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { business: mockBusiness, score, badges: [{ badge: 'TOP_SELLER' }] },
      });
    });
  });

  // ============= recomputeMyScore =============
  describe('recomputeMyScore', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.recomputeMyScore(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('recomputes and returns score', async () => {
      const score = { overallScore: 800 };
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      (afriScoreService.computeBusinessScore as jest.Mock).mockResolvedValue(score);
      const res = mockRes();
      ctrl.recomputeMyScore(req(), res, jest.fn());
      await flush();
      expect(afriScoreService.computeBusinessScore).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: score,
        message: 'Score recalculé avec succès',
      });
    });
  });

  // ============= deleteConsent =============
  describe('deleteConsent', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.deleteConsent(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('deletes consent and returns success', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      const res = mockRes();
      ctrl.deleteConsent(req(), res, jest.fn());
      await flush();
      expect(mockPrisma.dataConsent.deleteMany).toHaveBeenCalledWith({
        where: { businessId: 'b1' },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Consentement révoqué avec succès',
      });
    });
  });

  // ============= getConsent =============
  describe('getConsent', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getConsent(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('creates consent if none exists', async () => {
      const newConsent = { id: 'c1', businessId: 'b1', shareLevel: 'NONE' };
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.dataConsent.findUnique.mockResolvedValue(null);
      mockPrisma.dataConsent.create.mockResolvedValue(newConsent);
      const res = mockRes();
      ctrl.getConsent(req(), res, jest.fn());
      await flush();
      expect(mockPrisma.dataConsent.create).toHaveBeenCalledWith({ data: { businessId: 'b1' } });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: newConsent });
    });

    it('returns existing consent', async () => {
      const consent = { id: 'c1', businessId: 'b1', shareLevel: 'HIGH' };
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.dataConsent.findUnique.mockResolvedValue(consent);
      const res = mockRes();
      ctrl.getConsent(req(), res, jest.fn());
      await flush();
      expect(mockPrisma.dataConsent.create).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: consent });
    });
  });

  // ============= updateConsent =============
  describe('updateConsent', () => {
    it('returns 404 when business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.updateConsent(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('upserts consent with provided fields', async () => {
      const updated = { businessId: 'b1', shareLevel: 'HIGH', allowsBanks: true };
      mockPrisma.business.findUnique.mockResolvedValue(mockBusiness);
      mockPrisma.dataConsent.upsert.mockResolvedValue(updated);
      const res = mockRes();
      ctrl.updateConsent(req({ body: { shareLevel: 'HIGH', allowsBanks: true } }), res, jest.fn());
      await flush();
      expect(mockPrisma.dataConsent.upsert).toHaveBeenCalledWith({
        where: { businessId: 'b1' },
        update: {
          shareLevel: 'HIGH',
          allowsBanks: true,
          isActive: undefined,
          allowsInsurance: undefined,
          allowsInvestors: undefined,
          allowsPublic: undefined,
          allowsAll: undefined,
        },
        create: {
          businessId: 'b1',
          shareLevel: 'HIGH',
          allowsBanks: true,
          allowsInsurance: false,
          allowsInvestors: false,
          allowsPublic: false,
          allowsAll: false,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });
  });

  // ============= partnerGetBusinessScore =============
  describe('partnerGetBusinessScore', () => {
    it('returns 403 when consent is inactive or NONE', async () => {
      (afriDataHubService.getBusinessConsentCheck as jest.Mock).mockResolvedValue({
        isActive: false,
        shareLevel: 'NONE',
      });
      const res = mockRes();
      const next = jest.fn();
      ctrl.partnerGetBusinessScore(partnerReq({ params: { businessId: 'b1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });

    it('returns 404 when business not found', async () => {
      (afriDataHubService.getBusinessConsentCheck as jest.Mock).mockResolvedValue({
        isActive: true,
        shareLevel: 'HIGH',
      });
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.partnerGetBusinessScore(partnerReq({ params: { businessId: 'b1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });

    it('returns score and logs access', async () => {
      const business = { id: 'b1', name: 'Biz', type: 'RESTAURANT', country: 'SN', city: 'Dakar' };
      const score = {
        overallScore: 750,
        category: 'GOOD',
        commercialScore: 150,
        financialScore: 150,
        satisfactionScore: 150,
        reliabilityScore: 150,
        profileScore: 150,
        totalOrders: 30,
        totalBookings: 15,
        avgRating: 4.2,
        reviewCount: 8,
      };
      (afriDataHubService.getBusinessConsentCheck as jest.Mock).mockResolvedValue({
        isActive: true,
        shareLevel: 'HIGH',
      });
      mockPrisma.business.findUnique.mockResolvedValue(business);
      mockPrisma.businessScore.findUnique.mockResolvedValue(score);
      const res = mockRes();
      ctrl.partnerGetBusinessScore(partnerReq({ params: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.dataAccessLog.create).toHaveBeenCalledWith({
        data: { partnerId: 'p1', action: 'VIEW_SCORE', businessId: 'b1', details: { score: 750 } },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { business: { id: 'b1', name: 'Biz', type: 'RESTAURANT' }, score },
      });
    });
  });

  // ============= partnerGenerateReport =============
  describe('partnerGenerateReport', () => {
    it('generates report and returns 201', async () => {
      const report = { id: 'r1', url: '/report.pdf' };
      (afriDataHubService.generateBusinessReport as jest.Mock).mockResolvedValue(report);
      const res = mockRes();
      ctrl.partnerGenerateReport(partnerReq({ params: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(afriDataHubService.generateBusinessReport).toHaveBeenCalledWith('b1', 'p1');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: report });
    });
  });

  // ============= partnerGetSectorReport =============
  describe('partnerGetSectorReport', () => {
    it('generates sector report', async () => {
      const report = { sector: 'RESTAURANT', avgScore: 600 };
      (afriDataHubService.generateSectorReport as jest.Mock).mockResolvedValue(report);
      const res = mockRes();
      ctrl.partnerGetSectorReport(partnerReq({ params: { sector: 'RESTAURANT' } }), res, jest.fn());
      await flush();
      expect(afriDataHubService.generateSectorReport).toHaveBeenCalledWith('RESTAURANT');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: report });
    });
  });

  // ============= Hub endpoints =============
  describe('Hub endpoints', () => {
    it('getHubOverview', async () => {
      const stats = { totalBusinesses: 1000, totalOrders: 5000 };
      (afriDataHubService.getPlatformStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();
      ctrl.getHubOverview(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });

    it('getHubSectors', async () => {
      const stats = [{ sector: 'RESTAURANT', count: 200 }];
      (afriDataHubService.getSectorStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();
      ctrl.getHubSectors(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });

    it('getHubGeographic', async () => {
      const stats = [{ country: 'SN', count: 500 }];
      (afriDataHubService.getGeographicStats as jest.Mock).mockResolvedValue(stats);
      const res = mockRes();
      ctrl.getHubGeographic(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
    });

    it('getHubTrends', async () => {
      const growth = { growth: 10 };
      const consumption = { consumption: 20 };
      const booking = { booking: 30 };
      const delivery = { delivery: 40 };
      (afriDataHubService.getGrowthStats as jest.Mock).mockResolvedValue(growth);
      (afriDataHubService.getConsumptionTrends as jest.Mock).mockResolvedValue(consumption);
      (afriDataHubService.getBookingTrends as jest.Mock).mockResolvedValue(booking);
      (afriDataHubService.getDeliveryTrends as jest.Mock).mockResolvedValue(delivery);
      const res = mockRes();
      ctrl.getHubTrends(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { growth, consumption, booking, delivery },
      });
    });

    it('getHubPayments', async () => {
      const trends = [{ month: '2024-01', revenue: 1000 }];
      (afriDataHubService.getPaymentTrends as jest.Mock).mockResolvedValue(trends);
      const res = mockRes();
      ctrl.getHubPayments(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: trends });
    });
  });

  // ============= Admin endpoints =============
  describe('admin endpoints', () => {
    it('adminListPartners', async () => {
      const partners = [{ id: 'p1', name: 'Partner', _count: { subscriptions: 1, reports: 2 } }];
      mockPrisma.dataPartner.findMany.mockResolvedValue(partners);
      const res = mockRes();
      ctrl.adminListPartners(req(), res, jest.fn());
      await flush();
      expect(mockPrisma.dataPartner.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { subscriptions: true, reports: true } } },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: partners });
    });

    it('adminCreatePartner returns 201', async () => {
      const partner = { id: 'p2', name: 'New Partner', apiKey: 'apk_...' };
      mockPrisma.dataPartner.create.mockResolvedValue(partner);
      const res = mockRes();
      ctrl.adminCreatePartner(
        req({
          body: {
            name: 'New Partner',
            slug: 'new-partner',
            type: 'BANK',
            email: 'a@b.com',
            phone: '123',
            website: 'https://x.com',
            logo: 'l.png',
            description: 'desc',
            apiEnabled: true,
            apiQuota: 2000,
          },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(mockPrisma.dataPartner.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Partner',
          slug: 'new-partner',
          type: 'BANK',
          email: 'a@b.com',
          isActive: true,
        }),
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: partner });
    });

    it('adminUpdatePartner', async () => {
      const updated = { id: 'p1', name: 'Updated' };
      mockPrisma.dataPartner.update.mockResolvedValue(updated);
      const res = mockRes();
      ctrl.adminUpdatePartner(
        req({ params: { id: 'p1' }, body: { name: 'Updated' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(mockPrisma.dataPartner.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: {
          name: 'Updated',
          slug: undefined,
          type: undefined,
          email: undefined,
          phone: undefined,
          website: undefined,
          logo: undefined,
          description: undefined,
          apiEnabled: undefined,
          apiQuota: undefined,
          isActive: undefined,
        },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });

    it('adminDeactivatePartner', async () => {
      const deactivated = { id: 'p1', isActive: false };
      mockPrisma.dataPartner.update.mockResolvedValue(deactivated);
      const res = mockRes();
      ctrl.adminDeactivatePartner(req({ params: { id: 'p1' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.dataPartner.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { isActive: false },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: deactivated });
    });

    it('adminListReports', async () => {
      const reports = [{ id: 'r1', partner: { id: 'p1', name: 'P', slug: 'p' } }];
      mockPrisma.dataReport.findMany.mockResolvedValue(reports);
      mockPrisma.dataReport.count.mockResolvedValue(1);
      const res = mockRes();
      ctrl.adminListReports(req({ query: { page: '1', limit: '10' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.dataReport.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: { partner: { select: { id: true, name: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { data: reports, total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it('adminAccessLogs', async () => {
      const logs = [
        {
          id: 'l1',
          partner: { id: 'p1', name: 'P', slug: 'p' },
          business: { id: 'b1', name: 'Biz' },
        },
      ];
      mockPrisma.dataAccessLog.findMany.mockResolvedValue(logs);
      mockPrisma.dataAccessLog.count.mockResolvedValue(1);
      const res = mockRes();
      ctrl.adminAccessLogs(req({ query: { page: '2', limit: '5' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.dataAccessLog.findMany).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        include: {
          partner: { select: { id: true, name: true, slug: true } },
          business: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { data: logs, total: 1, page: 2, limit: 5, totalPages: 1 },
      });
    });

    it('adminSubscriptions', async () => {
      const subs = [{ id: 's1', partner: { id: 'p1', name: 'P', slug: 'p', type: 'BANK' } }];
      mockPrisma.partnerSubscription.findMany.mockResolvedValue(subs);
      const res = mockRes();
      ctrl.adminSubscriptions(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: subs });
    });

    it('adminRecompute', async () => {
      (afriScoreService.recomputeAllScores as jest.Mock).mockResolvedValue(42);
      const res = mockRes();
      ctrl.adminRecompute(req(), res, jest.fn());
      await flush();
      expect(afriScoreService.recomputeAllScores).toHaveBeenCalled();
      expect(afriDataHubService.computeSectorBenchmarks).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Scores recalculés pour 42 entreprises',
      });
    });

    it('adminRevenue', async () => {
      mockPrisma.dataReport.findMany.mockResolvedValue([
        { price: { toNumber: () => 5000 }, createdAt: new Date() },
        { price: { toNumber: () => 3000 }, createdAt: new Date() },
      ]);
      mockPrisma.partnerSubscription.findMany.mockResolvedValue([
        { price: { toNumber: () => 10000 }, plan: 'PREMIUM', status: 'ACTIVE' },
      ]);
      const res = mockRes();
      ctrl.adminRevenue(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          reportRevenue: 8000,
          subscriptionRevenue: 10000,
          totalRevenue: 18000,
          totalReports: 2,
          totalSubscriptions: 1,
          currency: 'FCFA',
        },
      });
    });
  });
});
