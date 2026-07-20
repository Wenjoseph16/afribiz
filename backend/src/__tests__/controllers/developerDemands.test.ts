import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/developerDemands';

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

describe('developerDemands controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOpenDemands', () => {
    it('should return open demands with filters', async () => {
      mockPrisma.moduleDemand.findMany.mockResolvedValue([{ id: 'd1', _count: { matches: 0 } }]);
      const res = mockRes();
      ctrl.getOpenDemands(
        req({ query: { moduleType: 'ECOMMERCE', search: 'shop' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(mockPrisma.moduleDemand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'OPEN', moduleType: 'ECOMMERCE' }),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 'd1', _count: { matches: 0 } }],
      });
    });

    it('should work without filters', async () => {
      mockPrisma.moduleDemand.findMany.mockResolvedValue([]);
      const res = mockRes();
      ctrl.getOpenDemands(req(), res, jest.fn());
      await flush();
      expect(mockPrisma.moduleDemand.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'OPEN' } })
      );
    });
  });

  describe('getMyMatchedDemands', () => {
    it('should return matched demands', async () => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue({ id: 'dev1' });
      (mockPrisma as any).moduleMatch.findMany.mockResolvedValue([
        { id: 'mm1', demand: { business: {} } },
      ]);
      const res = mockRes();
      ctrl.getMyMatchedDemands(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyMatchedDemands({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if no developer profile', async () => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getMyMatchedDemands(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('getDeveloperDemandById', () => {
    it('should return demand if accessible', async () => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue({ id: 'dev1' });
      (mockPrisma as any).moduleDemand.findFirst.mockResolvedValue({
        id: 'd1',
        business: {},
        _count: { matches: 0 },
      });
      const res = mockRes();
      ctrl.getDeveloperDemandById(req({ params: { id: 'd1' } }), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({ id: 'd1' }),
      });
    });

    it('should return 404 if demand not found', async () => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue({ id: 'dev1' });
      (mockPrisma as any).moduleDemand.findFirst.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getDeveloperDemandById(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('applyToDemand', () => {
    beforeEach(() => {
      mockPrisma.developerProfile.findUnique.mockResolvedValue({
        id: 'dev1',
        companyName: 'DevCo',
      });
      mockPrisma.moduleDemand.findUnique.mockResolvedValue({
        id: 'd1',
        businessId: 'b1',
        title: 'Shop',
        status: 'OPEN',
      });
      mockPrisma.moduleMatch.findFirst.mockResolvedValue(null);
    });

    it('should apply with existing module', async () => {
      mockPrisma.developerModule.findFirst.mockResolvedValue({
        id: 'm1',
        name: 'Shop Module',
        category: 'ECOMMERCE',
        isVerified: true,
        isFeatured: false,
        price: 0,
      });
      mockPrisma.business.findUnique.mockResolvedValue({ ownerId: 'bowner' });
      (mockPrisma as any).moduleMatch.create.mockResolvedValue({ id: 'mm1', score: 85 });
      mockPrisma.notification.create.mockResolvedValue({ id: 'n1' });

      const res = mockRes();
      ctrl.applyToDemand(
        req({ params: { id: 'd1' }, body: { moduleId: 'm1', proposalType: 'EXISTING' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should apply with custom build', async () => {
      (mockPrisma as any).moduleMatch.create.mockResolvedValue({ id: 'mm2', score: 60 });
      const res = mockRes();
      ctrl.applyToDemand(
        req({ params: { id: 'd1' }, body: { proposalType: 'CUSTOM_BUILD' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if existing proposal missing moduleId', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.applyToDemand(
        req({ params: { id: 'd1' }, body: { proposalType: 'EXISTING' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 409 if already applied', async () => {
      mockPrisma.moduleMatch.findFirst.mockResolvedValue({ id: 'existing' });
      const res = mockRes();
      const next = jest.fn();
      ctrl.applyToDemand(
        req({ params: { id: 'd1' }, body: { moduleId: 'm1', proposalType: 'EXISTING' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
    });
  });
});
