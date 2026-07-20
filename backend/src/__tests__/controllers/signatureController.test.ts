import { mockPrisma } from '../setup';
import * as sigCtrl from '../../controllers/signatureController';

jest.mock('../../services/signature', () => ({
  createSignatureRequest: jest.fn(),
  signDocument: jest.fn(),
  verifySignature: jest.fn(),
  listSignatureRequests: jest.fn(),
}));

import * as signatureService from '../../services/signature';

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

describe('signature controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSignatureReq', () => {
    it('returns 201 on success', async () => {
      (signatureService.createSignatureRequest as jest.Mock).mockResolvedValue({
        id: 'sig1',
        signatureLink: '/sign/abc',
      });
      const res = mockRes();
      const next = jest.fn();
      sigCtrl.createSignatureReq(
        req({ body: { documentId: 'doc1', signerEmail: 'a@b.com', signerName: 'Alice' } }),
        res,
        next
      );
      await flush();
      expect(signatureService.createSignatureRequest).toHaveBeenCalledWith(
        'doc1',
        'u1',
        'a@b.com',
        'Alice'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 401 when not authenticated', async () => {
      const res = mockRes();
      const next = jest.fn();
      sigCtrl.createSignatureReq(req({ user: null }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });

    it('returns 400 when required fields are missing', async () => {
      const error = Object.assign(new Error('Champs requis manquants'), { statusCode: 400 });
      (signatureService.createSignatureRequest as jest.Mock).mockRejectedValue(error);
      const res = mockRes();
      const next = jest.fn();
      sigCtrl.createSignatureReq(req({ body: { documentId: 'doc1' } }), res, next);
      await flush();
      expect(signatureService.createSignatureRequest).toHaveBeenCalledWith(
        'doc1',
        'u1',
        undefined,
        undefined
      );
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('signDocumentCtrl', () => {
    it('returns success', async () => {
      (signatureService.signDocument as jest.Mock).mockResolvedValue({
        id: 'sig1',
        status: 'SIGNED',
      });
      const res = mockRes();
      const next = jest.fn();
      sigCtrl.signDocumentCtrl(
        req({
          params: { token: 'tok_abc123' },
          body: { signatureData: 'data:image/png;base64,...' },
        }),
        res,
        next
      );
      await flush();
      expect(signatureService.signDocument).toHaveBeenCalledWith(
        'tok_abc123',
        'data:image/png;base64,...',
        '127.0.0.1'
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('verifySignatureCtrl', () => {
    it('returns success', async () => {
      (signatureService.verifySignature as jest.Mock).mockResolvedValue({
        isSigned: true,
        signatures: [
          { signerName: 'Alice', signerEmail: 'a@b.com', signedAt: new Date().toISOString() },
        ],
        signedCount: 1,
      });
      const res = mockRes();
      const next = jest.fn();
      sigCtrl.verifySignatureCtrl(req({ params: { documentId: 'doc1' } }), res, next);
      await flush();
      expect(signatureService.verifySignature).toHaveBeenCalledWith('doc1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
  });

  describe('listSignatureReqs', () => {
    it('returns success with results', async () => {
      (signatureService.listSignatureRequests as jest.Mock).mockResolvedValue([{ id: 'sig1' }]);
      const res = mockRes();
      const next = jest.fn();
      sigCtrl.listSignatureReqs(req({ query: { documentId: 'doc1' } }), res, next);
      await flush();
      expect(signatureService.listSignatureRequests).toHaveBeenCalledWith('u1', 'doc1');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('returns 401 when not authenticated', async () => {
      const res = mockRes();
      const next = jest.fn();
      sigCtrl.listSignatureReqs(req({ user: null }), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});
