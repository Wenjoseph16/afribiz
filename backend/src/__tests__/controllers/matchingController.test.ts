import { mockPrisma } from '../setup';

jest.mock('../../services/matchingService', () => ({
  getDevMatches: jest.fn(),
  getBusinessMatches: jest.fn(),
  getBizForDevMatches: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d) => ({ success: true, data: d })),
}));

import * as ctrl from '../../controllers/matchingController';
import * as svc from '../../services/matchingService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return {
    user: { id: 'u1', primaryRole: 'BUSINESS' },
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as any;
}

describe('matching controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDevMatches', () => {
    it('should return dev matches', async () => {
      (svc.getDevMatches as jest.Mock).mockResolvedValue([
        { developerId: 'd1', matchingScore: 85 },
      ]);
      const res = mockRes();
      ctrl.getDevMatches(req({ query: { businessId: 'b1', limit: '5' } }), res, jest.fn());
      await flush();
      expect(svc.getDevMatches).toHaveBeenCalledWith('b1', 5);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ developerId: 'd1', matchingScore: 85 }],
      });
    });

    it('should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getDevMatches(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getBusinessMatches', () => {
    it('should return business matches', async () => {
      (svc.getBusinessMatches as jest.Mock).mockResolvedValue([
        { businessId: 'b2', matchingScore: 75 },
      ]);
      const res = mockRes();
      ctrl.getBusinessMatches(req({ query: { businessId: 'b1', limit: '5' } }), res, jest.fn());
      await flush();
      expect(svc.getBusinessMatches).toHaveBeenCalledWith('b1', 5);
    });
  });

  describe('getBizForDevMatches', () => {
    it('should return biz for dev matches', async () => {
      (svc.getBizForDevMatches as jest.Mock).mockResolvedValue([
        { businessId: 'b2', matchingScore: 65 },
      ]);
      const res = mockRes();
      ctrl.getBizForDevMatches(req({ query: { developerId: 'd1' } }), res, jest.fn());
      await flush();
      expect(svc.getBizForDevMatches).toHaveBeenCalledWith('d1', 10);
    });
  });

  describe('getSuggestedMatches', () => {
    it('should return suggestions for BUSINESS role', async () => {
      mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
      (svc.getDevMatches as jest.Mock).mockResolvedValue([{ developerId: 'd1' }]);
      const res = mockRes();
      ctrl.getSuggestedMatches(
        req({ user: { id: 'u1', primaryRole: 'BUSINESS' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.getDevMatches).toHaveBeenCalledWith('b1', 10);
    });

    it('should return suggestions for DEVELOPER role', async () => {
      (svc.getBizForDevMatches as jest.Mock).mockResolvedValue([{ businessId: 'b1' }]);
      const res = mockRes();
      ctrl.getSuggestedMatches(
        req({ user: { id: 'u1', primaryRole: 'DEVELOPER' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.getBizForDevMatches).toHaveBeenCalledWith('u1', 10);
    });

    it('should return popular businesses for other roles', async () => {
      mockPrisma.business.findMany.mockResolvedValue([{ id: 'b1', name: 'Biz', rating: 4.5 }]);
      const res = mockRes();
      ctrl.getSuggestedMatches(
        req({ user: { id: 'u1', primaryRole: 'CUSTOMER' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(mockPrisma.business.findMany).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 'b1', name: 'Biz', rating: 4.5, matchScore: 90 }],
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getSuggestedMatches({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
