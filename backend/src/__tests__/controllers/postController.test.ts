import { mockPrisma } from '../setup';

jest.mock('../../services/postService', () => ({
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  getPost: jest.fn(),
  listPosts: jest.fn(),
  toggleLike: jest.fn(),
  getFeed: jest.fn(),
}));

import * as postCtrl from '../../controllers/postController';
const postService = jest.requireMock('../../services/postService');

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

describe('post controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post and return 201', async () => {
      const postData = { id: 'p1', title: 'Test', content: 'Hello' };
      (postService.createPost as jest.Mock).mockResolvedValue(postData);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.createPost(
        req({ body: { businessId: 'b1', title: 'Test', content: 'Hello' } }),
        res,
        next
      );
      await flush();
      expect(postService.createPost).toHaveBeenCalledWith('u1', 'b1', {
        title: 'Test',
        content: 'Hello',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: postData });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      postCtrl.createPost({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('deletePost', () => {
    it('should delete a post and return a message', async () => {
      (postService.deletePost as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.deletePost(req({ params: { id: 'p1' } }), res, next);
      await flush();
      expect(postService.deletePost).toHaveBeenCalledWith('u1', 'p1');
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Post supprimé' });
    });
  });

  describe('getPost', () => {
    it('should return a post', async () => {
      const post = { id: 'p1', title: 'Test', content: 'Hello' };
      (postService.getPost as jest.Mock).mockResolvedValue(post);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.getPost(req({ params: { id: 'p1' } }), res, next);
      await flush();
      expect(postService.getPost).toHaveBeenCalledWith('p1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: post });
    });
  });

  describe('listPosts', () => {
    it('should list posts with query params', async () => {
      const result = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (postService.listPosts as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.listPosts(
        req({
          query: { businessId: 'b1', status: 'PUBLISHED', tag: 'tech', page: '1', limit: '10' },
        }),
        res,
        next
      );
      await flush();
      expect(postService.listPosts).toHaveBeenCalledWith('b1', {
        status: 'PUBLISHED',
        tag: 'tech',
        page: 1,
        limit: 10,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should use defaults when no query params', async () => {
      const result = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (postService.listPosts as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.listPosts(req(), res, next);
      await flush();
      expect(postService.listPosts).toHaveBeenCalledWith(undefined, {
        status: undefined,
        tag: undefined,
        page: 1,
        limit: 20,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });
  });

  describe('toggleLike', () => {
    it('should toggle like and return result', async () => {
      const result = { liked: true, likesCount: 5 };
      (postService.toggleLike as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.toggleLike(req({ params: { id: 'p1' } }), res, next);
      await flush();
      expect(postService.toggleLike).toHaveBeenCalledWith('u1', 'p1');
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      postCtrl.toggleLike({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getFeed', () => {
    it('should return feed with query params', async () => {
      const result = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };
      (postService.getFeed as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.getFeed(req({ query: { page: '2', limit: '10' } }), res, next);
      await flush();
      expect(postService.getFeed).toHaveBeenCalledWith({ page: 2, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });

    it('should use default page and limit', async () => {
      const result = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };
      (postService.getFeed as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      postCtrl.getFeed(req(), res, next);
      await flush();
      expect(postService.getFeed).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(res.json).toHaveBeenCalledWith({ success: true, ...result });
    });
  });
});
