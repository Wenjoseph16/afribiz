import { mockPrisma } from '../setup';
import * as marketplaceIdeaService from '../../services/marketplaceIdeaService';

jest.mock('../../lib/db', () => ({ prisma: mockPrisma }));

const mockIdea = {
  id: 'idea-1',
  businessId: 'biz-1',
  title: 'Test Idea',
  description: 'A test idea',
  category: 'TECH',
  votes: 0,
  createdAt: new Date(),
  business: { id: 'biz-1', name: 'Biz', logo: null, city: 'Lome', country: 'Togo' },
};

describe('marketplaceIdeaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIdea', () => {
    it('should create an idea', async () => {
      (mockPrisma.marketIdea.create as jest.Mock).mockResolvedValue(mockIdea);
      const result = await marketplaceIdeaService.createIdea({
        businessId: 'biz-1',
        title: 'Test Idea',
        category: 'TECH',
      });
      expect(result).toEqual(mockIdea);
      expect(mockPrisma.marketIdea.create).toHaveBeenCalledWith({
        data: { businessId: 'biz-1', title: 'Test Idea', description: undefined, category: 'TECH' },
        include: { business: { select: { id: true, name: true, logo: true, city: true } } },
      });
    });
  });

  describe('getIdeas', () => {
    it('should return paginated ideas', async () => {
      (mockPrisma.marketIdea.findMany as jest.Mock).mockResolvedValue([mockIdea]);
      (mockPrisma.marketIdea.count as jest.Mock).mockResolvedValue(1);
      const result = await marketplaceIdeaService.getIdeas({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by category', async () => {
      (mockPrisma.marketIdea.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.marketIdea.count as jest.Mock).mockResolvedValue(0);
      await marketplaceIdeaService.getIdeas({ category: 'TECH' });
      expect(mockPrisma.marketIdea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'TECH' } })
      );
    });

    it('should enforce max limit of 50', async () => {
      (mockPrisma.marketIdea.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.marketIdea.count as jest.Mock).mockResolvedValue(0);
      await marketplaceIdeaService.getIdeas({ limit: 100 });
      expect(mockPrisma.marketIdea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 })
      );
    });
  });

  describe('getIdeaById', () => {
    it('should return idea by id', async () => {
      (mockPrisma.marketIdea.findUnique as jest.Mock).mockResolvedValue(mockIdea);
      const result = await marketplaceIdeaService.getIdeaById('idea-1');
      expect(result).toEqual(mockIdea);
    });

    it('should return null if not found', async () => {
      (mockPrisma.marketIdea.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await marketplaceIdeaService.getIdeaById('invalid');
      expect(result).toBeNull();
    });
  });

  describe('voteIdea', () => {
    it('should vote and increment votes', async () => {
      (mockPrisma.marketVote.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.marketVote.create as jest.Mock).mockResolvedValue({ id: 'vote-1' });
      (mockPrisma.marketIdea.update as jest.Mock).mockResolvedValue({ ...mockIdea, votes: 1 });
      const result = await marketplaceIdeaService.voteIdea('idea-1', 'user-1');
      expect(result.votes).toBe(1);
    });

    it('should throw if already voted', async () => {
      (mockPrisma.marketVote.findUnique as jest.Mock).mockResolvedValue({ id: 'vote-1' });
      await expect(marketplaceIdeaService.voteIdea('idea-1', 'user-1')).rejects.toThrow(
        'déjà voté'
      );
    });
  });

  describe('unvoteIdea', () => {
    it('should unvote and decrement votes', async () => {
      (mockPrisma.marketVote.findUnique as jest.Mock).mockResolvedValue({ id: 'vote-1' });
      (mockPrisma.marketVote.delete as jest.Mock).mockResolvedValue({});
      (mockPrisma.marketIdea.update as jest.Mock).mockResolvedValue({ ...mockIdea, votes: 0 });
      const result = await marketplaceIdeaService.unvoteIdea('idea-1', 'user-1');
      expect(result.votes).toBe(0);
    });

    it('should throw if no vote exists', async () => {
      (mockPrisma.marketVote.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(marketplaceIdeaService.unvoteIdea('idea-1', 'user-1')).rejects.toThrow(
        'pas voté'
      );
    });
  });

  describe('getTopIdeas', () => {
    it('should return top ideas sorted by votes', async () => {
      (mockPrisma.marketIdea.findMany as jest.Mock).mockResolvedValue([mockIdea]);
      const result = await marketplaceIdeaService.getTopIdeas(5);
      expect(result).toHaveLength(1);
      expect(mockPrisma.marketIdea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, orderBy: { votes: 'desc' } })
      );
    });
  });
});
