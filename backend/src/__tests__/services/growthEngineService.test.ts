import { mockPrisma } from '../setup';
import * as growthEngine from '../../services/growthEngineService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../events/publishers', () => ({
  publishMorningBriefGenerated: jest.fn(),
  publishEveningSummaryGenerated: jest.fn(),
}));

const mockBusiness = { id: 'biz-1', ownerId: 'u1' };
const mockBrief = {
  id: 'br-1',
  businessId: 'biz-1',
  type: 'MORNING_BRIEF',
  metrics: {},
  advice: [],
  quickActions: [],
  createdAt: new Date(),
};

describe('growthEngineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateMorningBrief', () => {
    function setupCountMocks() {
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.planningTask.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.promotion.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.conversation.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.growthBrief.create as jest.Mock).mockResolvedValue(mockBrief);
      // Pilier 3 : copilote quotidien
      (mockPrisma.order.aggregate as jest.Mock).mockResolvedValue({
        _sum: { totalAmount: null },
        _count: 0,
      });
      (mockPrisma.debt.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.delivery.findMany as jest.Mock).mockResolvedValue([]);
    }

    test('generates morning brief with metrics', async () => {
      setupCountMocks();
      const r = await growthEngine.generateMorningBrief('biz-1');
      expect(r.metrics).toBeDefined();
      expect(r.advice).toBeDefined();
      expect(r.quickActions).toBeDefined();
    });

    test('includes pending orders in advice when > 2 pending', async () => {
      setupCountMocks();
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'o1',
          status: 'PENDING',
          orderNumber: '001',
          totalAmount: 100,
          scheduledAt: new Date(),
          contactName: 'Client',
        },
        {
          id: 'o2',
          status: 'PENDING',
          orderNumber: '002',
          totalAmount: 200,
          scheduledAt: new Date(),
          contactName: 'Client',
        },
        {
          id: 'o3',
          status: 'PENDING',
          orderNumber: '003',
          totalAmount: 300,
          scheduledAt: new Date(),
          contactName: 'Client',
        },
      ]);
      const r = await growthEngine.generateMorningBrief('biz-1');
      expect(r.advice.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateEveningSummary', () => {
    function setupSummaryMocks() {
      (mockPrisma.businessPageView.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.favorite.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.businessReview.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.order.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.growthBrief.create as jest.Mock).mockResolvedValue(mockBrief);
    }

    test('generates evening summary with metrics', async () => {
      setupSummaryMocks();
      const r = await growthEngine.generateEveningSummary('biz-1');
      expect(r.metrics).toBeDefined();
      expect(r.improvementAxes).toBeDefined();
    });

    test('detects orders decline', async () => {
      setupSummaryMocks();
      (mockPrisma.order.count as jest.Mock)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(30);
      const r = await growthEngine.generateEveningSummary('biz-1');
      expect(r.improvementAxes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateCalendarInsights', () => {
    test('returns calendar insights with distribution', async () => {
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([
        { createdAt: new Date(), status: 'COMPLETED' },
      ]);
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      const r = await growthEngine.generateCalendarInsights('biz-1');
      expect(r.busiestDay).toBeDefined();
      expect(r.peakHour).toBeDefined();
    });

    test('returns default days when no data', async () => {
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      const r = await growthEngine.generateCalendarInsights('biz-1');
      expect(r.busiestDay!.count).toBe(0);
      expect(r.trend.direction).toBe('stable');
    });
  });

  describe('getLatestBrief', () => {
    test('returns latest brief by type', async () => {
      (mockPrisma.growthBrief.findFirst as jest.Mock).mockResolvedValue(mockBrief);
      const r = await growthEngine.getLatestBrief('biz-1', 'MORNING_BRIEF' as any);
      expect(r!.id).toBe('br-1');
    });

    test('returns null when no brief exists', async () => {
      (mockPrisma.growthBrief.findFirst as jest.Mock).mockResolvedValue(null);
      const r = await growthEngine.getLatestBrief('biz-1', 'MORNING_BRIEF' as any);
      expect(r).toBeNull();
    });
  });

  describe('getRecentBriefs', () => {
    test('returns recent briefs', async () => {
      (mockPrisma.growthBrief.findMany as jest.Mock).mockResolvedValue([mockBrief]);
      const r = await growthEngine.getRecentBriefs('biz-1', 7);
      expect(r).toHaveLength(1);
    });
  });

  describe('generateAllMorningBriefs', () => {
    test('generates briefs for all active businesses', async () => {
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([
        { id: 'biz-1' },
        { id: 'biz-2' },
      ]);
      (mockPrisma.order.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.booking.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.planningTask.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.promotion.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.offerFlash.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.conversation.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.growthBrief.create as jest.Mock).mockResolvedValue(mockBrief);
      const r = await growthEngine.generateAllMorningBriefs();
      expect(r.total).toBe(2);
      expect(r.success).toBe(2);
    });
  });

  describe('generateAllEveningSummaries', () => {
    test('generates summaries for all active businesses', async () => {
      (mockPrisma.business.findMany as jest.Mock).mockResolvedValue([{ id: 'biz-1' }]);
      (mockPrisma.businessPageView.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.favorite.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.order.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.booking.count as jest.Mock).mockResolvedValue(0);
      (mockPrisma.businessReview.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.order.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.growthBrief.create as jest.Mock).mockResolvedValue(mockBrief);
      const r = await growthEngine.generateAllEveningSummaries();
      expect(r.total).toBe(1);
      expect(r.success).toBe(1);
    });
  });
});
