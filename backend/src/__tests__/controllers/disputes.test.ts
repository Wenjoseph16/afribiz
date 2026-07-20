import { mockPrisma } from '../setup';

jest.mock('../../validators/disputes', () => ({
  createDisputeSchema: { parse: jest.fn((d) => d) },
  updateDisputeSchema: { parse: jest.fn((d) => d) },
}));

jest.mock('../../services/disputes', () => ({
  listDisputes: jest.fn(),
  getDispute: jest.fn(),
  createDispute: jest.fn(),
  updateDispute: jest.fn(),
  deleteDispute: jest.fn(),
  addDisputeEvidence: jest.fn(),
  getDisputeEvidence: jest.fn(),
  deleteDisputeEvidence: jest.fn(),
  addDisputeComment: jest.fn(),
  getDisputeComments: jest.fn(),
}));

import * as disputeCtrl from '../../controllers/disputes';
const disputeService = jest.requireMock('../../services/disputes');

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

describe('disputes controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listDisputes', () => {
    it('should list disputes successfully', async () => {
      const result = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      (disputeService.listDisputes as jest.Mock).mockResolvedValue(result);
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.listDisputes(req({ query: { page: '1', limit: '20' } }), res, next);
      await flush();
      expect(disputeService.listDisputes).toHaveBeenCalledWith('u1', { page: '1', limit: '20' });
      expect(res.json).toHaveBeenCalledWith({ success: true, data: result });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.listDisputes({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('createDispute', () => {
    it('should create dispute and return 201', async () => {
      const payload = { title: 'Test', description: 'Desc', type: 'ORDER' };
      (disputeService.createDispute as jest.Mock).mockResolvedValue({ id: 'd1', ...payload });
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.createDispute(req({ body: payload }), res, next);
      await flush();
      expect(disputeService.createDispute).toHaveBeenCalledWith('u1', payload);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.createDispute({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('deleteDispute', () => {
    it('should return success message', async () => {
      (disputeService.deleteDispute as jest.Mock).mockResolvedValue(undefined);
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.deleteDispute(req({ params: { id: 'd1' } }), res, next);
      await flush();
      expect(disputeService.deleteDispute).toHaveBeenCalledWith('u1', 'd1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Litige supprimé avec succès',
      });
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.deleteDispute({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('addEvidence', () => {
    it('should add evidence successfully', async () => {
      const body = {
        fileName: 'doc.pdf',
        fileUrl: 'https://example.com/doc.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
      };
      (disputeService.addDisputeEvidence as jest.Mock).mockResolvedValue({ evidence: body });
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.addEvidence(req({ params: { id: 'd1' }, body }), res, next);
      await flush();
      expect(disputeService.addDisputeEvidence).toHaveBeenCalledWith('u1', 'd1', body);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 if missing required fields', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.addEvidence(
        req({ params: { id: 'd1' }, body: { fileName: 'doc.pdf' } }),
        res,
        next
      );
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.addEvidence({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe('addComment', () => {
    it('should add comment and return 201', async () => {
      (disputeService.addDisputeComment as jest.Mock).mockResolvedValue({
        id: 'c1',
        content: 'Test message',
      });
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.addComment(
        req({ params: { id: 'd1' }, body: { content: 'Test message' } }),
        res,
        next
      );
      await flush();
      expect(disputeService.addDisputeComment).toHaveBeenCalledWith('u1', 'd1', 'Test message');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 if content is empty', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.addComment(req({ params: { id: 'd1' }, body: { content: '' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 400 if content is only whitespace', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.addComment(req({ params: { id: 'd1' }, body: { content: '   ' } }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });

    it('should return 401 if no user', async () => {
      const res = mockRes();
      const next = jest.fn();
      disputeCtrl.addComment({} as any, res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
