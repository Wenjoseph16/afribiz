import { mockPrisma } from '../setup';
import { cache } from '../../lib/cache';
import {
  generateDailyTips,
  getBusinessHealth,
  getModuleTips,
  generateSmartTip,
  generateDailyBriefForBusiness,
  generateLLMTip,
  warmCopilotCache,
} from '../../services/businessCopilot';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/cache', () => ({ cache: { get: jest.fn(), set: jest.fn() } }));

const mockScore = {
  id: 's1',
  overallScore: 750,
  commercialScore: 150,
  financialScore: 150,
  satisfactionScore: 150,
  reliabilityScore: 150,
  profileScore: 150,
  completionPct: 80,
  category: 'EXCELLENT',
};
const mockBusiness = {
  id: 'b1',
  ownerId: 'u1',
  name: 'Biz',
  slug: 'biz',
  logo: 'logo.png',
  description: 'Desc',
  address: 'Addr',
  phone: '123',
  hours: [{ day: 1, open: '08:00', close: '18:00' }],
  modules: ['ORDERS', 'BOOKINGS'],
  createdAt: new Date(Date.now() - 60 * 86400000),
  score: mockScore,
} as any;

describe('businessCopilot', () => {
  beforeEach(() => {
    (cache.get as jest.Mock).mockReset();
    (cache.set as jest.Mock).mockReset();
  });

  describe('generateDailyTips', () => {
    test('returns tips for business with complete profile', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness);
      jest.spyOn(mockPrisma.copilotConfiguration, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.businessReview, 'findMany').mockResolvedValue([{ rating: 5 }]);
      const r = await generateDailyTips('b1');
      expect(r.tips.length).toBeGreaterThan(0);
      expect(r.businessName).toBe('Biz');
    });

    test('returns empty tips when dailyTip is disabled', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness);
      jest
        .spyOn(mockPrisma.copilotConfiguration, 'findUnique')
        .mockResolvedValue({ dailyTipEnabled: false } as any);
      const r = await generateDailyTips('b1');
      expect(r.tips).toEqual([]);
    });

    test('returns success tip when no issues', async () => {
      const lowScore = { ...mockScore, overallScore: 500 };
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({
        ...mockBusiness,
        score: lowScore,
        logo: 'l.png',
        description: 'Desc',
        address: 'Addr',
        phone: '123',
        hours: [{ day: 1 }],
      });
      jest.spyOn(mockPrisma.copilotConfiguration, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.businessReview, 'findMany').mockResolvedValue([{ rating: 5 }]);
      const r = await generateDailyTips('b1');
      expect(r.tips.some((t: any) => t.type === 'success')).toBe(true);
    });

    test('includes profile tips for incomplete profile', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({
        ...mockBusiness,
        logo: null,
        description: null,
        address: null,
        phone: null,
        hours: [],
      });
      jest.spyOn(mockPrisma.copilotConfiguration, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.businessReview, 'findMany').mockResolvedValue([{ rating: 5 }]);
      const r = await generateDailyTips('b1');
      expect(r.tips.filter((t: any) => t.type === 'profile').length).toBeGreaterThanOrEqual(4);
    });

    test('throws if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(generateDailyTips('b1')).rejects.toThrow('Business not found');
    });
  });

  describe('getBusinessHealth', () => {
    test('calculates health score', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness);
      jest.spyOn(mockPrisma.copilotConfiguration, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.platformCopilotConfig, 'findFirst').mockResolvedValue(null);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(30);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(500);
      jest.spyOn(mockPrisma.adCampaign, 'count').mockResolvedValue(2);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(10);

      const r = await getBusinessHealth('b1');
      expect(r.healthScore).toBeGreaterThan(0);
      expect(r.status).toBeDefined();
    });

    test('returns 0 health when disabled', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness);
      jest
        .spyOn(mockPrisma.copilotConfiguration, 'findUnique')
        .mockResolvedValue({ enabled: false } as any);
      const r = await getBusinessHealth('b1');
      expect(r.healthScore).toBe(0);
    });

    test('throws if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(getBusinessHealth('b1')).rejects.toThrow('Business not found');
    });
  });

  describe('getModuleTips', () => {
    test('returns tips for active module', async () => {
      jest
        .spyOn(mockPrisma.business, 'findUnique')
        .mockResolvedValue({ modules: ['ORDERS'] } as any);
      const r = await getModuleTips('b1', 'ORDERS');
      expect(r.length).toBeGreaterThan(0);
      expect(r[0].moduleKey).toBe('ORDERS');
    });

    test('returns empty for inactive module', async () => {
      jest
        .spyOn(mockPrisma.business, 'findUnique')
        .mockResolvedValue({ modules: ['ORDERS'] } as any);
      const r = await getModuleTips('b1', 'CRM');
      expect(r).toEqual([]);
    });
  });

  describe('generateSmartTip', () => {
    test('returns rule-based tip for known module', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({} as any);
      const r = await generateSmartTip('b1', 'ORDERS');
      expect(r.source).toBe('rule');
      expect(r.message).toBeDefined();
    });
  });

  describe('generateDailyBriefForBusiness', () => {
    test('returns metrics-based brief', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({} as any);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(3);
      jest.spyOn(mockPrisma.order, 'aggregate').mockResolvedValue({
        _sum: { totalAmount: { toNumber: () => 15000, valueOf: () => 15000 } },
      } as any);
      jest.spyOn(mockPrisma.delivery, 'count').mockResolvedValue(2);
      jest.spyOn(mockPrisma.conversation, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([{ name: 'Prod A' }]);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(5);
      const r = await generateDailyBriefForBusiness('b1');
      expect(r!.brief).toContain('commande');
      expect(r!.source).toBe('metrics');
    });
  });

  describe('generateLLMTip', () => {
    test('returns rule-based tip for module', async () => {
      jest
        .spyOn(mockPrisma.business, 'findUnique')
        .mockResolvedValue({ modules: ['ORDERS'] } as any);
      const r = await generateLLMTip('b1', 'ORDERS');
      expect(r.source).toBe('rule');
    });
  });

  describe('warmCopilotCache', () => {
    test('warms cache for active businesses', async () => {
      (cache.get as jest.Mock).mockResolvedValue(null);
      jest
        .spyOn(mockPrisma.business, 'findMany')
        .mockResolvedValue([{ id: 'b1', name: 'Biz' } as any]);
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(mockBusiness);
      jest.spyOn(mockPrisma.copilotConfiguration, 'findUnique').mockResolvedValue(null);
      jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
      jest.spyOn(mockPrisma.product, 'count').mockResolvedValue(10);
      jest.spyOn(mockPrisma.businessReview, 'findMany').mockResolvedValue([{ rating: 5 }]);
      jest.spyOn(mockPrisma.platformCopilotConfig, 'findFirst').mockResolvedValue(null);
      jest.spyOn(mockPrisma.booking, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(1);
      jest.spyOn(mockPrisma.adCampaign, 'count').mockResolvedValue(0);

      await warmCopilotCache();
      expect(cache.set).toHaveBeenCalled();
    });

    test('skips if already warmed', async () => {
      (cache.get as jest.Mock).mockResolvedValue('true');
      await warmCopilotCache();
      expect(cache.set).not.toHaveBeenCalled();
    });
  });
});
