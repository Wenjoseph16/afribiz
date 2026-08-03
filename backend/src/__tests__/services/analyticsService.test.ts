import { mockPrisma } from '../setup';
import {
  trackAnalyticsEvent,
  getAnalyticsEvents,
  getEventBreakdownByType,
  getEventBreakdownByCategory,
  getAnalyticsSummary,
  getBusinessAnalyticsCounters,
} from '../../services/analyticsService';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockEvent = {
  id: 'ev-1',
  businessId: 'b1',
  userId: 'u1',
  type: 'order',
  category: 'commercial',
  eventName: 'ORDER_PLACED',
  properties: { orderId: 'o1' },
  value: 5000,
  occurredAt: new Date(),
};

describe('analyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackAnalyticsEvent', () => {
    test('creates an AnalyticsEvent with all fields', async () => {
      (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue(mockEvent);
      await trackAnalyticsEvent({
        businessId: 'b1',
        userId: 'u1',
        type: 'order',
        category: 'commercial',
        eventName: 'ORDER_PLACED',
        value: 5000,
        properties: { orderId: 'o1' },
      });
      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          businessId: 'b1',
          userId: 'u1',
          type: 'order',
          category: 'commercial',
          eventName: 'ORDER_PLACED',
          properties: { orderId: 'o1' },
          value: 5000,
        },
      });
    });

    test('accepts minimal payload (nulls + undefined optional)', async () => {
      (mockPrisma.analyticsEvent.create as jest.Mock).mockResolvedValue({});
      await trackAnalyticsEvent({ type: 'page_view', eventName: 'BUSINESS_VIEWED' });
      const arg = (mockPrisma.analyticsEvent.create as jest.Mock).mock.calls[0][0];
      expect(arg.data.businessId).toBeNull();
      expect(arg.data.category).toBeNull();
      expect(arg.data.properties).toBeUndefined();
      expect(arg.data.value).toBeUndefined();
    });

    test('is non-blocking: a DB failure does not throw', async () => {
      (mockPrisma.analyticsEvent.create as jest.Mock).mockRejectedValue(new Error('db down'));
      await expect(
        trackAnalyticsEvent({ type: 'order', eventName: 'ORDER_PLACED' })
      ).resolves.toBeUndefined();
    });
  });

  describe('getAnalyticsEvents', () => {
    test('returns paginated events with filters', async () => {
      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([mockEvent]);
      (mockPrisma.analyticsEvent.count as jest.Mock).mockResolvedValue(1);
      const r = await getAnalyticsEvents({ businessId: 'b1', type: 'order', page: 1, limit: 10 });
      expect(r.events).toHaveLength(1);
      expect(r.total).toBe(1);
      expect(r.totalPages).toBe(1);
      expect(mockPrisma.analyticsEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId: 'b1', type: 'order' }),
        })
      );
    });

    test('applies search filter on eventName', async () => {
      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.analyticsEvent.count as jest.Mock).mockResolvedValue(0);
      await getAnalyticsEvents({ search: 'ORDER' });
      const where = (mockPrisma.analyticsEvent.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.eventName).toEqual({ contains: 'ORDER', mode: 'insensitive' });
    });

    test('applies date range filter', async () => {
      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.analyticsEvent.count as jest.Mock).mockResolvedValue(0);
      await getAnalyticsEvents({ from: '2026-01-01', to: '2026-01-31' });
      const where = (mockPrisma.analyticsEvent.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.occurredAt.gte).toBeInstanceOf(Date);
      expect(where.occurredAt.lte).toBeInstanceOf(Date);
    });

    test('caps limit at 200', async () => {
      (mockPrisma.analyticsEvent.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.analyticsEvent.count as jest.Mock).mockResolvedValue(0);
      await getAnalyticsEvents({ limit: 9999 });
      expect((mockPrisma.analyticsEvent.findMany as jest.Mock).mock.calls[0][0].take).toBe(200);
    });
  });

  describe('getEventBreakdownByType', () => {
    test('groups by type with counts', async () => {
      (mockPrisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue([
        { type: 'order', _count: { _all: 5 } },
        { type: 'booking', _count: { _all: 3 } },
      ]);
      const r = await getEventBreakdownByType('b1', 30);
      expect(r).toEqual([
        { type: 'order', count: 5 },
        { type: 'booking', count: 3 },
      ]);
      const arg = (mockPrisma.analyticsEvent.groupBy as jest.Mock).mock.calls[0][0];
      expect(arg.by).toEqual(['type']);
      expect(arg.where.businessId).toBe('b1');
      expect(arg.where.occurredAt.gte).toBeInstanceOf(Date);
    });
  });

  describe('getEventBreakdownByCategory', () => {
    test('groups by category excluding nulls', async () => {
      (mockPrisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue([
        { category: 'commercial', _count: { _all: 8 } },
      ]);
      const r = await getEventBreakdownByCategory('b1', 30);
      expect(r).toEqual([{ category: 'commercial', count: 8 }]);
      const arg = (mockPrisma.analyticsEvent.groupBy as jest.Mock).mock.calls[0][0];
      expect(arg.where.category).toEqual({ not: null });
    });
  });

  describe('getAnalyticsSummary', () => {
    test('aggregates totals, today and breakdowns', async () => {
      (mockPrisma.analyticsEvent.count as jest.Mock)
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(7);
      (mockPrisma.analyticsEvent.groupBy as jest.Mock)
        .mockResolvedValueOnce([{ type: 'order', _count: { _all: 60 } }])
        .mockResolvedValueOnce([{ category: 'commercial', _count: { _all: 40 } }]);
      const r = await getAnalyticsSummary('b1', 30);
      expect(r.total).toBe(100);
      expect(r.today).toBe(7);
      expect(r.byType).toEqual([{ type: 'order', count: 60 }]);
      expect(r.byCategory).toEqual([{ category: 'commercial', count: 40 }]);
    });
  });

  describe('getBusinessAnalyticsCounters', () => {
    test('aggregates counts per type and revenue via groupBy + aggregate', async () => {
      (mockPrisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue([
        { type: 'order', _count: { _all: 2 } },
        { type: 'booking', _count: { _all: 1 } },
        { type: 'page_view', _count: { _all: 1 } },
      ]);
      (mockPrisma.analyticsEvent.aggregate as jest.Mock).mockResolvedValue({
        _sum: { value: 10000 },
      });
      const r = await getBusinessAnalyticsCounters('b1', 30);
      expect(r.totals).toEqual({ order: 2, booking: 1, page_view: 1 });
      expect(r.revenue).toBe(10000);
      expect(r.eventCount).toBe(4);
      expect(mockPrisma.analyticsEvent.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['type'],
          where: expect.objectContaining({ businessId: 'b1' }),
        })
      );
      expect(mockPrisma.analyticsEvent.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ businessId: 'b1' }),
        })
      );
    });

    test('returns zero when no events', async () => {
      (mockPrisma.analyticsEvent.groupBy as jest.Mock).mockResolvedValue([]);
      (mockPrisma.analyticsEvent.aggregate as jest.Mock).mockResolvedValue({
        _sum: { value: null },
      });
      const r = await getBusinessAnalyticsCounters('b1', 30);
      expect(r.totals).toEqual({});
      expect(r.revenue).toBe(0);
      expect(r.eventCount).toBe(0);
    });
  });
});
