import { mockPrisma } from '../setup';
import * as menuCtrl from '../../controllers/menu';

jest.mock('../../services/menu', () => ({
  listMenuItems: jest.fn(),
  createMenuItem: jest.fn(),
  deleteMenuItem: jest.fn(),
  listCategories: jest.fn(),
  createOrder: jest.fn(),
  getOrderStats: jest.fn(),
}));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import * as menuService from '../../services/menu';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  r.setHeader = jest.fn().mockReturnValue(r);
  r.send = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, cookies: {}, ...overrides } as any;
}

describe('menu controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listMenuItems', () => {
    it('success', async () => {
      (menuService.listMenuItems as jest.Mock).mockResolvedValue({ items: [], total: 0 });
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.listMenuItems(req(), res, next);
      await flush();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.listMenuItems({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('createMenuItem', () => {
    it('success with 201', async () => {
      (menuService.createMenuItem as jest.Mock).mockResolvedValue({ id: 'm1' });
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.createMenuItem(req({ body: { name: 'Pizza' } }), res, next);
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.createMenuItem({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('deleteMenuItem', () => {
    it('success with message', async () => {
      (menuService.deleteMenuItem as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.deleteMenuItem(req({ params: { id: 'm1' } }), res, next);
      await flush();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.any(String) })
      );
    });
  });

  describe('listCategories', () => {
    it('success', async () => {
      (menuService.listCategories as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.listCategories(req(), res, next);
      await flush();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.listCategories({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('createOrder', () => {
    it('success with 201', async () => {
      (menuService.createOrder as jest.Mock).mockResolvedValue({ id: 'o1' });
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.createOrder(req({ body: { items: [] } }), res, next);
      await flush();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('getOrderStats', () => {
    it('success', async () => {
      (menuService.getOrderStats as jest.Mock).mockResolvedValue({ total: 10, revenue: 100000 });
      const res = mockRes();
      const next = jest.fn();
      menuCtrl.getOrderStats(req(), res, next);
      await flush();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });
});
