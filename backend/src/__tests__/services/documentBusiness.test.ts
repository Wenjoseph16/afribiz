import { mockPrisma } from '../setup';
import * as docBiz from '../../services/documentBusiness';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockBusiness = { id: 'biz-1', ownerId: 'u1' };
const mockDoc = {
  id: 'doc-1',
  businessId: 'biz-1',
  title: 'Test Doc',
  type: 'CONTRAT',
  description: 'A test',
  fileUrl: 'url.pdf',
  fileSize: 100,
  mimeType: 'application/pdf',
  expiresAt: null,
  deletedAt: null,
  createdAt: new Date(),
  DocumentSignature: [],
};

describe('documentBusiness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listDocuments', () => {
    test('returns paginated documents', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findMany as jest.Mock).mockResolvedValue([mockDoc]);
      (mockPrisma.businessDocument.count as jest.Mock).mockResolvedValue(1);
      const r = await docBiz.listDocuments('u1', { page: '1', limit: '10' });
      expect(r.items).toHaveLength(1);
      expect(r.total).toBe(1);
    });

    test('filters by type', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.businessDocument.count as jest.Mock).mockResolvedValue(0);
      const r = await docBiz.listDocuments('u1', { type: 'FACTURE' });
      expect(r.total).toBe(0);
    });

    test('throws if business not found', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(docBiz.listDocuments('u-x', {})).rejects.toThrow('Business not found');
    });
  });

  describe('getDocument', () => {
    test('returns document with signatures', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(mockDoc);
      const r = await docBiz.getDocument('u1', 'doc-1');
      expect(r.id).toBe('doc-1');
    });

    test('throws if document not found', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(docBiz.getDocument('u1', 'bad-id')).rejects.toThrow('Document not found');
    });
  });

  describe('createDocument', () => {
    test('creates a document', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.create as jest.Mock).mockResolvedValue(mockDoc);
      const r = await docBiz.createDocument('u1', {
        title: 'Test Doc',
        type: 'CONTRAT',
        fileUrl: 'url.pdf',
      });
      expect(r.id).toBe('doc-1');
    });
  });

  describe('updateDocument', () => {
    test('updates a document', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(mockDoc);
      (mockPrisma.businessDocument.update as jest.Mock).mockResolvedValue({
        ...mockDoc,
        title: 'Updated',
      });
      const r = await docBiz.updateDocument('u1', 'doc-1', { title: 'Updated' });
      expect(mockPrisma.businessDocument.update).toHaveBeenCalled();
    });

    test('throws if document not found', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(docBiz.updateDocument('u1', 'bad-id', { title: 'Updated' })).rejects.toThrow(
        'Document not found'
      );
    });
  });

  describe('deleteDocument', () => {
    test('soft deletes a document', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(mockDoc);
      (mockPrisma.businessDocument.update as jest.Mock).mockResolvedValue({
        ...mockDoc,
        deletedAt: new Date(),
      });
      const r = await docBiz.deleteDocument('u1', 'doc-1');
      expect(r.success).toBe(true);
      expect(mockPrisma.businessDocument.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) })
      );
    });

    test('throws if document not found', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(docBiz.deleteDocument('u1', 'bad-id')).rejects.toThrow('Document not found');
    });
  });

  describe('getDocumentStats', () => {
    test('returns stats grouped by type', async () => {
      (mockPrisma.business.findFirst as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findMany as jest.Mock).mockResolvedValue([
        { type: 'CONTRAT', expiresAt: null },
        { type: 'FACTURE', expiresAt: null },
        { type: 'CONTRAT', expiresAt: new Date(Date.now() - 10000) },
      ]);
      const r = await docBiz.getDocumentStats('u1');
      expect(r.total).toBe(3);
      expect(r.contracts).toBe(2);
      expect(r.factures).toBe(1);
      expect(r.expired).toBe(1);
    });
  });
});
