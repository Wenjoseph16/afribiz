import { mockPrisma } from '../setup';
import {
  getScoreCategory,
  computeCommercialActivity,
  computeFinancialBehavior,
  computeSatisfaction,
  computeOperationalReliability,
  computeProfileCompleteness,
  computeBusinessScore,
  saveScoreHistory,
  getBadges,
  recomputeAllScores,
  getScoreHistory,
  getSectorBenchmark,
} from '../../services/afriScoreService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockBiz = {
  id: 'b1',
  ownerId: 'u1',
  name: 'Biz',
  type: 'RESTAURANT',
  slug: 'biz',
  createdAt: new Date(),
  updatedAt: new Date(),
  logo: 'logo.png',
  coverImage: null,
  description: 'Desc',
  address: 'Addr',
  phone: '123',
  whatsapp: null,
  email: 'a@b.com',
  latitude: 6.13,
  longitude: 1.22,
  taxId: null,
  managerName: 'Mgr',
  foundedYear: 2020,
  isActive: true,
  isVerified: true,
  isPremium: false,
  isRecommended: false,
  rating: 4.5,
  reviewCount: 30,
  modules: [],
  hours: [],
  portfolioItems: [],
  certifications: [],
  _count: { partners: 0, products: 10 },
};

describe('afriScoreService', () => {
  beforeEach(() => {
    /* cleared by config.clearMocks */
  });

  describe('getScoreCategory', () => {
    test('returns EXCELLENT for high scores', () => {
      expect(getScoreCategory(900)).toBe('EXCELLENT');
    });
    test('returns VERY_LOW for low scores', () => {
      expect(getScoreCategory(50)).toBe('VERY_LOW');
    });
  });

  describe('computeCommercialActivity', () => {
    test('computes commercial activity', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(50);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(20);
      (mockPrisma as any).$queryRaw = jest.fn(() =>
        Promise.resolve([
          { month: new Date(), revenue: 1000 },
          { month: new Date(), revenue: 2000 },
        ])
      );
      const r = await computeCommercialActivity('b1');
      expect(r.meta.totalOrders).toBe(50);
    });
  });

  describe('computeFinancialBehavior', () => {
    test('computes financial behavior', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(20);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(2);
      const r = await computeFinancialBehavior('b1');
      expect(r.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeSatisfaction', () => {
    test('computes satisfaction', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.businessReview, 'findMany').mockResolvedValue([
        { rating: 5, createdAt: new Date() },
        { rating: 4, createdAt: new Date() },
      ]);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      const r = await computeSatisfaction('b1');
      expect(r.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeOperationalReliability', () => {
    test('computes operational reliability', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(30);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(10);
      const r = await computeOperationalReliability('b1');
      expect(r.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('computeProfileCompleteness', () => {
    test('computes profile completeness', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      const r = await computeProfileCompleteness('b1');
      expect(r.meta.completedFields).toBeGreaterThan(0);
    });
  });

  describe('computeBusinessScore', () => {
    test('computes full business score', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(50);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(20);
      jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(20);
      jest
        .spyOn(mockPrisma.businessReview, 'findMany')
        .mockResolvedValue([{ rating: 5, createdAt: new Date() }]);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.message, 'findMany').mockResolvedValue([]);
      jest
        .spyOn(mockPrisma.businessScore, 'upsert')
        .mockResolvedValue({ id: 's1', businessId: 'b1', overallScore: 750 } as any);
      jest.spyOn(mockPrisma.scoreHistory, 'findFirst').mockResolvedValue(null);
      jest.spyOn(mockPrisma.scoreHistory, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.businessBadge, 'upsert').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.dispute, 'count').mockResolvedValue(0);
      (mockPrisma as any).$queryRaw = jest.fn(() =>
        Promise.resolve([
          { month: new Date(), revenue: 1000 },
          { month: new Date(), revenue: 2000 },
        ])
      );
      const r = await computeBusinessScore('b1');
      expect(r.overallScore).toBe(750);
    });
  });

  describe('saveScoreHistory', () => {
    test('creates history entry', async () => {
      jest.spyOn(mockPrisma.businessScore, 'findUnique').mockResolvedValue({
        id: 's1',
        overallScore: 700,
        commercialScore: 140,
        financialScore: 140,
        satisfactionScore: 140,
        reliabilityScore: 140,
        profileScore: 140,
        category: 'GOOD',
        businessId: 'b1',
      } as any);
      jest.spyOn(mockPrisma.scoreHistory, 'findFirst').mockResolvedValue(null);
      jest.spyOn(mockPrisma.scoreHistory, 'create').mockResolvedValue({} as any);
      await saveScoreHistory('b1');
      expect(mockPrisma.scoreHistory.create).toHaveBeenCalled();
    });
  });

  describe('getBadges', () => {
    test('returns badges', async () => {
      jest.spyOn(mockPrisma.businessBadge, 'findMany').mockResolvedValue([
        {
          id: 'bg1',
          badge: 'TOP_SELLER',
          label: 'Top',
          description: 'Best',
          icon: 'star',
          isActive: true,
          earnedAt: new Date(),
          businessId: 'b1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      const r = await getBadges('b1');
      expect(r).toHaveLength(1);
    });
  });

  describe('recomputeAllScores', () => {
    test('recomputes all scores', async () => {
      jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([{ id: 'b1' }]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBiz);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(0);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(0);
      jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(0);
      jest.spyOn(mockPrisma.businessReview, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.conversation, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.message, 'findMany').mockResolvedValue([]);
      jest.spyOn(mockPrisma.businessScore, 'upsert').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.scoreHistory, 'findFirst').mockResolvedValue(null);
      jest.spyOn(mockPrisma.scoreHistory, 'create').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.businessBadge, 'upsert').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.dispute, 'count').mockResolvedValue(0);
      (mockPrisma as any).$queryRaw = jest.fn(() =>
        Promise.resolve([
          { month: new Date(), revenue: 1000 },
          { month: new Date(), revenue: 2000 },
        ])
      );
      const r = await recomputeAllScores();
      expect(r).toBe(1);
    });
  });

  describe('getScoreHistory', () => {
    test('returns history', async () => {
      jest
        .spyOn(mockPrisma.scoreHistory, 'findMany')
        .mockResolvedValue([
          { id: 'h1', period: 'WEEKLY', snapshotDate: new Date(), overallScore: 700 } as any,
        ]);
      const r = await getScoreHistory('b1');
      expect(r).toHaveLength(1);
    });
  });

  describe('getSectorBenchmark', () => {
    test('returns benchmark from DB', async () => {
      jest.spyOn(mockPrisma.sectorBenchmark, 'findUnique').mockResolvedValue({
        sector: 'RESTAURANT',
        avgScore: 600,
        avgCommercial: 120,
        avgFinancial: 120,
        avgSatisfaction: 120,
        avgReliability: 120,
        avgProfile: 120,
        businessCount: 20,
      } as any);
      const r = await getSectorBenchmark('RESTAURANT');
      expect(r.avgScore).toBe(600);
    });
    test('computes benchmark if not in DB', async () => {
      jest.spyOn(mockPrisma.sectorBenchmark, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.business, 'findMany').mockResolvedValue([
        {
          id: 'b1',
          type: 'RESTAURANT',
          isActive: true,
          score: {
            overallScore: 700,
            commercialScore: 140,
            financialScore: 140,
            satisfactionScore: 140,
            reliabilityScore: 140,
            profileScore: 140,
          },
        } as any,
      ]);
      const r = await getSectorBenchmark('RESTAURANT');
      expect(r.avgScore).toBe(700);
    });
  });
});
