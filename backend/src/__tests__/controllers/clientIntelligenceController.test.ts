jest.mock('../../services/clientIntelligenceService', () => ({
  segmentClients: jest.fn(),
  getTopClients: jest.fn(),
  getActivityBarometer: jest.fn(),
}));

jest.mock('../../services/business', () => ({
  getMyBusiness: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d) => ({ success: true, data: d })),
}));

import { mockPrisma } from '../setup';

import * as ctrl from '../../controllers/clientIntelligenceController';
import * as ci from '../../services/clientIntelligenceService';
import * as bs from '../../services/business';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  r.status = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('clientIntelligence controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyClientIntelligence', () => {
    it('should return computed intelligence', async () => {
      (bs.getMyBusiness as jest.Mock).mockResolvedValue({ id: 'b1' });
      (ci.segmentClients as jest.Mock).mockResolvedValue({
        counts: { VIP: 1 },
        clients: [{ id: 'c1' }],
        suggestions: [{ segment: 'VIP', message: 'Top clients' }],
      });
      (ci.getTopClients as jest.Mock).mockResolvedValue([
        {
          clientId: 'c1',
          firstName: 'John',
          lastName: 'Doe',
          ordersInPeriod: 5,
          totalSpentInPeriod: 50000,
        },
      ]);
      (ci.getActivityBarometer as jest.Mock).mockResolvedValue({
        peakHour: { hour: '18h', count: 10 },
        peakDay: { day: 'Samedi', count: 20 },
        trendingProducts: [{ name: 'Product A' }],
      });

      const res = mockRes();
      ctrl.getMyClientIntelligence(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalled();
      const call = (res.json as jest.Mock).mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.avgScore).toBe('100%');
      expect(call.data.insights.length).toBeGreaterThan(0);
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyClientIntelligence({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if no business', async () => {
      (bs.getMyBusiness as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyClientIntelligence(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getClientSegments', () => {
    it('should return segments', async () => {
      (ci.segmentClients as jest.Mock).mockResolvedValue({ segments: ['VIP'] });
      const res = mockRes();
      ctrl.getClientSegments(req({ query: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(ci.segmentClients).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { segments: ['VIP'] } });
    });

    it('should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getClientSegments(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getClientSegments({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getTopClients', () => {
    it('should return top clients', async () => {
      (ci.getTopClients as jest.Mock).mockResolvedValue([{ clientId: 'c1' }]);
      const res = mockRes();
      ctrl.getTopClients(
        req({ query: { businessId: 'b1', period: '7d', limit: '5' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(ci.getTopClients).toHaveBeenCalledWith('b1', '7d', 5);
    });

    it('should use defaults for query params', async () => {
      (ci.getTopClients as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getTopClients(req({ query: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(ci.getTopClients).toHaveBeenCalledWith('b1', '30d', 10);
    });
  });

  describe('getActivityBarometer', () => {
    it('should return barometer', async () => {
      (ci.getActivityBarometer as jest.Mock).mockResolvedValue({
        peakHour: { hour: '18h', count: 10 },
      });
      const res = mockRes();
      ctrl.getActivityBarometer(req({ query: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(ci.getActivityBarometer).toHaveBeenCalledWith('b1');
    });
  });
});
