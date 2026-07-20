import { mockPrisma } from '../setup';
import {
  getGrowthDetection,
  getCoachDashboard,
  getModuleRecommendations,
} from '../../services/growthCoachingService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockBusiness = {
  id: 'biz-1',
  name: 'Test Biz',
  type: 'BOUTIQUE_VETEMENTS',
  modules: ['PRODUCTS'],
  isPremium: false,
  rating: 4.5,
  createdAt: new Date(Date.now() - 60 * 86400000),
  logo: 'logo.png',
  description: 'Desc',
  address: 'Addr',
  phone: '+22501000000',
  email: 'test@test.com',
  city: 'Abidjan',
  whatsapp: '+22501000000',
  facebook: 'fb',
  instagram: null,
  twitter: null,
  linkedin: null,
  score: null,
  isActive: true,
  deletedAt: null,
};

describe('growthCoachingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGrowthDetection', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const today = new Date();

    function setupBaseMocks() {
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.businessPageView.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.businessReview.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.favorite.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.businessScore.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.scoreHistory.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        ...mockBusiness,
        score: { profileScore: 100 },
      });
    }

    function mockOrderCounts(current: number, previous: number) {
      (mockPrisma.order.count as jest.Mock)
        .mockResolvedValueOnce(current)
        .mockResolvedValueOnce(previous);
    }

    test('returns growth detection with trends', async () => {
      setupBaseMocks();
      mockOrderCounts(10, 5);
      const r = await getGrowthDetection('biz-1');
      expect(r.trends.length).toBeGreaterThanOrEqual(6);
      expect(r.overallGrowthScore).toBeGreaterThanOrEqual(0);
      expect(r.summary).toBeTruthy();
    });

    test('detects conversion opportunity with page views but no orders', async () => {
      setupBaseMocks();
      (mockPrisma.businessPageView.count as jest.Mock).mockResolvedValueOnce(100);
      (mockPrisma.businessPageView.count as jest.Mock).mockResolvedValueOnce(0);
      const r = await getGrowthDetection('biz-1');
      const convOpp = r.opportunities.find((o) => o.type === 'conversion');
      expect(convOpp).toBeDefined();
    });

    test('detects missing promotion module opportunity', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        ...mockBusiness,
        modules: ['PRODUCTS'],
      });
      (mockPrisma.business.findUnique as jest.Mock).mockImplementation(() => {
        return Promise.resolve({ ...mockBusiness, modules: ['PRODUCTS'] });
      });
      setupBaseMocks();
      mockOrderCounts(1, 0);
      const r = await getGrowthDetection('biz-1');
      const promoOpp = r.opportunities.find((o) => o.type === 'module');
      expect(promoOpp).toBeDefined();
    });
  });

  describe('getCoachDashboard', () => {
    test('returns coach dashboard with tips', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        ...mockBusiness,
        score: null,
      });
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.businessReview.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.businessPageView.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.service.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.promotion.count as jest.Mock).mockResolvedValue(0);
      const r = await getCoachDashboard('biz-1');
      expect(r.businessId).toBe('biz-1');
      expect(r.healthScore).toBeGreaterThanOrEqual(0);
      expect(r.tips.length).toBeGreaterThanOrEqual(0);
    });

    test('throws if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(getCoachDashboard('bad-id')).rejects.toThrow('Business not found');
    });
  });

  describe('getModuleRecommendations', () => {
    test('returns module recommendations for business type', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({
        type: 'RESTAURANT',
        modules: ['PRODUCTS'],
      });
      (mockPrisma.product.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.service.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(5);
      const r = await getModuleRecommendations('biz-1');
      expect(r.length).toBeGreaterThan(1);
      const products = r.find((m) => m.module === 'PRODUCTS');
      expect(products).toBeDefined();
      expect(products!.isActive).toBe(true);
    });

    test('throws if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(getModuleRecommendations('bad-id')).rejects.toThrow('Business not found');
    });
  });
});
