jest.mock('../../services/liveService', () => ({
  getActiveLives: jest.fn(),
  getLiveById: jest.fn(),
  createLive: jest.fn(),
  startLive: jest.fn(),
  endLive: jest.fn(),
  updateLiveStatus: jest.fn(),
  addLiveProduct: jest.fn(),
  updateLiveProduct: jest.fn(),
  removeLiveProduct: jest.fn(),
  getLiveChats: jest.fn(),
  getLiveStats: jest.fn(),
}));

jest.mock('../../lib/businessAccess', () => ({
  resolveBusinessAccess: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import { mockPrisma } from '../setup';
import * as ctrl from '../../controllers/liveController';
import * as liveService from '../../services/liveService';
import { resolveBusinessAccess } from '../../lib/businessAccess';

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

describe('live controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (resolveBusinessAccess as jest.Mock).mockResolvedValue({ businessId: 'b1' });
  });

  describe('getActiveLives', () => {
    it('should return active lives', async () => {
      (liveService.getActiveLives as jest.Mock).mockResolvedValue([{ id: 'l1' }]);
      const res = mockRes();
      ctrl.getActiveLives(
        req({ query: { status: 'LIVE', businessId: 'b1', page: '1', limit: '10' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(liveService.getActiveLives).toHaveBeenCalledWith({
        status: 'LIVE',
        businessId: 'b1',
        page: 1,
        limit: 10,
      });
    });
  });

  describe('getLiveById', () => {
    it('should return live', async () => {
      (liveService.getLiveById as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.getLiveById(req({ params: { id: 'l1' } }), res, jest.fn());
      await flush();
      expect(liveService.getLiveById).toHaveBeenCalledWith('l1');
    });

    it('should return 404 if not found', async () => {
      (liveService.getLiveById as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.getLiveById(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('createLive', () => {
    it('should create live', async () => {
      (liveService.createLive as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.createLive(req({ body: { title: 'Live' } }), res, jest.fn());
      await flush();
      expect(liveService.createLive).toHaveBeenCalledWith({ title: 'Live', businessId: 'b1' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 'l1' },
        message: 'Live créé',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.createLive({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('startLive', () => {
    it('should start live', async () => {
      (liveService.startLive as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.startLive(
        req({ params: { id: 'l1' }, body: { streamUrl: 'rtmp://...' } }),
        res,
        jest.fn()
      );
      await flush();
      expect(liveService.startLive).toHaveBeenCalledWith('l1', 'b1', 'rtmp://...');
    });
  });

  describe('endLive', () => {
    it('should end live', async () => {
      (liveService.endLive as jest.Mock).mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.endLive(req({ params: { id: 'l1' } }), res, jest.fn());
      await flush();
    });
  });

  describe('deleteLive', () => {
    it('should delete live', async () => {
      mockPrisma.live.findFirst.mockResolvedValue({ id: 'l1', businessId: 'b1' });
      mockPrisma.live.delete.mockResolvedValue({ id: 'l1' });
      const res = mockRes();
      ctrl.deleteLive(req({ params: { id: 'l1' } }), res, jest.fn());
      await flush();
      expect(mockPrisma.live.findFirst).toHaveBeenCalledWith({
        where: { id: 'l1', businessId: 'b1' },
      });
      expect(mockPrisma.live.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
    });

    it('should return 404 if live not found', async () => {
      mockPrisma.live.findFirst.mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.deleteLive(req({ params: { id: 'none' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('live products', () => {
    it('addLiveProduct', async () => {
      (liveService.addLiveProduct as jest.Mock).mockResolvedValue({ id: 'lp1' });
      const res = mockRes();
      ctrl.addLiveProduct(req({ params: { id: 'l1' }, body: { productId: 'p1' } }), res, jest.fn());
      await flush();
      expect(liveService.addLiveProduct).toHaveBeenCalledWith('l1', 'b1', { productId: 'p1' });
    });
  });

  describe('getLiveChats', () => {
    it('should return chats', async () => {
      (liveService.getLiveChats as jest.Mock).mockResolvedValue([]);
      const res = mockRes();
      ctrl.getLiveChats(req({ params: { id: 'l1' }, query: { limit: '20' } }), res, jest.fn());
      await flush();
      expect(liveService.getLiveChats).toHaveBeenCalledWith('l1', 20);
    });
  });

  describe('getLiveStats', () => {
    it('should return stats', async () => {
      (liveService.getLiveStats as jest.Mock).mockResolvedValue({ viewers: 10 });
      const res = mockRes();
      ctrl.getLiveStats(req(), res, jest.fn());
      await flush();
      expect(liveService.getLiveStats).toHaveBeenCalledWith('b1');
    });
  });

  describe('access errors', () => {
    it('should return 403 if business access denied', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      ctrl.createLive(req({ body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
    });
  });
});
