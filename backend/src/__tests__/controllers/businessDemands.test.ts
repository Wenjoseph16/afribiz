import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/businessDemands';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

function mockBusiness() {
  mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
}

describe('businessDemands controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDemand', () => {
    it('should create demand and return 201', async () => {
      mockBusiness();
      mockPrisma.moduleDemand.create.mockResolvedValue({
        id: 'd1',
        moduleType: 'ECOMMERCE',
        title: 'My Module',
      });
      const res = mockRes();
      ctrl.createDemand(
        req({ body: { moduleType: 'ECOMMERCE', title: 'My Module', budget: '500000' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(mockPrisma.moduleDemand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            businessId: 'b1',
            moduleType: 'ECOMMERCE',
            title: 'My Module',
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'd1', moduleType: 'ECOMMERCE', title: 'My Module' },
      });
    });

    it('should return 400 if missing required fields', async () => {
      mockBusiness();
      const res = mockRes();
      const next = jest.fn();
      ctrl.createDemand(req({ body: { budget: '500000' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.createDemand({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getMyDemands', () => {
    it('should list demands for business', async () => {
      mockBusiness();
      const demands = [{ id: 'd1', title: 'My Module', _count: { matches: 0 } }];
      (mockPrisma as any).moduleDemand.findMany.mockResolvedValue(demands);
      const res = mockRes();
      ctrl.getMyDemands(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: demands });
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyDemands(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getDemandMatches', () => {
    it('should return matches for a demand', async () => {
      mockBusiness();
      mockPrisma.moduleDemand.findFirst.mockResolvedValue({ id: 'd1', businessId: 'b1' });
      mockPrisma.moduleMatch.findMany.mockResolvedValue([{ id: 'm1', score: 85 }]);
      const res = mockRes();
      ctrl.getDemandMatches(req({ params: { id: 'd1' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.moduleMatch.findMany).toHaveBeenCalledWith({
        where: { demandId: 'd1' },
        orderBy: { score: 'desc' },
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'm1', score: 85 }] });
    });

    it('should return 404 if demand not found', async () => {
      mockBusiness();
      mockPrisma.moduleDemand.findFirst.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getDemandMatches(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('approveDeveloper', () => {
    it('should approve developer and update matches', async () => {
      mockBusiness();
      mockPrisma.moduleDemand.findFirst.mockResolvedValue({
        id: 'd1',
        businessId: 'b1',
        title: 'Test',
        status: 'OPEN',
      });
      mockPrisma.moduleMatch.findFirst.mockResolvedValue({
        id: 'm1',
        demandId: 'd1',
        developerId: 'dev1',
        moduleId: null,
      });
      const res = mockRes();
      ctrl.approveDeveloper(req({ params: { id: 'd1', matchId: 'm1' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.moduleMatch.updateMany).toHaveBeenCalled();
      expect(mockPrisma.moduleMatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm1' },
          data: expect.objectContaining({ status: 'ACCEPTED' }),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { demandId: 'd1', matchId: 'm1', developerId: 'dev1' },
      });
    });

    it('should return 400 if demand not open', async () => {
      mockBusiness();
      mockPrisma.moduleDemand.findFirst.mockResolvedValue({
        id: 'd1',
        businessId: 'b1',
        status: 'CLOSED',
      });
      const res = mockRes();
      const next = jest.fn();
      ctrl.approveDeveloper(req({ params: { id: 'd1', matchId: 'm1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
