jest.mock('../../services/ModuleDemandService', () => ({
  ModuleDemandService: {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    findMatches: jest.fn(),
    autoMatch: jest.fn(),
    updateMatchStatus: jest.fn(),
  },
}));

import * as ctrl from '../../controllers/moduleDemandController';
import { ModuleDemandService } from '../../services/ModuleDemandService';

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

describe('moduleDemand controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDemand', () => {
    it('should create and return 201', async () => {
      (ModuleDemandService.create as jest.Mock).mockResolvedValue({ id: 'd1', title: 'Test' });
      const res = mockRes();
      ctrl.createDemand(req({ body: { businessId: 'b1', title: 'Test' } }), res, jest.fn());
      await flush();
      expect(ModuleDemandService.create).toHaveBeenCalledWith({ businessId: 'b1', title: 'Test' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'd1', title: 'Test' },
        message: 'Demande de module creee',
      });
    });
  });

  describe('getDemand', () => {
    it('should get demand by id', async () => {
      (ModuleDemandService.findById as jest.Mock).mockResolvedValue({ id: 'd1' });
      const res = mockRes();
      ctrl.getDemand(req({ params: { id: 'd1' } }), res, jest.fn());
      await flush();
      expect(ModuleDemandService.findById).toHaveBeenCalledWith('d1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'd1' } });
    });
  });

  describe('getAllDemands', () => {
    it('should list with filters', async () => {
      (ModuleDemandService.findAll as jest.Mock).mockResolvedValue([{ id: 'd1' }]);
      const res = mockRes();
      ctrl.getAllDemands(
        req({
          query: { businessId: 'b1', moduleType: 'ECOMMERCE', status: 'OPEN', search: 'shop' },
        }),
        res,
        jest.fn()
      );
      await flush();
      expect(ModuleDemandService.findAll).toHaveBeenCalledWith({
        businessId: 'b1',
        moduleType: 'ECOMMERCE',
        status: 'OPEN',
        search: 'shop',
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 'd1' }] });
    });

    it('should handle empty query params', async () => {
      (ModuleDemandService.findAll as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getAllDemands(req(), res, jest.fn());
      await flush();
      expect(ModuleDemandService.findAll).toHaveBeenCalledWith({
        businessId: undefined,
        moduleType: undefined,
        status: undefined,
        search: undefined,
      });
    });
  });

  describe('updateDemandStatus', () => {
    it('should update status', async () => {
      (ModuleDemandService.updateStatus as jest.Mock).mockResolvedValue({
        id: 'd1',
        status: 'IN_PROGRESS',
      });
      const res = mockRes();
      ctrl.updateDemandStatus(
        req({ params: { id: 'd1' }, body: { status: 'IN_PROGRESS' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(ModuleDemandService.updateStatus).toHaveBeenCalledWith('d1', 'IN_PROGRESS');
    });
  });

  describe('deleteDemand', () => {
    it('should delete demand', async () => {
      (ModuleDemandService.delete as jest.Mock).mockResolvedValue({ message: 'Demande supprimee' });
      const res = mockRes();
      ctrl.deleteDemand(req({ params: { id: 'd1' } }), res, jest.fn());
      await flush();
      expect(ModuleDemandService.delete).toHaveBeenCalledWith('d1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Demande supprimee' });
    });
  });

  describe('findMatches', () => {
    it('should find matches', async () => {
      (ModuleDemandService.findMatches as jest.Mock).mockResolvedValue([{ id: 'm1' }]);
      const res = mockRes();
      ctrl.findMatches(req({ params: { id: 'd1' } }), res, jest.fn());
      await flush();
      expect(ModuleDemandService.findMatches).toHaveBeenCalledWith('d1');
    });
  });

  describe('autoMatch', () => {
    it('should auto-match', async () => {
      (ModuleDemandService.autoMatch as jest.Mock).mockResolvedValue([{ id: 'm1' }]);
      const res = mockRes();
      ctrl.autoMatch(req({ params: { id: 'd1' } }), res, jest.fn());
      await flush();
      expect(ModuleDemandService.autoMatch).toHaveBeenCalledWith('d1');
    });
  });

  describe('updateMatch', () => {
    it('should update match status', async () => {
      (ModuleDemandService.updateMatchStatus as jest.Mock).mockResolvedValue({
        id: 'm1',
        status: 'ACCEPTED',
      });
      const res = mockRes();
      ctrl.updateMatch(
        req({ params: { matchId: 'm1' }, body: { status: 'ACCEPTED' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(ModuleDemandService.updateMatchStatus).toHaveBeenCalledWith('m1', 'ACCEPTED');
    });
  });
});
