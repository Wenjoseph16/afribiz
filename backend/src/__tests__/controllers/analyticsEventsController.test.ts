import { Response } from 'express';
import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/analyticsEventsController';
import * as analyticsService from '../../services/analyticsService';

jest.mock('../../services/analyticsService', () => ({
  getAnalyticsEvents: jest.fn(),
  getEventBreakdownByType: jest.fn(),
  getEventBreakdownByCategory: jest.fn(),
  getAnalyticsSummary: jest.fn(),
  getBusinessAnalyticsCounters: jest.fn(),
}));

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

function req(overrides: any = {}) {
  return {
    user: { id: 'u1', email: 'a@b.c', primaryRole: 'BUSINESS', roles: ['BUSINESS'] },
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as any;
}

function res() {
  const r: any = { statusCode: 200 };
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r as Response;
}

// catchAsyncErrors ne retourne pas de promesse — on laisse la microtask/macrotask tourner
function flush() {
  return new Promise((r) => setImmediate(r));
}

describe('analyticsEventsController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getEventsFeed returns paginated events scoped to business', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'b1' });
    (analyticsService.getAnalyticsEvents as jest.Mock).mockResolvedValue({
      events: [{ id: 'ev-1' }],
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    });
    const r = res();
    ctrl.getEventsFeed(req({ query: { type: 'order', page: '2' } }), r, jest.fn());
    await flush();
    expect(analyticsService.getAnalyticsEvents).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: 'b1', type: 'order', page: 2 })
    );
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: expect.objectContaining({ total: 1 }) })
    );
  });

  test('getEventsFeed for admin does not scope to business', async () => {
    (analyticsService.getAnalyticsEvents as jest.Mock).mockResolvedValue({
      events: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    });
    const r = res();
    const adminReq = req({
      user: { id: 'a1', email: 'admin@afribiz.com', primaryRole: 'ADMIN', roles: ['ADMIN'] },
    });
    ctrl.getEventsFeed(adminReq, r, jest.fn());
    await flush();
    expect(mockPrisma.business.findUnique).not.toHaveBeenCalled();
    expect(analyticsService.getAnalyticsEvents).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: undefined })
    );
  });

  test('getEventsByType returns breakdown', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'b1' });
    (analyticsService.getEventBreakdownByType as jest.Mock).mockResolvedValue([
      { type: 'order', count: 5 },
    ]);
    const r = res();
    ctrl.getEventsByType(req({ query: { days: '7' } }), r, jest.fn());
    await flush();
    expect(analyticsService.getEventBreakdownByType).toHaveBeenCalledWith('b1', 7);
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ days: 7 }) })
    );
  });

  test('getEventsByCategory returns category breakdown', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'b1' });
    (analyticsService.getEventBreakdownByCategory as jest.Mock).mockResolvedValue([
      { category: 'commercial', count: 8 },
    ]);
    const r = res();
    ctrl.getEventsByCategory(req(), r, jest.fn());
    await flush();
    expect(analyticsService.getEventBreakdownByCategory).toHaveBeenCalledWith('b1', 30);
  });

  test('getEventsSummary returns totals', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'b1' });
    (analyticsService.getAnalyticsSummary as jest.Mock).mockResolvedValue({
      total: 100,
      today: 7,
      byType: [],
      byCategory: [],
      days: 30,
    });
    const r = res();
    ctrl.getEventsSummary(req(), r, jest.fn());
    await flush();
    expect(analyticsService.getAnalyticsSummary).toHaveBeenCalledWith('b1', 30);
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ total: 100 }) })
    );
  });

  test('getEventsCounters returns counters for business', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'b1' });
    (analyticsService.getBusinessAnalyticsCounters as jest.Mock).mockResolvedValue({
      totals: { order: 2 },
      revenue: 8000,
      eventCount: 2,
    });
    const r = res();
    ctrl.getEventsCounters(req(), r, jest.fn());
    await flush();
    expect(analyticsService.getBusinessAnalyticsCounters).toHaveBeenCalledWith('b1', 30);
    expect(r.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ revenue: 8000 }) })
    );
  });

  test('getEventsCounters returns 404 when no business', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const r = res();
    const next = jest.fn();
    ctrl.getEventsCounters(req(), r, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  test('getEventsFeed returns 404 for business user without business', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const r = res();
    const next = jest.fn();
    ctrl.getEventsFeed(req(), r, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    expect(analyticsService.getAnalyticsEvents).not.toHaveBeenCalled();
  });

  test('getEventsByType returns 404 for business user without business', async () => {
    (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
    const r = res();
    const next = jest.fn();
    ctrl.getEventsByType(req(), r, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });
});
