jest.mock('../../services/marketplaceNeedService', () => ({
  createNeed: jest.fn(),
  getNeeds: jest.fn(),
  getNeedById: jest.fn(),
  voteNeed: jest.fn(),
  unvoteNeed: jest.fn(),
  closeNeed: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import * as ctrl from '../../controllers/marketNeedController';
import * as svc from '../../services/marketplaceNeedService';

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

describe('marketNeed controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNeed', () => {
    it('should create and return 201', async () => {
      (svc.createNeed as jest.Mock).mockResolvedValue({ id: 'n1', title: 'Need' });
      const res = mockRes();
      ctrl.createNeed(
        req({ body: { businessId: 'b1', title: 'Need', category: 'TECH' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(svc.createNeed).toHaveBeenCalledWith({
        businessId: 'b1',
        title: 'Need',
        category: 'TECH',
        description: undefined,
        budget: undefined,
        urgency: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'n1', title: 'Need' },
        message: 'Besoin publié',
      });
    });

    it('should return 400 if missing required fields', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.createNeed(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.createNeed({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getNeeds (public)', () => {
    it('should return paginated needs', async () => {
      const result = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (svc.getNeeds as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      ctrl.getNeeds(req({ query: { category: 'TECH', page: '2', limit: '10' } }), res, jest.fn());
      await flush();
      expect(svc.getNeeds).toHaveBeenCalledWith({
        category: 'TECH',
        status: undefined,
        page: 2,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getNeedById', () => {
    it('should return need', async () => {
      (svc.getNeedById as jest.Mock).mockResolvedValue({ id: 'n1' });
      const res = mockRes();
      ctrl.getNeedById(req({ params: { id: 'n1' } }), res, jest.fn());
      await flush();
      expect(svc.getNeedById).toHaveBeenCalledWith('n1');
    });

    it('should return 404 if not found', async () => {
      (svc.getNeedById as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getNeedById(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('voteNeed', () => {
    it('should vote', async () => {
      (svc.voteNeed as jest.Mock).mockResolvedValue({ id: 'n1', votes: 5 });
      const res = mockRes();
      ctrl.voteNeed(req({ params: { id: 'n1' } }), res, jest.fn());
      await flush();
      expect(svc.voteNeed).toHaveBeenCalledWith('n1', 'u1');
    });
  });

  describe('unvoteNeed', () => {
    it('should unvote', async () => {
      (svc.unvoteNeed as jest.Mock).mockResolvedValue({ id: 'n1', votes: 4 });
      const res = mockRes();
      ctrl.unvoteNeed(req({ params: { id: 'n1' } }), res, jest.fn());
      await flush();
      expect(svc.unvoteNeed).toHaveBeenCalledWith('n1', 'u1');
    });
  });

  describe('closeNeed', () => {
    it('should close need', async () => {
      (svc.closeNeed as jest.Mock).mockResolvedValue({ id: 'n1', status: 'CLOSED' });
      const res = mockRes();
      ctrl.closeNeed(req({ params: { id: 'n1' }, body: { businessId: 'b1' } }), res, jest.fn());
      await flush();
      expect(svc.closeNeed).toHaveBeenCalledWith('n1', 'b1');
    });

    it('should return 400 if businessId missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.closeNeed(req({ params: { id: 'n1' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
