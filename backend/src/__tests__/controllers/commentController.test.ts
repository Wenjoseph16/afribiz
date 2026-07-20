import { mockPrisma } from '../setup';
import * as commentCtrl from '../../controllers/commentController';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data, message = 'Success') => ({ success: true, data, message })),
}));

jest.mock('../../services/commentService', () => ({
  createComment: jest.fn(),
  getComments: jest.fn(),
  getCommentById: jest.fn(),
  updateComment: jest.fn(),
  deleteComment: jest.fn(),
}));

import {
  createComment,
  getComments,
  getCommentById,
  updateComment,
  deleteComment,
} from '../../services/commentService';

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

const validType = 'PRODUCT';

describe('comment controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a comment and return 201', async () => {
      const data = {
        id: 'c1',
        userId: 'u1',
        type: validType,
        referenceId: 'r1',
        content: 'Great!',
      };
      (createComment as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.createComment(
        req({ body: { type: validType, referenceId: 'r1', content: 'Great!' } }),
        res,
        next
      );
      await flush();
      expect(createComment).toHaveBeenCalledWith({
        userId: 'u1',
        type: validType,
        referenceId: 'r1',
        content: 'Great!',
        parentId: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Commentaire ajouté' });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.createComment({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if type is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.createComment(req({ body: { referenceId: 'r1', content: 'Great!' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if referenceId is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.createComment(req({ body: { type: validType, content: 'Great!' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if content is empty', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.createComment(
        req({ body: { type: validType, referenceId: 'r1', content: '   ' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if type is invalid', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.createComment(
        req({ body: { type: 'INVALID', referenceId: 'r1', content: 'Great!' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should create a reply when parentId is provided', async () => {
      const data = {
        id: 'c2',
        userId: 'u1',
        type: validType,
        referenceId: 'r1',
        content: 'Reply',
        parentId: 'c1',
      };
      (createComment as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.createComment(
        req({ body: { type: validType, referenceId: 'r1', content: 'Reply', parentId: 'c1' } }),
        res,
        next
      );
      await flush();
      expect(createComment).toHaveBeenCalledWith({
        userId: 'u1',
        type: validType,
        referenceId: 'r1',
        content: 'Reply',
        parentId: 'c1',
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('getComments', () => {
    it('should return paginated comments', async () => {
      const data = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (getComments as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.getComments(
        req({ params: { type: validType, referenceId: 'r1' }, query: { page: '2', limit: '10' } }),
        res,
        next
      );
      await flush();
      expect(getComments).toHaveBeenCalledWith(validType, 'r1', 2, 10);
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Success' });
    });

    it('should default page and limit when not provided', async () => {
      (getComments as jest.Mock).mockResolvedValue({ items: [], pagination: {} });
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.getComments(req({ params: { type: validType, referenceId: 'r1' } }), res, next);
      await flush();
      expect(getComments).toHaveBeenCalledWith(validType, 'r1', 1, 20);
    });

    it('should return 400 if type param is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.getComments(req({ params: { referenceId: 'r1' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if referenceId param is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.getComments(req({ params: { type: validType } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getCommentById', () => {
    it('should return a comment', async () => {
      const data = { id: 'c1', userId: 'u1', content: 'Great!' };
      (getCommentById as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.getCommentById(req({ params: { id: 'c1' } }), res, next);
      await flush();
      expect(getCommentById).toHaveBeenCalledWith('c1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Success' });
    });

    it('should return 404 if comment not found', async () => {
      (getCommentById as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.getCommentById(req({ params: { id: 'missing' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const data = { id: 'c1', userId: 'u1', content: 'Updated!' };
      (updateComment as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.updateComment(
        req({ params: { id: 'c1' }, body: { content: 'Updated!' } }),
        res,
        next
      );
      await flush();
      expect(updateComment).toHaveBeenCalledWith('c1', 'u1', { content: 'Updated!' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Commentaire modifié',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.updateComment({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if content is missing', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.updateComment(req({ params: { id: 'c1' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if content is empty', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.updateComment(req({ params: { id: 'c1' }, body: { content: '   ' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 404 if comment not found', async () => {
      (updateComment as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.updateComment(
        req({ params: { id: 'missing' }, body: { content: 'Updated!' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      (deleteComment as jest.Mock).mockResolvedValue(true);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.deleteComment(req({ params: { id: 'c1' } }), res, next);
      await flush();
      expect(deleteComment).toHaveBeenCalledWith('c1', 'u1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Commentaire supprimé',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.deleteComment({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 404 if comment not found', async () => {
      (deleteComment as jest.Mock).mockResolvedValue(false);
      const res = mockRes();
      const next = jest.fn();
      commentCtrl.deleteComment(req({ params: { id: 'missing' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });
});
