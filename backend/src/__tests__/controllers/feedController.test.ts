import * as feedCtrl from '../../controllers/feedController';

jest.mock('../../services/feedService', () => ({
  getFeed: jest.fn(),
  getTrendingFeed: jest.fn(),
}));

import * as feedService from '../../services/feedService';

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
  return { user: null, query: {}, ...overrides } as any;
}

describe('feed controller', () => {
  describe('getFeed', () => {
    it('should call getFeed when user is authenticated', async () => {
      const mockData = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (feedService.getFeed as jest.Mock).mockResolvedValue(mockData);
      const res = mockRes();
      const r = req({ user: { id: 'u1' } });
      feedCtrl.getFeed(r, res, jest.fn());
      await flush();
      expect(feedService.getFeed).toHaveBeenCalledWith('u1', 1, 20);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('should call getTrendingFeed when no user', async () => {
      const mockData = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (feedService.getTrendingFeed as jest.Mock).mockResolvedValue(mockData);
      const res = mockRes();
      const r = req();
      feedCtrl.getFeed(r, res, jest.fn());
      await flush();
      expect(feedService.getTrendingFeed).toHaveBeenCalledWith(1, 20);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });
  });

  describe('getTrendingFeed', () => {
    it('should return trending feed with custom page and limit', async () => {
      const mockData = { items: [], pagination: { page: 2, limit: 10, total: 0, totalPages: 0 } };
      (feedService.getTrendingFeed as jest.Mock).mockResolvedValue(mockData);
      const res = mockRes();
      const r = req({ query: { page: '2', limit: '10' } });
      feedCtrl.getTrendingFeed(r, res, jest.fn());
      await flush();
      expect(feedService.getTrendingFeed).toHaveBeenCalledWith(2, 10);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('should use default page and limit when no query params', async () => {
      const mockData = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (feedService.getTrendingFeed as jest.Mock).mockResolvedValue(mockData);
      const res = mockRes();
      const r = req();
      feedCtrl.getTrendingFeed(r, res, jest.fn());
      await flush();
      expect(feedService.getTrendingFeed).toHaveBeenCalledWith(1, 20);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });
  });
});
