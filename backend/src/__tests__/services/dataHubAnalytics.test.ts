import { mockPrisma } from '../setup';
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
import {
  trackSearchQuery,
  getSearchTrends,
  getConversionFunnel,
  getRetentionCohorts,
  getProductRecommendations,
  getEngagementAnalytics,
  getAuthTrends,
} from '../../services/dataHubAnalytics';

describe('dataHubAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('trackSearchQuery creates search log', async () => {
    jest.spyOn(mockPrisma.searchLog, 'create').mockResolvedValue({ id: 'sl-1' });
    await trackSearchQuery('test query', 5, { userId: 'u1' });
    expect(mockPrisma.searchLog.create).toHaveBeenCalled();
  });

  test('getSearchTrends returns trends', async () => {
    jest.spyOn(mockPrisma.searchLog, 'count').mockResolvedValue(100);
    jest
      .spyOn(mockPrisma.searchLog, 'groupBy')
      .mockResolvedValueOnce([{ query: 'test', _count: { id: 10 }, _sum: { resultCount: 5 } }])
      .mockResolvedValueOnce([]);
    const result = await getSearchTrends(30);
    expect(result.totalSearches).toBe(100);
    expect(result.topQueries).toHaveLength(1);
  });

  test('getConversionFunnel returns funnel data', async () => {
    jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([{ id: 'p1' }]);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(1000);
    jest.spyOn(mockPrisma.productView, 'count').mockResolvedValue(500);
    jest.spyOn(mockPrisma.productClick, 'count').mockResolvedValue(200);
    jest.spyOn(mockPrisma.cartItem, 'count').mockResolvedValue(100);
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(50);
    jest.spyOn(mockPrisma.payment, 'count').mockResolvedValue(30);
    const result = await getConversionFunnel('biz-1');
    expect(result.stages).toHaveLength(6);
    expect(result.conversionRates.overall).toBeGreaterThan(0);
  });

  test('getRetentionCohorts returns cohorts', async () => {
    jest
      .spyOn(mockPrisma.businessClient, 'findMany')
      .mockResolvedValue([{ clientId: 'u1', createdAt: new Date() }]);
    jest.spyOn(mockPrisma.order, 'count').mockResolvedValue(5);
    const result = await getRetentionCohorts('biz-1');
    expect(Array.isArray(result)).toBe(true);
  });

  test('getProductRecommendations returns products', async () => {
    jest
      .spyOn(mockPrisma.productView, 'groupBy')
      .mockResolvedValue([{ productId: 'p1', _count: { id: 10 } }]);
    jest
      .spyOn(mockPrisma.productClick, 'groupBy')
      .mockResolvedValue([{ productId: 'p1', _count: { id: 5 } }]);
    jest
      .spyOn(mockPrisma.orderItem, 'groupBy')
      .mockResolvedValue([{ productId: 'p1', _count: { id: 3 } }]);
    jest.spyOn(mockPrisma.product, 'findMany').mockResolvedValue([
      {
        id: 'p1',
        name: 'Prod A',
        slug: 'prod-a',
        images: [],
        price: 5000,
        description: 'Desc',
        category: 'Cat',
        rating: 4.5,
      },
    ]);
    const result = await getProductRecommendations('biz-1', 6);
    expect(result).toHaveLength(1);
  });

  test('getEngagementAnalytics returns engagement data', async () => {
    jest.spyOn(mockPrisma.businessClient, 'count').mockResolvedValue(100);
    jest.spyOn(mockPrisma.businessPageView, 'count').mockResolvedValue(500);
    jest.spyOn(mockPrisma.businessReview, 'count').mockResolvedValue(10);
    jest.spyOn(mockPrisma.conversation, 'count').mockResolvedValue(25);
    const result = await getEngagementAnalytics('biz-1');
    expect(result.totalClients).toBe(100);
    expect(result.engagementRate).toBeGreaterThanOrEqual(0);
  });

  test('getAuthTrends aggregates auth analytics events', async () => {
    jest.spyOn(mockPrisma.analyticsEvent, 'count').mockResolvedValue(3);
    jest.spyOn(mockPrisma.analyticsEvent, 'groupBy').mockResolvedValue([
      { eventName: 'USER_LOGGED_IN', _count: { _all: 2 } },
      { eventName: 'USER_SIGNED_UP', _count: { _all: 1 } },
    ]);
    jest.spyOn(mockPrisma.analyticsEvent, 'findMany').mockResolvedValue([
      { occurredAt: new Date('2026-08-01T10:00:00.000Z') },
      { occurredAt: new Date('2026-08-01T14:00:00.000Z') },
      { occurredAt: new Date('2026-08-02T09:00:00.000Z') },
    ]);
    const result = await getAuthTrends(30);
    expect(result.total).toBe(3);
    expect(result.byEvent).toHaveLength(2);
    expect(result.byEvent[0]).toEqual({ eventName: 'USER_LOGGED_IN', count: 2 });
    expect(result.byDay).toHaveLength(2);
    expect(result.byDay[0]).toEqual({ day: '2026-08-01', count: 2 });
    expect(result.byDay[1]).toEqual({ day: '2026-08-02', count: 1 });
  });
});
