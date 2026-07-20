import { mockPrisma } from '../setup';

jest.mock('../../services/documentBusiness', () => ({
  listDocuments: jest.fn(),
  getDocument: jest.fn(),
  createDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  getDocumentStats: jest.fn(),
}));

import * as docCtrl from '../../controllers/documentBusiness';
const docService = jest.requireMock('../../services/documentBusiness');

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

describe('documentBusiness controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listDocuments', async () => {
    (docService.listDocuments as jest.Mock).mockResolvedValue({
      items: [{ id: 'd1' }],
      total: 1,
      page: 1,
      limit: 50,
    });
    const res = mockRes();
    const next = jest.fn();
    docCtrl.listDocuments(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listDocuments returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    docCtrl.listDocuments({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('createDocument returns 201 and Document créé message', async () => {
    (docService.createDocument as jest.Mock).mockResolvedValue({ id: 'd1' });
    const res = mockRes();
    const next = jest.fn();
    docCtrl.createDocument(
      req({ body: { title: 'Doc', fileUrl: 'http://example.com/doc.pdf' } }),
      res,
      next
    );
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Document cree' })
    );
  });

  it('createDocument returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    docCtrl.createDocument({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('deleteDocument returns Document supprime message', async () => {
    (docService.deleteDocument as jest.Mock).mockResolvedValue({ success: true });
    const res = mockRes();
    const next = jest.fn();
    docCtrl.deleteDocument(req({ params: { id: 'd1' } }), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Document supprime' })
    );
  });

  it('getDocumentStats', async () => {
    (docService.getDocumentStats as jest.Mock).mockResolvedValue({
      total: 10,
      contracts: 3,
      factures: 4,
      certifications: 2,
      expired: 1,
    });
    const res = mockRes();
    const next = jest.fn();
    docCtrl.getDocumentStats(req(), res, next);
    await flush();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
