import { mockPrisma } from '../setup';
import * as followCtrl from '../../controllers/followController';

jest.mock('../../services/followService', () => ({
  follow: jest.fn(),
  unfollow: jest.fn(),
  getFollowers: jest.fn(),
  getFollowing: jest.fn(),
  getFollowCount: jest.fn(),
  isFollowing: jest.fn(),
}));

import {
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  getFollowCount,
  isFollowing,
} from '../../services/followService';

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

describe('follow controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should follow successfully and return 201', async () => {
      const data = { id: 'f1', followerId: 'u1', businessId: 'b1' };
      (follow as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      followCtrl.follow(req({ body: { businessId: 'b1' } }), res, next);
      await flush();
      expect(follow).toHaveBeenCalledWith('u1', { businessId: 'b1' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Vous suivez maintenant',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      followCtrl.follow({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('unfollow', () => {
    it('should unfollow successfully', async () => {
      const result = { message: 'Arrêté de suivre' };
      (unfollow as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      followCtrl.unfollow(req({ params: { id: 'f1' } }), res, next);
      await flush();
      expect(unfollow).toHaveBeenCalledWith('u1', 'f1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });
  });

  describe('getFollowers', () => {
    it('should return followers list', async () => {
      const data = { followers: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (getFollowers as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      followCtrl.getFollowers(
        req({ params: { targetId: 'b1', type: 'business' }, query: { page: '1', limit: '20' } }),
        res,
        next
      );
      await flush();
      expect(getFollowers).toHaveBeenCalledWith('b1', 'business', 1, 20);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('getFollowing', () => {
    it('should return following list', async () => {
      const data = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (getFollowing as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      followCtrl.getFollowing(req({ query: { page: '1', limit: '20' } }), res, next);
      await flush();
      expect(getFollowing).toHaveBeenCalledWith('u1', 1, 20);
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });

  describe('getFollowCount', () => {
    it('should return follow count (no auth required)', async () => {
      (getFollowCount as jest.Mock).mockResolvedValue(42);
      const res = mockRes();
      const next = jest.fn();
      followCtrl.getFollowCount(req({ params: { targetId: 'b1', type: 'business' } }), res, next);
      await flush();
      expect(getFollowCount).toHaveBeenCalledWith('b1', 'business');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { count: 42 } });
    });
  });

  describe('checkFollowing', () => {
    it('should return following status', async () => {
      const data = { isFollowing: true, followId: 'f1', createdAt: new Date() };
      (isFollowing as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      followCtrl.checkFollowing(req({ query: { businessId: 'b1' } }), res, next);
      await flush();
      expect(isFollowing).toHaveBeenCalledWith('u1', { businessId: 'b1', developerId: undefined });
      expect(res.json).toHaveBeenCalledWith({ success: true, data });
    });
  });
});
