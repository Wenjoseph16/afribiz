import { mockPrisma } from '../setup';

jest.mock('../../lib/businessAccess', () => ({
  resolveBusinessAccess: jest.fn().mockResolvedValue({ businessId: 'b1' }),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((data, msg) => ({ success: true, data, message: msg || '' })),
}));

jest.mock('../../services/shortService', () => ({
  getShorts: jest.fn(),
  getShortById: jest.fn(),
  createShort: jest.fn(),
  updateShort: jest.fn(),
  deleteShort: jest.fn(),
  likeShort: jest.fn(),
  addComment: jest.fn(),
  getComments: jest.fn(),
  viewShort: jest.fn(),
  shareShort: jest.fn(),
  saveShort: jest.fn(),
}));

import * as shortCtrl from '../../controllers/shortController';
const shortService = jest.requireMock('../../services/shortService');

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
    user: { id: 'u1', email: 'test@test.com' },
    params: {},
    body: {},
    query: {},
    ...overrides,
  } as any;
}

describe('short controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShorts', () => {
    it('should fetch shorts successfully', async () => {
      const result = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      (shortService.getShorts as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.getShorts(req({ query: { businessId: 'b1', page: '1', limit: '10' } }), res, next);
      await flush();
      expect(shortService.getShorts).toHaveBeenCalledWith({ businessId: 'b1', page: 1, limit: 10 });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: '' });
    });
  });

  describe('getShortById', () => {
    it('should fetch short by id successfully', async () => {
      const result = { id: 's1', title: 'Test' };
      (shortService.getShortById as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.getShortById(req({ params: { id: 's1' } }), res, next);
      await flush();
      expect(shortService.getShortById).toHaveBeenCalledWith('s1', 'u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: '' });
    });

    it('should return 404 if short not found', async () => {
      (shortService.getShortById as jest.Mock).mockResolvedValue(null);
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.getShortById(req({ params: { id: 'nonexistent' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
    });
  });

  describe('createShort', () => {
    it('should create short and return 201', async () => {
      const result = { id: 's1', title: 'New Short' };
      (shortService.createShort as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.createShort(
        req({
          body: { title: 'New Short', videoUrl: 'http://example.com/v.mp4', businessId: 'b1' },
        }),
        res,
        next
      );
      await flush();
      expect(shortService.createShort).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Short',
          videoUrl: 'http://example.com/v.mp4',
          businessId: 'b1',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: 'Short créé' });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.createShort({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('likeShort', () => {
    it('should like short successfully', async () => {
      const result = { liked: true };
      (shortService.likeShort as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.likeShort(req({ params: { id: 's1' } }), res, next);
      await flush();
      expect(shortService.likeShort).toHaveBeenCalledWith('s1', 'u1');
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result, message: '' });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.likeShort({ params: { id: 's1' } } as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('addComment', () => {
    it('should add comment successfully', async () => {
      const result = { id: 'c1', content: 'Nice!' };
      (shortService.addComment as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.addComment(req({ params: { id: 's1' }, body: { content: 'Nice!' } }), res, next);
      await flush();
      expect(shortService.addComment).toHaveBeenCalledWith('s1', 'u1', 'test@test.com', 'Nice!');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: result,
        message: 'Commentaire ajouté',
      });
    });

    it('should return 400 if no content', async () => {
      const res = mockRes();
      const next = jest.fn();
      shortCtrl.addComment(req({ params: { id: 's1' }, body: {} }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
