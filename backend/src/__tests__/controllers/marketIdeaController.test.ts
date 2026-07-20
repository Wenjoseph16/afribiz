import { mockPrisma } from '../setup';

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data, message = 'Success') => ({ success: true, data, message })),
}));

jest.mock('../../services/marketplaceIdeaService', () => ({
  createIdea: jest.fn(),
  getIdeas: jest.fn(),
  getIdeaById: jest.fn(),
  voteIdea: jest.fn(),
  unvoteIdea: jest.fn(),
  getTopIdeas: jest.fn(),
}));

import * as marketIdeaCtrl from '../../controllers/marketIdeaController';
const ideaService = jest.requireMock('../../services/marketplaceIdeaService');
import { successResponse } from '../../utils/response';

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

describe('marketIdea controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIdea', () => {
    it('should create an idea and return 201', async () => {
      const data = { id: 'i1', title: 'Test Idea', category: 'TECH' };
      (ideaService.createIdea as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.createIdea(
        req({
          body: { businessId: 'b1', title: 'Test Idea', description: 'desc', category: 'TECH' },
        }),
        res,
        next
      );
      await flush();
      expect(ideaService.createIdea).toHaveBeenCalledWith({
        businessId: 'b1',
        title: 'Test Idea',
        description: 'desc',
        category: 'TECH',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Idée publiée' });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.createIdea({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('should return 400 if missing required fields', async () => {
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.createIdea(req({ body: { title: 'Only Title' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('getIdeas', () => {
    it('should return paginated ideas', async () => {
      const result = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (ideaService.getIdeas as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.getIdeas(
        req({ query: { category: 'TECH', page: '1', limit: '20' } }),
        res,
        next
      );
      await flush();
      expect(ideaService.getIdeas).toHaveBeenCalledWith({ category: 'TECH', page: 1, limit: 20 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: 'Success' });
    });

    it('should use defaults when no query params', async () => {
      const result = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      (ideaService.getIdeas as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.getIdeas(req(), res, next);
      await flush();
      expect(ideaService.getIdeas).toHaveBeenCalledWith({
        category: undefined,
        page: 1,
        limit: 20,
      });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: 'Success' });
    });
  });

  describe('getIdeaById', () => {
    it('should return an idea', async () => {
      const data = { id: 'i1', title: 'Test' };
      (ideaService.getIdeaById as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.getIdeaById(req({ params: { id: 'i1' } }), res, next);
      await flush();
      expect(ideaService.getIdeaById).toHaveBeenCalledWith('i1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Success' });
    });

    it('should return 404 if idea not found', async () => {
      (ideaService.getIdeaById as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.getIdeaById(req({ params: { id: 'nonexistent' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('voteIdea', () => {
    it('should vote and return success', async () => {
      const data = { id: 'i1', votes: 5 };
      (ideaService.voteIdea as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.voteIdea(req({ params: { id: 'i1' } }), res, next);
      await flush();
      expect(ideaService.voteIdea).toHaveBeenCalledWith('i1', 'u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Vote enregistré' });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.voteIdea({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('unvoteIdea', () => {
    it('should unvote and return success', async () => {
      const data = { id: 'i1', votes: 4 };
      (ideaService.unvoteIdea as jest.Mock).mockResolvedValue(data);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.unvoteIdea(req({ params: { id: 'i1' } }), res, next);
      await flush();
      expect(ideaService.unvoteIdea).toHaveBeenCalledWith('i1', 'u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data, message: 'Vote retiré' });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.unvoteIdea({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('getTopIdeas', () => {
    it('should return top ideas with default limit', async () => {
      const ideas = [{ id: 'i1', votes: 10 }];
      (ideaService.getTopIdeas as jest.Mock).mockResolvedValue(ideas);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.getTopIdeas(req(), res, next);
      await flush();
      expect(ideaService.getTopIdeas).toHaveBeenCalledWith(10);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: ideas, message: 'Success' });
    });

    it('should return top ideas with custom limit', async () => {
      const ideas = [{ id: 'i1', votes: 10 }];
      (ideaService.getTopIdeas as jest.Mock).mockResolvedValue(ideas);
      const res = mockRes();
      const next = jest.fn();
      marketIdeaCtrl.getTopIdeas(req({ query: { limit: '5' } }), res, next);
      await flush();
      expect(ideaService.getTopIdeas).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: ideas, message: 'Success' });
    });
  });
});
