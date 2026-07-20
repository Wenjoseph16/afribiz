import { mockPrisma } from '../setup';
import * as documents from '../../services/documents';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockBusiness = { id: 'biz-1', modules: ['DOCUMENTS'] };
const mockDoc = {
  id: 'doc-1',
  businessId: 'biz-1',
  title: 'Test',
  type: 'CONTRAT',
  description: 'Desc',
  fileUrl: 'url.pdf',
  fileSize: 100,
  mimeType: 'application/pdf',
  expiresAt: null,
  createdAt: new Date(),
};

describe('documents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listDocuments', () => {
    test('lists documents for owner', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findMany as jest.Mock).mockResolvedValue([mockDoc]);
      const r = await documents.listDocuments('u1');
      expect(r).toHaveLength(1);
    });

    test('throws if business not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(documents.listDocuments('u-x')).rejects.toThrow('Business not found');
    });

    test('throws if DOCUMENTS module not active', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue({ id: 'biz-1', modules: [] });
      await expect(documents.listDocuments('u1')).rejects.toThrow('Module Documents non activé');
    });
  });

  describe('getDocument', () => {
    test('returns document by id', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(mockDoc);
      const r = await documents.getDocument('u1', 'doc-1');
      expect(r.id).toBe('doc-1');
    });

    test('throws if not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(documents.getDocument('u1', 'bad-id')).rejects.toThrow('Document non trouvé');
    });
  });

  describe('createDocument', () => {
    test('creates document', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.create as jest.Mock).mockResolvedValue(mockDoc);
      const r = await documents.createDocument('u1', { title: 'Test', fileUrl: 'url.pdf' });
      expect(r.id).toBe('doc-1');
    });
  });

  describe('updateDocument', () => {
    test('updates document', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(mockDoc);
      (mockPrisma.businessDocument.update as jest.Mock).mockResolvedValue({
        ...mockDoc,
        title: 'Updated',
      });
      const r = await documents.updateDocument('u1', 'doc-1', { title: 'Updated' });
      expect(mockPrisma.businessDocument.update).toHaveBeenCalled();
    });

    test('throws if not found', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(documents.updateDocument('u1', 'bad-id', { title: 'Updated' })).rejects.toThrow(
        'Document non trouvé'
      );
    });
  });

  describe('deleteDocument', () => {
    test('deletes document', async () => {
      (mockPrisma.business.findUnique as jest.Mock).mockResolvedValue(mockBusiness);
      (mockPrisma.businessDocument.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      const r = await documents.deleteDocument('u1', 'doc-1');
      expect(r.message).toBe('Document supprimé');
    });
  });
});
