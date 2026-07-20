import { mockPrisma } from '../setup';

jest.mock('../../services/savedItemService', () => ({
  saveItem: jest.fn(),
  unsaveItem: jest.fn(),
  listSavedItems: jest.fn(),
  checkSaved: jest.fn(),
  getSavedCount: jest.fn(),
}));

import * as savedCtrl from '../../controllers/savedItemController';
const savedItemService = jest.requireMock('../../services/savedItemService');

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

describe('savedItem controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveItem', () => {
    it('should save item and return 201', async () => {
      const data = { id: 's1', userId: 'u1', type: 'PROMOTION', referenceId: 'r1' };
      (savedItemService.saveItem as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      savedCtrl.saveItem(req({ body: { type: 'PROMOTION', referenceId: 'r1' } }), res, next);
      await flush();
      expect(savedItemService.saveItem).toHaveBeenCalledWith('u1', {
        type: 'PROMOTION',
        referenceId: 'r1',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      savedCtrl.saveItem({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('unsaveItem', () => {
    it('should unsave item successfully', async () => {
      const result = { message: 'Élément retiré des favoris' };
      (savedItemService.unsaveItem as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      savedCtrl.unsaveItem(req({ params: { id: 's1' } }), res, next);
      await flush();
      expect(savedItemService.unsaveItem).toHaveBeenCalledWith('u1', 's1');
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });
  });

  describe('listSavedItems', () => {
    it('should list saved items', async () => {
      const result = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (savedItemService.listSavedItems as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      savedCtrl.listSavedItems(req({ query: { page: '1', limit: '20' } }), res, next);
      await flush();
      expect(savedItemService.listSavedItems).toHaveBeenCalledWith('u1', {
        page: '1',
        limit: '20',
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });
  });

  describe('checkSaved', () => {
    it('should return saved status', async () => {
      const result = { saved: true, id: 's1' };
      (savedItemService.checkSaved as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      savedCtrl.checkSaved(req({ query: { type: 'PROMOTION', referenceId: 'r1' } }), res, next);
      await flush();
      expect(savedItemService.checkSaved).toHaveBeenCalledWith('u1', 'PROMOTION', 'r1');
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });
  });

  describe('getSavedCount', () => {
    it('should return saved count', async () => {
      const result = { count: 5 };
      (savedItemService.getSavedCount as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      savedCtrl.getSavedCount(req({ query: { referenceId: 'r1' } }), res, next);
      await flush();
      expect(savedItemService.getSavedCount).toHaveBeenCalledWith('r1');
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should return 0 count when no referenceId', async () => {
      const res = mockRes();
      const next = jest.fn();
      savedCtrl.getSavedCount(req({ query: {} }), res, next);
      await flush();
      expect(savedItemService.getSavedCount).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, count: 0 });
    });
  });
});
