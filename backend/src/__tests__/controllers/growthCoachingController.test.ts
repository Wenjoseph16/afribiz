jest.mock('../../services/growthCoachingService', () => ({
  getGrowthDetection: jest.fn(),
  getCoachDashboard: jest.fn(),
  getModuleRecommendations: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d) => ({ success: true, data: d })),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/growthCoachingController';
import * as gc from '../../services/growthCoachingService';

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

describe('growthCoaching controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  describe('getGrowthDetection', () => {
    it('should return growth detection', async () => {
      (gc.getGrowthDetection as jest.Mock).mockResolvedValue({ opportunities: [] });
      const res = mockRes();
      ctrl.getGrowthDetection(req(), res, jest.fn());
      await flush();
      expect(gc.getGrowthDetection).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { opportunities: [] } });
    });

    it('should use businessId from query', async () => {
      (gc.getGrowthDetection as jest.Mock).mockResolvedValue({});
      const res = mockRes();
      ctrl.getGrowthDetection(req({ query: { businessId: 'b2' } }), res, jest.fn());
      await flush();
      expect(gc.getGrowthDetection).toHaveBeenCalledWith('b2');
    });

    it('should return 401 if no user and no query businessId', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getGrowthDetection({ query: {} } as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getCoachDashboard', () => {
    it('should return dashboard', async () => {
      (gc.getCoachDashboard as jest.Mock).mockResolvedValue({ score: 75 });
      const res = mockRes();
      ctrl.getCoachDashboard(req(), res, jest.fn());
      await flush();
    });
  });

  describe('getModuleRecommendations', () => {
    it('should return recommendations', async () => {
      (gc.getModuleRecommendations as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getModuleRecommendations(req(), res, jest.fn());
      await flush();
    });
  });
});
