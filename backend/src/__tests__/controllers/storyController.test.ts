import { mockPrisma } from '../setup';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data: any, message = 'Success') => ({ success: true, data, message })),
}));

jest.mock('../../lib/businessAccess', () => ({
  resolveBusinessAccess: jest.fn(),
}));

jest.mock('../../services/storyService', () => ({
  getActiveStories: jest.fn(),
  createStory: jest.fn(),
  viewStory: jest.fn(),
  deleteStory: jest.fn(),
  getBusinessHighlights: jest.fn(),
}));

import * as storyCtrl from '../../controllers/storyController';
const storyService = jest.requireMock('../../services/storyService');
const resolveBusinessAccess = jest.requireMock('../../lib/businessAccess').resolveBusinessAccess;

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
  return {
    user: { id: 'u1' },
    params: {},
    body: {},
    query: {},
    ip: '127.0.0.1',
    ...overrides,
  } as any;
}

describe('story controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveStories', () => {
    it('should return active stories', async () => {
      const data = [{ id: 's1', mediaUrl: 'a.mp4' }];
      (storyService.getActiveStories as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      storyCtrl.getActiveStories(req(), res, next);
      await flush();
      expect(storyService.getActiveStories).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Success' });
    });
  });

  describe('createStory', () => {
    it('should create story and return 201', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue({ businessId: 'b1' });
      const created = { id: 's1', businessId: 'b1', mediaUrl: 'a.mp4' };
      (storyService.createStory as jest.Mock).mockResolvedValue(created);
      const res = mockRes();
      const next = jest.fn();
      storyCtrl.createStory(req({ body: { businessId: 'b1', mediaUrl: 'a.mp4' } }), res, next);
      await flush();
      expect(resolveBusinessAccess).toHaveBeenCalledWith({
        userId: 'u1',
        roles: undefined,
        bodyBusinessId: 'b1',
      });
      expect(storyService.createStory).toHaveBeenCalledWith({
        businessId: 'b1',
        mediaUrl: 'a.mp4',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: created,
        message: 'Story créée',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      storyCtrl.createStory({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('viewStory', () => {
    it('should mark story as viewed', async () => {
      (storyService.viewStory as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const next = jest.fn();
      storyCtrl.viewStory(req({ params: { id: 's1' } }), res, next);
      await flush();
      expect(storyService.viewStory).toHaveBeenCalledWith('s1', 'u1', '127.0.0.1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { viewed: true },
        message: 'Success',
      });
    });
  });

  describe('deleteStory', () => {
    it('should delete story successfully', async () => {
      (resolveBusinessAccess as jest.Mock).mockResolvedValue({ businessId: 'b1' });
      (storyService.deleteStory as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const next = jest.fn();
      storyCtrl.deleteStory(req({ params: { id: 's1' }, body: { businessId: 'b1' } }), res, next);
      await flush();
      expect(resolveBusinessAccess).toHaveBeenCalledWith({
        userId: 'u1',
        roles: undefined,
        bodyBusinessId: 'b1',
      });
      expect(storyService.deleteStory).toHaveBeenCalledWith('s1', 'b1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Story supprimée',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      storyCtrl.deleteStory({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getHighlights', () => {
    it('should return business highlights', async () => {
      const data = [{ id: 's1', isHighlight: true }];
      (storyService.getBusinessHighlights as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      storyCtrl.getHighlights(req({ params: { businessId: 'b1' } }), res, next);
      await flush();
      expect(storyService.getBusinessHighlights).toHaveBeenCalledWith('b1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Success' });
    });
  });
});
