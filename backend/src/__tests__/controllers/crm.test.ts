jest.mock('../../services/crm', () => ({
  getCrmDashboardStats: jest.fn(),
  getBusinessClients: jest.fn(),
  getClientDetail: jest.fn(),
  addClientNote: jest.fn(),
  updateClientNote: jest.fn(),
  deleteClientNote: jest.fn(),
  getTags: jest.fn(),
  createTag: jest.fn(),
  deleteTag: jest.fn(),
  assignTag: jest.fn(),
  removeTag: jest.fn(),
  getSegments: jest.fn(),
  createSegment: jest.fn(),
  updateSegment: jest.fn(),
  deleteSegment: jest.fn(),
  assignClientToSegment: jest.fn(),
  removeClientFromSegment: jest.fn(),
  recalculateSegment: jest.fn(),
  syncClientVisit: jest.fn(),
  listStages: jest.fn(),
  createStage: jest.fn(),
  updateStage: jest.fn(),
  deleteStage: jest.fn(),
  listDeals: jest.fn(),
  getDeal: jest.fn(),
  createDeal: jest.fn(),
  updateDeal: jest.fn(),
  moveDeal: jest.fn(),
  deleteDeal: jest.fn(),
  getPipelineStats: jest.fn(),
  seedDefaultStages: jest.fn(),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/crm';
import * as crmService from '../../services/crm';

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

describe('crm controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.business.findUnique.mockResolvedValue({ id: 'b1' });
  });

  describe('getCrmDashboardStats', () => {
    it('should return dashboard stats', async () => {
      (crmService.getCrmDashboardStats as jest.Mock).mockResolvedValue({ clients: 10 });
      const res = mockRes();
      ctrl.getCrmDashboardStats(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { clients: 10 } });
    });
  });

  describe('listClients', () => {
    it('should list clients with filters', async () => {
      (crmService.getBusinessClients as jest.Mock).mockResolvedValue([{ id: 'c1' }]);
      const res = mockRes();
      ctrl.listClients(
        req({ query: { search: 'john', isActive: 'true', limit: '20', offset: '0' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(crmService.getBusinessClients).toHaveBeenCalledWith(
        'b1',
        expect.objectContaining({ search: 'john', isActive: true, limit: 20, offset: 0 })
      );
    });
  });

  describe('getClientDetail', () => {
    it('should get client detail', async () => {
      (crmService.getClientDetail as jest.Mock).mockResolvedValue({ id: 'c1' });
      const res = mockRes();
      ctrl.getClientDetail(req({ params: { clientId: 'c1' } }), res, jest.fn());
      await flush();
      expect(crmService.getClientDetail).toHaveBeenCalledWith('b1', 'c1');
    });
  });

  describe('createNote', () => {
    it('should create note and return 201', async () => {
      (crmService.addClientNote as jest.Mock).mockResolvedValue({ id: 'n1' });
      const res = mockRes();
      ctrl.createNote(
        req({ params: { clientId: 'c1' }, body: { content: 'Note' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(crmService.addClientNote).toHaveBeenCalledWith('b1', 'c1', 'Note', 'u1');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('CRUD: tags', () => {
    it('should list tags', async () => {
      (crmService.getTags as jest.Mock).mockResolvedValue([{ id: 't1' }]);
      const res = mockRes();
      ctrl.listTags(req(), res, jest.fn());
      await flush();
      expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 't1' }] });
    });

    it('should create tag', async () => {
      (crmService.createTag as jest.Mock).mockResolvedValue({ id: 't1' });
      const res = mockRes();
      ctrl.createTag(req({ body: { name: 'VIP', color: 'gold' } }), res, jest.fn());
      await flush();
      expect(crmService.createTag).toHaveBeenCalledWith('b1', 'VIP', 'gold');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should delete tag', async () => {
      (crmService.deleteTag as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.deleteTag(req({ params: { tagId: 't1' } }), res, jest.fn());
      await flush();
      expect(crmService.deleteTag).toHaveBeenCalledWith('b1', 't1');
    });
  });

  describe('segments', () => {
    it('should list segments', async () => {
      (crmService.getSegments as jest.Mock).mockResolvedValue([{ id: 's1' }]);
      const res = mockRes();
      ctrl.listSegments(req(), res, jest.fn());
      await flush();
    });

    it('should create segment', async () => {
      (crmService.createSegment as jest.Mock).mockResolvedValue({ id: 's1' });
      const res = mockRes();
      ctrl.createSegment(req({ body: { name: 'Segment', conditions: {} } }), res, jest.fn());
      await flush();
      expect(crmService.createSegment).toHaveBeenCalledWith('b1', {
        name: 'Segment',
        conditions: {},
      });
    });
  });

  describe('pipeline / deals', () => {
    it('should list stages', async () => {
      (crmService.listStages as jest.Mock).mockResolvedValue([{ id: 'st1' }]);
      const res = mockRes();
      ctrl.listStages(req(), res, jest.fn());
      await flush();
    });

    it('should list deals', async () => {
      (crmService.listDeals as jest.Mock).mockResolvedValue([{ id: 'd1' }]);
      const res = mockRes();
      ctrl.listDeals(req({ query: { stageId: 'st1' } }), res, jest.fn());
      await flush();
      expect(crmService.listDeals).toHaveBeenCalledWith('b1', {
        stageId: 'st1',
        search: undefined,
      });
    });

    it('should create deal', async () => {
      (crmService.createDeal as jest.Mock).mockResolvedValue({ id: 'd1' });
      const res = mockRes();
      ctrl.createDeal(req({ body: { title: 'Deal' } }), res, jest.fn());
      await flush();
      expect(crmService.createDeal).toHaveBeenCalledWith('b1', { title: 'Deal' });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should move deal', async () => {
      (crmService.moveDeal as jest.Mock).mockResolvedValue({ id: 'd1' });
      const res = mockRes();
      ctrl.moveDeal(req({ params: { dealId: 'd1' }, body: { stageId: 'st2' } }), res, jest.fn());
      await flush();
      expect(crmService.moveDeal).toHaveBeenCalledWith('b1', 'd1', { stageId: 'st2' });
    });

    it('should seed default stages', async () => {
      (crmService.seedDefaultStages as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      ctrl.seedDefaultStages(req(), res, jest.fn());
      await flush();
      expect(crmService.seedDefaultStages).toHaveBeenCalledWith('b1');
    });
  });

  describe('errors', () => {
    it('should return 401 if no user', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getCrmDashboardStats({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if business not found', async () => {
      mockPrisma.business.findUnique.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getCrmDashboardStats(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
