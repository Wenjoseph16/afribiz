import { mockPrisma } from '../setup';
import * as signature from '../../services/signature';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('signature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSignatureRequest', () => {
    it('should create a signature request with token', async () => {
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue({ id: 'doc-1' });
      (mockPrisma.documentSignature.create as jest.Mock).mockResolvedValue({
        id: 'sig-1',
        documentId: 'doc-1',
        signerId: 'user-1',
        signerEmail: 'test@test.com',
        signerName: 'John',
        token: 'token-123',
        status: 'PENDING',
        expiresAt: new Date(),
      });
      const result = await signature.createSignatureRequest(
        'doc-1',
        'user-1',
        'test@test.com',
        'John'
      );
      expect(result.status).toBe('PENDING');
      expect(result.signatureLink).toContain('/sign/');
    });

    it('should throw if document not found', async () => {
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        signature.createSignatureRequest('invalid', 'user-1', 't@t.com', 'John')
      ).rejects.toThrow('Document non trouvé');
    });
  });

  describe('signDocument', () => {
    it('should sign a document with valid token', async () => {
      (mockPrisma.documentSignature.findUnique as jest.Mock).mockResolvedValue({
        id: 'sig-1',
        documentId: 'doc-1',
        status: 'PENDING',
        signerEmail: 'test@test.com',
        expiresAt: new Date(Date.now() + 86400000),
      });
      (mockPrisma.documentSignature.update as jest.Mock).mockResolvedValue({
        id: 'sig-1',
        status: 'SIGNED',
        signedAt: new Date(),
      });
      (mockPrisma.businessDocument.update as jest.Mock).mockResolvedValue({});
      const result = await signature.signDocument('token-123', 'base64sig', '127.0.0.1');
      expect(result.status).toBe('SIGNED');
    });

    it('should throw if token invalid', async () => {
      (mockPrisma.documentSignature.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(signature.signDocument('invalid', 'sig')).rejects.toThrow(
        'Lien de signature invalide'
      );
    });

    it('should throw if already signed', async () => {
      (mockPrisma.documentSignature.findUnique as jest.Mock).mockResolvedValue({
        id: 'sig-1',
        status: 'SIGNED',
        expiresAt: new Date(Date.now() + 86400000),
      });
      await expect(signature.signDocument('token', 'sig')).rejects.toThrow('Document déjà signé');
    });

    it('should throw if expired', async () => {
      (mockPrisma.documentSignature.findUnique as jest.Mock).mockResolvedValue({
        id: 'sig-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 86400000),
      });
      await expect(signature.signDocument('token', 'sig')).rejects.toThrow(
        'Lien de signature expiré'
      );
    });
  });

  describe('verifySignature', () => {
    it('should return signed status', async () => {
      (mockPrisma.documentSignature.findMany as jest.Mock).mockResolvedValue([
        { signerName: 'John', signerEmail: 'j@t.com', signedAt: new Date() },
      ]);
      const result = await signature.verifySignature('doc-1');
      expect(result.isSigned).toBe(true);
      expect(result.signedCount).toBe(1);
    });

    it('should return not signed when no signatures', async () => {
      (mockPrisma.documentSignature.findMany as jest.Mock).mockResolvedValue([]);
      const result = await signature.verifySignature('doc-1');
      expect(result.isSigned).toBe(false);
      expect(result.signedCount).toBe(0);
    });
  });

  describe('listSignatureRequests', () => {
    it('should list requests for owner', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'biz-1' });
      (mockPrisma.documentSignature.findMany as jest.Mock).mockResolvedValue([]);
      const result = await signature.listSignatureRequests('owner-1');
      expect(result).toEqual([]);
    });

    it('should filter by documentId', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'biz-1' });
      (mockPrisma.documentSignature.findMany as jest.Mock).mockResolvedValue([]);
      await signature.listSignatureRequests('owner-1', 'doc-1');
      expect(mockPrisma.documentSignature.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ documentId: 'doc-1' }) })
      );
    });

    it('should throw if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(signature.listSignatureRequests('invalid')).rejects.toThrow(
        'Business non trouvé'
      );
    });
  });
});
