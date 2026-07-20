import { mockPrisma } from '../setup';
import {
  getBusinessFaqs,
  getMyFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
} from '../../services/businessFaq';

jest.mock('../../lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockFaq = {
  id: 'f1',
  businessId: 'b1',
  question: 'Q?',
  answer: 'A!',
  category: 'general',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('businessFaq', () => {
  beforeEach(() => {
    /* cleared by config.clearMocks */
  });

  describe('getBusinessFaqs', () => {
    test('returns active faqs by slug', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.businessFaq, 'findMany').mockResolvedValue([mockFaq]);
      const r = await getBusinessFaqs('biz');
      expect(r).toHaveLength(1);
    });

    test('throws if business not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue(null);
      await expect(getBusinessFaqs('biz')).rejects.toThrow('Business non trouvé');
    });
  });

  describe('getMyFaqs', () => {
    test('returns all faqs for owner', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.businessFaq, 'findMany').mockResolvedValue([mockFaq]);
      const r = await getMyFaqs('u1');
      expect(r).toHaveLength(1);
    });
  });

  describe('createFaq', () => {
    test('creates a faq', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.businessFaq, 'create').mockResolvedValue(mockFaq);
      const r = await createFaq('u1', { question: 'Q?', answer: 'A!' });
      expect(r.question).toBe('Q?');
    });
  });

  describe('updateFaq', () => {
    test('updates a faq', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.businessFaq, 'findFirst').mockResolvedValue(mockFaq);
      jest
        .spyOn(mockPrisma.businessFaq, 'update')
        .mockResolvedValue({ ...mockFaq, question: 'Updated?' });
      const r = await updateFaq('u1', 'f1', { question: 'Updated?' });
      expect(r.question).toBe('Updated?');
    });

    test('throws if faq not found', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.businessFaq, 'findFirst').mockResolvedValue(null);
      await expect(updateFaq('u1', 'f1', {})).rejects.toThrow('FAQ non trouvée');
    });
  });

  describe('deleteFaq', () => {
    test('deletes a faq', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      jest.spyOn(mockPrisma.businessFaq, 'findFirst').mockResolvedValue(mockFaq);
      jest.spyOn(mockPrisma.businessFaq, 'delete').mockResolvedValue(mockFaq);
      await deleteFaq('u1', 'f1');
      expect(mockPrisma.businessFaq.delete).toHaveBeenCalled();
    });
  });

  describe('reorderFaqs', () => {
    test('reorders faqs using transaction', async () => {
      jest.spyOn(mockPrisma.business, 'findUnique').mockResolvedValue({ id: 'b1' } as any);
      (mockPrisma as any).$transaction = jest.fn((arr: any) => Promise.all(arr));
      jest.spyOn(mockPrisma.businessFaq, 'updateMany').mockResolvedValue({ count: 1 });
      await reorderFaqs('u1', ['f1', 'f2']);
      expect(mockPrisma.businessFaq.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});
