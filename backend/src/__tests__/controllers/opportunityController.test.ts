jest.mock('../../services/opportunityService', () => ({
  getOpportunityFeed: jest.fn(),
  detectOpportunities: jest.fn(),
  updateOpportunityStatus: jest.fn(),
  getPublicOpportunityFeed: jest.fn(),
  getUnmetDemandFeed: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import * as ctrl from '../../controllers/opportunityController';
import * as svc from '../../services/opportunityService';

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

describe('opportunity controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOpportunityFeed', () => {
    it('should return opportunity feed', async () => {
      const result = { items: [] };
      (svc.getOpportunityFeed as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.getOpportunityFeed(
        req({ query: { businessId: 'b1', page: '2', limit: '10' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.getOpportunityFeed).toHaveBeenCalledWith('b1', 2, 10);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getOpportunityFeed(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('detectOpportunities', () => {
    it('should detect opportunities', async () => {
      (svc.detectOpportunities as jest.Mock).mockResolvedValue(5);
      const res = mockRes();
      ctrl.detectOpportunities(req({ body: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(svc.detectOpportunities).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { detected: 5 },
        message: '5 opportunité(s) détectée(s)',
      });
    });

    it('should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.detectOpportunities(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.detectOpportunities({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('updateOpportunityStatus', () => {
    it('should update status', async () => {
      (svc.updateOpportunityStatus as jest.Mock).mockResolvedValue({ id: 'o1', status: 'NEW' });
      const res = mockRes();
      ctrl.updateOpportunityStatus(
        req({ params: { id: 'o1' }, body: { status: 'NEW' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.updateOpportunityStatus).toHaveBeenCalledWith('o1', 'NEW');
    });

    it('should return 400 if invalid status', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.updateOpportunityStatus(
        req({ params: { id: 'o1' }, body: { status: 'INVALID' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.updateOpportunityStatus({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getPublicFeed', () => {
    it('should return public feed with trends and unmet demand', async () => {
      (svc.getPublicOpportunityFeed as jest.Mock).mockResolvedValue([{ id: 'o1' }]);
      (svc.getUnmetDemandFeed as jest.Mock).mockResolvedValue([{ id: 'd1' }]);
      const res = mockRes();
      ctrl.getPublicFeed(req(), res, jest.fn());
      await flush();
      expect(svc.getPublicOpportunityFeed).toHaveBeenCalledWith(1, 10);
      expect(svc.getUnmetDemandFeed).toHaveBeenCalledWith(1, 10);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { trends: [{ id: 'o1' }], unmetDemand: [{ id: 'd1' }] },
      });
    });
  });
});
