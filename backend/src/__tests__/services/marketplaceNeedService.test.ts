import { mockPrisma } from '../setup';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));
jest.mock('../../middlewares/errorHandler', () => ({
  AppError: class extends Error {
    constructor(
      m: string,
      public statusCode: number
    ) {
      super(m);
    }
  },
}));

import {
  createNeed,
  getNeeds,
  getNeedById,
  voteNeed,
  unvoteNeed,
  closeNeed,
} from '../../services/marketplaceNeedService';

function flush() {
  return new Promise((r) => setImmediate(r));
}

describe('marketplaceNeedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNeed', () => {
    it('should create a need with defaults', async () => {
      mockPrisma.marketNeed.create.mockResolvedValue({ id: 'n1', title: 'Test', business: {} });
      const result = await createNeed({ businessId: 'b1', title: 'Test', category: 'TECH' });
      expect(mockPrisma.marketNeed.create).toHaveBeenCalledWith({
        data: {
          businessId: 'b1',
          title: 'Test',
          category: 'TECH',
          budget: undefined,
          urgency: 'MEDIUM',
        },
        include: { business: { select: { id: true, name: true, logo: true, city: true } } },
      });
      expect(result).toEqual({ id: 'n1', title: 'Test', business: {} });
    });
  });

  describe('getNeeds', () => {
    it('should return paginated needs', async () => {
      mockPrisma.marketNeed.findMany.mockResolvedValue([{ id: 'n1' }]);
      mockPrisma.marketNeed.count.mockResolvedValue(1);
      const result = await getNeeds({ category: 'TECH', page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should cap limit at 50', async () => {
      mockPrisma.marketNeed.findMany.mockResolvedValue([]);
      mockPrisma.marketNeed.count.mockResolvedValue(0);
      await getNeeds({ limit: 100 });
      expect(mockPrisma.marketNeed.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe('getNeedById', () => {
    it('should return a need', async () => {
      mockPrisma.marketNeed.findUnique.mockResolvedValue({ id: 'n1' });
      const result = await getNeedById('n1');
      expect(result).toEqual({ id: 'n1' });
    });
  });

  describe('voteNeed', () => {
    it('should vote if not already voted', async () => {
      mockPrisma.marketVote.findUnique.mockResolvedValue(null);
      mockPrisma.marketVote.create.mockResolvedValue({ id: 'v1' });
      mockPrisma.marketNeed.update.mockResolvedValue({ id: 'n1', votes: 1 });
      const result = await voteNeed('n1', 'u1');
      expect(mockPrisma.marketNeed.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { votes: { increment: 1 } },
      });
      expect(result.votes).toBe(1);
    });

    it('should throw if already voted', async () => {
      mockPrisma.marketVote.findUnique.mockResolvedValue({ id: 'v1' });
      await expect(voteNeed('n1', 'u1')).rejects.toThrow('déjà voté');
    });
  });

  describe('unvoteNeed', () => {
    it('should unvote if voted', async () => {
      mockPrisma.marketVote.findUnique.mockResolvedValue({ id: 'v1' });
      mockPrisma.marketVote.delete.mockResolvedValue({ id: 'v1' });
      mockPrisma.marketNeed.update.mockResolvedValue({ id: 'n1', votes: 0 });
      const result = await unvoteNeed('n1', 'u1');
      expect(result.votes).toBe(0);
    });

    it('should throw if not voted', async () => {
      mockPrisma.marketVote.findUnique.mockResolvedValue(null);
      await expect(unvoteNeed('n1', 'u1')).rejects.toThrow('pas voté');
    });
  });

  describe('closeNeed', () => {
    it('should close need if business owns it', async () => {
      mockPrisma.marketNeed.findUnique.mockResolvedValue({ id: 'n1', businessId: 'b1' });
      mockPrisma.marketNeed.update.mockResolvedValue({ id: 'n1', status: 'CLOSED' });
      const result = await closeNeed('n1', 'b1');
      expect(result.status).toBe('CLOSED');
    });

    it('should throw if not authorized', async () => {
      mockPrisma.marketNeed.findUnique.mockResolvedValue({ id: 'n1', businessId: 'b1' });
      await expect(closeNeed('n1', 'other')).rejects.toThrow('Non autorisé');
    });

    it('should throw if need not found', async () => {
      mockPrisma.marketNeed.findUnique.mockResolvedValue(null);
      await expect(closeNeed('n1', 'b1')).rejects.toThrow('Non autorisé');
    });
  });
});
